import type { Grade } from '../../core/types';
import { getTea } from '../../core/data/teas';
import { getNpc } from '../../core/data/npcs';
import { getTeaWare, type TeaWare } from '../../core/data/teaWares';
import { todayMarket } from './marketEval';

// ─────────────────────────────────────────────────────────────
// 茶集市 V0.3：逛摊与买茶（NPC 是摊主，茶叶是摊上的东西）
//
// 设计约束（用户明确）：
//   1) 不新建「商城页面」：玩家仍在茶集市场景里逛，点开 NPC 摊位看茶、买茶。
//   2) 今日行情(todayMarket)只轻量影响买价（±需求→±5%），不升品质、不无限涨价。
//   3) 买价以茶叶经济系统 basePrice[grade] 为基准，封顶 ±15%，不与卖茶第二套价格体系。
//   4) 一个摊位摆 1~3 种茶；3~5 个摊位；按 day 种子确定性生成（刷新不乱跳）。
//   5) 摊主与普通偶遇 NPC 共用立绘/场景层，但身份区分、不混系统。
// ─────────────────────────────────────────────────────────────

/** 适合当「摊主」卖茶的 NPC（来自现有偶遇 NPC，不新增角色）。 */
export const STALL_OWNERS = [
  'caicha_ayi',     // 采茶阿姨
  'young_farmer',   // 年轻茶农
  'maicha_dashu',   // 卖茶大叔
  'laojia',         // 茶商老贾
  'tricycle_farmer' // 三轮车茶农
] as const;

/** 每位摊主今天可能摆的茶 + 一句招呼（按角色定位，不写成专业断言）。 */
const OWNER_PROFILE: Record<string, { greeting: string; teas: string[] }> = {
  caicha_ayi: { greeting: '来看看？都是最近做的。', teas: ['shuixian', 'rougui'] },
  young_farmer: { greeting: '这锅肉桂我今年做得还挺满意。', teas: ['rougui', 'shuixian', 'dahongpao'] },
  maicha_dashu: { greeting: '看看？几种都有。', teas: ['rougui', 'shuixian', 'dahongpao'] },
  laojia: { greeting: '这包可不便宜，不过最近确实有人找。', teas: ['rougui', 'shuixian', 'dahongpao'] },
  tricycle_farmer: { greeting: '刚从山上带下来的，你要不看看？', teas: ['shuixian', 'rougui'] },
};

/**
 * 每位摊主今天可能摆的茶具（按角色定位，不写成专业断言）。
 * 设计约束：一个摊位 = 多种商品（茶 + 茶具混摆），不是「一人只卖一种茶具」。
 * 老贾是「看起来很贵的东西」担当，池子里含精选紫砂壶与稀有旅行茶具。
 */
const WARE_PROFILE: Record<string, string[]> = {
  caicha_ayi: ['bamboo-teaware', 'white-teacup', 'blue-white-tea-caddy'],
  young_farmer: ['white-gaiwan', 'fairness-cup', 'blue-gray-tea-caddy'],
  maicha_dashu: ['white-gaiwan', 'white-teacup', 'fairness-cup'],
  laojia: ['celadon-gaiwan', 'selected-zisha-pot', 'blue-white-tea-caddy', 'rare-travel-teaware'],
  tricycle_farmer: ['bamboo-teaware', 'white-teacup', 'blue-gray-tea-caddy'],
};

/** 每款茶、每档品质的一句话（看茶不看数；按茶种+品质轻量变化）。 */
const TEA_DESC: Record<string, Record<Grade, string[]>> = {
  rougui: {
    fail: ['这包火没稳住，自己喝喝吧。'],
    normal: ['香气还成，自己喝挺好。', '桂皮味有，不算冲。'],
    good: ['香气清楚，回甘也不错。', '火候稳，闻着就舒服。'],
    fine: ['香气很足，回甘也漂亮。', '这一包，山里人一眼认得出。'],
  },
  shuixian: {
    fail: ['这锅没出那个味儿，留着喝吧。'],
    normal: ['汤顺，慢慢喝不腻。', '中规中矩，不挑人。'],
    good: ['汤感挺顺，慢慢喝不错。', '水路清楚，入口不糙。'],
    fine: ['汤厚回甜，越喝越顺。', '这包水仙，醇得很。'],
  },
  dahongpao: {
    fail: ['这包没焙出岩韵，自己留着。'],
    normal: ['岩味有，不算惊艳。', '名气大，这包就普通喝。'],
    good: ['岩韵清楚，回味带甜。', '这包大红袍，喝着稳。'],
    fine: ['岩骨花香都齐了，难得。', '这一包，配得上名号。'],
  },
};

export interface StallTea {
  teaId: string;
  grade: Grade;
  price: number;
  desc: string;
  /** 小故事标记：deal=捡漏（品质不错却便宜）/ overpriced=买贵（普通茶却偏贵）。无数值奖惩，仅用于周伯品茶反馈。 */
  bargain?: 'deal' | 'overpriced';
}

// ─────────────────────────────────────────────────────────────
// 茶集市 V0.4「生活化茶市」：让摊位像一个会发生小故事的地方。
//   - 每位摊主有轻量「市场性格」sellerStyle，决定话术与信息透明度（不建成「商家可信度」数值）。
//   - 「看看茶」= 轻量自然语言描述（条索/颜色/闻香），不出现专业评分。
//   - 「问问老板」= 从少量固定问题里选，按 sellerStyle 给不同口吻的回答；话术≠真实情况。
// 所有内容均为自然语言，严禁香气 82 分 / 可信度 85 这类数字。
// ─────────────────────────────────────────────────────────────

/** 轻量市场性格（仅影响话术与「看看」信息密度，不建成信誉/好感数值）。 */
export type SellerStyle = 'honest' | 'casual' | 'businesslike' | 'salesy' | 'tea_person';

/** 摊主 → 市场性格。人物有倾向，但具体这次发生什么由生成时随机决定（话术≠真实情况）。 */
export const SELLER_STYLE: Record<string, SellerStyle> = {
  caicha_ayi: 'honest',       // 采茶阿姨：实在，直说
  young_farmer: 'casual',     // 年轻茶农：爽快
  maicha_dashu: 'businesslike', // 卖茶大叔：会做生意、明码标价
  laojia: 'salesy',           // 茶商老贾：会包装
  tricycle_farmer: 'casual',  // 三轮车茶农：随意
};

/**
 * 「看看茶」：每款茶 × 每档品质几句自然语言（条索 / 颜色 / 闻香）。
 * 看的是「大概」，不是考试——同一品质不同摊位措辞随机抽一句，但都落在同一判断区间。
 */
const TEA_LOOK: Record<string, Record<Grade, string[]>> = {
  rougui: {
    fail: ['条索有点散，颜色也暗。', '闻着青气没去干净，火也没稳住。'],
    normal: ['条索还算完整，颜色匀。', '闻起来有一点桂皮似的香气，不冲。', '干茶看着普通，没啥特别。'],
    good: ['条索紧实，颜色油润。', '桂皮香清楚，凑近能闻到。', '叶底还行，做工算稳。'],
    fine: ['条索漂亮，油亮亮的。', '桂皮香一开盖就上来，很足。', '这包看着就比一般的细。'],
  },
  shuixian: {
    fail: ['叶子有点碎，颜色发暗。', '闻着没什么水韵，火也没到位。'],
    normal: ['条索顺，颜色中规中矩。', '汤色透亮，喝着顺口。', '看着普通，自己喝不挑人。'],
    good: ['条索匀整，带点兰韵。', '闻着水感清楚，入口不糙。', '叶底厚实，做工稳。'],
    fine: ['条索肥壮，颜色油绿带光。', '兰韵明显，越泡越甜。', '这包水仙醇得很，少见。'],
  },
  dahongpao: {
    fail: ['条索偏碎，岩韵没出来。', '闻着平平，焙火也没稳住。'],
    normal: ['条索还成，颜色深褐。', '有点岩味，不算惊艳。', '名气大，这包就普通喝。'],
    good: ['条索紧结，岩韵清楚。', '焙火到位，回味带甜。', '这包大红袍喝着稳。'],
    fine: ['条索匀润，宝色明显。', '岩骨花香都齐了，难得。', '这一包，配得上名号。'],
  },
};

/** 「看看茶」抽一句（随机但同品质同判断）。 */
export function lookAtTea(teaId: string, grade: Grade): string {
  const pool = TEA_LOOK[teaId]?.[grade] ?? ['看着就是一包茶。'];
  return pool[Math.floor(Math.random() * pool.length)];
}

/** 玩家可问的少量问题（flavor，不分支、不考试）。 */
export const ASK_QUESTIONS: { key: string; label: string }[] = [
  { key: 'where', label: '这是哪里的茶？' },
  { key: 'year', label: '是今年做的吗？' },
  { key: 'how', label: '这茶是怎么做的？' },
  { key: 'price', label: '为什么卖这个价？' },
];

/**
 * 按 sellerStyle 给的回答库。同一问题不同性格口吻不同；
 * 且「话术 ≠ 真实情况」：salesy 的「这货不一般」可能对应普通茶（具体品质由 grade 决定，不由话术决定）。
 */
const ASK_ANSWERS: Record<SellerStyle, Record<string, string[]>> = {
  honest: {
    where: ['自己家茶山出的，山下那几垄。', '就本村的茶，没啥名堂。'],
    year: ['今年春上做的，放着也半年了。', '去年底的，存得还行。'],
    how: ['倒青做青炒揉焙火，一步步来的。', '老法子，没偷工。'],
    price: ['就这价，实在，不糊弄你。', '本小利薄，图个热闹。'],
  },
  casual: {
    where: ['自家山上的，你随便看。', '山里出的，错不了。'],
    year: ['今年新做的，尝个鲜。', '前阵子刚焙的。'],
    how: ['做茶嘛，跟着节气走。', '摇青焙火，手熟就行。'],
    price: ['你喜欢就这个价，不贵。', '随便给，合口味最重要。'],
  },
  businesslike: {
    where: ['明码标价，武夷山的水仙。', '这包肉桂，山里出的。'],
    year: ['今年春茶，新鲜着呢。', '去年存的，转化得正好。'],
    how: ['标准工序，该有的都有。', '该晒晒该焙焙，不马虎。'],
    price: ['这价公道，你要是懂行就知道。', '行市就是这个价，不虚。'],
  },
  salesy: {
    where: ['这可是好地方出的，一般人我不拿出来。', '山场不一般，你闻闻就晓得。'],
    year: ['今年头采，紧着给你留的。', '陈了两年，火退得正好，更值钱。'],
    how: ['独门手法，外面学不来。', '老师傅手把手做的，不一样。'],
    price: ['这价真不算贵，懂的人抢着要。', '好东西自然这个价，你放心。'],
  },
  tea_person: {
    where: ['一处好山场，水土养出来的。', '茶嘛，山在哪里，味就在哪里。'],
    year: ['今年的，火气将将退。', '时候到了，就做了。'],
    how: ['顺着茶性来，急不得。', '看天看茶，一锅一锅来。'],
    price: ['值不值，泡开就知道了。', '价在其次，合不合口才是真。'],
  },
};

/** 「问问老板」抽一句回答（按摊主性格；话术不保证等于真实品质）。 */
export function askSeller(npcId: string, questionKey: string): string {
  const style = SELLER_STYLE[npcId] ?? 'honest';
  const pool = ASK_ANSWERS[style][questionKey] ?? ['他笑了笑，没多说。'];
  return pool[Math.floor(Math.random() * pool.length)];
}

export interface Stall {
  npcId: string;
  name: string;
  role: string;
  greeting: string;
  teas: StallTea[];
  /** 该摊位今天摆出的茶具（与茶混摆；可能为空）。 */
  wares: TeaWare[];
}

/** 确定性随机（mulberry32）：同一 day 永远得到同一批摊位/茶/价，刷新不乱跳。 */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 品质倾向：普通 50% / 良好 35% / 上品 15%（摊主不卖失败茶）。 */
function rollGrade(rng: () => number): Grade {
  const r = rng();
  if (r < 0.15) return 'fine';
  if (r < 0.5) return 'good';
  return 'normal';
}

/**
 * 按 day 确定性生成今天的集市摊位。
 *  - 选 3~5 个摊主；每个摊主摆 1~3 种茶（从其茶池取）。
 *  - 价格 = basePrice[grade] ×(1+需求±5%)×(1+抖动±5%)，封顶 ±15%（不过度涨价）。
 *  - 今日行情只调「价格接受度/成交意愿」，绝不改品质。
 */
export function generateStalls(day: number): Stall[] {
  const rng = mulberry32(day * 6151 + 7);
  const m = todayMarket(day);

  const ownerCount = 3 + Math.floor(rng() * 3); // 3..5
  const owners = shuffle([...STALL_OWNERS], rng).slice(0, ownerCount);

  return owners.map((npcId) => {
    const prof = OWNER_PROFILE[npcId];
    const npc = getNpc(npcId);
    const nTeas = Math.min(prof.teas.length, 1 + Math.floor(rng() * 3)); // 1..3
    const picked = shuffle(prof.teas, rng).slice(0, nTeas);

    const teas: StallTea[] = picked.map((teaId) => {
      const grade = rollGrade(rng);
      const base = getTea(teaId).basePrice[grade];
      const demand = m.demand[teaId] ?? 1;
      const demandFactor = 1 + (demand - 1) * 0.5;        // 行情影响 ±5%
      const jitter = 1 + (rng() - 0.5) * 0.1;             // 轻微随机 ±5%
      let price = Math.round(base * demandFactor * jitter);
      price = Math.max(Math.round(base * 0.9), Math.min(Math.round(base * 1.15), price)); // 封顶 ±15%

      // 小故事标记（无数值奖惩，只决定周伯后续品茶反馈的口吻）：
      //   deal=捡漏 —— 品质不错（良好/上品）却卖到了附近最低价；
      //   overpriced=买贵 —— 普通茶却卖到了附近最高价。
      let bargain: 'deal' | 'overpriced' | undefined;
      if ((grade === 'good' || grade === 'fine') && price <= Math.round(base * 0.97)) bargain = 'deal';
      else if (grade === 'normal' && price >= Math.round(base * 1.1)) bargain = 'overpriced';

      return { teaId, grade, price, desc: pick(TEA_DESC[teaId][grade], rng), bargain };
    });

    // 茶具：每个摊位从自己的池子里挑 1~3 件（与茶混摆，不重复购买、不影响品质）。
    const warePool = WARE_PROFILE[npcId] ?? [];
    const nWares = Math.min(warePool.length, 1 + Math.floor(rng() * 3)); // 1..3
    const wares: TeaWare[] = shuffle(warePool, rng)
      .slice(0, nWares)
      .map((id) => getTeaWare(id))
      .filter((w): w is TeaWare => !!w);

    return { npcId, name: npc.name, role: npc.role, greeting: prof.greeting, teas, wares };
  });
}
