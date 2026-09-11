import { getTea } from '../../core/data/teas';
import { GRADE_LABEL, proficiencyLabel } from '../../core/types';
import { useGame } from '../../store/gameStore';
import { TeaLeavesPile } from '../../components/art/Art';

export default function ResultView() {
  const { lastResult, player, go, startMaking, startBrewFromStack } = useGame();
  if (!lastResult) return null;
  const tea = getTea(lastResult.teaId);
  const isFail = lastResult.grade === 'fail';
  // 「带去茶桌泡一杯」直接定位刚入篓的那一 stack 进入泡茶：与茶篓选茶共用同一条入口，
  // 从而正确记录 brewingStackId，泡完结算时只扣这一包（自制/购买/赠送统一逻辑）。
  const madeStackId = `${lastResult.teaId}:${lastResult.grade}:${lastResult.roastLevel}`;
  const madeStack = player.inventory.find((s) => s.id === madeStackId);

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="hint">今日制茶结果</div>
      <h2 className="h-serif" style={{ margin: '6px 0 2px' }}>{tea.fullName}</h2>

      <div style={{ background: 'var(--paper-2)', border: '1px solid var(--ochre)', borderRadius: 12, padding: 20, marginTop: 12 }}>
        <div className="hint" style={{ letterSpacing: '0.2em' }}>品质等级</div>
        <div className="h-serif" style={{ fontSize: 30, letterSpacing: '0.3em', color: isFail ? 'var(--rock)' : 'var(--seal)' }}>
          {GRADE_LABEL[lastResult.grade]}
        </div>
        <div style={{ textAlign: 'center', margin: '12px 0' }}>
          <TeaLeavesPile width={150} color={lastResult.visuals.dryColor} curled={lastResult.visuals.shape === 'curled'} broken={lastResult.visuals.shape === 'broken'} />
        </div>

        <div className="hint" style={{ textAlign: 'left', marginTop: 6 }}>这一锅怎么样</div>
        <p className="note">{lastResult.comment}</p>

        {lastResult.highlight && (
          <>
            <div className="hint" style={{ textAlign: 'left', marginTop: 6 }}>这次最值得注意</div>
            <div
              className="note"
              style={{ color: lastResult.faultReason ? 'var(--cliff)' : 'var(--bamboo)', marginTop: 2 }}
            >
              {lastResult.highlight}
            </div>
          </>
        )}

        <div className="h-serif" style={{ marginTop: 12 }}>可售：{lastResult.value} 茶钱</div>
        <div className="hint">火功：{lastResult.roastLevel}（本次过程的结果标签，不表示现实品质高低）</div>
        <div className="hint" style={{ marginTop: 8 }}>🎒 已收入茶篓</div>
      </div>

      <div className="hint" style={{ marginTop: 10 }}>
        制茶熟练度：{proficiencyLabel(player.proficiency)}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={() => (madeStack ? startBrewFromStack(madeStack) : go('brew'))}>带去茶桌泡一杯</button>
        <button className="btn" onClick={() => startMaking(tea.id)}>再做一锅</button>
        <button className="btn" onClick={() => go('journal')}>看看茶游记</button>
        <button className="btn" onClick={() => go('map')}>🗺️ 回茶地图</button>
      </div>
      <button className="btn" style={{ marginTop: 10, border: 'none', background: 'none', boxShadow: 'none' }} onClick={() => go('garden')}>
        回到茶园 / 换一种茶
      </button>
    </div>
  );
}
