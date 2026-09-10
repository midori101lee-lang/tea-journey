import { REGIONS, UPCOMING_REGIONS, regionExploration } from '../../core/data/regions';
import { BATCH_ACHIEVEMENTS, regionProficiency, proficiencyLabel } from '../../core/types';
import { getTeaWare, RARITY_LABEL } from '../../core/data/teaWares';
import { useGame } from '../../store/gameStore';
import BackButton from '../../components/BackButton';

/**
 * 我的茶游记 = 两层，视觉层级必须分明：
 *   第一层 茶客手记（我）：全局的个人记录 —— 熟练度按茶区、累计锅数、茶钱、成就
 *   第二层 我的茶山足迹（我去过哪）：茶区卡片 —— 探索进度、该茶区熟练度
 * 茶钱与总锅数是「我」的属性，绝不重复出现在茶区里。
 */
export default function JournalView() {
  const { player, go } = useGame();

  const earned = BATCH_ACHIEVEMENTS.filter((a) => player.totalMade >= a.need);
  const locked = BATCH_ACHIEVEMENTS.filter((a) => player.totalMade < a.need);
  // 有熟练度记录或已踏足的茶区，才显示档位；其余显示「尚未开始」
  const startedRegions = new Set(
    REGIONS.filter((r) => regionProficiency(player, r.id) > 0 || regionExploration(player, r).visited > 0).map((r) => r.id),
  );

  return (
    <div className="scene">
      <BackButton />
      <div className="journal">
        <div className="hint">茶游记</div>
        <h2 className="h-serif" style={{ margin: '2px 0 14px' }}>我的茶游记</h2>

        {/* ── 第一层：茶客手记（个人记录） ── */}
        <section className="journal-me">
          <div className="journal-me-head">
            <span className="journal-me-seal">记</span>
            <span className="h-serif">🍵 茶客手记</span>
          </div>

          <div className="journal-me-rows">
            <div className="me-row">
              <span className="me-label">制茶熟练度</span>
              <span className="me-value">
                {REGIONS.map((r) => (
                  <span className="me-prof" key={r.id}>
                    {r.name} · {startedRegions.has(r.id) ? proficiencyLabel(regionProficiency(player, r.id)) : '尚未开始'}
                  </span>
                ))}
              </span>
            </div>

            <div className="me-row me-row-strong">
              <span className="me-label">🍵 已做</span>
              <span className="me-value me-big">{player.totalMade} 锅</span>
            </div>

            <div className="me-row me-row-strong">
              <span className="me-label">🪙 茶钱</span>
              <span className="me-value me-big">{player.coins} 文</span>
            </div>
          </div>

          <div className="journal-ach">
            <div className="ach-head">🏅 成就 {earned.length} / {BATCH_ACHIEVEMENTS.length}</div>
            <div className="ach-list">
              {earned.map((a) => (
                <span className="ach-chip ach-got" key={a.id} title={a.desc}>{a.icon} {a.name}</span>
              ))}
              {locked.map((a) => (
                <span className="ach-chip ach-lock" key={a.id} title={a.desc}>🔒 {a.name}</span>
              ))}
            </div>
          </div>

          {player.flags.bought_wangba && (
            <p className="hint" style={{ marginTop: 10 }}>
              🫖 第一次逛茶集市，老贾塞来一包「景区王霸茶」。泡开喝了——香气没什么劲，也算长个经验。
            </p>
          )}
          {player.teaWareInventory.length > 0 && (
            <p className="hint" style={{ marginTop: 6 }}>
              🫖 已经收着 {player.teaWareInventory.length} 件茶具，慢慢有了自己的茶桌。
            </p>
          )}
        </section>

        {/* ── 第二层：我的茶山足迹（茶区记录） ── */}
        <section className="journal-regions">
          <div className="journal-sec-head">🗺 我的茶山足迹</div>

          {REGIONS.map((r) => {
            const { visited, total } = regionExploration(player, r);
            const prof = regionProficiency(player, r.id);
            return (
              <button
                className="region-card"
                key={r.id}
                style={{ borderLeftColor: r.accent }}
                onClick={() => go('region-journal', { regionId: r.id })}
              >
                <span className="region-icon" style={{ background: r.accent }}>🌿</span>
                <span className="region-body">
                  <span className="region-name h-serif">{r.name}</span>
                  <span className="region-meta">
                    第 {player.regionDays[r.id] ?? 1} 天
                    {startedRegions.has(r.id) && <>　·　已探索 {visited} / {total}</>}
                    {startedRegions.has(r.id) && <>　·　制茶 {proficiencyLabel(prof)}</>}
                  </span>
                </span>
                <span className="region-arrow">›</span>
              </button>
            );
          })}

          {UPCOMING_REGIONS.map((r) => (
            <div className="region-card region-card-locked" key={r.id} style={{ borderLeftColor: r.accent }}>
              <span className="region-icon region-icon-dim" style={{ background: r.accent }}>{r.icon}</span>
              <span className="region-body">
                <span className="region-name h-serif">{r.name}</span>
                <span className="region-meta">尚未抵达　·　{r.hint}</span>
              </span>
            </div>
          ))}
        </section>

        {/* ── 第三层：我的茶具收藏（长期持有，与茶叶背包分开） ── */}
        <section className="journal-wares">
          <div className="journal-sec-head">🫖 我的茶具</div>
          {player.teaWareInventory.length === 0 ? (
            <p className="hint">还没置办茶具。去茶集市逛逛，挑一件喜欢的吧。</p>
          ) : (
            <div className="ware-grid">
              {player.teaWareInventory.map((id) => {
                const w = getTeaWare(id);
                if (!w) return null;
                return (
                  <div className="ware-chip" key={id}>
                    <img className="ware-thumb" src={`${import.meta.env.BASE_URL}${w.asset}`} alt={w.name} />
                    <div className="ware-chip-body">
                      <span className="ware-chip-name h-serif">{w.name}</span>
                      <span className={`ware-rarity ware-${w.rarity}`}>{RARITY_LABEL[w.rarity]}</span>
                      <span className="ware-chip-desc">{w.description}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
