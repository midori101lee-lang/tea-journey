import { useState } from 'react';
import { useGame } from '../../store/gameStore';
import { hasSave, inspectSave, clearSave } from '../../core/storage/storage';

/**
 * 启动页（boot gate）：根据 localStorage 是否有有效存档，决定给玩家什么入口。
 * - 无存档：直接「开始茶旅」。
 * - 有存档：欢迎回来 + 「继续旅程」/「新的茶旅」（二次确认，绝不误清旧档）。
 * - 存档损坏：隔离提示，提供「开始茶旅」并清掉坏档。
 * 长期进度（茶叶/金币/茶具/剧情 flags/明信片/解锁）已由 storage 自动读取，这里只决定入口，不重建任何状态。
 */
export default function StartScreen() {
  const { bootTo, reset } = useGame();
  const [confirmNew, setConfirmNew] = useState(false);
  const health = inspectSave();
  const hasValidSave = health === 'ok' && hasSave();

  function startFresh() {
    if (health === 'corrupt') clearSave(); // 坏档隔离后清掉，避免下次又进 corrupt 分支
    bootTo('teaworld');
  }
  function continueJourney() {
    bootTo('teaworld');
  }
  function beginNew() {
    setConfirmNew(false);
    reset(); // 内部已 archive 旧档 + 清生效档 + 写全新档
  }

  return (
    <div className="scene start-screen">
      <div className="start-card">
        <h1 className="h-serif start-title">茶游记</h1>
        <p className="start-sub">Tea Journey · 一场可以玩的中国茶山游历</p>

        {health === 'corrupt' && (
          <p className="start-note start-note-warn">⚠️ 存档读取遇到问题，已尝试恢复。已为你开启新的茶旅。</p>
        )}
        {health === 'none' && (
          <p className="start-note">开启你的茶山之旅——武夷山，是你走到的第一站。</p>
        )}
        {hasValidSave && (
          <p className="start-note">欢迎回来，茶客。你的茶旅还在继续。</p>
        )}

        <div className="start-actions">
          {hasValidSave ? (
            <>
              <button className="btn btn-primary start-btn" onClick={continueJourney}>继续旅程</button>
              <button className="btn start-btn" onClick={() => setConfirmNew(true)}>新的茶旅</button>
            </>
          ) : (
            <button className="btn btn-primary start-btn" onClick={startFresh}>开始茶旅</button>
          )}
        </div>

        {confirmNew && (
          <div className="start-confirm">
            <p className="start-confirm-text">确定要重新开始吗？<br />现有的茶旅进度将被清除。</p>
            <div className="start-confirm-actions">
              <button className="btn" onClick={() => setConfirmNew(false)}>取消</button>
              <button className="btn btn-primary" onClick={beginNew}>重新开始</button>
            </div>
          </div>
        )}

        <p className="start-foot">进度会自动保存 · 可随时在「茶世界」右上角「⋯」手动保存</p>
      </div>
    </div>
  );
}
