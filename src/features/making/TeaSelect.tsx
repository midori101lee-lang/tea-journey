import { TEAS, isTeaUnlocked } from '../../core/data/teas';
import { useGame } from '../../store/gameStore';

interface Props {
  onPick: (teaId: string) => void;
}

export default function TeaSelect({ onPick }: Props) {
  const { player } = useGame();
  return (
    <div>
      <div className="hint">这一季，山上有三种茶青。选一种做。</div>
      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {TEAS.map((t) => {
          const unlocked = isTeaUnlocked(t, player);
          return (
            <button
              key={t.id}
              className="tea-option"
              disabled={!unlocked}
              onClick={() => unlocked && onPick(t.id)}
              style={{ opacity: unlocked ? 1 : 0.5 }}
            >
              <div className="h-serif" style={{ fontSize: 18 }}>{t.name}</div>
              <div className="hint">{t.fullName}</div>
              {!unlocked && <div className="hint" style={{ color: 'var(--cliff)' }}>🔒 还没到解锁的时候</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
