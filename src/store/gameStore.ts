import { create } from 'zustand';
import type { Player, ProcessingResult, Difficulty, BrewOutcome, Grade, TeaStack, FaultTag } from '../core/types';
import { regionProficiency } from '../core/types';
import { loadSave, persist, defaultPlayer, archiveCurrentSave, wipeActiveSave } from '../core/storage/storage';
import { MARKET_REQUIRED_TEAS, regionLocationScene } from '../core/data/regions';
import { getTea, isCraftable } from '../core/data/teas';
import { getTeaWare } from '../core/data/teaWares';
import { getZhouBoAfterTeaAdvice } from '../core/data/zhouBoAdvice';
import type { RolledEncounter } from '../features/encounter/encounterEngine';
import type { ZhouBoAdvice } from '../core/data/zhouBoAdvice';

/**
 * 小红书分享奖励（XHS 增强，经现有 gameStore / 茶钱机制接入，不复制经济逻辑）：
 * 每日仅首次成功分享（制茶 / 泡茶 / 茶席任意一种）发放 +20 茶钱，每日上限 20，防重复刷。
 *
 * 平台能力限制（详见二次调整报告 §3）：当前 XHS 以 webview 运行、无小红书 JSbridge，
 * `navigator.share` 无法可靠回传「已成功发帖」。故本版本 SHARE_PAYOUT_ENABLED=false：
 * 只记录当日已分享日期（shareRewardDate），暂不发茶钱、不伪造回调。
 * 待接入 XHS 平台发帖确认能力后，将本常量置 true 即可启用 +20（无需改动其它逻辑）。
 */
const SHARE_PAYOUT_ENABLED = false;
const SHARE_REWARD_AMOUNT = 20;

/** 入篓/入背包的通用堆叠逻辑（制茶结果 与 偶遇赠茶 共用）。 */
function pushStack(
  inventory: TeaStack[],
  teaId: string,
  grade: Grade,
  roastLevel: string,
  count: number,
  unitValue: number,
  source?: 'made' | 'purchased' | 'gift',
  sourceNpc?: string,
  bargain?: 'deal' | 'overpriced',
  giftTag?: string,
  fault?: FaultTag,
): TeaStack[] {
  // 旅途赠礼成独立一栈（key 带上 giftTag）：不与自制/购买的同品质茶合并，保留「我的旅途」身份。
  const key = giftTag ? `${teaId}:${grade}:${giftTag}` : `${teaId}:${grade}:${roastLevel}`;
  const next = [...inventory];
  const idx = next.findIndex((s) => s.id === key);
  if (idx >= 0) next[idx] = { ...next[idx], count: next[idx].count + count };
  else   next.push({ id: key, teaId, grade, count, unitValue, roastLevel, firstMadeAt: new Date().toISOString(), source, sourceNpc, bargain, giftTag, fault });
  return next;
}

/** 从茶篓指定 stack 扣 1 包（floor 0；扣到 0 则移出茶篓）。库存最低不为负，永远不出现负数。 */
function consumeOne(inventory: TeaStack[], stackId: string): TeaStack[] {
  const next = inventory.map((s) => s.id === stackId ? { ...s, count: Math.max(0, s.count - 1) } : s);
  return next.filter((s) => s.count > 0);
}

/** 第一日场景状态机（Web 版完整游历；XHS 版走线性精简流，复用同一 store） */
export type Scene =
  | 'start'        // 启动页（boot gate）：继续旅程 / 新的茶旅
  | 'intro'        // 茶馆开场
  | 'teaworld'     // 茶世界：茶区旅行入口（四宫格 + 茶叶旅行动画）
  | 'map'          // 当前茶区的地点选择（按 player.currentRegion 渲染）
  | 'teahouse'     // 老陈茶馆 + 林姑娘线索
  | 'garden'       // 茶园：阿秀 + 选茶 + 采茶
  | 'workshop'     // 制茶坊：岩伯（地图可独立拜访；实际五步在 making）
  | 'pick-tea'     // 选茶（XHS 线性入口）
  | 'making'       // 制茶（由配方决定步骤：岩茶 / 红茶不同）
  | 'result'       // 制茶结果
  | 'brew'         // 8 步泡茶
  | 'teatable'     // 周伯点评
  | 'wuyi-teaseat' // 我的茶席（武夷山：复用杭州茶席组件，仅地区配置不同；剧情解锁）
  | 'mothertree'   // 母树（岩伯）
  | 'market'       // 茶集市（小满 · 卖茶/辨茶；各地共用）
  | 'mountain'     // 山路（主动「去山路上逛逛」；偶遇 NPC 的主场之一）
  // ── 杭州篇（第二阶段起步：功能场景与武夷山同一套，只是本地场景 / NPC 不同） ──
  | 'hz-teahouse'  // 玲姨的茶馆
  | 'hz-garden'    // 杭州茶园：阿青
  | 'hz-workshop'  // 杭州制茶坊
  | 'hz-teatable'  // 杭州茶桌（泡茶 / 品饮）
  | 'hz-teaseat'  // 我的茶席（杭州：分层场景——背景/NPC/茶桌/茶具/玩家；轻量社交彩蛋）
  | 'hz-stroll'    // 梅家坞走走（杭州区域探索：每日 3 次，复用山路散步机制；事件池 strolls.ts）
  | 'meijiawu'     // 梅家坞（地域探索入口 · 占位）
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
  /** 当前正在泡的茶篓 stack id（瞬时 UI 态，不写盘）。「一包茶 = 一次完整泡茶」在结算时据此扣 1；结算后置 null 作防重复守卫。 */
  brewingStackId: string | null;
  /** 泡完后的一句轻量库存反馈（瞬时 UI 态，不写盘）。 */
  drinkNotice: string | null;
  /** 周伯品茶后给出的上下文建议（瞬时 UI 态，不写盘；离开茶桌即清除）。 */
  zhouBoAdvice: ZhouBoAdvice | null;
  currentDialogueIds: string[]; // 当前场景要播的对话 id
  /** 当前场景里正发生的偶遇（瞬时 UI 态，不写盘；刷新不恢复）。 */
  activeEncounter: RolledEncounter | null;
  triggerEncounter: (r: RolledEncounter) => void;
  clearEncounter: () => void;
  /** 回茶馆歇一晚后弹出的「新的一天」轻量提示（瞬时 UI 态，不写盘；点击继续后清空）。 */
  pendingDayIntro: { region: string; day: number } | null;
  clearDayIntro: () => void;
  /** 轻量 toast（瞬时 UI 态，不写盘）：保存反馈等一次性提示。 */
  toast: string | null;
  showToast: (msg: string) => void;
  /** 手动「保存进度」：自动保存已在每次 player 变化时由 persist() 完成，这里再落一次盘（幂等）并给玩家明确反馈。 */
  saveProgress: () => void;
  /** 启动态跳转：直接切场景、清空导航历史（不把 start 页压入返回栈）。 */
  bootTo: (s: Scene) => void;
  /** 从茶世界进入某茶区：切换 currentRegion、同步本茶区天数与熟练度，并进入指定场景（默认茶区地图）。 */
  enterRegion: (regionId: string, target?: Scene) => void;

  go: (s: Scene, data?: SceneData) => void;
  back: () => void;
  /** 回茶馆歇一晚：推进「天」，并重置山路当日次数（茶集市与山路共用同一个 day）。 */
  advanceDay: () => void;
  /** 主动去山路上逛逛：受「每日最多 3 次」约束；达上限则不进入。 */
  visitMountain: () => void;
  /** 区域探索（通用）：与山路散步同一套每日 3 次机制，进入指定探索场景（如杭州 hz-stroll）。 */
  visitExplore: (target: Scene) => void;
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
  /** 茶席实饮：一次「真的喝了」扣 1 包（自饮/与 NPC 同饮各算一次）。进入/等待茶席不调本函数 → 不扣。 */
  drinkTea: (stackId: string) => void;
  setDialogues: (ids: string[]) => void;
  /** 卖茶：price 缺省用原价(unitValue)；count 缺省=整包卖出，传入则只卖 count 份（其余留在茶篓）。 */
  sell: (stackId: string, price?: number, count?: number) => void;
  /** 消费一条熟客回访待触发状态（回访对话播完后调用；未触发则保留，下次进茶集市再判定）。 */
  consumeTeaFeedback: () => void;
  addCoins: (n: number) => void;
  /** 小红书分享奖励：用户完成一次分享发帖流程后调用（由 ShareSheet 的「记录这次分享」触发）。
   *  每日任意一种分享首次成功即发 +20（每日上限 20），防重复刷。
   *  type 参数仅用于未来平台回调日志，不参与判定。
   *  返回 true 表示本次发放了茶钱（当前平台未接入发帖确认时为 false，只记录日期）。 */
  grantShareReward: (type: 'making' | 'brewing' | 'teaseat') => boolean;
  addTea: (teaId: string, grade: Grade, roastLevel: string, count: number, unitValue: number, sourceNpc?: string, bargain?: 'deal' | 'overpriced') => void;
  /** 一次性旅途赠礼入茶篓（如「武夷山茶礼」）：source='gift'、带 giftTag，成独立一栈，不参与普通出售。 */
  addGiftTea: (teaId: string, grade: Grade, count: number, giftTag?: string) => void;
  /** 茶集市买茶：原子扣茶钱 + 入茶篓（source=purchased）。余额不足返回 false 且不改状态。 */
  buyTea: (teaId: string, grade: Grade, price: number, sourceNpc?: string, bargain?: 'deal' | 'overpriced') => boolean;
  /** 茶集市买茶具：原子扣茶钱 + 入茶具收藏（teaWareInventory）。已拥有 / 余额不足返回 false 且不改状态。 */
  buyTeaWare: (id: string) => boolean;
  /** 剧情赠礼茶具：免费入茶具收藏（teaWareInventory），不扣茶钱、不进茶集市。已拥有返回 false（不重复入收藏）。 */
  giveTeaWare: (id: string) => boolean;
  reset: () => void;
}

export const useGame = create<GameStore>((set, get) => ({
  scene: 'start',
  sceneData: {},
  navHistory: [],
  difficulty: 'standard',
  player: loadSave().player,
  currentTeaId: null,
  lastResult: null,
  lastBrew: null,
  brewingStackId: null,
  drinkNotice: null,
  zhouBoAdvice: null,
  currentDialogueIds: [],
  activeEncounter: null,
  pendingDayIntro: null,
  toast: null,

  // 切场景：记录「进入此场景前所在的场景」到导航历史栈（仅页面导航，不记录游戏状态变化）。
  go: (s, data = {}) => set((st) => {
    if (s === st.scene) return { sceneData: data }; // 同场景只刷新数据，不压栈、不跳变
    return {
      scene: s,
      sceneData: data,
      navHistory: pushHist(st.navHistory, { scene: st.scene, data: st.sceneData }),
      // 离开茶桌时清除周伯上一条品茶建议，避免回看时残留旧建议
      zhouBoAdvice: s === 'teatable' ? st.zhouBoAdvice : null,
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

  showToast: (msg) => {
    set({ toast: msg });
    // 1.8s 后仅当仍是同一条提示时才清除，避免后一条提示被前一条的定时器误清
    window.setTimeout(() => { if (get().toast === msg) set({ toast: null }); }, 1800);
  },

  saveProgress: () => {
    // 自动保存已在每次 player 变化时由 persist() 完成；此处为「手动保存」按钮：
    // 再落一次盘（幂等）并给玩家明确反馈。不会重复扣茶 / 不影响任何业务逻辑。
    persist(get().player);
    get().showToast('进度已保存');
  },

  bootTo: (s) => set({ scene: s, navHistory: [] }),

  // 进入某茶区：切换当前茶区，并把「天数 / 熟练度 / 山路当日次数」同步为该茶区的值。
  // 武夷山与杭州共用同一批功能场景，具体场景 key 由数据（regions.locations[].scene）绑定。
  // 不清空玩家进度，只做「进入某茶区」这一步所需的轻量状态切换。
  enterRegion: (regionId, target = 'map') => {
    const st = get();
    const { player } = st;
    const changed = player.currentRegion !== regionId;
    const regionDays = { ...player.regionDays, [regionId]: player.regionDays[regionId] ?? 1 };
    const next: Player = {
      ...player,
      currentRegion: regionId,
      day: regionDays[regionId],
      // proficiency 始终代表「当前茶区熟练度」，兼容制茶容错 / NPC 熟练度对话。
      proficiency: player.proficiencyByRegion?.[regionId] ?? 0,
      // 换茶区 = 换了一天，重置山路当日次数；同茶区重进不动。
      mountainVisitsToday: changed ? 0 : player.mountainVisitsToday,
      regionDays,
    };
    persist(next);
    // 与 go 一样把「进入前的场景」压栈（仍可返回茶世界），不清空既有历史。
    set({
      player: next,
      scene: target,
      navHistory: pushHist(st.navHistory, { scene: st.scene, data: st.sceneData }),
    });
  },

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

  // 区域探索（通用）：武夷山「山路散步」与杭州「梅家坞走走」共用同一套
  // 「每日 3 次 + 回茶馆歇一晚重置 + 换茶区重置」机制（计数沿用 mountainVisitsToday，
  // 与既有「换茶区=新的一天节奏」约定一致）。visitMountain 是武夷山实例、行为不变；
  // 各地区的随机事件池由数据提供（strolls.ts / encounters.ts），本函数只管次数与进入。
  visitExplore: (target) => {
    const { player, navHistory } = get();
    if (player.mountainVisitsToday >= 3) return;
    const next = { ...player, mountainVisitsToday: player.mountainVisitsToday + 1 };
    persist(next);
    set((st) => ({
      player: next,
      scene: target,
      // 已在目标场景（散步场景内「再走走」）不重复压栈，避免返回链里串起一截同场景
      navHistory: st.scene === target ? st.navHistory : pushHist(navHistory, { scene: st.scene, data: st.sceneData }),
    }));
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

  startMaking: (teaId) => {
    // 无「已实现配方」的茶（如尚未实装龙井配方的龙井）不进入制茶流程，避免误用别的茶的工序。
    if (!isCraftable(teaId)) return;
    set((st) => ({
      currentTeaId: teaId,
      scene: 'making',
      lastResult: null,
      navHistory: pushHist(st.navHistory, { scene: st.scene, data: st.sceneData }),
    }));
  },

  finishMaking: (result, gain) => {
    const { player } = get();
    // 失败茶把「影响最大的失败原因」带上栈：熟客回访按「茶种+失败原因」生成抱怨文案（纯剧情，无数值）。
    const inventory = pushStack(
      player.inventory, result.teaId, result.grade, result.roastLevel, 1, result.value,
      undefined, undefined, undefined, undefined,
      result.grade === 'fail' ? result.worstFault : undefined,
    );
    // 记录「曾经亲手制作过」——与背包无关，卖/喝掉仍保留，用于解锁茶集市
    const madeTeas = { ...player.madeTeas, [result.teaId]: true };
    const allThreeMade = MARKET_REQUIRED_TEAS.every((id) => madeTeas[id]);
    // 熟练度按茶区累加：不同茶区制茶方法不同，不能用全局值代表。
    // 同时同步到 player.proficiency（= 当前茶区熟练度），兼容制茶容错/结果页/NPC 熟练度对话。
    const regionId = getTea(result.teaId)?.regionId ?? 'wuyishan';
    const regionProf = Math.min(100, regionProficiency(player, regionId) + gain);
    // 隐藏成就「铁砂掌」：成功完成一次龙井炒制（grade !== 'fail' 视为成功）即解锁。
    // 这是多茶区功能扩展，与难度无关——standard / casual 都应解锁，故不绑 difficulty 条件。
    // 解锁后由玲姨赠出「杭州玻璃杯」（hangzhou 茶席的进入条件之一）。不改任何难度容错判定。
    // 幂等——已解锁不重复写入、兼容旧档。
    // （注：P0 曾误加 `difficulty === 'standard'` 条件；该条件在 Web 下恒真、属无操作死条件，
    //  已在二次调整中移除——不属于「为 XHS 改 Web 规则」，故保留移除结论。）
    let hiddenAchievements = player.hiddenAchievements ?? [];
    if (
      result.teaId === 'longjing'
      && result.grade !== 'fail'
      && !hiddenAchievements.includes('iron_palm')
    ) {
      hiddenAchievements = [...hiddenAchievements, 'iron_palm'];
    }
    const next: Player = {
      ...player,
      totalMade: player.totalMade + 1, // 全局累计锅数：上品/良好/普通/失败都算一锅
      proficiency: regionProf,
      proficiencyByRegion: { ...player.proficiencyByRegion, [regionId]: regionProf },
      inventory,
      madeTeas,
      hiddenAchievements,
      flags: allThreeMade ? { ...player.flags, all_tea_made: 1 } : player.flags,
    };
    persist(next);
    set({ player: next, lastResult: result, scene: 'result' });
  },

  finishBrewing: (o) => {
    // 「一包茶 = 一次完整泡茶」：仅在此处（完整泡茶完成 / 收杯结算）扣 1 包。
    // 中途退出、切换场景、返回都不调本函数 → 不扣茶。brewingStackId 在扣完后置 null，
    // 即使因 effect / 重渲染导致本函数被重复调用，第二次也因 id 已空而不重复扣除。
    const st = get();
    // 稳健定位「这一泡用的那包茶」：优先用显式记录的 brewingStackId；
    // 兜底用 lastResult（同 茶种:品质:过程标签）反查——避免任何入口漏记 id 时出现「泡了不扣茶」。
    let id = st.brewingStackId;
    if (!id && st.lastResult) {
      const r = st.lastResult;
      const guess = `${r.teaId}:${r.grade}:${r.roastLevel}`;
      if (st.player.inventory.some((s) => s.id === guess)) id = guess;
    }
    if (id) {
      const stack = st.player.inventory.find((s) => s.id === id);
      const inventory = consumeOne(st.player.inventory, id);
      const next = { ...st.player, inventory };
      // 牛姐彩蛋：这一泡是乌牛早（它只可能来自牛姐摊上那包「龙井」）→ 落「待辨茶」标记，
      // 杭州茶桌的周伯辨茶对话由此接手（derived flag zhoubo_niujie_ready）。已揭穿过的存档不重复触发。
      if (stack && stack.teaId === 'wuniuzao' && !st.player.flags['niujie_tea_revealed']) {
        next.flags = { ...next.flags, niujie_brew_pending: 1 };
      }
      // 周伯品茶后的上下文建议：纯逻辑模块计算，不在此写业务判断。
      const advice = stack
        ? getZhouBoAfterTeaAdvice({ teaId: stack.teaId, grade: stack.grade, brewScore: o.brewScore, player: st.player })
        : null;
      persist(next);
      // 泡完回到「当前茶区的茶桌」：武夷山=周伯茶桌，杭州=杭州茶桌（场景由数据绑定）。
      const teaTable = regionLocationScene(next.currentRegion || 'wuyishan', 'teatable') as Scene;
      set({
        lastBrew: o,
        scene: teaTable,
        player: next,
        brewingStackId: null,
        drinkNotice: stack ? `这一泡喝完了——${getTea(stack.teaId).name} 少了一包。` : null,
        zhouBoAdvice: advice,
      });
    } else {
      const teaTable = regionLocationScene(st.player.currentRegion || 'wuyishan', 'teatable') as Scene;
      set({ lastBrew: o, scene: teaTable, zhouBoAdvice: null });
    }
  },

  // 茶席实饮扣茶：与泡茶结算（finishBrewing）同一套 consumeOne，保证「一次喝 = 恰好扣 1 包」。
  // 只在茶席发生实际喝茶行为时调用（自饮 / 与 NPC 同饮）；进入、布置、等待 NPC 都不调用 → 不扣。
  // stack 已不存在（比如刚被卖掉/泡掉）时静默跳过，不报错。
  drinkTea: (stackId) => {
    const { player } = get();
    if (!player.inventory.some((s) => s.id === stackId)) return;
    const inventory = consumeOne(player.inventory, stackId);
    const next = { ...player, inventory };
    persist(next);
    set({ player: next });
  },

  startBrewFromStack: (stack) => {
    // 从库存合成一个「结果」喂给泡茶流程：买来的茶没有制茶过程，用默认值补齐全字段。
    // 此处只记录 brewingStackId（用于结算时扣 1 包），不立即扣库存。
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
      brewingStackId: stack.id,
      drinkNotice: null,
      zhouBoAdvice: null,
      scene: 'brew',
      navHistory: pushHist(st.navHistory, { scene: st.scene, data: st.sceneData }),
    }));
  },

  setDialogues: (ids) => set({ currentDialogueIds: ids }),

  triggerEncounter: (r) => set({ activeEncounter: r }),
  clearEncounter: () => set({ activeEncounter: null }),

  sell: (stackId, price, count) => {
    const { player } = get();
    const stack = player.inventory.find((s) => s.id === stackId);
    if (!stack) return;
    // 小满可建议「加价」——price 由 MarketView 按品质计算传入；不传则用原价(unitValue)
    const qty = count ?? stack.count; // 缺省整包；传入 count 则只卖指定份数
    const gained = (price ?? stack.unitValue) * qty;
    // 熟客回访待触发：卖出失败茶记「茶种+失败原因」、卖出上品茶记好评——一次只留一条，卖新的覆盖旧的。
    // 纯剧情反馈标记，不是声望/满意度数值；经济规则零改动。
    const teaFeedback: Player['teaFeedback'] =
      stack.grade === 'fail' ? { teaId: stack.teaId, kind: 'fail', fault: stack.fault }
        : stack.grade === 'fine' ? { teaId: stack.teaId, kind: 'fine' }
          : player.teaFeedback ?? null;
    const next: Player = {
      ...player,
      coins: player.coins + gained,
      teaFeedback,
      inventory:
        qty >= stack.count
          ? player.inventory.filter((s) => s.id !== stackId)
          : player.inventory.map((s) => (s.id === stackId ? { ...s, count: s.count - qty } : s)),
    };
    persist(next);
    set({ player: next });
  },

  /** 消费一条熟客回访（对话播完后清除；未被概率抽中则保留到下次进茶集市再判定）。 */
  consumeTeaFeedback: () => {
    const { player } = get();
    if (!player.teaFeedback) return;
    const next = { ...player, teaFeedback: null };
    persist(next);
    set({ player: next });
  },

  addCoins: (n) => {
    const { player } = get();
    const next = { ...player, coins: Math.max(0, player.coins + n) };
    persist(next);
    set({ player: next });
  },

  // 小红书分享奖励：用户在 ShareSheet 中「我已发布」后由 recordShare 触发。
  // 关键前提：当前 XHS 以 webview 运行、无小红书 JSbridge，无法可靠确认「用户真的成功发布了一篇小红书帖子」。
  // 因此本函数只负责「防重复 + 发钱」，成功依据完全由调用方（ShareSheet）提供：
  //  - 调用方的「我已发布」是【用户手动确认】，**不等于**平台已确认成功发布（manual confirmation ≠ verified publish）。
  //  - SHARE_PAYOUT_ENABLED=false 时仅记录日期、不发钱、不伪造；接入可靠平台回调后再置 true。
  //  - 未来若平台能可靠确认发帖成功，只需把调用来源从「手动确认」换成「平台成功回调」，游戏逻辑无需改动。
  // 每日规则：当天首次成功分享（任意一种）发 +20，之后当天其余分享不再发（每日上限 20）。
  grantShareReward: (type) => {
    const { player } = get();
    const today = new Date().toISOString().slice(0, 10);
    if (player.shareRewardDate === today) return false; // 今日已领过每日分享奖励，防重复刷
    const next: Player = {
      ...player,
      shareRewardDate: today,
      coins: SHARE_PAYOUT_ENABLED ? Math.max(0, player.coins + SHARE_REWARD_AMOUNT) : player.coins,
    };
    persist(next);
    set({ player: next });
    return SHARE_PAYOUT_ENABLED;
  },

  addTea: (teaId, grade, roastLevel, count, unitValue, sourceNpc?, bargain?) => {
    const { player } = get();
    const inventory = pushStack(player.inventory, teaId, grade, roastLevel, count, unitValue, sourceNpc ? 'purchased' : undefined, sourceNpc, bargain);
    const next = { ...player, inventory };
    persist(next);
    set({ player: next });
  },

  addGiftTea: (teaId, grade, count, giftTag) => {
    // 一次性旅途赠礼（如老陈的武夷山茶礼）：进现有茶篓，source='gift' 且带 giftTag。
    // 不改动任何已有茶的 grade / 数量：赠礼单独成栈（见 pushStack）。
    const { player } = get();
    const tea = getTea(teaId);
    const inventory = pushStack(player.inventory, teaId, grade, '足火', count, tea.basePrice[grade], 'gift', undefined, undefined, giftTag);
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

  giveTeaWare: (id) => {
    const { player } = get();
    if (!getTeaWare(id)) return false;
    if (player.teaWareInventory.includes(id)) return false; // 已拥有：不重复入收藏
    const next = { ...player, teaWareInventory: [...player.teaWareInventory, id] };
    persist(next);
    set({ player: next });
    return true;
  },

  reset: () => {
    // 重新开始前先保留旧存档到 archive（一次保险），再清掉生效存档。
    archiveCurrentSave();
    wipeActiveSave();
    const p = defaultPlayer();
    persist(p);
    set({
      player: p,
      scene: 'teaworld',
      lastResult: null,
      currentTeaId: null,
      sceneData: {},
      navHistory: [],
      brewingStackId: null,
      drinkNotice: null,
      zhouBoAdvice: null,
      currentDialogueIds: [],
      activeEncounter: null,
      pendingDayIntro: null,
      lastBrew: null,
    });
  },
}));
