// 轻量天气系统 V0.1 —— 纯数据 / 纯逻辑（禁止 import React / DOM）。
//
// 设计原则：
//   天气是茶山世界的一部分，不是独立玩法；真实世界决定规则，游戏机制负责降低复杂度。
//   - 同一游戏日（day）+ 同一茶区（region）→ 永远同一个天气（确定性，不 random）。
//   - 天气只轻微参与「倒青 / 做青」的过程节奏，不决定最终品质、不改变售价、不导致必然失败。
//   - 天气是环境条件，不是 RPG 属性 / Buff / Debuff。
//   - region 参数预留未来扩展（杭州 / 福州 / 潮州），V0.1 仅武夷山。
import type { Player } from '../types';

export type WeatherId = 'sunny' | 'cloudy' | 'mist' | 'rain';

export interface WeatherConfig {
  id: WeatherId;
  icon: string;
  name: string;
  /** 一句话世界描述（武夷山首页天气卡 / 氛围用）。 */
  shortDescription: string;
  /**
   * 制茶过程节奏倍率（仅影响「状态变化速度」，不显示数值、不直接决定品质）：
   *   晴 略快 / 多云 基准 / 雾 略慢 / 雨 略慢。
   */
  rate: number;
  /** 做青步骤兼容映射（force 偏移理想区间、decay 影响青气消退速率）。 */
  zuoqing: { force: number; decay: number; label: string };
  /** CSS 修饰类后缀（WeatherOverlay 用），不引入图片 / 视频。 */
  visual: string;
}

export const WEATHER_CONFIG: Record<WeatherId, WeatherConfig> = {
  sunny: {
    id: 'sunny',
    icon: '☀️',
    name: '晴',
    shortDescription: '山风干爽，日头落在茶园里。',
    rate: 1.1,
    zuoqing: { force: 0.0, decay: 1.12, label: '今天天晴，日头好' },
    visual: 'weather-sunny',
  },
  cloudy: {
    id: 'cloudy',
    icon: '☁️',
    name: '多云',
    shortDescription: '云压着山头，茶园里凉快了些。',
    rate: 1.0,
    zuoqing: { force: 0.0, decay: 1.0, label: '今天阴，山里凉快' },
    visual: 'weather-cloudy',
  },
  mist: {
    id: 'mist',
    icon: '🌫️',
    name: '山雾',
    shortDescription: '雾气沿着山谷慢慢爬上来。',
    rate: 0.9,
    zuoqing: { force: 0.02, decay: 0.92, label: '今天山里起了雾' },
    visual: 'weather-mist',
  },
  rain: {
    id: 'rain',
    icon: '🌧️',
    name: '小雨',
    shortDescription: '山里落着细雨，丹霞岩壁也湿润起来。',
    rate: 0.85,
    zuoqing: { force: 0.05, decay: 0.85, label: '今天下着小雨' },
    visual: 'weather-rain',
  },
};

const WEATHER_IDS: WeatherId[] = ['sunny', 'cloudy', 'mist', 'rain'];

/** 确定性伪随机：同一 (day, region) 永远得到同一天气，刷新 / 重进场景都不变。 */
function hashDay(day: number, region: string): number {
  let h = (Math.floor(day || 1) * 2654435761) | 0;
  for (let i = 0; i < region.length; i++) h = (Math.imul(h, 31) + region.charCodeAt(i)) | 0;
  h = (h ^ (h >>> 13) ^ (h >>> 7)) >>> 0;
  return h;
}

/**
 * 根据游戏日得到当天固定天气。完全本地、无外部天气 API。
 * day 复用现有 Player.day（按茶区分区记录于 regionDays，day 同步为当前茶区天数）；
 * region 预留未来多茶区，V0.1 恒为当前茶区。
 */
export function getWeatherForDay(day: number, region = 'wuyishan'): WeatherId {
  return WEATHER_IDS[hashDay(day, region) % WEATHER_IDS.length];
}

/** 从 Player 直接取「当前天气」（复用 day + currentRegion，不建第二套日期系统）。 */
export function currentWeatherId(player: Player): WeatherId {
  return getWeatherForDay(player.day, player.currentRegion || 'wuyishan');
}

/** 制茶「倒青 / 做青」状态变化速率倍率（晴略快 → 雨略慢）。 */
export function makingRate(id: WeatherId): number {
  return WEATHER_CONFIG[id].rate;
}

/** 做青步骤兼容映射（force 偏移理想区间、decay 影响青气消退速率）。 */
export function zuoqingWeather(id: WeatherId): { force: number; decay: number; label: string } {
  return WEATHER_CONFIG[id].zuoqing;
}

// ── NPC 天气随感：V0.1 只给重要 NPC 少量反应，仅增强氛围，不进对话触发链 ──
export const NPC_WEATHER_LINES: Record<string, Partial<Record<WeatherId, string>>> = {
  laochen: {
    sunny: '今天天气不错，山里走走正好。',
    mist: '雾一起来，山里的味道就不一样了。',
    rain: '下雨天嘛，坐下来喝杯茶最好。',
  },
  axiu: {
    sunny: '今天太阳不错，采回来的叶子得看紧些。',
    mist: '今天湿气重，做青可不能照昨天那样来。',
    rain: '下雨了？那就慢些做，别急。',
  },
  zhoubo: {
    sunny: '今天这天气，喝茶倒舒服。',
    rain: '外头下着雨，茶喝起来也安静。',
  },
};

export function getNpcWeatherLine(npcId: string, w: WeatherId): string | null {
  return NPC_WEATHER_LINES[npcId]?.[w] ?? null;
}
