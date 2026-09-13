import type { FaultTag } from '../types';
import { computeRoastLevel } from './scoring';

// ─────────── 焙火结算（纯函数） ───────────
// RoastingStep 组件与蒙特卡洛验证脚本共用同一份评分逻辑，保证「验证的就是上线代码」。
// 设计约定（用户 2026-09-13 定稿）：
//   1) 火性占 20 分，但只是软加成/减分——不设「火性匹配才允许上品」的隐藏硬门槛；
//   2) 肉桂=中火最佳、足火可接受；水仙=中火/足火皆宜；大红袍=轻/中/足都是风格（只要求稳、不踩极端）；
//   3) 高火是火功风格标签（焦糖香突出），不判焦；焦味/炭化只出现在病火档（haste 超限）。
// 评分构成：命中质量×60 + 稳定性×20 + 火性合拍×20 − 病火惩罚（casual +5）。
// 具体系数是校准起点而非定论：以蒙特卡洛三目标校准（三茶上品率下降、良品率稳定、大红袍三档火功皆可上品）。

export type RoastZone = 'center' | 'edge' | 'warn' | 'bad';
export interface RoastTap { zone: RoastZone; dist: number; side: number; } // side: -1=偏轻侧 +1=偏足侧
export type RoastStyle = 'aroma' | 'mellow' | 'balanced';

const ZONE_CREDIT: Record<RoastZone, number> = { center: 1, edge: 0.7, warn: 0.35, bad: 0 };

/**
 * 火性合拍曲线（lean → 0~1，连续插值，校准起点可调）：
 *   每只茶一条曲线——理想火性点=1，随偏离平滑下降。连续而非档位阶跃的原因：
 *   锁定时机有噪声 → lean 必然在理想点附近抖动 → 期望火性分必然低于满分，
 *   「懂茶性」的玩家把落点对准理想点才能拿满 → 「不同的茶需要不同的火候判断」。
 *   全部为软分：不存在任何「火性不匹配就不给上品」的判断，只影响这 20 分落多少。
 * 曲线关键点（lean, fit）按升序排列，端点外 clamp。
 */
const STYLE_CURVE: Record<RoastStyle, [number, number][]> = {
  // 肉桂：理想=中火（lean≈0）；右侧稍缓（足火可接受）；欠火/高火重罚
  aroma: [[-0.12, 0.02], [-0.075, 0.12], [-0.03, 0.55], [0, 1], [0.03, 0.74], [0.075, 0.28], [0.12, 0.05]],
  // 水仙：中火~足火一段平台（耐焙求醇）；轻火侧掉得快（汤薄）
  mellow: [[-0.12, 0.03], [-0.075, 0.14], [-0.03, 0.62], [0, 0.92], [0.03, 1], [0.045, 1], [0.075, 0.6], [0.12, 0.12]],
  // 大红袍：轻/中/足皆有效风格（宽平台、小坡度）；越过欠火线才重罚
  balanced: [[-0.12, 0.04], [-0.075, 0.32], [-0.05, 0.85], [0, 1], [0.05, 0.95], [0.075, 0.68], [0.12, 0.15]],
};

function interpFit(points: [number, number][], lean: number): number {
  if (lean <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i];
    if (lean <= x1) {
      const [x0, y0] = points[i - 1];
      return y0 + ((y1 - y0) * (lean - x0)) / (x1 - x0);
    }
  }
  return points[points.length - 1][1];
}

/** 火性合拍度（0~1，游戏参数）。软分量，无任何「不匹配则不给上品」的判断；病火直接 0。 */
function styleFit(style: RoastStyle, lean: number, level: string): number {
  if (level === '病火') return 0;
  return interpFit(STYLE_CURVE[style], lean);
}

/** 结果页火功点评（茶种 × 火功档）：自然语言，无数值。高火=风格描述，病火=焦味/炭化负面。 */
const ROAST_REVIEW: Record<string, Record<string, string>> = {
  rougui: {
    欠火: '青味还压着香，这一炉火根本没进到叶子里。',
    轻火: '火收得早了，桂皮香还浮着，茶汤也略单薄。',
    中火: '桂皮香站住了，香和汤都在——肉桂该有的样子。',
    足火: '火走深了，香转沉稳，高扬的劲儿收了些。',
    高火: '焦糖香开始冒头，盖了些桂皮香——火再收一收就要过了。',
    病火: '焦味压过了茶香，叶底都炭了，这一炉焙坏了。',
  },
  shuixian: {
    欠火: '青气没褪干净，汤里发涩，这火等于没焙。',
    轻火: '汤寡了些，醇厚没烘出来。',
    中火: '香水均衡，顺得很，是水仙的脾气。',
    足火: '焙得透，汤厚而滑，木质香都出来了。',
    高火: '火气偏重，兰香有点闷住了。',
    病火: '焦味上来了，汤也浊了，这炉可惜了。',
  },
  dahongpao: {
    欠火: '青味未退，香是浮的，算不上成茶。',
    轻火: '偏香一路，鲜扬，底子略薄。',
    中火: '香水平衡，这一炉很正。',
    足火: '偏醇厚一路，沉稳回甜。',
    高火: '焦糖香突出来了，风格走重了。',
    病火: '炭化味上来了，这炉救不回来。',
  },
};

export interface RoastEvalInput {
  taps: RoastTap[];
  teaId: string;
  style: RoastStyle;
  casual: boolean;
  hasteThreshold: number;
}

export interface RoastEval {
  score: number;
  haste: number;
  lean: number;
  level: string;
  faults: FaultTag[];
  comment: string;
}

/** 焙火结算：由 RoastingStep.finish 调用；taps 为各轮点击判定结果。 */
export function evaluateRoasting(inp: RoastEvalInput): RoastEval {
  const { taps, teaId, style, casual, hasteThreshold } = inp;
  const n = Math.max(1, taps.length);

  const quality = taps.reduce((s, t) => s + ZONE_CREDIT[t.zone], 0) / n;
  // 火功方向：按偏离幅度加权的左右倾向（纯用组件已记录的 side/dist，不新增玩家可见数值）
  const lean = taps.reduce((s, t) => s + t.side * t.dist, 0) / n;
  const dists = taps.map((t) => t.dist);
  const mean = dists.reduce((a, b) => a + b, 0) / n;
  const variance = dists.reduce((s, d) => s + Math.pow(d - mean, 2), 0) / n;
  const stability = Math.max(0, 1 - variance * 40);
  const haste = taps.reduce((s, t) => {
    if (t.zone === 'bad') return s + 0.5;
    if (t.zone === 'warn') return s + 0.18;
    return s + (t.side > 0 ? 0.12 : 0.06);
  }, 0);

  // 先算「火性之外」的底分用于定档，再补火性分（火性不参与定档，避免循环）
  const base = quality * 60 + stability * 20;
  const level = computeRoastLevel(base, haste, lean);
  const score = Math.max(0, Math.min(100, base + styleFit(style, lean, level) * 20 - (haste > hasteThreshold ? 18 : 0) + (casual ? 5 : 0)));

  const faults: FaultTag[] = [];
  if (haste > hasteThreshold) faults.push('roast_over');
  else if (haste > hasteThreshold * 0.7) faults.push('roast_hasty');

  const review = ROAST_REVIEW[teaId]?.[level] ?? '这一炉火，各有各的说法。';
  return { score: Math.round(score), haste, lean, level, faults, comment: review };
}
