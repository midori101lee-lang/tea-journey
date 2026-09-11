import type { BandParams } from '../types';

/**
 * 确定性散列：相同输入永远得到相同输出，不依赖 Math.random。
 * 用于让焙火绿区在「同一天 / 同一茶 / 同一熟练度 / 同一轮次」下稳定，
 * 避免相同操作因随机数在优秀与失败之间漂移。
 */
export function hash01(...nums: number[]): number {
  let h = 2166136261 >>> 0;
  for (const n of nums) {
    h ^= Math.floor(n) & 0xffff;
    h = Math.imul(h, 16777619) >>> 0;
  }
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519) >>> 0;
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

export interface RoastBandInput {
  teaId: string;
  day: number;
  proficiency: number;
  tapIndex: number;
  band: BandParams;
  biasCenter: number;
  biasWidth: number;
  profTol: number;
  basketTol: number;
  carry: number;
}

/**
 * 焙火动态绿区（V0.4 稳定化）：
 * 受茶种 / 天数 / 熟练度 / 轮次等确定性数据驱动，相同输入结果稳定。
 * 保留极轻微的漂移量（randomDrift 经 0.6 缩放，最大约 ±0.02），
 * 但漂移方向由确定性散列决定，因此可复现、不随机。
 */
export function computeRoastBand(inp: RoastBandInput): { center: number; width: number } {
  const seed = hash01(inp.teaId.length, inp.day, Math.round(inp.proficiency), inp.tapIndex);
  const drift = (inp.band.driftPerRound ?? 0) * inp.tapIndex * (seed > 0.5 ? 1 : -1);
  const rand = (seed - 0.5) * (inp.band.randomDrift ?? 0.03) * 0.6;
  const center = Math.max(0.25, Math.min(0.78, inp.band.centerBase + inp.biasCenter + inp.carry + drift + rand));
  const width = Math.max(
    0.14,
    inp.band.widthBase + inp.biasWidth + inp.profTol + inp.basketTol - (inp.band.driftPerRound ?? 0) * inp.tapIndex * 0.5,
  );
  return { center, width };
}
