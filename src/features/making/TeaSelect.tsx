import { getTea, isTeaUnlocked, isCraftable, makeableTeasForRegion } from '../../core/data/teas';
import { useGame } from '../../store/gameStore';

interface Props {
  onPick: (teaId: string) => void;
  /** 不传则用玩家当前茶区（多茶区共用同一选茶界面）。 */
  regionId?: string;
}

export default function TeaSelect({ onPick, regionId }: Props) {
  const { player } = useGame();
  const rid = regionId ?? (player.currentRegion || 'wuyishan');
  // 候选以「该茶区将来可做的茶」为准（含尚未解锁、仅作未来预留的，如龙井）。
  const makeable = makeableTeasForRegion(rid).map(getTea);
  const lead = rid === 'hangzhou'
    ? '这一季，杭州茶山有两种茶青——能做的先做。'
    : '这一季，山上有三种茶青。选一种做。';
  return (
    <div>
      <div className="hint">{lead}</div>
      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {makeable.map((t) => {
          const unlocked = isTeaUnlocked(t, player);
          // 解锁 ≠ 可做：配方尚未实装的茶（如龙井）即使剧情解锁，也还不能开做。
          const craftable = isCraftable(t.id);
          const available = unlocked && craftable;
          return (
            <button
              key={t.id}
              className="tea-option"
              disabled={!available}
              onClick={() => available && onPick(t.id)}
              style={{ opacity: available ? 1 : 0.5 }}
            >
              <div className="h-serif" style={{ fontSize: 18 }}>{t.name}</div>
              <div className="hint">{t.fullName}</div>
              {!unlocked && <div className="hint" style={{ color: 'var(--cliff)' }}>🔒 还没到解锁的时候</div>}
              {unlocked && !craftable && <div className="hint">🍃 已经认得这块山场，制茶的法子还在后头。</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
