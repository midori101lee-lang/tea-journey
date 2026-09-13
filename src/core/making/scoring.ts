import type {
  Grade, FaultTag, StepOutcome, StepId, Tea, ProcessingResult, LeafVisualState, Difficulty,
} from '../types';
import { GRADE_LABEL } from '../types';
import { getTea } from '../data/teas';

// ─────────── 权重（V0.3 第 15 节：内部计算，前台不显示） ───────────

const WEIGHTS: Partial<Record<StepId, number>> = {
  picking: 0.15,
  daoqing: 0.15,
  zuoqing: 0.30,
  'chao-rou': 0.20,
  roasting: 0.25,
  // 红茶线（杭州·九曲红梅）：发酵是核心记忆点，权重最高
  withering: 0.15,
  rolling: 0.20,
  fermentation: 0.35,
  drying: 0.15,
  // 绿茶线（杭州·西湖龙井）：杀青定鲜、理条成形，是这一路的两处记忆点
  fixation: 0.30,
  shaping: 0.30,
};

const FAULT_PENALTY: Record<FaultTag, number> = {
  picking_poor: 8,
  daoqing_off: 10,
  daoqing_short: 8,
  daoqing_overlong: 8,
  zuoqing_hasty: 16,
  zuoqing_light: 12,
  zuoqing_stale: 10,
  chaoqing_under: 12,
  chaoqing_over: 18,
  rolling_broken: 12,
  roast_hasty: 12,
  roast_over: 16,
  wither_short: 6,
  wither_over: 6,
  ferment_short: 10,
  ferment_over: 12,
  drying_over: 10,
  fixation_under: 12,
  fixation_over: 14,
  shaping_loose: 10,
  shaping_broken: 12,
};

export const FAULT_REASON: Record<FaultTag, string> = {
  picking_poor: '茶青采得杂了。',
  daoqing_off: '倒青没倒透，叶子还没醒。',
  daoqing_short: '倒青没做足，叶片状态还没调整到位。',
  daoqing_overlong: '晾得有些久了，叶片状态偏软。',
  zuoqing_hasty: '摇得太急，叶子受伤了。',
  zuoqing_light: '青气还在里头。',
  zuoqing_stale: '捂得有点久，闷住了。',
  chaoqing_under: '火没到，青气压不住。',
  chaoqing_over: '锅太热，边上有焦了。',
  rolling_broken: '揉得太重，条索断了。',
  roast_hasty: '火太急，香还没转出来。',
  roast_over: '焙过头了，火气压住了茶。',
  wither_short: '萎凋没到，叶子还硬挺着。',
  wither_over: '萎凋过头，叶子失水太多。',
  ferment_short: '发酵没发起，香还没转出来。',
  ferment_over: '发酵过了，味有点闷。',
  drying_over: '烘得急了，火气重了些。',
  fixation_under: '锅温不够，青气没杀透。',
  fixation_over: '锅太热，边上有点焦了。',
  shaping_loose: '手上没使上劲，条索还散着。',
  shaping_broken: '手重了，条索压碎了。',
};

/** 评语池：按 茶种 × 等级 × 火功 借自然语言的口吻（前台只显示这一句 + 等级 + 茶钱 + 火功） */
const COMMENTS: Record<string, Record<Grade, string[]>> = {
  rougui: {
    fine: ['火候走得稳，桂皮香已经出来了。', '香很冲，也很正。这一锅，像样。'],
    good: ['香是有了，就是收得略急了一点。', '桂皮香在，喉咙里还差一口气。'],
    normal: ['能喝。香还没完全醒开。', '中规中矩，再焙一次也许更好。'],
    fail: ['这锅……还是留着自己喝吧。'],
  },
  shuixian: {
    fine: ['水很顺，木质香都烘出来了。', '稳稳当当的一锅，难得。'],
    good: ['味是厚的，就是香还含着。', '这锅稳，但不惊艳。'],
    normal: ['能喝。汤里少了点内容。', '不功不过。'],
    fail: ['这锅……还是留着自己喝吧。'],
  },
  dahongpao: {
    fine: ['岩骨花香，都在这一锅里了。', '火功恰到好处，回味是甜的。'],
    good: ['有那个意思了，火还能再稳些。', '香正经，水略薄。'],
    normal: ['能喝。离「大红袍」还差几锅火。', '及格，但仅是及格。'],
    fail: ['这锅……还是留着自己喝吧。'],
  },
  jiuquhongmei: {
    fine: ['红亮甜润，甜香明显，带着一丝梅子般的清甜。', '汤色红亮，甜香里透出梅子香——这一锅，像样。'],
    good: ['甜香出来了，汤也红亮，就是尾巴略短。', '不错，红茶的暖香有了。'],
    normal: ['茶汤偏浅，滋味略带青涩，下次可以再等等。', '能喝。发酵的度还差一口气。'],
    fail: ['香气发闷，这锅……还是留着自己喝吧。'],
  },
  // 杭州 · 西湖龙井（绿茶）：清亮鲜爽、豆香/栗香、回甘干净。不套红茶 / 岩茶的口吻。
  longjing: {
    fine: ['汤色清亮，茶香清鲜，带着淡淡的豆香，入口鲜爽。', '嫩绿透亮，鲜爽干净——这一锅，是龙井的样子。'],
    good: ['豆香出来了，汤也清亮，就是鲜爽稍短一口气。', '不错，绿茶那股清鲜有了。'],
    normal: ['汤色略浑，香气偏弱，鲜爽感不足，下次火候再稳些。', '能喝。杀青的度还差一点。'],
    fail: ['青气还压着，这锅……还是留着自己喝吧。'],
  },
};

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.floor(seed * arr.length) % arr.length];
}

/**
 * 「目标区间」类工序的通用评分（萎凋 / 发酵等）：
 * 区间内 80–100（越靠中心越好），区间外按超出量平滑衰减（不会因差一点就掉到很低）。
 * 让玩家靠「看状态」判断，而不是背数字；细心 ≈ 上品，略偏 ≈ 良好，明显过头/不足才低分。
 */
export function targetWindowScore(value: number, target: [number, number]): number {
  const [lo, hi] = target;
  const mid = (lo + hi) / 2;
  const half = Math.max(4, (hi - lo) / 2);
  const d = Math.abs(value - mid);
  const s = d <= half ? 100 - (d / half) * 20 : Math.max(0, 80 - ((d - half) / half) * 32);
  return Math.max(0, Math.min(100, Math.round(s)));
}

/**
 * 火功标签（岩茶）：欠火/轻火/中火/足火/高火/病火是「本次游戏过程形成的结果标签」，
 * 不代表对现实茶叶品质的绝对判断，不形成「足火 > 轻火」的等级关系。
 * 方向由 lean（负=偏轻侧、正=偏足侧）决定；haste 超限=病火（焦味，明显坏结果）。
 * 高火是「火功风格」标签（焦糖香突出），不直接判焦——焦味/炭化只出现在病火档。
 */
export const ROAST_LEAN_T = 0.03;   // 轻火/足火 分界（|lean|）
export const ROAST_LEAN_T2 = 0.075; // 欠火/高火 分界（极端侧）
export const ROAST_OVER_HASTE = 2.2; // 病火线（与配方 hasteThreshold 同源）

export function computeRoastLevel(roastScore: number, haste: number, lean = 0): string {
  if (haste > ROAST_OVER_HASTE) return '病火';
  if (lean >= ROAST_LEAN_T2) return '高火';
  if (lean <= -ROAST_LEAN_T2) return '欠火';
  if (roastScore < 45 && Math.abs(lean) < ROAST_LEAN_T2) return '轻火'; // 没焙透的兜底
  if (lean >= ROAST_LEAN_T) return '足火';
  if (lean <= -ROAST_LEAN_T) return '轻火';
  return '中火';
}

export function computeResult(
  teaId: string,
  outcomes: StepOutcome[],
  difficulty: Difficulty,
): ProcessingResult {
  const tea: Tea = getTea(teaId);
  const casualNudge = difficulty === 'casual' ? 5 : 0;

  let total = 0;
  let weightSum = 0;
  const faults: FaultTag[] = [];
  for (const o of outcomes) {
    const w = WEIGHTS[o.step] ?? 0.1;
    total += (o.score + casualNudge) * w;
    weightSum += w;
    faults.push(...o.faults);
  }
  const score = weightSum > 0 ? total / weightSum : 0;

  const penalty = faults.reduce((s, f) => s + FAULT_PENALTY[f], 0);
  const final = Math.max(0, Math.min(100, score - penalty));

  let grade: Grade;
  if (final < 40) grade = 'fail';
  else if (final < 62) grade = 'normal';
  else if (final < 80) grade = 'good';
  else grade = 'fine';

  const roastOutcome = outcomes.find((o) => o.step === 'roasting');
  const haste = roastOutcome?.haste ?? 0;
  // 过程标签按茶类走：岩茶=火功，红茶=发酵（九曲红梅的记忆点），绿茶=杀青（龙井的记忆点）。
  // 均为「本次过程形成的结果标签」，不代表对现实茶叶品质的绝对判断。
  let roastLevel: string;
  if (tea.category === 'yancha') {
    roastLevel = computeRoastLevel(roastOutcome?.score ?? 50, haste, roastOutcome?.lean ?? 0);
  } else if (tea.category === 'hongcha') {
    const f = outcomes.find((o) => o.step === 'fermentation')?.score ?? 50;
    roastLevel = faults.includes('ferment_over') ? '略过' : faults.includes('ferment_short') ? '不足' : f >= 60 ? '到位' : '中';
  } else if (tea.category === 'green') {
    const fx = outcomes.find((o) => o.step === 'fixation')?.score ?? 50;
    roastLevel = faults.includes('fixation_over') ? '略过' : faults.includes('fixation_under') ? '不足' : fx >= 60 ? '刚好' : '中';
  } else {
    roastLevel = '干燥';
  }

  // 视觉合成：岩茶由做青红边 + 焙火决定；红茶由发酵转色 + 揉捻断条决定；
  // 绿茶不转红，看的是「杀青是否还鲜、理条是否扁平挺直」。
  const zuo = outcomes.find((o) => o.step === 'zuoqing');
  const chao = outcomes.find((o) => o.step === 'chao-rou');
  const rollO = outcomes.find((o) => o.step === 'rolling');
  const fermO = outcomes.find((o) => o.step === 'fermentation');
  const shapeO = outcomes.find((o) => o.step === 'shaping');
  const isHong = tea.category === 'hongcha';
  const isGreen = tea.category === 'green';
  const edgeRed = isHong ? (fermO ? fermO.score / 100 : 0)
    : isGreen ? 0
      : (zuo ? zuo.visualState.edgeRed : 0);
  const broken = isHong
    ? (rollO ? rollO.visualState.shape === 'broken' : false)
    : isGreen
      ? (shapeO ? shapeO.visualState.shape === 'broken' : false)
      : (chao ? chao.visualState.shape === 'broken' : false);
  const baseColor = grade === 'fail' ? (isGreen ? '#5c5844' : '#5C5246')
    : isGreen ? (grade === 'fine' || grade === 'good' ? '#a8ae58' : '#94995c')
      : isHong ? (edgeRed > 0.7 ? '#5a2b1e' : '#6b3a26')
        : edgeRed > 0.55 ? '#3A2E22' : '#4A3A2A';
  const visuals: LeafVisualState = {
    dryColor: baseColor,
    // 龙井的目标就是「扁平挺直」——flat 对绿茶是好形，不是失败形。
    shape: broken ? 'broken' : isGreen ? 'flat' : grade === 'fail' ? 'flat' : 'curled',
    edgeRed,
    sheen: final / 100,
  };

  const seed = (final * 7919 + teaId.length * 31) % 97 / 97;
  const pool = COMMENTS[teaId] ?? COMMENTS.shuixian;
  let comment = pick(pool[grade], seed);

  const worst = faults.length
    ? faults.reduce((a, b) => (FAULT_PENALTY[a] >= FAULT_PENALTY[b] ? a : b))
    : null;
  const faultReason = worst ? FAULT_REASON[worst] : undefined;

  // 轻教学反馈（scoring 层生成，UI 只呈现）：
  // 有 fault → 展示「影响最大」的那一条；无 fault → 给一句正向反馈（不强行制造负面）。
  const PRAISE: Partial<Record<StepId, string>> = {
    picking: '茶青采得匀净，底子好。',
    daoqing: '倒青醒得透，叶片状态调得正好。',
    zuoqing: '做青的节奏掌握得不错。',
    'chao-rou': '炒揉拿捏得准，条索紧结。',
    roasting: '这一炉火候走得很稳。',
    withering: '萎凋得匀，叶子软硬正好。',
    rolling: '揉捻到位，条索紧结。',
    fermentation: '发酵的度拿捏得不错。',
    drying: '烘干收得稳，火气不重。',
    fixation: '杀青抓得准，青气散了，鲜味定住了。',
    shaping: '理条做得细，叶子压得扁平挺直。',
  };
  const best = outcomes.reduce((a, b) => (b.score > a.score ? b : a));
  const praise = PRAISE[best.step] ?? '这一锅做得稳。';
  const highlight = faultReason ?? (grade === 'fail' ? '这一锅没达到预期，下一锅再来。' : praise);

  // 逐工序小记：把每一步的自然语言结论汇总，供结果页让玩家「看懂自己这锅茶」。
  const stepNotes = outcomes.filter((o) => !!o.comment).map((o) => ({ step: o.step, text: o.comment }));

  return {
    teaId,
    grade,
    comment,
    faultReason,
    highlight,
    stepNotes,
    value: tea.basePrice[grade],
    roastLevel,
    worstFault: worst ?? undefined,
    faults,
    visuals,
    madeAt: new Date().toISOString(),
  };
}

export { GRADE_LABEL };
