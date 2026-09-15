import type { Grade, Player, SeatSlotId } from '../types';
import { regionTeaIds } from './regions';
import { MARKET_TEA_WARES, GIFT_TEA_WARES, getTeaWare } from './teaWares';
import type { TeaWare } from './teaWares';

// ─────────── 我的茶席（分茶区配置 · 杭州/武夷山共用一套玩法） ───────────
// 定位（2026-09-12 明确）：茶席 = 玩家自己的喝茶社交空间（坐下 → 偶遇 → 邀请 → 聊天/回礼），
// 与「区域探索」（出去逛）职责分开。武夷山茶席是杭州茶席的地区扩展：
// **玩法/组件/状态机完全复用，只有 背景、NPC池、对白风格、地区门禁 不同。**
//
// 硬约束：
//   - 牛姐（niujie）只属于杭州茶市场彩蛋体系，**永不进入任何茶席 NPC 池**。
//   - 神秘茶人保持武夷山原有偶遇概率与设定（encounters.ts），**不因茶席改变**，不入茶席池。
//   - 回礼走 addGiftTea（source='gift'，可泡不可卖），概率随品质提高但永不 100%；
//     乌牛早不回流（牛姐专属）。
// 本模块只放纯数据与判定（无 React/DOM），供 TeaSeatView 消费、便于断言测试。

/** 茶席偶遇概率（两茶区共用同一参数；「可能没人来」）。 */
export const TEA_SEAT_ENCOUNTER_CHANCE = 0.35;

/** 茶席入口门禁（按茶区）：
 *  - 杭州：拥有任意一件茶具即可（设计路径=玲姨赠的杭州玻璃杯）。
 *  - 武夷山：完成「林姑娘邀请 → 回武夷山 → 老陈寒暄」剧情后解锁（flag；旧存档默认未解锁，不报错）。 */
export function canEnterTeaSeat(player: Player, regionId: string): boolean {
  if (regionId === 'wuyishan') return !!player.flags['wuyishan_teaseat_unlocked'];
  return player.teaWareInventory.length > 0;
}

/** 是否该茶区茶席的首次入席（首次=固定地区引路人登场）。 */
export function isTeaSeatFirstVisit(player: Player, regionId: string): boolean {
  const cfg = TEA_SEAT_BY_REGION[regionId as 'hangzhou' | 'wuyishan'];
  return !cfg || !player.flags[cfg.firstDoneFlag];
}

/** 单个闲聊池：直接给一组台词，或对象形式（lines + 可选按茶种覆盖）。 */
export type TeaSeatChatEntry = string[] | { lines?: string[]; byTea?: Record<string, string[]> };

export interface TeaSeatRegionConfig {
  regionId: 'hangzhou' | 'wuyishan';
  /** 茶席环境背景（只负责环境，不画桌/茶具——桌与茶具由组件/槽位动态叠加）。 */
  bg: string;
  /** 首次入席固定登场的引路人 + 台词。 */
  firstNpc: string;
  firstLines: string[];
  firstDoneFlag: string;
  /** 随机偶遇 NPC 池（权重；可能抽到「没人来」）。 */
  npcPool: { npcId: string; weight: number }[];
  greetings: Record<string, string[]>;
  /** 喝完茶的闲聊：chat[npcId][category] = 台词组（可按茶种覆盖）；对白风格按地区写。 */
  chat: Record<string, Record<string, TeaSeatChatEntry>>;
}

// ── 杭州 · 茶席（既有内容原样收编为地区配置，玩法不变） ──
const HANGZHOU: TeaSeatRegionConfig = {
  regionId: 'hangzhou',
  bg: 'assets/scenes/hangzhou_teaseat.webp',
  firstNpc: 'aqing',
  firstLines: [
    '你也来这儿喝茶啦？',
    '给你带了点绿豆糕。',
    '龙井配点绿豆糕，倒挺有滋有味。',
  ],
  firstDoneFlag: 'teaseat_first_done',
  npcPool: [
    { npcId: 'aqing', weight: 4 },   // 阿青：茶园的孩子，最常来蹭茶
    { npcId: 'zhoubo', weight: 3 },  // 周伯：遛弯路过，顺口点评
    { npcId: 'lingyi', weight: 3 },  // 玲姨：送茶点路过，坐一坐
  ],
  greetings: {
    aqing: ['咦，你也来这儿喝茶啦？', '这个位置好，看得见湖。'],
    zhoubo: ['哦？你也寻到这儿来了。', '这地方选得好——喝水看山，两不耽误。'],
    lingyi: ['哎，你在这儿呀？我路过瞧瞧。', '一个人坐着也挺好，湖风吹着舒服。'],
  },
  chat: {
    aqing: {
      green: ['龙井就要这么喝——叶子在水里慢慢站起来的样子最好看。', '你这一泡，比集市上糊弄人的强多了。'],
      hongcha: ['九曲红梅是红亮红亮的，跟我家园子里的绿完全是两个脾气。', '甜的！这个我喜欢。'],
      other: ['好喝就行。茶嘛，喝着舒服最重要。'],
    },
    zhoubo: {
      green: ['嗯，鲜爽是有的。龙井这一口，就图一个「清」字。', '叶子舒展得开，说明水温、出汤都没大错。'],
      hongcha: ['红亮，甜润——九曲红梅这一口，跟岩茶是两个路数。', '发酵到位了，青气没带进来。'],
      other: ['能喝。茶没有高低，喝着顺就好。'],
    },
    lingyi: {
      green: ['龙井就该这么慢慢喝——看着叶子在水里开，心也跟着慢下来。', '春茶就要鲜着喝。'],
      hongcha: ['我们杭州的红茶，就图这一口红亮甜润。', '焖得不错，回头我那儿也照这个来。'],
      other: ['喝着好就好。回头把茶具备齐了，常来坐坐。'],
    },
  },
};

// ── 武夷山 · 茶席（复用同一套玩法；人/茶/景/说话方式换成武夷山） ──
// 对白风格：老陈=朴实熟络有经验；阿秀=直白热情；岩伯=看茶说话；周伯=懂茶一针见血；林姑娘=两地都熟。
// 「岩茶性格」通过 byTea 按茶种体现（水仙柔/肉桂冲/大红袍慢），只是对白表现、不新增数值。
const WUYISHAN: TeaSeatRegionConfig = {
  regionId: 'wuyishan',
  bg: 'assets/scenes/wuyishan_teaseat.webp',
  firstNpc: 'laochen',
  firstLines: [
    '后头这块地方，收拾出来还像样吧？',
    '想喝什么自己挑——咱们武夷山的茶，管够。',
  ],
  firstDoneFlag: 'teaseat_first_done_wuyishan',
  npcPool: [
    { npcId: 'laochen', weight: 4 },  // 老陈：茶馆主人，常来坐
    { npcId: 'axiu', weight: 3 },     // 阿秀：采茶下来歇脚
    { npcId: 'yanbo', weight: 3 },    // 岩伯：看茶说话的老制茶师
    { npcId: 'zhoubo', weight: 2 },   // 周伯：两座山都跑的老茶客
    { npcId: 'linggu', weight: 2 },   // 林姑娘：本来就两头跑的旅人
  ],
  greetings: {
    laochen: ['哟，舍得回来了？', '来了就坐，别站着。'],
    axiu: ['来都来了，喝一杯再走。', '今儿得空来茶席坐坐啦？'],
    yanbo: ['嗯，坐。', '正好，陪我喝一泡。'],
    zhoubo: ['哦？这茶桌，摆到武夷山来了。', '行啊，换个山头接着喝。'],
    linggu: ['路过，讨一杯喝。', '你的茶席，比我想的有样子。'],
  },
  chat: {
    laochen: {
      yancha: ['岩茶这东西，得慢慢喝。火气刚退的时候，和放一放以后，滋味还不一样。', '自己做的？嗯，手上有数了。'],
      green: ['杭州来的？这龙井倒是清清爽爽。', '绿茶喝个鲜——跟咱们岩茶是两个路数，都好。'],
      hongcha: ['九曲红梅？杭州的红茶，甜润，喝着倒也顺口。'],
      other: ['茶没有高低，合口味就是好茶。'],
    },
    axiu: {
      yancha: ['这是我们山场里的茶做的吧？喝着就是亲切。', '这泡还行，再坐会儿。'],
      green: ['这么绿的汤，看着就凉快。'],
      hongcha: ['红的？闻着挺香。'],
      other: ['来都来了，喝一杯再走。'],
    },
    yanbo: {
      yancha: ['火功看得出分寸，香在汤里，不浮。', '岩茶讲香、清、甘、活——你这一泡，占了两样。'],
      green: ['绿茶看叶底，嫩就嫩得坦白。'],
      hongcha: ['发酵到位，汤是活的。'],
      other: ['茶怎么样，喝过才知道。'],
    },
    zhoubo: {
      yancha: {
        lines: ['火气退得正好，这泡喝着顺。', '岩茶就得这样，一口一口来。'],
        // 「岩茶性格」按茶种命中（水仙柔/肉桂冲/大红袍慢）——只是对白表现，不新增数值。
        byTea: {
          rougui: ['这香气够冲，一进嘴就知道是肉桂——做得也正。'],
          shuixian: ['水仙喝着倒是柔和，汤也顺——这泡稳。'],
          dahongpao: ['大红袍嘛，坐下来慢慢喝，急不得。'],
        },
      },
      green: ['龙井到了武夷山还是龙井——清鲜，藏不住。'],
      hongcha: ['红茶的甜是发出来的，岩茶的甜是焙出来的——都不是一回事，都好。'],
      other: ['能喝。茶没有高低，喝着顺就好。'],
    },
    linggu: {
      yancha: ['回武夷山喝岩茶，感觉又不一样了——一个鲜，一个醇。'],
      green: ['在杭州喝惯的口，回这儿换换嘴，正好。'],
      hongcha: ['两座山的茶摆在一起喝，才喝得出各自的脾气。'],
      other: ['好茶不怕比较，就怕不比。'],
    },
  },
};

export const TEA_SEAT_BY_REGION: Record<'hangzhou' | 'wuyishan', TeaSeatRegionConfig> = {
  hangzhou: HANGZHOU,
  wuyishan: WUYISHAN,
};

/** 按权重抽一位茶席 NPC（纯函数，随机源由调用方传入便于测试）；null=今天没人来。 */
export function rollTeaSeatNpc(config: TeaSeatRegionConfig, rand: () => number = Math.random): string | null {
  if (rand() > TEA_SEAT_ENCOUNTER_CHANCE) return null;
  const total = config.npcPool.reduce((s, n) => s + n.weight, 0);
  let r = rand() * total;
  for (const n of config.npcPool) {
    r -= n.weight;
    if (r <= 0) return n.npcId;
  }
  return config.npcPool[config.npcPool.length - 1].npcId;
}

function chatList(entry: TeaSeatChatEntry | undefined): string[] | undefined {
  return Array.isArray(entry) ? entry : entry?.lines;
}

/** 按茶叶大类（可按茶种覆盖）取一句闲聊（纯函数，随机源可注入）。 */
export function teaSeatChatLine(
  config: TeaSeatRegionConfig,
  npcId: string,
  category: string,
  teaId?: string,
  rand: () => number = Math.random,
): string {
  const catEntry = config.chat[npcId]?.[category];
  const byTea = teaId && catEntry && !Array.isArray(catEntry) ? catEntry.byTea?.[teaId] : undefined;
  const list = byTea
    ?? chatList(catEntry)
    ?? chatList(config.chat[npcId]?.other)
    ?? ['一起喝了这杯。茶没有高低，喝着顺就好。'];
  return list[Math.floor(rand() * list.length)];
}

/**
 * 茶叶回礼概率（仅游戏参数）：品质越好概率越高，但永不 100%——
 * 「不是每次都有回礼」，保持人情往来而非奖励机制。不新增数值系统。
 */
export const TEA_SEAT_GIFT_CHANCE: Record<Grade, number> = {
  fail: 0,
  normal: 0.25,
  good: 0.45,
  fine: 0.65,
};

export function teaSeatGiftChance(grade: Grade): number {
  return TEA_SEAT_GIFT_CHANCE[grade] ?? 0.25;
}

/**
 * 回礼茶：从「与所喝的茶同一茶区」的茶里随机挑。
 * 彩蛋专属茶不回流：乌牛早（牛姐彩蛋）、王霸茶（老贾彩蛋）都不从回礼再次流通。
 */
export const TEA_SEAT_GIFT_EXCLUDED = ['wuniuzao', 'wangba'];

export function rollTeaSeatGift(servedTeaId: string, servedTeaRegion: string, rand: () => number = Math.random): string {
  const pool = regionTeaIds(servedTeaRegion).filter((id) => !TEA_SEAT_GIFT_EXCLUDED.includes(id));
  const fallback = ['jiuquhongmei'];
  const list = pool.length > 0 ? pool : fallback;
  return list[Math.floor(rand() * list.length)];
}

/** 林姑娘的「回武夷山」邀请台词（杭州茶席触发；剧情收口在老陈寒暄）。 */
export const LINGGU_WUYI_INVITE_LINES = [
  '「这阵子，杭州的茶席倒是越来越热闹了。」',
  '你笑了笑——在这儿坐下来喝杯茶，是挺舒服的。',
  '「你在杭州也待了一阵了吧？」',
  '「要不，跟我一道回趟武夷山？」',
  '「也让乡亲们瞧瞧，杭州是怎么喝茶、怎么待客的。」',
];

export const LINGGU_WUYI_DECLINE_LINES = [
  '「也成。杭州还有不少地方没逛呢。」',
  '「那你再多待几日——等想回去了，再来找我。」',
];

// ─────────── 茶席功能位（固定槽位，非自由装修） ───────────
// 交互 = 点功能位 → 从已拥有且属于该位的茶具里挑一件 → 吸附到固定锚点。
// 只存「哪个位摆了什么」（Player.teaSeat），不存坐标；锚点由这里统一配置。
// 分层铁律不变：物品全部在 z3 槽位层，锚点都落在桌面（舞台 y 66%~72.8%）内，不挡按钮/不出安全区。
// 茶承(assist)视觉宽 52% 横贯桌面（x≈24.5%~76.5%），承托 taste/brew/share 组合（x≈30.75%~71.25%）并留白；
// 其点击热区(hit)仍是小矩形，绝不随视觉放大而拦截其他功能位。

export interface TeaSeatSlotConfig {
  id: SeatSlotId;
  label: string;
  /** 该位放什么的一句说明（布置面板用）。 */
  hint: string;
  /** 茶具视觉锚点（舞台 %，物品底边中心；配合 .teaseat-item 的 translate(-50%,-100%)）。 */
  left: number;
  top: number;
  /** 茶具视觉宽度（舞台宽度 %）——只管「看起来多大」，与点击区域解耦。 */
  width: number;
  /** 同层渲染顺序：小者先画（茶承作垫底，其余按从后到前）。 */
  order: number;
  /**
   * 编辑热区（舞台 %，左上角矩形，2026-09-14 与视觉宽度解耦）：
   * 茶承图可以很大，但点击区只占「功能位中心」——五个热区两两互不重叠
   * （assist 走前排独立 y 带，绝不拦截 brew/taste 的点击，全空位时也各自可点）。
   */
  hit: { left: number; top: number; width: number; height: number };
}

export const TEA_SEAT_SLOTS: TeaSeatSlotConfig[] = [
  { id: 'brew',   label: '主泡位', hint: '盖碗、紫砂壶——今天用它泡茶', left: 51.5, top: 70.6, width: 13.5, order: 2,
    hit: { left: 44, top: 66.5, width: 16, height: 5.8 } },
  { id: 'taste',  label: '品茗位', hint: '自己喝的那只杯',             left: 35.5, top: 71.6, width: 9.5,  order: 3,
    hit: { left: 28.5, top: 68.5, width: 14, height: 5.5 } },
  { id: 'share',  label: '分茶位', hint: '公道杯——茶汤分得匀',        left: 66.5, top: 71.6, width: 9.5,  order: 3,
    hit: { left: 61.5, top: 68.5, width: 13.5, height: 5.5 } },
  { id: 'store',  label: '储茶位', hint: '茶叶罐——装今天喝的茶',      left: 14,   top: 68.8, width: 11,   order: 2,
    hit: { left: 7.5, top: 65.5, width: 15, height: 5 } },
  { id: 'assist', label: '辅助位', hint: '茶承——给茶席垫个底',        left: 50.5, top: 74.4, width: 50,   order: 1,
    hit: { left: 43, top: 72.5, width: 17.5, height: 4 } },
];

/** 旅行套组（稀有旅行茶具）的席面锚点：整套一张图居中上场——宽扁资源（1100×796）单独定尺寸，
 *  不套用方形茶具的比例逻辑，也绝不占普通主泡位（走 mode='travel'，见 types.TeaSeatSave）。 */
export const TEA_SEAT_TRAVEL_ANCHOR = { left: 50, top: 70.8, width: 26 };

export const TEA_SEAT_SLOT_BY_ID: Record<SeatSlotId, TeaSeatSlotConfig> =
  Object.fromEntries(TEA_SEAT_SLOTS.map((s) => [s.id, s])) as Record<SeatSlotId, TeaSeatSlotConfig>;

/** 全部茶具（集市 + 剧情赠礼），固定顺序（=商品上架顺序），保证默认布置确定性。 */
const ALL_WARES: TeaWare[] = [...MARKET_TEA_WARES, ...GIFT_TEA_WARES];

/** 某功能位下玩家可用的茶具（已拥有 + seatSlot 匹配，按固定顺序；旅行套组不在任何普通位）。 */
export function waresForSeatSlot(owned: string[], slot: SeatSlotId): TeaWare[] {
  return ALL_WARES.filter((w) => w.seatSlot === slot && owned.includes(w.id));
}

/** 玩家是否拥有旅行套组（稀有旅行茶具；seatSlot='travel' 是标记，不是可摆的普通位）。 */
export function ownedTravelSet(owned: string[]): TeaWare | undefined {
  return ALL_WARES.find((w) => w.seatSlot === 'travel' && owned.includes(w.id));
}

/** 当前是否处于旅行茶席模式：存档 mode='travel' 且确实拥有套组（防旧档/异常态）。 */
export function seatTravelMode(save: Player['teaSeat'], owned: string[]): boolean {
  return save?.mode === 'travel' && !!ownedTravelSet(owned);
}

/**
 * 默认茶席布置（旧玩家第一次进新茶席 / 从未布置过时自动生成）：
 * 每个位取「该位下第一件已拥有的茶具」（按上架顺序 → 主泡位默认白瓷盖碗、品茗位默认白瓷品茗杯）。
 * 纯函数、确定性：同一份收藏永远生成同一张茶席，刷新不走样。
 */
export function defaultSeatArrangement(owned: string[]): Partial<Record<SeatSlotId, string>> {
  const arr: Partial<Record<SeatSlotId, string>> = {};
  for (const slot of TEA_SEAT_SLOTS) {
    const w = waresForSeatSlot(owned, slot.id)[0];
    if (w) arr[slot.id] = w.id;
  }
  return arr;
}

/**
 * 消毒已保存的布置（teaSeat 存在时走这里——尊重玩家的每一个 slot 决定）：
 *   slot = null            → 明确不摆放，原样保留（绝不回填默认茶具）；
 *   slot = 合法 wareId     → 保留；
 *   slot = 不存在的 wareId → 丢弃该位（脏数据清理，不回填默认）；
 *   slot 缺失              → 该位为空（不整席回退默认席）。
 * 默认席只在 teaSeat 整体 undefined（旧档/首次）时由 defaultSeatArrangement 生成。
 */
export function sanitizeSeatArrangement(
  arr: Partial<Record<SeatSlotId, string | null>> | undefined,
  owned: string[],
): Partial<Record<SeatSlotId, string | null>> {
  const out: Partial<Record<SeatSlotId, string | null>> = {};
  if (!arr) return out;
  for (const slot of TEA_SEAT_SLOTS) {
    const id = arr[slot.id];
    if (id === null) { out[slot.id] = null; continue; } // 明确不摆放：合法状态，原样保留
    if (!id) continue;                                  // 未配置：空位
    const w = getTeaWare(id);
    if (w && w.seatSlot === slot.id && owned.includes(id)) out[slot.id] = id;
  }
  return out;
}

/**
 * 茶席搭配反馈（纯文字，无评分无数值，不影响任何品质/茶钱）：
 * 旅行席一句；否则按「今天喝的茶 × 主泡/品茗茶具」给一句对味观感；命中不了就按摆件数量给档位句。
 */
export function seatArrangementNote(
  arr: Partial<Record<SeatSlotId, string | null>>,
  teaCategory?: string,
  travelMode?: boolean,
): string {
  if (travelMode) return '带上这一套，走到哪儿都能喝上一盏茶——轻装出行，茶席随身。';
  const ware = (s: SeatSlotId) => (arr[s] ? getTeaWare(arr[s]!) : undefined);
  // 茶与具的对味（只聊感受，不给加成）
  if (teaCategory === 'green' && arr.taste === 'hz-glass-cup') return '玻璃杯配绿茶——看得见叶子在水里舒展。';
  if (teaCategory === 'yancha' && ware('brew')?.type === 'pot') return '紫砂壶伺候岩茶，稳。';
  if (teaCategory === 'hongcha' && ware('brew')?.type === 'gaiwan') return '盖碗泡红茶，正好看那口红亮的汤色。';
  const filled = TEA_SEAT_SLOTS.filter((s) => arr[s.id]).length;
  if (filled >= 4) return '茶具齐整——像样的一方茶席。';
  if (filled >= 3) return '有模有样，坐下来慢慢喝。';
  if (filled >= 1) return '素雅清简，一壶一杯也自在。';
  return '席面还空着——点上面的功能位，先摆上一件。';
}
