import { useState } from 'react';
import { useGame } from '../../store/gameStore';
import { TEA_WORLD_REGIONS, teaWorldPages, TEA_WORLD_PER_PAGE } from '../../core/data/teaRegions';
import { TeaLeafSvg } from '../../components/art/Art';

/**
 * 茶世界（Tea World）首页：四宫格茶区旅行卡片 + 克制轻盈的茶叶旅行动画。
 * - 数据驱动：卡片来自 TEA_WORLD_REGIONS，分页每页 4 张（预留第二页）。
 * - 已解锁（武夷山）：点击「进入茶区 →」播放 650ms 茶叶弧线飞行，再进入茶区（'map'）。
 * - 未解锁（杭州/福州/潮州）：降低饱和 + 淡墨灰雾，显示 🔒 尚未解锁 + 「还没有去过这里。」。
 * - 不破坏武夷山内部任何玩法；武夷山进入后仍是既有的地点选择（MapView）。
 */
export default function TeaWorldView() {
  const { go, player, saveProgress, bootTo } = useGame();
  const [page, setPage] = useState(0);
  const [fly, setFly] = useState<{ id: string; x: number; y: number; w: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const pages = teaWorldPages();
  const slice = TEA_WORLD_REGIONS.slice(page * TEA_WORLD_PER_PAGE, page * TEA_WORLD_PER_PAGE + TEA_WORLD_PER_PAGE);

  function handleEnter(e: React.MouseEvent<HTMLButtonElement>, id: string) {
    // 轻盈出发感：捕获当前卡片位置，让小茶叶沿轻微弧线飞出，约 650ms 后进入茶区。
    const img = (e.currentTarget.querySelector('.tw-card-img') as HTMLElement) ?? e.currentTarget;
    const r = img.getBoundingClientRect();
    setFly({ id, x: r.left, y: r.top, w: r.width });
    window.setTimeout(() => {
      setFly(null);
      // 首次从茶世界进入武夷山 → 先走老陈开场对话（intro）；已见过则直接进入武夷山内部地图，不重复触发。
      go(player.flags.saw_opening ? 'map' : 'intro');
    }, 680);
  }

  return (
    <div className="tw">
      <header className="tw-head">
        <h1 className="h-serif tw-title">茶世界</h1>
        <p className="tw-title-en">Tea World</p>
        <p className="tw-sub">中国每一座茶山，都有自己的故事。</p>
        <p className="tw-tagline">一场可以玩的中国茶山游历 · Explore China, one tea mountain at a time.</p>

        {/* 右上角轻量菜单：保存进度 / 重新开始（去启动页走二次确认）。不占泡茶主操作区。 */}
        <div className="tw-menu">
          <button
            type="button"
            className="tw-menu-btn"
            aria-label="更多"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >⋯</button>
          {menuOpen && (
            <div className="tw-menu-pop" role="menu">
              <button type="button" className="tw-menu-item" role="menuitem" onClick={() => { setMenuOpen(false); saveProgress(); }}>
                保存进度
              </button>
              <button type="button" className="tw-menu-item" role="menuitem" onClick={() => { setMenuOpen(false); bootTo('start'); }}>
                重新开始 / 继续
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="tw-grid">
        {slice.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`tw-card ${r.unlocked ? '' : 'locked'} ${fly?.id === r.id ? 'is-leaving' : ''}`}
            disabled={!r.unlocked}
            onClick={(e) => r.unlocked && handleEnter(e, r.id)}
          >
            <div className="tw-card-img">
              <img
                src={r.image}
                alt={r.name}
                loading="lazy"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
              />
              {!r.unlocked && <span className="tw-veil" aria-hidden />}
            </div>
            <div className="tw-card-body">
              <div className="h-serif tw-name">{r.name}</div>
              <div className="tw-impression">{r.impression}</div>
              <div className="tw-teas">{r.teas}</div>
              {r.unlocked ? (
                <div className="tw-enter">进入茶区 →</div>
              ) : (
                <div className="tw-locked">
                  <span className="tw-locked-tag">🔒 尚未解锁</span>
                  <span className="tw-locked-hint">还没有去过这里。</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="tw-pager">
        <button className="tw-page-btn" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>‹</button>
        <span className="tw-page-num">{page + 1} / {pages}</span>
        <button className="tw-page-btn" disabled={page >= pages - 1} onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}>›</button>
      </div>

      <p className="tw-foot-hint">武夷山，是你目前走到的第一站。</p>

      {/* 茶叶旅行动画层：固定覆盖，不阻塞交互；650ms 后随场景切换自然消失。 */}
      {fly && (
        <div className="tw-leaf-layer" aria-hidden>
          <div className="tw-leaf-fly" style={{ left: fly.x, top: fly.y, width: fly.w }}>
            <TeaLeafSvg size={36} color="#7e9a5b" />
          </div>
        </div>
      )}
    </div>
  );
}
