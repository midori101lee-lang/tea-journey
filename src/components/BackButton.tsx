import { useState } from 'react';
import { useGame } from '../store/gameStore';

// 场景 → 「返回X」里 X 的名称（仅用于非流程场景；流程页统一用「返回」）。
const SCENE_NAME: Partial<Record<string, string>> = {
  map: '茶地图',
  teahouse: '茶馆',
  garden: '茶园',
  workshop: '制茶坊',
  teatable: '茶桌',
  mothertree: '九龙窠',
  market: '茶集市',
  encounter: '山路',
  journal: '茶游记',
  'region-journal': '茶游记',
  comic: '茶游记',
  souvenir: '茶游记',
  'pick-tea': '茶园',
  result: '上一页',
};

// 离开流程页需要二次确认（制茶 / 泡茶进行中）。
const FLOW_PAGES = new Set(['making', 'brew']);

/**
 * 统一「返回上一层」按钮（页面左上角）。
 * 返回目标 = 导航历史栈的真实上一页（store.navHistory 栈顶），而非一律回到地图。
 * 流程页（making/brew）点击后弹确认，避免误丢进行中的进度。
 */
export default function BackButton() {
  const { scene, navHistory, back } = useGame();
  const [confirm, setConfirm] = useState(false);
  if (navHistory.length === 0) return null;

  const target = navHistory[navHistory.length - 1].scene as string;
  const name = SCENE_NAME[target] ?? '';
  const label = name ? `返回${name}` : '返回';
  const isFlow = FLOW_PAGES.has(scene);

  return (
    <>
      <button className="back-btn" onClick={() => (isFlow ? setConfirm(true) : back())} aria-label="返回">
        <span className="back-arrow">←</span> {label}
      </button>

      {confirm && (
        <div className="confirm-leave" role="dialog" aria-modal="true">
          <div className="confirm-card">
            <p className="confirm-title">确定要离开吗？</p>
            <p className="confirm-sub">离开后，本轮制茶进度将不会保留。</p>
            <div className="confirm-actions">
              <button
                className="btn btn-primary"
                onClick={() => { setConfirm(false); back(); }}
              >离开</button>
              <button className="btn" onClick={() => setConfirm(false)}>继续制作</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
