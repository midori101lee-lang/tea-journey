/**
 * 场景注册表：把「场景 key」映射到独立 SVG 场景组件 + 透明 NPC 人物层的叠加位置。
 * 立绘不直接画死在场景里，由 NpcStage 用 NpcPortrait（透明人物层）叠加，
 * 便于复用人物、且人物与场景空间关系自然。
 *
 * figure 的 left / bottom / width 为相对舞台容器的百分比（0–100），
 * 因为 NpcStage 强制 aspect-ratio = 390/560，与场景 viewBox 一致，故百分比可直接对应 viewBox 坐标。
 */
import type { ComponentType } from 'react';
import { WuyiEstablishingScene } from './WuyiEstablishingScene';
import { TeaHouseScene } from './TeaHouseScene';
import { TeaGardenScene } from './TeaGardenScene';
import { TeaMakingScene } from './TeaMakingScene';
import { TeaTableScene } from './TeaTableScene';
import { MotherTreeScene } from './MotherTreeScene';
import { LingguScene } from './LingguScene';
import { TeaMarketScene } from './TeaMarketScene';

export interface SceneFigPos { left: number; bottom: number; width: number; }
export interface SceneEntry {
  Component: ComponentType;
  figure?: SceneFigPos;
  /**
   * 偶遇 NPC 站位（场景级世界机制）。与主线 NPC 的 figure 错位，避免重叠；
   * 仍使用同一套「相对场景画布的百分比」坐标系，保证偶遇 NPC 永远落在场景内。
   * 缺省时回退到 figure。
   */
  encounterFigure?: SceneFigPos;
  /** 位图背景（public 相对路径）。存在时 NpcStage 用满铺位图替代 SVG 场景大图。 */
  bg?: string;
}

export const SCENES: Record<string, SceneEntry> = {
  // 武夷山进入 · establishing（无 NPC，仅空间建立）
  wuyishan: { Component: WuyiEstablishingScene },
  // 老陈茶馆（开篇茶馆位图背景 + 老陈坐茶桌后）
  // 背景来源：background picture/老陈的茶馆0909.PNG —— 与「老陈茶馆新.jpg」是同一茶馆的不同视角，两者不可互相替换。
  teahouse: { Component: TeaHouseScene, bg: 'assets/scenes/teahouse_opening.webp', figure: { left: 22, bottom: 14, width: 44 }, encounterFigure: { left: 56, bottom: 16, width: 38 } },
  // 阿秀茶园（位图背景 + 侧身采茶，左中）
  garden: { Component: TeaGardenScene, bg: 'assets/scenes/garden.webp', figure: { left: 18, bottom: 16, width: 42 }, encounterFigure: { left: 54, bottom: 18, width: 40 } },
  // 岩伯制茶坊（武夷山真实茶农日常制茶的半开放式空间；位图背景 + 岩伯透明立绘叠加）
  workshop: { Component: TeaMakingScene, bg: 'assets/scenes/workshop.webp', figure: { left: 24, bottom: 14, width: 46 } },
  // 周伯品茶：复用「新·老陈茶馆」位图背景，周伯作为站立透明立绘叠加（不新增茶桌 PNG）
  teatable: { Component: TeaTableScene, bg: 'assets/scenes/teahouse_new.webp', figure: { left: 48, bottom: 16, width: 42 } },
  // 母树（位图背景 + 岩伯侧身指引，石阶上）
  mothertree: { Component: MotherTreeScene, bg: 'assets/scenes/mothertree.webp', figure: { left: 18, bottom: 18, width: 42 } },
  // 林姑娘廊下（茶席旁；暂用 SVG 场景大图）
  linggu: { Component: LingguScene, figure: { left: 22, bottom: 14, width: 40 } },
  // 茶集市（小满固定摊主；位图背景 + 小满透明立绘叠加）
  market: { Component: TeaMarketScene, bg: 'assets/scenes/market.webp', figure: { left: 50, bottom: 16, width: 46 }, encounterFigure: { left: 16, bottom: 16, width: 40 } },
  // 山路（玩家主动「去山路上逛逛」到达的真实可游玩场景）
  // 背景来源：background picture/山路.png —— 山路随机偶遇的固定场景背景；NPC 仍由 NpcPortrait 透明层叠加（不并入背景）。
  mountain: { Component: WuyiEstablishingScene, bg: 'assets/scenes/mountain.webp', encounterFigure: { left: 30, bottom: 16, width: 42 } },
};

export type SceneKey = keyof typeof SCENES;
