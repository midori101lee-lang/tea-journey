// 轻量天气系统 V0.1 —— 纯数据 / 纯逻辑（禁止 import React / DOM）。
//
// 设计原则：
//   天气是茶山世界的一部分，不是独立玩法；真实世界决定规则，游戏机制负责降低复杂度。
//   - 同一游戏日（day）+ 同一茶区（region）→ 永远同一个天气（确定性，不 random）。
//   - 天气只轻微参与「倒青 / 做青」的过程节奏，不决定最终品质、不改变售价、不导致必然失败。
//   - 天气是环境条件，不是 RPG 属性 / Buff / Debuff。
//   - region 参数预留未来扩展（杭州 / 福州 / 潮州），V0.1 仅武夷山。
import type { Player } from '../types';

/**
 * 天气 id 池：
 *   - 武夷山（既有，保持不变）：sunny / cloudy / mist / rain
 *   - 杭州（新增，江南春茶 / 西湖龙井茶园氛围）：spring_sunny / spring_mist / overcast / light_rain / after_rain
 * 天气是「茶区 / 章节环境」的一部分——不同地区用不同的天气类型 + 描述 + 视觉氛围，
 * 不再共用一套固定文案（此前杭州会误读到武夷山描述，如「丹霞岩壁」）。
 */
export type WeatherId =
  | 'sunny' | 'cloudy' | 'mist' | 'rain'
  | 'spring_sunny' | 'spring_mist' | 'overcast' | 'light_rain' | 'after_rain';

export interface WeatherConfig {
  id: WeatherId;
  icon: string;
  name: string;
  /** 一句话世界描述（首页天气卡 / 氛围用），按茶区各自撰写，不出现别处地域词。 */
  shortDescription: string;
  /**
   * 制茶过程节奏倍率（仅影响「状态变化速度」，不显示数值、不直接决定品质）。
   * 杭州没有做青工序，这里只给一个基准值供复用，不影响绿茶制茶。
   */
  rate: number;
  /** 做青步骤兼容映射（force 偏移理想区间、decay 影响青气消退速率）。杭州用不到，给中性值。 */
  zuoqing: { force: number; decay: number; label: string };
  /** CSS 修饰类后缀（WeatherOverlay 用），不引入图片 / 视频。 */
  visual: string;
}

// ─────────── 武夷山天气池（V0.1 既有，保持不变） ───────────
const WUYISHAN_WEATHER: Record<'sunny' | 'cloudy' | 'mist' | 'rain', WeatherConfig> = {
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

// ─────────── 杭州天气池（新增：江南春茶 / 西湖龙井茶园氛围） ───────────
// 关键词统一围绕：江南 / 春茶 / 湿润 / 薄雾 / 细雨 / 嫩绿 / 山间水汽 / 清雅。
// 不出现丹霞 / 岩壁 / 岩茶 / 山场岩韵等武夷山地域描述。
const HANGZHOU_WEATHER: Record<'spring_sunny' | 'spring_mist' | 'overcast' | 'light_rain' | 'after_rain', WeatherConfig> = {
  spring_sunny: {
    id: 'spring_sunny',
    icon: '🌞',
    name: '春日晴',
    shortDescription: '春光落在茶垄间，嫩绿的茶芽被照得亮亮的，远处山色也清了起来。',
    rate: 1.1,
    zuoqing: { force: 0.0, decay: 1.0, label: '' },
    visual: 'weather-spring_sunny',
  },
  spring_mist: {
    id: 'spring_mist',
    icon: '🌫️',
    name: '春日薄雾',
    shortDescription: '山间还留着一层薄雾，茶园若隐若现，空气里带着湿润的春意。',
    rate: 0.95,
    zuoqing: { force: 0.0, decay: 1.0, label: '' },
    visual: 'weather-spring_mist',
  },
  overcast: {
    id: 'overcast',
    icon: '☁️',
    name: '阴天',
    shortDescription: '云层压得低低的，茶园的嫩绿显得格外安静。',
    rate: 1.0,
    zuoqing: { force: 0.0, decay: 1.0, label: '' },
    visual: 'weather-overcast',
  },
  light_rain: {
    id: 'light_rain',
    icon: '🌧️',
    name: '细雨',
    shortDescription: '细雨落在茶树上，茶园湿润清凉，远处的山色也朦朦胧胧。',
    rate: 0.9,
    zuoqing: { force: 0.0, decay: 1.0, label: '' },
    visual: 'weather-light_rain',
  },
  after_rain: {
    id: 'after_rain',
    icon: '🌦️',
    name: '雨后初晴',
    shortDescription: '雨刚停，茶园里的水汽还没散尽，叶尖挂着细小的水珠。',
    rate: 1.05,
    zuoqing: { force: 0.0, decay: 1.0, label: '' },
    visual: 'weather-after_rain',
  },
};

/** 所有天气配置（武夷山 + 杭州），按 id 取用。 */
export const WEATHER_CONFIG: Record<WeatherId, WeatherConfig> = {
  ...WUYISHAN_WEATHER,
  ...HANGZHOU_WEATHER,
};

/** 每茶区各自的天气随机池：不同地区走不同天气类型 + 描述 + 氛围。 */
const REGION_WEATHER_IDS: Record<string, WeatherId[]> = {
  wuyishan: ['sunny', 'cloudy', 'mist', 'rain'],
  hangzhou: ['spring_sunny', 'spring_mist', 'overcast', 'light_rain', 'after_rain'],
};

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
 * region 决定取哪一茶区的天气池——切换茶区后天气随之刷新，不沿用上一个茶区的状态。
 */
export function getWeatherForDay(day: number, region = 'wuyishan'): WeatherId {
  const pool = REGION_WEATHER_IDS[region] ?? REGION_WEATHER_IDS['wuyishan'];
  return pool[hashDay(day, region) % pool.length];
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
