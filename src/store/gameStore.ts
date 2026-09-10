import { create } from 'zustand';
import type { Player, ProcessingResult, Difficulty, BrewOutcome, Grade, TeaStack } from '../core/types';
import { regionProficiency } from '../core/types';
import { loadSave, persist } from '../core/storage/storage';
import { MARKET_REQUIRED_TEAS } from '../core/data/regions';
import { getTea } from '../core/data/teas';
import { getTeaWare } from '../core/data/teaWares';
import type { RolledEncounter } from '../features/encounter/encounterEngine';

/** 入篓/入背包的通用堆叠逻辑（制茶结果 与 偶遇赠茶 共用）。 */
function pushStack(
  inventory: TeaStack[],
  teaId: string,
  grade: Grade,
  roastLevel: string,
  count: number,
  unitValue: number,
  source?: 'made' | 'purchased',
  sourceNpc?: string,
  bargain?: 'deal' | 'overpriced',
): TeaStack[] {
  const key = `${teaId}:${grade}:${roastLevel}`;
  const next = [...inventory];
  const idx = next.findIndex((s) => s.id === key);
  if (idx >= 0) next[idx] = { ...next[idx], count: next[idx].count + count };
  else next.push({ id: key, teaId, grade, count, unitValue, roastLevel, firstMadeAt: new Date().toISOString(), source, sourceNpc, bargain });
  return next;
}

/** 第一日场景状态机（Web 版完整游历；XHS 版走线性精简流，复用同一 store） */
export type Scene =
  | 'intro'        // 茶馆开场
  | 'map'          // 武夷山地点选择
  | 'teahouse'     // 老陈茶馆 + 林姑娘线索
  | 'garden'       // 茶园：阿秀 + 选茶 + 采茶
  | 'workshop'     // 制茶坊：岩伯（地图可独立拜访；实际五步在 making）
  | 'pick-tea'     // 选茶（XHS 线性入口）
  | 'making'       // 制茶五步
  | 'result'       // 制茶结果
  | 'brew'         // 8 步泡茶
  | 'teatable'     // 周伯点评
  | 'mothertree'   // 母树（岩伯）
  | 'market'       // 茶集市（小满 · 卖茶/辨茶）
  | 'mountain'     // 山路（主动「去山路上逛逛」；偶遇 NPC 的主场之一）
  | 'journal'      // 茶游记手账
  | 'comic'        // 漫画视图
  | 'clue'         // 线索视图
  | 'souvenir'     // 旅行纪念物（明信片）查看（V0.2）
  | 'region-journal'; // 单个茶区的游记（武夷山 · 茶游记）

interface SceneData {
  comicId?: string;
  clueId?: string;
  souvenirId?: string;
  regionId?: string;
}

/**
 * 导航历史的一项：进入某场景「之前」所在的场景及其数据。
 * 注意：history 只记录「页面 / 场景导航」历史，绝不记录游戏状态变化历史。
 * 它只服务于「返回上一层」——不是存档、不是成就、不是进度。
 */
interface NavEntry {
  scene: Scene;
  data: SceneData;
}

/** 导航历史栈上限：避免意外情况下无限增长（页面导航，不持久化）。 */
const HISTORY_CAP = 24;

function pushHist(hist: NavEntry[], entry: NavEntry): NavEntry[] {
  // 同场景连续进入不重复压栈（避免 go 同场景造成回退死循环）
  const last = hist[hist.length - 1];
  if (last && last.scene === entry.scene) return hist;
  const next = [...hist, entry];
  return next.length > HISTORY_CAP ? next.slice(next.length - HISTORY_CAP) : next;
}

interface GameStore {
  scene: Scene;
  sceneData: SceneData;
  /** 页面 / 场景导航历史栈（仅记「上一页」，用于「返回上一层」）。不持久化、不记录游戏状态变化。 */
  navHistory: NavEntry[];
  difficulty: Difficulty;
  player: Player;
  currentTeaId: string | null;
  lastResult: ProcessingResult | null;
  lastBrew: BrewOutcome | null;
  currentDialogueIds: string[]; // 当前场景要播的对话 id
  /** 当前场景里正发生的偶遇（瞬时 UI 态，不写盘；刷新不恢复）。 */
  activeEncounter: RolledEncounter | null;
  triggerEncounter: (r: RolledEncounter) => void;
  clearEncounter: () => void;
  /** 回茶馆歇一晚后弹出的「新的一天」轻量提示（瞬时 UI 态，不写盘；点击继续后清空）。 */
  pendingDayIntro: { region: string; day: number } | null;
  clearDayIntro: () => void;

  go: (s: Scene, data?: SceneData) => void;
  back: () => void;
  /** 回茶馆歇一晚：推进「天」，并重置山路当日次数（茶集市与山路共用同一个 day）。 */
  advanceDay: () => void;
  /** 主动去山路上逛逛：受「每日最多 3 次」约束；达上限则不进入。 */
  visitMountain: () => void;
  setDifficulty: (d: Difficulty) => void;
  meetNpc: (id: string) => void;
  setFlag: (k: string, v: boolean | number) => void;
  setFlags: (f: Record<string, boolean | number>) => void;
  unlockComic: (id: string) => void;
  addClue: (id: string) => void;
  addSouvenir: (id: string) => void;
  startMaking: (teaId: string) => void;
  finishMaking: (result: ProcessingResult, gain: number) => void;
  finishBrewing: (o: BrewOutcome) => void;
  /** 用茶篓里已有的茶（买来的或做好的）泡一壶：合成 ProcessingResult 写入 lastResult 并进入泡茶流程，不消耗库存。 */
  startBrewFromStack: (stack: TeaStack) => void;
  setDialogues: (ids: string[]) => void;
  sell: (stackId: string, price?: number) => void;
  addCoins: (n: number) => void;
  addTea: (teaId: string, grade: Grade, roastLevel: string, count: number, unitValue: number, sourceNpc?: string, bargain?: 'deal' | 'overpriced') => void;
  /** 茶集市买茶：原子扣茶钱 + 入茶篓（source=purchased）。余额不足返回 false 且不改状态。 */
  buyTea: (teaId: string, grade: Grade, price: number, sourceNpc?: string, bargain?: 'deal' | 'overpriced') => boolean;
  /** 茶集市买茶具：原子扣茶钱 + 入茶具收藏（teaWareInventory）。已拥有 / 余额不足返回 false 且不改状态。 */
  buyTeaWare: (id: string) => boolean;
  reset: () => void;
}

export const useGame = create<GameStore>((set, get) => ({
  scene: 'intro',
  sceneData: {},
  navHistory: [],
  difficulty: 'standard',
  player: loadSave().player,
  currentTeaId: null,
  lastResult: null,
  lastBrew: null,
  currentDialogueIds: [],
  activeEncounter: null,
  pendingDayIntro: null,

  // 切场景：记录「进入此场景前所在的场景」到导航历史栈（仅页面导航，不记录游戏状态变化）。
  go: (s, data = {}) => set((st) => {
    if (s === st.scene) return { sceneData: data }; // 同场景只刷新数据，不压栈、不跳变
    return {
      scene: s,
      sceneData: data,
      navHistory: pushHist(st.navHistory, { scene: st.scene, data: st.sceneData }),
    };
  }),

  // 返回真实上一层：弹出导航历史栈的栈顶（保留其余历史，可继续往回退）。
  // 不硬编码回地图——上一页是什么就回什么。
  back: () => set((st) => {
    if (st.navHistory.length === 0) return {};
    const entry = st.navHistory[st.navHistory.length - 1];
    return { scene: entry.scene, sceneData: entry.data, navHistory: st.navHistory.slice(0, -1) };
  }),

  // 回茶馆歇一晚：推进「当前茶区的天」，重置山路当日次数；茶集市与山路共用同一天。
  // 天数按茶区分别记录（regionDays），day 同步为本茶区天数，保证多茶区各自计数、互不重置。
  advanceDay: () => {
    const { player } = get();
    const region = player.currentRegion || 'wuyishan';
    const regionDays = { ...player.regionDays, [region]: (player.regionDays[region] ?? 0) + 1 };
    const newDay = regionDays[region];
    const next = { ...player, regionDays, day: newDay, mountainVisitsToday: 0 };
    persist(next);
    set({ player: next, pendingDayIntro: { region, day: newDay } });
  },

  clearDayIntro: () => set({ pendingDayIntro: null }),

  // 主动去山路上逛逛：每日最多 3 次（主动进入才计数；场景内偶遇不计数）。达上限不进入。
  visitMountain: () => {
    const { player, navHistory } = get();
    const visits = player.mountainVisitsToday;
    if (visits >= 3) return;
    const next = { ...player, mountainVisitsToday: visits + 1 };
    persist(next);
    set({
      player: next,
      scene: 'mountain',
      navHistory: pushHist(navHistory, { scene: get().scene, data: get().sceneData }),
    });
  },

  setDifficulty: (d) => set({ difficulty: d }),

  meetNpc: (id) => {
    const { player } = get();
    if (player.metNpcs.includes(id)) return;
    const next = { ...player, metNpcs: [...player.metNpcs, id] };
    persist(next);
    set({ player: next });
  },

  setFlag: (k, v) => {
    const { player } = get();
    const next = { ...player, flags: { ...player.flags, [k]: v } };
    persist(next);
    set({ player: next });
  },

  setFlags: (f) => {
    const { player } = get();
    const next = { ...player, flags: { ...player.flags, ...f } };
    persist(next);
    set({ player: next });
  },

  unlockComic: (id) => {
    const { player } = get();
    if (player.comicSeen.includes(id)) return;
    const next = { ...player, comicSeen: [...player.comicSeen, id] };
    persist(next);
    set({ player: next });
  },

  addClue: (id) => {
    const { player } = get();
    if (player.clues.includes(id)) return;
    const next = { ...player, clues: [...player.clues, id] };
    persist(next);
    set({ player: next });
  },

  addSouvenir: (id) => {
    const { player } = get();
    if (player.souvenirs.includes(id)) return; // 幂等：重访母树不会重复获得
    const next = { ...player, souvenirs: [...player.souvenirs, id] };
    persist(next);
    set({ player: next });
  },

  startMaking: (teaId) => set((st) => ({
    currentTeaId: teaId,
    scene: 'making',
    lastResult: null,
    navHistory: pushHist(st.navHistory, { scene: st.scene, data: st.sceneData }),
  })),

  finishMaking: (result, gain) => {
    const { player } = get();
    const inventory = pushStack(player.inventory, result.teaId, result.grade, result.roastLevel, 1, result.value);
    // 记录「曾经亲手制作过」——与背包无关，卖/喝掉仍保留，用于解锁茶集市
    const madeTeas = { ...player.madeTeas, [result.teaId]: true };
    const allThreeMade = MARKET_REQUIRED_TEAS.every((id) => madeTeas[id]);
    // 熟练度按茶区累加：不同茶区制茶方法不同，不能用全局值代表。
    // 同时同步到 player.proficiency（= 当前茶区熟练度），兼容制茶容错/结果页/NPC 熟练度对话。
    const regionId = getTea(result.teaId)?.regionId ?? 'wuyishan';
    const regionProf = Math.min(100, regionProficiency(player, regionId) + gain);
    const next: Player = {
      ...player,
      totalMade: player.totalMade + 1, // 全局累计锅数：上品/良好/普通/失败都算一锅
      proficiency: regionProf,
      proficiencyByRegion: { ...player.proficiencyByRegion, [regionId]: regionProf },
      inventory,
      madeTeas,
      flags: allThreeMade ? { ...player.flags, all_tea_made: 1 } : player.flags,
    };
    persist(next);
    set({ player: next, lastResult: result, scene: 'result' });
  },

  finishBrewing: (o) => set({ lastBrew: o, scene: 'teatable' }),

  startBrewFromStack: (stack) => {
    // 从库存合成一个「结果」喂给泡茶流程：买来的茶没有制茶过程，用默认值补齐全字段。
    // 不扣库存、不改 coins —— 泡的是「手上的样品」，喝掉才计入消耗（本 MVP 不消耗库存）。
    // 携带 sourceNpc / bargain，让周伯品茶时能给出「捡漏 / 买贵」的生活化反馈（无数值奖惩）。
    const result: ProcessingResult = {
      teaId: stack.teaId,
      grade: stack.grade,
      comment: '',
      value: stack.unitValue,
      roastLevel: stack.roastLevel,
      faults: [],
      visuals: { dryColor: '#7a5a3a', shape: 'curled', edgeRed: 0.2, sheen: 0.3 },
      madeAt: new Date().toISOString(),
      sourceNpc: stack.sourceNpc,
      bargain: stack.bargain,
    };
    set((st) => ({
      lastResult: result,
      currentTeaId: stack.teaId,
      scene: 'brew',
      navHistory: pushHist(st.navHistory, { scene: st.scene, data: st.sceneData }),
    }));
  },

  setDialogues: (ids) => set({ currentDialogueIds: ids }),

  triggerEncounter: (r) => set({ activeEncounter: r }),
  clearEncounter: () => set({ activeEncounter: null }),

  sell: (stackId, price) => {
    const { player } = get();
    const stack = player.inventory.find((s) => s.id === stackId);
    if (!stack) return;
    // 小满可建议「加价」——price 由 MarketView 按品质计算传入；不传则用原价(unitValue)
    const gained = (price ?? stack.unitValue) * stack.count;
    const next: Player = {
      ...player,
      coins: player.coins + gained,
      inventory: player.inventory.filter((s) => s.id !== stackId),
    };
    persist(next);
    set({ player: next });
  },

  addCoins: (n) => {
    const { player } = get();
    const next = { ...player, coins: Math.max(0, player.coins + n) };
    persist(next);
    set({ player: next });
  },

  addTea: (teaId, grade, roastLevel, count, unitValue, sourceNpc?, bargain?) => {
    const { player } = get();
    const inventory = pushStack(player.inventory, teaId, grade, roastLevel, count, unitValue, sourceNpc ? 'purchased' : undefined, sourceNpc, bargain);
    const next = { ...player, inventory };
    persist(next);
    set({ player: next });
  },

  buyTea: (teaId, grade, price, sourceNpc?, bargain?) => {
    const { player } = get();
    if (player.coins < price) return false; // 余额不足：不扣钱、不入篓
    // 买来的岩茶统一记为「足火」（轻量默认，不进品质体系）；unitValue 存成交价，前端不显示数字。
    // sourceNpc / bargain 记下「来源」与「捡漏/买贵」标记，供茶篓展示与周伯品茶反馈用（不含数值奖惩）。
    const inventory = pushStack(player.inventory, teaId, grade, '足火', 1, price, 'purchased', sourceNpc, bargain);
    const next = { ...player, coins: player.coins - price, inventory };
    persist(next);
    set({ player: next });
    return true;
  },

  buyTeaWare: (id) => {
    const { player } = get();
    const ware = getTeaWare(id);
    if (!ware) return false;
    if (player.teaWareInventory.includes(id)) return false; // 已拥有：不重复购买、不扣钱
    if (player.coins < ware.price) return false;            // 余额不足：不扣钱、不入收藏
    // 茶具是长期收藏，与茶叶背包完全分开；不影响茶叶品质 / 王霸茶评价。
    const next = {
      ...player,
      coins: player.coins - ware.price,
      teaWareInventory: [...player.teaWareInventory, id],
    };
    persist(next);
    set({ player: next });
    return true;
  },

  reset: () => {
    try { localStorage.removeItem('teaworld.save.v3'); } catch { /* ignore */ }
    const p = loadSave().player;
    persist(p);
    set({ player: p, scene: 'intro', lastResult: null, currentTeaId: null, sceneData: {} });
  },
}));
