// 泡茶视觉配置：茶汤与干茶按茶种区分（数据化，便于以后扩展新茶区）。
// 颜色遵循《茶游记》东方手绘、低饱和淡水彩风格；不使用鲜艳卡通色。

import type { Grade } from '../types';

export interface TeaVisual {
  /** 浅汤色（刚出汤，t→0）：偏明亮、透 */
  liquorLight: string;
  /** 深汤色（久泡，t→1）：偏浓、沉 */
  liquorDeep: string;
  /** 干茶条索色（投茶阶段，叶底入碗） */
  leafColor: string;
}

export const TEA_VISUAL: Record<string, TeaVisual> = {
  rougui: {
    liquorLight: '#d98a44', // 橙黄偏琥珀
    liquorDeep: '#a8431e',  // 橙红 · 深琥珀（浓郁、暖）
    leafColor: '#5a4326',
  },
  shuixian: {
    liquorLight: '#e7c25a', // 金黄
    liquorDeep: '#c8922e',  // 橙黄（柔和、透亮）
    leafColor: '#6b5230',
  },
  dahongpao: {
    liquorLight: '#cf7a32', // 琥珀橙
    liquorDeep: '#8f3f1c',  // 深琥珀 · 橙红（更深、有层次）
    leafColor: '#4a3318',
  },
  wangba: {
    liquorLight: '#c99a52',
    liquorDeep: '#9a5a2a',
    leafColor: '#574226',
  },
  // 杭州 · 九曲红梅：红亮茶汤、甜润，偏暖。
  jiuquhongmei: {
    liquorLight: '#e0915a', // 红亮 · 初汤
    liquorDeep: '#a83a2a',  // 深红 · 浓汤
    leafColor: '#4a2e22',
  },
  // 杭州 · 西湖龙井：嫩黄绿干茶、清透黄绿汤色（不是荧光绿，也不是深绿蔬菜色）。
  longjing: {
    liquorLight: '#e6e9ac',
    liquorDeep: '#aab562',
    leafColor: '#a8ae58',
  },
};

export function teaVisual(teaId: string): TeaVisual {
  return TEA_VISUAL[teaId] ?? TEA_VISUAL['rougui'];
}

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/**
 * 按「茶种 + 出汤进度 t(0..1) + 制茶品质」计算茶汤色：
 * - 茶种：light→deep 插值，三茶明显不同（数据驱动，非写死全局色）。
 * - 品质（利用现有 result.grade，不新增属性）：
 *     上品 → 更明亮、透亮；良好 → 正常；普通 → 稍弱；失败 → 明显发闷偏淡。
 */
export function brewLiquor(teaId: string, t: number, grade: Grade): string {
  const v = teaVisual(teaId);
  const [lr, lg, lb] = hexToRgb(v.liquorLight);
  const [dr, dg, db] = hexToRgb(v.liquorDeep);
  let r = lerp(lr, dr, t);
  let g = lerp(lg, dg, t);
  let b = lerp(lb, db, t);
  const lift = grade === 'fine' ? 14 : grade === 'good' ? 4 : grade === 'normal' ? -8 : -30;
  r += lift; g += lift; b += lift;
  if (grade === 'fail') {
    const m = 0.82;
    const avg = (r + g + b) / 3;
    r = lerp(r, avg, 1 - m);
    g = lerp(g, avg, 1 - m);
    b = lerp(b, avg, 1 - m);
  }
  return rgbToHex(r, g, b);
}
