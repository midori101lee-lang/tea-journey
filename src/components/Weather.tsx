// 天气视觉组件（轻量）：只读取核心天气数据，不引入任何图片 / 视频 / GIF。
// 全部用 CSS overlay 实现，pointer-events:none，绝不遮挡 NPC / 茶具 / 对话框 / 按钮。
import type { Player } from '../core/types';
import type { WeatherId } from '../core/data/weather';
import { WEATHER_CONFIG, currentWeatherId, getNpcWeatherLine } from '../core/data/weather';

/** 天气卡：武夷山首页用，显示「☀️ 晴 / 一句话世界描述」。 */
export function WeatherBadge({ id, showDesc = true }: { id: WeatherId; showDesc?: boolean }) {
  const w = WEATHER_CONFIG[id];
  return (
    <div className={`weather-badge weather-badge-${id}`}>
      <span className="weather-badge-icon" aria-hidden>{w.icon}</span>
      <div>
        <div className="weather-badge-name">{w.name}</div>
        {showDesc && <div className="weather-badge-desc">{w.shortDescription}</div>}
      </div>
    </div>
  );
}

/**
 * 天气视觉 overlay：挂在 .npc-scene 背景层之上、NPC/对话之下，
 * 纯 CSS 渐变 / 轻动画，pointer-events:none，不增加加载体积、不挡交互。
 */
export function WeatherOverlay({ id }: { id: WeatherId }) {
  return (
    <div className={`weather-overlay weather-${id}`} aria-hidden>
      {id === 'rain' && (
        <div className="weather-rain">
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} style={{ left: `${(i * 5.5) % 100}%`, animationDelay: `${(i % 9) * 0.13}s` }} />
          ))}
        </div>
      )}
      {id === 'mist' && (
        <div className="weather-mist-layer">
          <span className="weather-mist weather-mist-1" />
          <span className="weather-mist weather-mist-2" />
        </div>
      )}
    </div>
  );
}

/**
 * NPC 天气随感：重要 NPC（老陈 / 阿秀 / 周伯）按当天天气随口一句，仅增强氛围，
 * 不进对话触发链、不新增评分 / 天气数值。无对应台词时返回 null。
 */
export function NpcWeatherAside({ npcId, player }: { npcId: string; player: Player }) {
  const line = getNpcWeatherLine(npcId, currentWeatherId(player));
  if (!line) return null;
  return (
    <div className="scene-foot">
      <p className="hint">{line}</p>
    </div>
  );
}
