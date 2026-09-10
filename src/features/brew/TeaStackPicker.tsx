import { useGame } from '../../store/gameStore';
import { getTea } from '../../core/data/teas';
import { getNpc } from '../../core/data/npcs';

const GRADE_LABEL: Record<string, string> = { fail: '失败', normal: '普通', good: '良好', fine: '上品' };

/**
 * 茶篓选茶泡一壶（库存 → 泡茶 入口，P0 前置缺口补全）。
 * 在茶桌场景提供「用茶篓里已有的茶泡一壶」——买来的王霸茶、做好的三茶都能进来。
 * 选中的茶不消耗库存，仅作为「手上的样品」进入 8 步泡茶，再由周伯点评。
 */
export default function TeaStackPicker({ onClose }: { onClose: () => void }) {
  const inventory = useGame((s) => s.player.inventory);
  const startBrewFromStack = useGame((s) => s.startBrewFromStack);

  if (inventory.length === 0) {
    return <p className="hint">茶篓还是空的——先去制茶，或在茶集市逛逛。</p>;
  }

  return (
    <div className="brew-picker">
      <p className="hint">挑一篓里的茶，泡来尝尝：</p>
      <div className="dialog-choices">
        {inventory.map((s) => {
          const name = getTea(s.teaId).name;
          const src = s.source === 'purchased' && s.sourceNpc ? ` · ${getNpc(s.sourceNpc).name}的摊` : '';
          return (
            <button
              key={s.id}
              className="btn"
              onClick={() => startBrewFromStack(s)}
            >
              {name}（{GRADE_LABEL[s.grade] ?? s.grade}）{src}
            </button>
          );
        })}
        <button className="btn" onClick={onClose}>先不泡</button>
      </div>
    </div>
  );
}
