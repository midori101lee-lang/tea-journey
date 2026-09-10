import { getRegion } from '../core/data/regions';
import { useGame } from '../store/gameStore';

/**
 * 「回茶馆歇一晚」后的轻量新一天提示（瞬时 UI，不写盘）。
 * 显示当前茶区与第几天，由玩家点击「开始今天的茶游」关闭。
 * 仅作旅行叙事与进度反馈，不引入任何时间系统 / 不影响玩法。
 */
export default function DayIntro() {
  const { pendingDayIntro, clearDayIntro } = useGame();
  if (!pendingDayIntro) return null;
  const region = getRegion(pendingDayIntro.region);
  const day = pendingDayIntro.day;
  const subtitle =
    day <= 1
      ? `你的${region.name}茶山之旅，从今天开始。`
      : '昨晚在茶馆住了一晚。今天，又可以去山里看看了。';

  return (
    <div className="day-intro" role="dialog" aria-modal="true">
      <div className="day-intro-card">
        <div className="day-intro-sun">☀️</div>
        <div className="day-intro-title h-serif">
          {region.name} · 第 {day} 天
        </div>
        <p className="day-intro-sub">{subtitle}</p>
        <button className="btn btn-primary" onClick={clearDayIntro}>
          开始今天的茶游
        </button>
      </div>
    </div>
  );
}
