import { getRegion, isMarketUnlocked } from '../../core/data/regions';
import { useGame } from '../../store/gameStore';
import type { Scene } from '../../store/gameStore';
import type { LocationId } from '../../core/types';
import { WeatherBadge } from '../../components/Weather';
import { currentWeatherId } from '../../core/data/weather';

export default function MapView() {
  const { go, player, advanceDay, visitMountain } = useGame();
  const region = getRegion('wuyishan');

  const order: LocationId[] = ['teahouse', 'garden', 'workshop', 'teatable', 'mothertree', 'market'];
  const mountainFull = player.mountainVisitsToday >= 3;
  const mountainLeft = Math.max(0, 3 - player.mountainVisitsToday);

  return (
    <div>
      <div className="hint">武夷山 · 轻量探索 · 第 {player.regionDays[player.currentRegion] ?? 1} 天</div>
      <WeatherBadge id={currentWeatherId(player)} showDesc />
      <h2 className="h-serif" style={{ margin: '2px 0 10px' }}>今天去哪儿？</h2>
      <div style={{ display: 'grid', gap: 12 }}>
        {order.map((id) => {
          const loc = region.locations.find((l) => l.id === id)!;
          // 茶集市：集齐三种亲手制茶才开市；九龙窠：完成一次制茶（tea_made）才解锁。
          // 二者都以 flag 驱动，不靠熟练度 / 随机 / 老陈普通对话提前开门。
          const locked =
            loc.id === 'market' ? !isMarketUnlocked(player)
            : loc.id === 'mothertree' ? !player.flags['tea_made']
            : !!loc.locked;
          return (
            <button
              key={id}
              className="loc-card"
              disabled={locked}
              onClick={() => go(loc.id as Scene)}
              style={{ borderLeft: `6px solid ${loc.accent}`, opacity: locked ? 0.55 : 1 }}
            >
              <div className="h-serif" style={{ fontSize: 18 }}>{locked ? '🔒 ' : ''}{loc.name}</div>
              <div className="hint">
                {locked && loc.id === 'market' ? '三种茶都亲手做过，才会开市。'
                  : locked && loc.id === 'mothertree' ? '做完一锅武夷山茶，再来这儿。'
                  : loc.blurb}
              </div>
            </button>
          );
        })}
      </div>
      <button
        className="btn btn-primary"
        style={{ marginTop: 14 }}
        disabled={mountainFull}
        onClick={() => visitMountain()}
        title={mountainFull ? '今天山路已经逛够了，回茶馆歇一晚再来。' : ''}
      >🚶 去山路上逛逛{mountainFull ? '（今天逛够啦）' : `（今天还能去 ${mountainLeft} 回）`}</button>
      <button className="btn" style={{ marginTop: 10 }} onClick={() => go('journal')}>📚 我的茶游记</button>
      <button className="btn" style={{ marginTop: 10 }} onClick={() => go('teaworld')}>🌍 回到茶世界</button>
      <button
        className="btn"
        style={{ marginTop: 10 }}
        onClick={() => advanceDay()}
        title="回老陈茶馆歇一晚：新的一天，山路又能逛了，今日行情也会变。"
      >🌙 回老陈茶馆歇一晚（新的一天）</button>
      <button
        className="btn"
        style={{ marginTop: 10, fontSize: 13, opacity: 0.6 }}
        onClick={() => {
          if (window.confirm('确定要重新开始游历吗？\n认识的人、做过的茶、收藏的纪念都会清空，回到刚进山的那一天。')) {
            localStorage.removeItem('teaworld.save.v3');
            window.location.reload();
          }
        }}
      >↺ 重新开始游历</button>
    </div>
  );
}
