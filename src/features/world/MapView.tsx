import { useState } from 'react';
import { getRegion, isMarketUnlocked } from '../../core/data/regions';
import { useGame } from '../../store/gameStore';
import type { Scene } from '../../store/gameStore';
import type { LocationId, Player, LocationDef } from '../../core/types';
import { WeatherBadge } from '../../components/Weather';
import { currentWeatherId } from '../../core/data/weather';

/** 各茶区的地点显示顺序（固定功能场景 + 本区特色探索地点）。 */
const REGION_ORDER: Record<string, LocationId[]> = {
  wuyishan: ['teahouse', 'garden', 'workshop', 'teatable', 'mothertree', 'market'],
  hangzhou: ['teahouse', 'garden', 'workshop', 'teatable', 'meijiawu', 'market'],
};

/** 某地点的门禁：茶集市=三种武夷茶都做过才开市；九龙窠=做过一锅茶；梅家坞=做过一锅九曲红梅；其余按数据默认态。 */
function isLocked(loc: LocationDef, player: Player): boolean {
  if (loc.id === 'market') return !isMarketUnlocked(player);
  if (loc.id === 'mothertree') return !player.flags['tea_made'];
  // 杭州 · 梅家坞：本章第一条线（九曲红梅）做出来之后才开放；不新增任务系统，沿用「做过这一锅」的轻量门禁。
  if (loc.id === 'meijiawu') return !player.madeTeas['jiuquhongmei'];
  return !!loc.locked;
}

function lockedHint(loc: LocationDef): string | null {
  if (loc.id === 'market') return '三种茶都亲手做过，才会开市。';
  if (loc.id === 'mothertree') return '做完一锅武夷山茶，再来这儿。';
  if (loc.id === 'meijiawu') return '先把杭州的第一锅茶（九曲红梅）做出来，再去梅家坞。';
  return null;
}

export default function MapView() {
  const { go, player, advanceDay, visitMountain, visitExplore, reset } = useGame();
  const [confirmReset, setConfirmReset] = useState(false);
  const regionId = player.currentRegion || 'wuyishan';
  const region = getRegion(regionId);
  const isWuyi = regionId === 'wuyishan';

  const order = REGION_ORDER[regionId] ?? region.locations.map((l) => l.id);
  const mountainFull = player.mountainVisitsToday >= 3;
  const mountainLeft = Math.max(0, 3 - player.mountainVisitsToday);
  const teaHouseName = isWuyi ? '老陈茶馆' : '玲姨的茶馆';

  return (
    <div>
      <div className="hint">{region.name} · 轻量探索 · 第 {player.regionDays[regionId] ?? 1} 天</div>
      <WeatherBadge id={currentWeatherId(player)} showDesc />
      <h2 className="h-serif" style={{ margin: '2px 0 10px' }}>今天去哪儿？</h2>
      <div style={{ display: 'grid', gap: 12 }}>
        {order.map((id) => {
          const loc = region.locations.find((l) => l.id === id);
          if (!loc) return null;
          const locked = isLocked(loc, player);
          return (
            <button
              key={id}
              className="loc-card"
              disabled={locked}
              onClick={() => go((loc.scene ?? loc.id) as Scene)}
              style={{ borderLeft: `6px solid ${loc.accent}`, opacity: locked ? 0.55 : 1 }}
            >
              <div className="h-serif" style={{ fontSize: 18 }}>{locked ? '🔒 ' : ''}{loc.name}</div>
              <div className="hint">{locked ? (lockedHint(loc) ?? loc.blurb) : loc.blurb}</div>
            </button>
          );
        })}
      </div>
      {isWuyi && (
        <button
          className="btn btn-primary"
          style={{ marginTop: 14 }}
          disabled={mountainFull}
          onClick={() => visitMountain()}
          title={mountainFull ? '今天山路已经逛够了，回茶馆歇一晚再来。' : ''}
        >🚶 去山路上逛逛{mountainFull ? '（今天逛够啦）' : `（今天还能去 ${mountainLeft} 回）`}</button>
      )}
      {/* 杭州 · 区域探索：梅家坞走走（与武夷山山路散步同一套每日 3 次机制，事件池见 strolls.ts） */}
      {!isWuyi && (
        <button
          className="btn btn-primary"
          style={{ marginTop: 14 }}
          disabled={mountainFull}
          onClick={() => visitExplore('hz-stroll')}
          title={mountainFull ? '今天逛够了，回玲姨茶馆歇一晚再来。' : ''}
        >🍵 去梅家坞走走{mountainFull ? '（今天逛够啦）' : `（今天还能去 ${mountainLeft} 回）`}</button>
      )}
      <button className="btn" style={{ marginTop: 10 }} onClick={() => go('journal')}>📚 我的茶游记</button>
      <button className="btn" style={{ marginTop: 10 }} onClick={() => go('teaworld')}>🌍 回到茶世界</button>
      <button
        className="btn"
        style={{ marginTop: 10 }}
        onClick={() => advanceDay()}
        title={`回${teaHouseName}歇一晚：新的一天，今日行情也会变。`}
      >🌙 回{teaHouseName}歇一晚（新的一天）</button>
      <button
        className="btn"
        style={{ marginTop: 10, fontSize: 13, opacity: 0.6 }}
        onClick={() => setConfirmReset(true)}
      >↺ 重新开始游历</button>

      {confirmReset && (
        <div className="confirm-leave" onClick={() => setConfirmReset(false)}>
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
            <p className="confirm-title">重新开始游历？</p>
            <p className="confirm-sub">认识的人、做过的茶、收藏的纪念都会清空，回到刚进山的那一天。</p>
            <div className="confirm-actions">
              <button className="btn" onClick={() => setConfirmReset(false)}>再想想</button>
              <button
                className="btn btn-primary"
                onClick={() => { setConfirmReset(false); reset(); }}
              >确定重来</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
