import type { Grade, TeaStack, Player } from '../../core/types';
import { TEAS } from '../../core/data/teas';
import { getNpc } from '../../core/data/npcs';

/** 小满对市场价值的判断类型：加价 / 正常价 / 劝退（不强制）。 */
export type MarketAdvice = 'raise' | 'normal' | 'avoid';

export interface MarketEval {
  look: string;          // 「看茶」动作描写
  lines: string[];       // 小满的点评（随机表达，品质判断一致）
  advice: MarketAdvice;  // 市场建议
  adviceLine: string;    // 市场建议句（随机表达）
}

/**
 * 同一品质区间准备多套表达，随机抽一句——随机的是「怎么说」，不是「品质判断」。
 * 同一锅茶在同一次进入集市时评价保持一致（调用方一次性缓存即可）。
 */
const VARIANTS: Record<Grade, { lines: string[][]; advice: string[] }> = {
  fine: {
    lines: [
      ['哟，这锅做得不错。', '香气出来了，火候也稳。'],
      ['这回稳了。', '卖相好，山里人一眼就认得出。'],
      ['你这回是真下功夫了。', '汤色透亮，活该卖个好价。'],
    ],
    advice: ['这锅我建议你往上抬一抬。', '我看可以加点价。', '这茶卖便宜了，我都替你可惜。'],
  },
  good: {
    lines: [
      ['不错，有点意思。', '这锅茶已经能拿出去见人了。'],
      ['火候还行，香味也出来了。', '比上回稳。'],
    ],
    advice: ['卖的话，正常价就行。', '再稳一点，下一锅说不定能卖个好价。'],
  },
  normal: {
    lines: [
      ['嗯……能卖。', '味道没出大问题，就是没什么特别的。'],
      ['中规中矩。', '没坏，就是没什么惊喜。'],
    ],
    advice: ['这种茶，按普通价走吧。', '能卖，但别指望卖高价。'],
  },
  fail: {
    lines: [
      ['哎呀……太可惜了。', '这锅火候没稳住。'],
      ['这锅没救出那个味儿来。', '你这茶，我可不敢替你夸。'],
      ['送人当赠品……都得看人家给不给面子。', '这锅，你自己喝喝就好。'],
    ],
    advice: ['这种品质，我劝你别卖。', '卖出去怕是砸自己的招牌。', '要不你自己留着喝？别拿出去卖了。'],
  },
};

const LOOK = '（小满捏起一撮茶叶，端详了一会儿）';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 小满验茶：根据实际品质给出带性格的点评与市场建议（不出现数值评分）。 */
export function evaluateMarket(stack: TeaStack): MarketEval {
  const v = VARIANTS[stack.grade];
  const advice: MarketAdvice =
    stack.grade === 'fine' ? 'raise'
    : stack.grade === 'fail' ? 'avoid'
    : 'normal';
  return { look: LOOK, lines: pick(v.lines), advice, adviceLine: pick(v.advice) };
}

/**
 * 建议售价：仅上品(fine)由小满主动「加价」上浮，其余维持原价(basePrice)。
 * 不建立复杂经济系统，只让高品质茶在出售按钮上体现市场溢价。
 */
const PREMIUM: Record<Grade, number> = { fine: 8, good: 0, normal: 0, fail: 0 };

export function suggestedPrice(stack: TeaStack): number {
  return stack.unitValue + PREMIUM[stack.grade];
}

// ─────────────────────────────────────────────────────────────
// 茶集市 V0.2：玩家摆摊做生意（小满 = 茶摊搭档 / 管家）
//
// 设计约束（用户明确）：
//   1) 今日行情 = 轻量游戏参数，不是现实市场模拟（只给 ±10% 的需求偏好 + 一句行情话）。
//   2) 市场需求只影响「成交意愿 / 价格接受度」，不直接把热门茶变成无限涨价。
//   3) 回头客 / 熟人捧场 = NPC 记忆（metNpcs）+ 轻量 flag，不增加好感度 / 口碑数值。
//   4) 茶集市与山路共用同一个 day（行情随 player.day 走，与山路限次同天）。
// ─────────────────────────────────────────────────────────────

/** 确定性随机（mulberry32）：同一 day 永远得到同一行情 / 同一批客人倾向，刷新不乱跳。 */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function teaName(id: string): string {
  return TEAS.find((t) => t.id === id)?.name ?? id;
}

// ─────────── 今日行情 · 按茶区（2026-09-14 地区化） ───────────
// 行情茶与文案随 currentRegion 走：地区 → 地区市场配置 → 本地茶 → 行情话。
// 未来加福州/潮州：在这里加一条配置即可，UI 与调用方零改动。
// 铁律：杭州行情绝不出现岩韵/焙火/山场/肉桂等武夷山术语；外地茶（跨区茶商）在非本产区
// 行情中 demand 缺省 = 1.0 中性——武夷山茶在杭州出售不受杭州行情影响，反之亦然。
const REGION_MARKETS: Record<string, {
  teas: string[];      // 本地行情茶（demand 只为它们生成）
  hotNotes: string[];  // 有热门茶时的行情话（{hot}/{cold} 占位，按 day 确定性抽取）
  calmNotes: string[]; // 行情平稳时的行情话
}> = {
  wuyishan: {
    teas: ['rougui', 'shuixian', 'dahongpao'],
    hotNotes: [
      '山里人今天偏爱{hot}，价好商量些；{cold}则平淡些。',
      '岩茶市道不错，{hot}香头正旺；{cold}今天问的人少些。',
      '做青做得好的抢手，{hot}今天格外走俏；{cold}稍慢些。',
    ],
    calmNotes: [
      '来逛的人不少，价钱都还实在。',
      '焙火香飘满市，各家价钱都实在。',
      '山场茶陆续下山，行情平稳。',
    ],
  },
  hangzhou: {
    teas: ['longjing', 'jiuquhongmei'],
    hotNotes: [
      '茶客今天偏爱{hot}，价好商量些；{cold}则平淡些。',
      '春茶市道正好，{hot}清鲜讨喜；{cold}今天安静些。',
      '西湖边茶市热闹，{hot}更受追捧；{cold}稍平淡些。',
    ],
    calmNotes: [
      '来逛的人不少，价钱都还实在。',
      '湖边茶市人来人往，各家价钱都公道。',
      '本地茶客常来坐坐，行情平稳。',
    ],
  },
};

/** 茶区种子：让不同茶区在同一天各有自己的行情（不与武夷山共用序列）。 */
function regionSeed(region: string): number {
  let h = 0;
  for (let i = 0; i < region.length; i++) h = (h * 31 + region.charCodeAt(i)) | 0;
  return Math.abs(h) % 100003;
}

/** 今日行情：轻量、按 (day, region) 种子生成。demand 仅 ±10%，只用来算顾客「心理价位」。 */
export interface DayMarket {
  headline: string;
  note: string;
  demand: Record<string, number>;
}

export function todayMarket(day: number, regionId: string = 'wuyishan'): DayMarket {
  const cfg = REGION_MARKETS[regionId] ?? REGION_MARKETS.wuyishan;
  const rng = mulberry32(day * 9973 + 17 + regionSeed(regionId));
  const demand: Record<string, number> = {};
  for (const id of cfg.teas) demand[id] = Math.round((0.9 + rng() * 0.2) * 100) / 100;
  const hot = cfg.teas.reduce((a, b) => (demand[a] >= demand[b] ? a : b));
  const cold = cfg.teas.reduce((a, b) => (demand[a] <= demand[b] ? a : b));
  const hotName = teaName(hot);
  const coldName = teaName(cold);
  let headline: string;
  let note: string;
  if (demand[hot] - demand[cold] < 0.04) {
    headline = '今日行情平稳';
    note = cfg.calmNotes[Math.floor(rng() * cfg.calmNotes.length)];
  } else {
    headline = `今日「${hotName}」比较抢手`;
    note = cfg.hotNotes[Math.floor(rng() * cfg.hotNotes.length)]
      .replace(/\{hot\}/g, hotName)
      .replace(/\{cold\}/g, coldName);
  }
  return { headline, note, demand };
}

/** 一位来摊上的顾客（回头客 / 熟人 / 路人）。 */
export interface MarketCustomer {
  npcId: string;
  name: string;
  isRegular: boolean; // 回头客：之前在世界上见过这人
  isKnown: boolean;   // 熟人：主线里认识的人，会多捧场一点（封顶，不无限）
  stackId: string;
  teaId: string;
  willing: number;    // 这位数以内的价，他愿意买（受 todayMarket 需求影响，非无限）
}

// 可能来摊上的路人 / 回头客候选（均为已在世界中注册的 NPC）
const CUSTOMER_POOL = [
  'linggu', 'laojia', 'caicha_ayi', 'young_farmer', 'tea_dajie',
  'roadside_uncle', 'young_male_traveler', 'maicha_dashu', 'tricycle_farmer',
];
// 主线里认识的人 = 熟人（多捧场一点，但只是 flavor + 封顶系数）
const KNOWN_SET = new Set(['laochen', 'axiu', 'yanbo', 'zhoubo', 'linggu']);

function shuffleInPlace<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function shuffleIndices(n: number, rng: () => number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  shuffleInPlace(a, rng);
  return a;
}

/** 这位顾客愿意出的价：小满建议价 × 当日需求 × 熟人系数（封顶）。 */
function willingnessOf(stack: TeaStack, demand: Record<string, number>, isKnown: boolean): number {
  const base = suggestedPrice(stack);
  const demandFactor = demand[stack.teaId] ?? 1;
  const knownFactor = isKnown ? 1.08 : 1; // 熟人捧场：最多多 8%，不无限叠加
  return Math.max(1, Math.round(base * demandFactor * knownFactor));
}

/**
 * 今天来摊上的客人：回头客（见过的 NPC）优先，再补路人；每人分到一锅不同的茶。
 * 完全由 (day, region) + 当前背包决定（确定性），不引入新系统。
 * 行情随当前茶区走：杭州摊上只按龙井/红梅的需求算价，武夷山茶在此为中性需求。
 */
export function marketCustomers(player: Player, day: number, stacks: TeaStack[], regionId: string = 'wuyishan'): MarketCustomer[] {
  if (stacks.length === 0) return [];
  const rng = mulberry32(day * 7919 + 31 + regionSeed(regionId));
  const m = todayMarket(day, regionId);

  const met = player.metNpcs.filter((id) => id !== 'mystery_tea_person');
  const regulars = met.filter((id) => CUSTOMER_POOL.includes(id) || KNOWN_SET.has(id));
  const passers = CUSTOMER_POOL.filter((id) => !met.includes(id));

  const count = Math.min(2 + Math.floor(rng() * 3), stacks.length); // 今天来 2~4 位，但不多于手上的茶
  const chosen: { id: string; isRegular: boolean }[] = [];
  shuffleInPlace(regulars, rng);
  for (const id of regulars) if (chosen.length < count) chosen.push({ id, isRegular: true });
  shuffleInPlace(passers, rng);
  for (const id of passers) if (chosen.length < count) chosen.push({ id, isRegular: false });
  if (chosen.length === 0) chosen.push({ id: 'maicha_dashu', isRegular: false });

  const order = shuffleIndices(stacks.length, rng);
  return chosen.map((c, i) => {
    const stack = stacks[order[i]];
    const isKnown = KNOWN_SET.has(c.id) && met.includes(c.id);
    return {
      npcId: c.id,
      name: getNpc(c.id)?.name ?? c.id,
      isRegular: c.isRegular,
      isKnown,
      stackId: stack.id,
      teaId: stack.teaId,
      willing: willingnessOf(stack, m.demand, isKnown),
    };
  });
}
