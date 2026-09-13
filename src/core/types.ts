// ─────────────────────────────────────────────────────────────
// 《茶游记》Core 类型定义 V1.0
// 铁律：本目录禁止 import react / DOM API。
// 真实世界决定规则，游戏机制负责降低复杂度。
// ─────────────────────────────────────────────────────────────

/** 品质等级（对外只显示这一档 + 一句话 + 茶钱 + 火功，永不显示内部分数） */
export type Grade = 'fail' | 'normal' | 'good' | 'fine';

export const GRADE_LABEL: Record<Grade, string> = {
  fail: '失败',
  normal: '普通',
  good: '良好',
  fine: '上品',
};

export type Difficulty = 'standard' | 'casual';

/** 游戏工序 id。带 ★ 的是武夷山第一章使用的；其余为通用组件，留给未来茶类 */
export type StepId =
  | 'picking'      // ★ 采茶（开面采判断）
  | 'daoqing'      // ★ 倒青 / 萎凋（两晒两晾）
  | 'zuoqing'      // ★ 做青（摇青 + 静置，叶缘转朱砂红）
  | 'chao-rou'     // ★ 炒揉（双炒双揉：一个 step 两轮，决策 Q1）
  | 'roasting'     // ★ 焙火（动态指针 ×5，火功累积）
  | 'withering'    // 萎凋（红茶线）
  | 'fixation'     // ★ 杀青（绿茶线：西湖龙井的青锅）
  | 'shaping'      // ★ 理条（绿茶线：抓·压·推，压扁挺直成形）
  | 'rolling'      // 通用揉捻
  | 'drying'       // 通用干燥
  | 'fermentation'; // 发酵（红茶线）

export type FaultTag =
  | 'picking_poor'
  | 'daoqing_off'
  | 'daoqing_short'
  | 'daoqing_overlong'
  | 'zuoqing_hasty'
  | 'zuoqing_light'
  | 'zuoqing_stale'
  | 'chaoqing_under'
  | 'chaoqing_over'
  | 'rolling_broken'
  | 'roast_hasty'
  | 'roast_over'
  // 红茶工序（杭州·九曲红梅）：萎凋 / 发酵 / 烘干
  | 'wither_short'
  | 'wither_over'
  | 'ferment_short'
  | 'ferment_over'
  | 'drying_over'
  // 绿茶工序（杭州·西湖龙井）：杀青 / 理条
  | 'fixation_under'
  | 'fixation_over'
  | 'shaping_loose'
  | 'shaping_broken';

/** 工艺映射表（数据化）：每个 step 说清自己对应现实的哪道工序 */
export interface StepMeta {
  id: StepId;
  gameName: string;           // 游戏里显示的名字
  realProcessName: string;    // 现实工艺名
  simplificationNote: string; // 为什么这样简化
  knowledgeComicId?: string;  // 完成后可解锁的漫画
}

export interface RoastLevel {
  id: 'light' | 'medium' | 'heavy';
  label: string; // 轻火 / 中火 / 足火
}

// ─────────── 茶叶：事实 / 体验文案 / 游戏参数 三层分离 ───────────
// 铁律：TeaFact 与 TeaCopy 不进入知识系统即不得含有「天生更难/更容易」等茶学判断；
// 游戏难度差异一律放在 teaGameProfile，并明确标注「仅游戏参数」。

export interface TeaFact {
  level: 'S' | 'A' | 'B' | 'C'; // 资料库来源等级
  source: string;               // 出处（标准/非遗/权威研究）
  category: 'identity' | 'aroma' | 'taste' | 'appearance' | 'making' | 'roast' | 'brewing' | 'story';
  text: string;
}

export type TeaCopyKind = 'player_hint' | 'npc_opinion' | 'brief';

/** 体验文案 / NPC 主观评价：可游戏化表达，但不得伪装成科学事实 */
export interface TeaCopy {
  kind: TeaCopyKind;
  text: string;
}

/** 采茶游戏化配置（仅游戏参数，不混真实茶学事实）。
 * 不同茶区未来可在此给出不同采摘重点：武夷山=开面采/茶梢成熟度。 */
export interface PickingConfig {
  /** 采摘方式的游戏化标签：开面采（岩茶/红茶，看茶梢成熟度）/ 嫩芽采（绿茶，看一芽一叶）。 */
  pickingMethod: 'open-face' | 'bud';
  /** 目标成熟度：中开面（开面采）/ 一芽一叶（嫩芽采）。 */
  targetMaturity: 'middle-open' | 'bud-one-leaf';
  attemptCount: number;           // 本篓可采摘机会总数
  basketNeed: number;             // 采满几梢算「一篓」
  tolerance: number;              // 采茶容错：影响 good/normal/rough 判定
}

/** 本轮鲜叶品质（采茶产出，隐藏档，前台只给自然语言评价，不显示数值） */
export type BasketQuality = 'good' | 'normal' | 'rough';

/** 仅游戏参数，不属于知识系统，禁止表述为现实茶学事实 */
export interface TeaGameProfile {
  difficulty: 1 | 2 | 3;                 // 仅影响操作容错/摆动速度等，不代表现实中肉桂更难
  roastBias?: { center: number; width: number }; // 焙火绿区偏移（游戏内差异，非现实焙火标准）
  picking?: PickingConfig;               // 采茶（开面采）游戏化参数
  unlockCondition: UnlockCondition;
}

export type UnlockCondition =
  | { type: 'initial' }                                   // 初始可做
  | { type: 'exploration'; note: string }                 // 探索触发
  | { type: 'motherTree'; note: string }                  // 母树/游历内容触发
  | { type: 'flag'; flag: string; note: string }          // 指定 flag 触发（如龙井待梅家坞解锁）
  | { type: 'story'; note: string };                      // 剧情线索触发

export interface Tea {
  id: string;
  name: string;              // 肉桂 / 水仙 / 大红袍
  fullName: string;          // 武夷岩茶 · 肉桂
  category: 'yancha' | 'hongcha' | 'green';  // 岩茶 / 红茶 / 绿茶（游戏内分类，用于界面标签）
  regionId: string;
  basePrice: Record<Grade, number>;  // 游戏自有经济，非现实价格
  // 大红袍不做「高级等级茶」，解锁由内容触发（M2）
  unlockCondition: UnlockCondition;
  facts: TeaFact[];          // S/B 级真实资料
  copies: TeaCopy[];         // 玩家一句话理解 / NPC 主观评价
  gameProfile: TeaGameProfile;
  /** 特殊剧情标记：周伯等评价点对它给特殊反馈（如景区王霸茶彩蛋）。仅剧情/叙事用。 */
  specialReview?: string;
}

// ─────────── 配方 ───────────

export interface BandParams {
  centerBase: number;        // 0..1 安全区中心
  widthBase: number;         // 0..1 安全区宽度
  driftPerRound?: number;    // 每轮收窄 / 偏移
  randomDrift?: number;      // 每局随机漂移
}

export interface StepParams {
  rounds?: number;                       // 倒青晒晾轮数 / 做青推荐轮数 / 炒揉轮数 / 焙火点击次数
  durationMs?: number;
  // 倒青
  softnessTarget?: [number, number];     // 叶态柔软度目标区间
  greenTarget?: number;                  // 青气需降到该值以下
  // 做青
  idealShakeForce?: [number, number];    // 摇青力度理想区间（0..1）
  weatherBias?: { force: number; roundsBias: number };  // 看天做青
  // 炒青（复用 v0.1 惯性控火）
  safeBand?: BandParams;
  heatRisePerSec?: number;
  coolPerSec?: number;
  inertiaSec?: number;
  greenDropPerSec?: number;              // 安全区内青气下降速度
  heatWindowMs?: number;                 // 趁热揉窗口
  // 揻捻
  idealRollForce?: [number, number];
  breakRatePerSec?: number;              // 过重时碎叶累积速率
  // 焙火
  band?: BandParams;                     // 焙火动态绿区
  swingSpeed?: number;                   // 指针摆动速度（rad/s 基准）
  hasteThreshold?: number;               // 火气累积上限
  toleranceByProficiency?: number;       // 熟练度带来的额外宽度（0..1）
  basketQuality?: BasketQuality;         // 采茶产出：贯穿后续步骤，轻量影响判断窗口（good 等价原行为）
  // 红茶工序（杭州·九曲红梅）：萎凋 / 发酵——仅游戏参数，非现实工艺数字
  moistureTarget?: [number, number];     // 萎凋：含水率目标区间（越小越干）
  moistureRate?: number;                 // 萎凋：走水速度
  fermentTarget?: [number, number];      // 发酵：目标区间（颜色/香气转红的程度）
  fermentRate?: number;                  // 发酵：推进速度
  // 绿茶工序（杭州·西湖龙井）：杀青 / 理条——仅游戏参数
  gestureCount?: number;                 // 理条：每轮手法序列长度
}

export interface ProcessingRecipe {
  id: string;
  regionId: string;
  appliesTo: string[];
  steps: StepId[];
  params: Partial<Record<StepId, StepParams>>;
  casual?: Partial<Record<StepId, Partial<StepParams>>>; // 小红书档：只覆盖差异
  displayNote: string;
}

// ─────────── 制茶过程与结果 ───────────

export interface LeafVisualState {
  dryColor: string;      // 干茶色
  shape: 'flat' | 'curled' | 'broken';
  edgeRed: number;       // 叶缘朱砂红（做青成果）
  sheen: number;         // 油润感
}

export interface StepOutcome {
  step: StepId;
  score: number;         // 0-100，仅内部使用，前台不显示
  faults: FaultTag[];
  visualState: LeafVisualState;
  comment: string;       // 玩家可读的自然语言
  haste?: number;        // 焙火火气累积（仅内部评分用）
  basketQuality?: BasketQuality; // 采茶步产出：供后续步骤轻量影响容错，前台不显示
}

export interface ProcessingResult {
  teaId: string;
  grade: Grade;
  comment: string;       // 一句自然语言评价
  faultReason?: string;  // 失败时的可归因原因
  /** 结果页「最值得注意」：有 fault=影响最大的那条自然语言；无 fault=一句正向反馈。由 scoring 层生成，UI 只负责呈现。 */
  highlight?: string;
  /** 各工序的自然语言小结（供结果页逐环节回顾「我这锅茶是怎么做出来的」；只有文案，没有数值面板）。 */
  stepNotes?: { step: StepId; text: string }[];
  value: number;         // 可售茶钱
  roastLevel: string;    // 轻火 / 中火 / 足火（游戏过程结果标签，不代表现实品质绝对判断）
  faults: FaultTag[];
  visuals: LeafVisualState;
  madeAt: string;
  /** 由买来的茶合成泡茶结果时携带：摊主 id 与捡漏/买贵标记；自制茶此字段为空。仅用于周伯品茶反馈，不进茶钱/评分。 */
  sourceNpc?: string;
  bargain?: 'deal' | 'overpriced';
}

// ─────────── 玩家 / 背包 ───────────

export interface TeaStack {
  id: string;
  teaId: string;
  grade: Grade;
  count: number;
  unitValue: number;
  roastLevel: string;
  firstMadeAt: string;
  /** 来源：made=自己制作（我的手艺），purchased=茶集市买来的（我的发现），gift=NPC/旅途赠礼（我的旅途）。
   *  仅后台记录，仍是一套库存，不区分两套。 */
  source?: 'made' | 'purchased' | 'gift';
  /** 买来的茶的摊主 id（仅 purchased）。用于「来源」一句展示，不建第二套库存。 */
  sourceNpc?: string;
  /** 购买时附带的小故事标记（仅 purchased）：deal=捡漏（品质不错却便宜）/ overpriced=买贵（普通茶却偏贵）。仅用于周伯品茶反馈，不含任何数值奖惩。 */
  bargain?: 'deal' | 'overpriced';
  /** 一次性旅途赠礼标记（仅 gift），如 'farewell_gift_wuyishan'。
   *  供未来 NPC 识别「玩家带着上一座茶山的茶」；同时是礼物茶「不进入普通出售」的判据。
   *  只是库存上的一个轻量标记，不新建来源历史系统。 */
  giftTag?: string;
}

export interface Player {
  name: string;
  /** 茶钱：全局唯一货币，不按茶区拆分。 */
  coins: number;
  /** 当前茶区的制茶熟练度（0-100）。前台只显示四档文字，不显示数字。
   *  保留此字段是为了兼容既有消费点（制茶容错 / 结果页 / NPC 熟练度对话）。 */
  proficiency: number;
  /** 按茶区分别记录的制茶熟练度：不同茶区制茶方法不同，不能用全局值代表。
   *  旧档迁移：见 storage.migrate（旧 proficiency → wuyishan）。 */
  proficiencyByRegion: Record<string, number>;
  /** 全局累计制茶锅数（上品/良好/普通/失败均 +1，与做得好不好无关）。 */
  totalMade: number;
  /** 游戏内「第几天」（茶集市行情 / 山路当日次数共用的轻量日期；非现实日历）。 */
  day: number;
  /** 当天已主动去山路上逛逛的次数（每日最多 3 次；回茶馆歇一晚后清零）。 */
  mountainVisitsToday: number;
  inventory: TeaStack[];
  flags: Record<string, boolean | number>;
  comicSeen: string[];
  clues: string[];
  metNpcs: string[];
  /** 旅行纪念物（明信片等）收藏 id 列表；与茶叶背包、漫画、线索并列，互不影响。 */
  souvenirs: string[];
  /** 曾经亲手制作过的茶（按 teaId）。与背包 inventory 无关：卖掉/喝掉仍保留，用于解锁茶集市等内容触发。 */
  madeTeas: Record<string, boolean>;
  /** 茶具收藏（长期持有，与茶叶背包 inventory 分开）。存茶具 id 列表；买一次长期拥有，不消耗、不重复购买。 */
  teaWareInventory: string[];
  /** 已解锁的隐藏成就 id 列表（一次性事件触发，不累计、不按锅数）。缺省为未解锁任何隐藏成就。 */
  hiddenAchievements?: string[];
  /** 当前所在的茶区 id（多茶区旅行用；当前只有 wuyishan）。 */
  currentRegion: string;
  /** 每个茶区各自的旅行天数（游戏内旅行日，非现实日历）。
   *  首次进入 = 1；回茶馆歇一晚 +1；不重复进入不重置。与山路限次 / 茶集市行情共用同一天概念（day 同步为本茶区天数）。 */
  regionDays: Record<string, number>;
  /** 每日分享奖励日期（YYYY-MM-DD）：记录玩家最近一次成功领取分享奖励的日期。
   *  每日任意一种分享（制茶 / 泡茶 / 茶席）首次成功分享即 +20，之后当天其余分享不再发钱（每日上限 20）。
   *  仅用于分享奖励判定，不参与任何玩法逻辑；旧档经 storage.migrate 自动补 undefined。 */
  shareRewardDate?: string;
}

/** 熟练度四档（C1 采用资料库版本）：初学 / 入门 / 熟手 / 老练 */
export const PROFICIENCY_TIERS = [
  { min: 0, label: '初学' },
  { min: 25, label: '入门' },
  { min: 55, label: '熟手' },
  { min: 85, label: '老练' },
] as const;

export function proficiencyLabel(p: number): string {
  let label: string = PROFICIENCY_TIERS[0].label;
  for (const t of PROFICIENCY_TIERS) if (p >= t.min) label = t.label;
  return label;
}

/** 读取某茶区的制茶熟练度（未去过则为 0，显示「初学」）。 */
export function regionProficiency(player: Player, regionId: string): number {
  return player.proficiencyByRegion?.[regionId] ?? 0;
}

/** 某茶区制茶熟练度的四档文字（未开始也显示「初学」，由调用方决定是否改说「尚未开始」）。 */
export function regionProficiencyLabel(player: Player, regionId: string): string {
  return proficiencyLabel(regionProficiency(player, regionId));
}

// ─────────── 轻量成就：只基于全局锅数派生，不额外存储、不积分、不分级 ───────────
// 成就是 totalMade 的纯函数 → 天然随存档持久化，刷新不丢、不会重复计数。

export interface BatchAchievement {
  id: string;
  icon: string;
  name: string;
  desc: string;
  need: number;
}

export const BATCH_ACHIEVEMENTS: BatchAchievement[] = [
  { id: 'batch_1', icon: '🍃', name: '第一锅', desc: '做出第一锅茶', need: 1 },
  { id: 'batch_3', icon: '🍵', name: '三锅茶', desc: '做完三锅茶', need: 3 },
  { id: 'batch_10', icon: '🔥', name: '十锅茶', desc: '做完十锅茶', need: 10 },
  { id: 'batch_20', icon: '🫖', name: '二十锅茶', desc: '做完二十锅茶', need: 20 },
];

export function earnedAchievementIds(player: Player): string[] {
  return BATCH_ACHIEVEMENTS.filter((a) => player.totalMade >= a.need).map((a) => a.id);
}

// ─────────── 隐藏成就：一次性事件触发，不累计、不按锅数 ───────────
// 与 BATCH_ACHIEVEMENTS（基于 totalMade 累计）完全分开：隐藏成就靠「某个条件首次达成」解锁，
// 不进入累计体系、不重复计数、不写复杂状态。存档里只存已解锁 id 列表（player.hiddenAchievements），
// 解锁逻辑幂等：已解锁的 id 再次出现不会重复写入、不会报错（兼容旧档 / 已得成就的存档）。

export interface HiddenAchievement {
  id: string;
  icon: string;
  name: string;
  desc: string;
}

/**
 * 隐藏成就注册表（目前只有一个，但结构预留多个）。
 * 触发条件写在各自的解锁点（如 gameStore.finishMaking），此处只描述「是什么」。
 */
export const HIDDEN_ACHIEVEMENTS: HiddenAchievement[] = [
  {
    id: 'iron_palm',
    icon: '🖐️🔥',
    name: '铁砂掌',
    desc: '锅底近200℃。茶叶没糊，手也还在。',
  },
];

/** 读取玩家已解锁的隐藏成就（旧档 hiddenAchievements 缺省为空数组，天然兼容）。 */
export function hiddenAchievementsOf(player: Player): HiddenAchievement[] {
  const earned = player.hiddenAchievements ?? [];
  return HIDDEN_ACHIEVEMENTS.filter((a) => earned.includes(a.id));
}

// ─────────── 事件 ───────────

export type GameEvent =
  | { type: 'STEP_DONE'; step: StepId; outcome: StepOutcome }
  | { type: 'STEP_FAULT'; step: StepId; fault: FaultTag }
  | { type: 'TEA_FINISHED'; result: ProcessingResult }
  | { type: 'COMIC_UNLOCKED'; comicId: string };

type Handler = (e: GameEvent) => void;
const handlers = new Set<Handler>();

export const events = {
  on(h: Handler) { handlers.add(h); return () => handlers.delete(h); },
  emit(e: GameEvent) { handlers.forEach((h) => h(e)); },
};

// ─────────── NPC（武夷山第一章 5 人；职能见 NPC 设计文档） ───────────
// 铁律：每个 NPC 有不可替代的核心功能，知识不重复讲述，不做好感度系统。

export interface Npc {
  id: string;
  name: string;
  role: string;            // 茶农兼茶馆老板 / 采茶人 / 老制茶师 / 老茶客 / 游历茶客
  coreWords: string;       // 核心关键词（身份锚）
  knowledgeScope: string[];// 知识所有权主题（该 NPC 负责的内容）
  avatarBg: string;        // 头像底色（内联 SVG 用）
  firstMeet: string;       // 第一次相遇地点
  recurring: boolean;      // 贯穿式 NPC
  sceneArt: string;        // 默认场景大图 key（见 components/scenes）
  /** 位图立绘（public 相对路径，如 'assets/npcs/wuyishan/axiu.webp'）。
   *  存在时 NpcPortrait 渲染透明位图，否则回退内联 SVG。仅资源配置，不改人设。 */
  portrait?: string;
  /** 立绘显示缩放（仅影响该 NPC 自身，不影响场景 figure 槽与其他 NPC）。
   *  1 = 原始槽位大小；<1 缩小。用于个别立绘画面占比过大时针对性收敛。 */
  portraitScale?: number;
  /** 茶集市摊位卡片中的专属缩放（与 portraitScale 独立）。
   *  1 = 撑满卡片可用区；<1 缩小以留出上方/左右/下方留白。 */
  stallScale?: number;
}

export type DialogueTrigger =
  | { kind: 'first' }
  | { kind: 'repeat' }
  | { kind: 'conditional'; flag: string; value?: boolean | number | string };

export interface DialogueLine {
  speaker?: string;        // 不填则默认该 NPC 说话
  text: string;
  mood?: 'calm' | 'warm' | 'dry' | 'joke';
  choices?: string[];      // 可选玩家回应（仅 flavor，不分支，点任意项继续）
}

export interface Dialogue {
  id: string;
  npcId: string;
  scene: string;           // 触发场景 / 地点 id
  trigger: DialogueTrigger;
  lines: DialogueLine[];
  sceneArt?: string;       // 覆盖默认场景图（同一场景多句共用一张，重大转场才换）
  setsFlags?: Record<string, boolean | number>;
  unlocksComic?: string;
  unlocksClue?: string;
  /** 赠予一件旅行纪念物（明信片 / 地方纪念物等），进入「游记收藏」而非茶叶背包。 */
  givesSouvenir?: string;
  /** 赠予一件剧情茶具（如玲姨相赠的「杭州玻璃杯」）。进入玩家茶具收藏（teaWareInventory），与茶叶背包分开；
   *  不进茶集市、不标价、不可购买；为未来「我的茶席」预留（茶席可直接读取茶具收藏摆上茶席）。 */
  givesTeaWare?: string;
  /** 赠予若干份茶（如区域告别礼「武夷山茶礼」）。grade 沿用现有 Grade 档；
   *  giftTag 为一次性旅途赠礼标记（入篓时 source='gift'，不参与普通出售）。 */
  givesTea?: { teaId: string; grade: Grade; count: number; giftTag?: string }[];
}

// ─────────── 旅行纪念物（明信片 / 地方纪念物；V0.2） ───────────
// 设计原则：玩家游历某地后获得的一件「纪念」，不是知识卡、不是评分、不是百科。
// 进入 Journal 的「旅行纪念」收藏区，与茶叶背包、漫画、线索并列但独立。

export interface SouvenirDef {
  id: string;
  /** 所属茶区（用于「茶山足迹 → 某茶区的旅行收藏」；缺省按武夷山）。 */
  regionId?: string;
  /** 纪念物形态：postcard=实景明信片（默认，需 photo）；note=文字诗笺；couplet=竖长条茶联（无照片，逐行联语）。 */
  kind?: 'postcard' | 'note' | 'couplet';
  title: string;             // 大红袍母树明信片 / 梅家坞诗笺
  /** 真实实景照片（public 相对路径，经 BASE_URL 解析）。postcard 必填；note 可省；couplet=上联图。 */
  photo?: string;
  /** 第二张图（couplet 形态=下联图）。上/下联仍是同一收藏品，不拆成两件。 */
  photo2?: string;
  caption?: string;          // 照片下方小字：大红袍母树
  place: string;             // 落款地点：福建 · 武夷山 · 九龙窠
  backText: string;          // 背面少量说明文字（note 形态下为一句短说明）
  yanboNote?: string;        // 岩伯（或赠予者）留言
  /** 赠予者署名（缺省「岩伯」）：用于留言标题与诗笺落款。 */
  giverName?: string;
  /** 诗笺正文（kind='note' 时逐行显示）。 */
  lines?: string[];
  /** 诗句出处标注。 */
  attribution?: string;
  /** 收藏描述（如「陶冶情操，有缘再见。」），与茶联等其它收藏区分。 */
  motto?: string;
  source?: string;          // 照片来源标注
}

// ─────────── 茶山偶遇：场景级世界机制（V0.1） ───────────
// 核心：偶遇发生在「世界里」，不是「encounter 页面」。
// 数据围绕「人物 × 场景 × 事件」组织：
//   - NPC 用 scenes 表达「在哪些场景更可能遇见」（倾向权重，非固定结果）
//   - 每个事件用 scenes 表达「可在哪些场景发生」
//   - 引擎：场景概率闸门 → 按场景筛 NPC(加权) → 按场景筛事件(加权)
// 仅用对白 / NPC / 场景 / 茶叶 / 茶钱 / 简单 flag，不引入好感度 / 数值系统。

/** 支持偶遇的场景（与场景注册表 SCENES 对应）。 */
export type EncounterScene = 'garden' | 'teahouse' | 'market' | 'mountain';

export interface EncounterOutcome {
  setsFlags?: Record<string, boolean | number>;
  addCoins?: number;                 // 可负（扣茶钱）
  giveTea?: { teaId: string; grade: Grade; roastLevel?: string; count?: number; unitValue: number };
  /** 一次给多包茶（如「乌牛早＋九曲红梅」套装）。与 giveTea 并存时优先用 giveTeas。 */
  giveTeas?: { teaId: string; grade: Grade; roastLevel?: string; count?: number; unitValue: number }[];
  unlockComic?: string;
  addClue?: string;
  goTo?: string;                     // 跳转某 Scene（'map' 等已存在地点）
  toast?: string;                    // 一句话结果反馈
}

export interface EncounterChoice {
  label: string;
  /** 直接结算的结果；与 followup 二选一——纯「跟进分支」选项可省略 outcome。 */
  outcome?: EncounterOutcome;
  /** 选了该项后进入的「追问/压力」分支：替换当前对白与选项，不直接结算 outcome。
   *  递归复用现有结构，用于「拒绝后又被劝一次」等多步轻交互；choices 仍走同一套买茶确认逻辑。 */
  followup?: {
    lines: DialogueLine[];
    choices?: EncounterChoice[];
    outcome?: EncounterOutcome;
  };
}

export interface EncounterEvent {
  id: string;
  /** 该事件可在哪些场景发生（决定同一 NPC 在不同地点讲不同内容）。 */
  scenes: EncounterScene[];
  weight: number;                   // 该 NPC 的「同场景事件池」内权重
  requires?: (player: Player) => boolean; // 可选守卫（V0.1 暂未大量使用）
  lines: DialogueLine[];            // 复用对白结构（仅展示；DialogueLine.choices 字段忽略）
  /** 按茶区覆盖台词（可选）：键=regionId。偶遇 NPC 跨茶区复用时说当地的话，缺省回通用 lines。 */
  linesByRegion?: Record<string, DialogueLine[]>;
  choices?: EncounterChoice[];      // 有则显示分支按钮；无则单「继续」应用 outcome
  outcome?: EncounterOutcome;       // 无 choices 时应用
}

export interface EncounterNpc {
  id: string;                       // 对应 NPCS 中已注册 NPC
  name: string;
  role: string;
  /** 各场景偶遇倾向权重；键缺席或 0 = 该场景不会出现此人。 */
  scenes: Partial<Record<EncounterScene, number>>;
  /** 限定出现的茶区（可选）：如牛姐只在杭州茶集市。缺省 = 全茶区可遇（沿用旧行为）。 */
  regions?: string[];
  requires?: (player: Player) => boolean;
  events: EncounterEvent[];
}

// ─────────── 漫画 / 知识卡（轻量，2–4 格） ───────────

export type ComicKind = 'process' | 'terroir' | 'story' | 'person' | 'brew';
export interface ComicPanel { caption: string; art?: string; }
export interface Comic {
  id: string;
  /** 所属茶区（用于「茶山足迹 → 某茶区的茶漫画」；缺省按武夷山）。 */
  regionId?: string;
  kind: ComicKind;
  title: string;
  source: string;         // 标注 S/B/传说，严禁伪装成绝对事实
  panels: ComicPanel[];   // 2–4 格
  triggerNote: string;    // 从什么行为触发
}

// ─────────── 茶区 / 地点 / 线索 ───────────

export type LocationId = 'teahouse' | 'garden' | 'workshop' | 'teatable' | 'market' | 'mothertree' | 'meijiawu';

export interface LocationDef {
  id: LocationId;
  name: string;
  npcIds: string[];
  locked?: boolean;
  accent: string;         // 地点主题色
  blurb: string;
  /** 点击后进入的场景 key（缺省用 id）。多茶区共用同一批功能场景时，用它在数据里绑定本地场景。 */
  scene?: string;
}

export interface Region {
  id: string;
  name: string;
  accent: string;         // 茶区主题色（换山即换色调，成本近零）
  intro: string;
  locations: LocationDef[];
}

export interface Clue {
  id: string;
  fromRegion: string;
  toRegion: string;       // 下一座茶山
  text: string;           // NPC 口吻的线索文案
  triggerFlag: string;    // 集齐后触发
  sourceNpc: string;
}

/** 泡茶结果（仅影响周伯口头反馈，不进茶钱） */
export interface BrewOutcome {
  brewScore: number;      // 0-100
}
