import { useEffect } from 'react';
import { useGame } from '../store/gameStore';
import { getTea } from '../core/data/teas';
import { GRADE_LABEL } from '../core/types';
import { TeaLeavesPile } from '../components/art/Art';
import TeaSelect from '../features/making/TeaSelect';
import MakingFlow from '../features/making/MakingFlow';
import ResultView from '../features/result/ResultView';
import BrewingFlow from '../features/brew/BrewingFlow';

/** 小红书版：线性快速流，强制 casual 档。复用同一套 Core / 组件，只换顺序与节奏。 */
export default function XhsApp() {
  const { scene, go, player, startMaking, finishBrewing, setDifficulty, lastResult } = useGame();

  useEffect(() => { setDifficulty('casual'); }, [setDifficulty]);

  if (scene === 'start' || scene === 'intro' || scene === 'teaworld' || scene === 'map' || scene === 'teahouse') {
    return (
      <div className="xhs-home">
        <div className="xhs-title">🍃 今天，来做一杯<br />属于自己的茶</div>
        <button className="btn btn-primary xhs-cta" onClick={() => go('garden')}>开始制茶</button>
        <p className="hint">武夷山 · 第一日　·　约 90–100 秒</p>
      </div>
    );
  }

  if (scene === 'garden' || scene === 'pick-tea') {
    return (
      <div className="scene">
        <div className="h-serif" style={{ fontSize: 20, marginBottom: 6 }}>选一种茶</div>
        <TeaSelect onPick={(id) => startMaking(id)} />
      </div>
    );
  }

  if (scene === 'making') return <div className="scene"><MakingFlow /></div>;
  if (scene === 'result') return <div className="scene"><ResultView /></div>;

  if (scene === 'brew') {
    if (!lastResult) return <div className="scene"><p className="hint">还没有茶可泡。</p></div>;
    return <div className="scene"><BrewingFlow result={lastResult} difficulty="casual" onDone={(o) => finishBrewing(o)} /></div>;
  }

  // XHS 收尾卡：把结果浓缩成一张可截图分享的卡（不接 web 叙事）
  if (scene === 'teatable') {
    if (!lastResult) return <div className="scene"><p className="hint">还没有茶。</p></div>;
    const tea = getTea(lastResult.teaId);
    return (
      <div className="scene xhs-card">
        <div className="hint">今日制茶 · 完成</div>
        <h2 className="h-serif">{tea.fullName}</h2>
        <div className="xhs-grade" style={{ color: lastResult.grade === 'fail' ? 'var(--rock)' : 'var(--seal)' }}>
          {GRADE_LABEL[lastResult.grade]}
        </div>
        <div style={{ display: 'grid', placeItems: 'center', margin: '10px 0' }}>
          <TeaLeavesPile width={140} color={lastResult.visuals.dryColor} curled={lastResult.visuals.shape === 'curled'} broken={lastResult.visuals.shape === 'broken'} />
        </div>
        <p className="note">{lastResult.comment}</p>
        <div className="hint">火功：{lastResult.roastLevel}　·　可售 {lastResult.value} 茶钱</div>
        <div className="hint" style={{ marginTop: 8 }}>🎒 已收入茶篓</div>
        <div className="scene-foot">
          <button className="btn btn-primary" onClick={() => startMaking(lastResult.teaId)}>再做一锅</button>
          <button className="btn" onClick={() => go('garden')}>换一种茶</button>
        </div>
        <p className="hint" style={{ marginTop: 10, opacity: 0.7 }}>截图分享，带上 #茶游记</p>
      </div>
    );
  }

  return (
    <div className="scene">
      <div className="h-serif" style={{ fontSize: 20 }}>选一种茶</div>
      <TeaSelect onPick={(id) => startMaking(id)} />
    </div>
  );
}
