import { YANCHA_RECIPE, getTea, isTeaUnlocked } from '../../core/data/teas';
import { useGame } from '../../store/gameStore';

interface Props {
  onPick: (teaId: string) => void;
}

export default function TeaSelect({ onPick }: Props) {
  const { player } = useGame();
  // 制茶候选必须以「配方可制作的茶」为准（appliesTo），不能遍历全量 TEAS。
  // 否则王霸茶这类剧情专用茶（unlockCondition.type='story'）会被错误列入「今天做哪种茶」的候选。
  const makeable = YANCHA_RECIPE.appliesTo.map(getTea);
  return (
    <div>
      <div className="hint">这一季，山上有三种茶青。选一种做。</div>
      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {makeable.map((t) => {
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
