import type {
  Grade, FaultTag, StepOutcome, StepId, Tea, ProcessingResult, LeafVisualState, Difficulty,
} from '../types';
import { GRADE_LABEL } from '../types';
import { getTea } from '../data/teas';

// ─────────── 权重（V0.3 第 15 节：内部计算，前台不显示） ───────────

const WEIGHTS: Partial<Record<StepId, number>> = {
  picking: 0.15,
  daoqing: 0.10,
  zuoqing: 0.30,
  'chao-rou': 0.20,
  roasting: 0.25,
};

const FAULT_PENALTY: Record<FaultTag, number> = {
  picking_poor: 8,
  daoqing_off: 10,
  zuoqing_hasty: 16,
  zuoqing_light: 12,
  zuoqing_stale: 10,
  chaoqing_under: 12,
  chaoqing_over: 18,
  rolling_broken: 12,
  roast_hasty: 12,
  roast_over: 16,
};

export const FAULT_REASON: Record<FaultTag, string> = {
  picking_poor: '茶青采得杂了。',
  daoqing_off: '倒青没倒透，叶子还没醒。',
  zuoqing_hasty: '摇得太急，叶子受伤了。',
  zuoqing_light: '青气还在里头。',
  zuoqing_stale: '捂得有点久，闷住了。',
  chaoqing_under: '火没到，青气压不住。',
  chaoqing_over: '锅太热，边上有焦了。',
  rolling_broken: '揉得太重，条索断了。',
  roast_hasty: '火太急，香还没转出来。',
  roast_over: '焙过头了，火气压住了茶。',
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
};

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.floor(seed * arr.length) % arr.length];
}

/**
 * 火功标签：轻火/中火/足火是「本次游戏过程形成的结果标签」，
 * 不代表对现实茶叶品质的绝对判断，不形成「足火 > 轻火」的等级关系。
 */
export function computeRoastLevel(roastScore: number, haste: number): string {
  if (haste > 1.2) return '足火';
  if (roastScore >= 70) return haste > 0.5 ? '足火' : '中火';
  if (roastScore >= 45) return '中火';
  return '轻火';
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
  const roastLevel = computeRoastLevel(roastOutcome?.score ?? 50, haste);

  // 视觉合成：干茶色由做青红边 + 焙火决定
  const zuo = outcomes.find((o) => o.step === 'zuoqing');
  const chao = outcomes.find((o) => o.step === 'chao-rou');
  const edgeRed = zuo ? zuo.visualState.edgeRed : 0;
  const broken = chao ? chao.visualState.shape === 'broken' : false;
  const baseColor = grade === 'fail' ? '#5C5246' : edgeRed > 0.55 ? '#3A2E22' : '#4A3A2A';
  const visuals: LeafVisualState = {
    dryColor: baseColor,
    shape: broken ? 'broken' : grade === 'fail' ? 'flat' : 'curled',
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
  if (grade === 'fail' && faultReason) comment = faultReason;

  return {
    teaId,
    grade,
    comment,
    faultReason,
    value: tea.basePrice[grade],
    roastLevel,
    faults,
    visuals,
    madeAt: new Date().toISOString(),
  };
}

export { GRADE_LABEL };
