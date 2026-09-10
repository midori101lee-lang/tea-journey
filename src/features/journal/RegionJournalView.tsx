import { getRegion, regionExploration, regionTeaIds } from '../../core/data/regions';
import { comicsOfRegion } from '../../core/data/comics';
import { souvenirsOfRegion } from '../../core/data/souvenirs';
import { getTea } from '../../core/data/teas';
import { regionProficiency, proficiencyLabel } from '../../core/types';
import { useGame } from '../../store/gameStore';
import BackButton from '../../components/BackButton';

/**
 * 单个茶区的游记（武夷山 · 茶游记）。
 * 只讲「我在这里经历了什么」：熟练度、探索进度、茶漫画、旅行收藏、茶叶记录。
 * 茶钱与全局累计锅数属于「茶客手记」，这里刻意不重复显示。
 */
export default function RegionJournalView() {
  const { sceneData, player, go } = useGame();
  const regionId = sceneData.regionId ?? 'wuyishan';
  const region = getRegion(regionId);
  const { visited, total } = regionExploration(player, region);

  const prof = regionProficiency(player, regionId);
  const started = prof > 0 || visited > 0;

  const comics = comicsOfRegion(regionId).filter((c) => player.comicSeen.includes(c.id));
  const allComics = comicsOfRegion(regionId);
  const souvenirs = souvenirsOfRegion(regionId).filter((s) => player.souvenirs.includes(s.id));
  const teas = regionTeaIds(regionId);

  return (
    <div className="scene">
      <BackButton />
      <div className="journal">
        <div className="hint" style={{ color: region.accent }}>茶山足迹</div>
        <h2 className="h-serif" style={{ margin: '2px 0 4px' }}>{region.name} · 第 {player.regionDays[regionId] ?? 1} 天</h2>
        <p className="hint" style={{ margin: '0 0 14px' }}>{region.intro}</p>

        {/* 熟练度 与 探索进度 是两个维度，分开显示 */}
        <div className="region-stat-row">
          <div className="region-stat">
            <div className="region-stat-label">制茶熟练度</div>
            <div className="region-stat-value h-serif">{started ? proficiencyLabel(prof) : '尚未开始'}</div>
          </div>
          <div className="region-stat">
            <div className="region-stat-label">已探索</div>
            <div className="region-stat-value h-serif">{visited} / {total}</div>
          </div>
        </div>

        <section className="journal-card">
          <h3 className="h-serif">📖 茶漫画</h3>
          {allComics.length === 0 ? (
            <p className="hint">这里还没有故事。</p>
          ) : (
            <ul className="journal-list">
              {allComics.map((c) => {
                const seen = player.comicSeen.includes(c.id);
                return (
                  <li
                    key={c.id}
                    style={{ cursor: seen ? 'pointer' : 'default', opacity: seen ? 1 : 0.45 }}
                    onClick={() => seen && go('comic', { comicId: c.id })}
                  >
                    {seen ? '📖' : '🔒'} {c.title}
                  </li>
                );
              })}
            </ul>
          )}
          {comics.length === 0 && allComics.length > 0 && (
            <p className="hint">逛着逛着，会有人讲给你听。</p>
          )}
        </section>

        <section className="journal-card">
          <h3 className="h-serif">🖼 旅行收藏</h3>
          {souvenirs.length === 0 ? (
            <p className="hint">游历过的地方，会留下点什么。</p>
          ) : (
            <ul className="journal-list">
              {souvenirs.map((s) => (
                <li key={s.id} style={{ cursor: 'pointer' }} onClick={() => go('souvenir', { souvenirId: s.id })}>
                  📮 {s.title}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="journal-card">
          <h3 className="h-serif">🍵 茶叶记录</h3>
          <ul className="journal-list">
            {teas.map((id) => {
              const tea = getTea(id);
              const made = !!player.madeTeas[id];
              return (
                <li key={id} style={{ opacity: made ? 1 : 0.45 }}>
                  {made ? '🌿' : '○'} {tea.name}
                  {made && <span className="hint">　亲手做过</span>}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
