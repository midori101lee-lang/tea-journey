import { useEffect, useRef, useState } from 'react';
import type { EncounterOutcome, EncounterChoice, EncounterScene, EncounterEvent, DialogueLine } from '../../core/types';
import { ENCOUNTERS } from '../../core/data/encounters';
import { TEAS } from '../../core/data/teas';
import { getNpc } from '../../core/data/npcs';
import { useGame } from '../../store/gameStore';
import type { Scene } from '../../store/gameStore';
import { NpcPortrait } from '../../components/art/NpcPortrait';
import { SCENES } from '../../components/scenes';
import { rollEncounter, ENCOUNTER_SCENES } from './encounterEngine';

const GRADE_LABEL: Record<string, string> = { fail: '失败', normal: '普通', good: '良好', fine: '上品' };
function teaName(id: string): string {
  return TEAS.find((t) => t.id === id)?.name ?? id;
}

/** 抽一个选项的花费（仅买茶类选项：outcome.addCoins 为负） */
function choiceCost(c: EncounterChoice): number {
  const n = c.outcome?.addCoins ?? 0;
  return n < 0 ? -n : 0;
}

/**
 * 偶遇层（场景级世界机制的核心呈现）。
 * 关键约束（V0.1 视觉回退修正）：
 *  - 偶遇发生在「当前场景内部」：本层是 .scene 的绝对子层（pointer-events:none），
 *    只通过内部 NPC 立绘与底部对话 overlay 呈现，绝不跳转独立页面、绝不重渲染背景。
 *  - NPC 立绘用 SCENES[scene].encounterFigure 百分比坐标，永远落在 Scene Container 内。
 *  - 对话 overlay 直接贴在当前场景底部，Scene Container 的 width/height/aspect 完全不变。
 *  - 「点击搭话」已删除：NPC 出现后直接进入对话（第一句对话自动显示）。
 *  - 对话期间 NPC 立绘保持在原位置，但位于「对话渐变遮罩」之下（人物→渐变→文字的绘本层次），
 *    不遮挡文字；对话结束才清除。
 *  - 触发：订阅 store.scene，一次「进入场景」只 roll 一次；离开则清场。
 */
export default function EncounterLayer() {
  const scene = useGame((s) => s.scene);
  const active = useGame((s) => s.activeEncounter);
  const triggerEncounter = useGame((s) => s.triggerEncounter);
  const clearEncounter = useGame((s) => s.clearEncounter);
  const setFlags = useGame((s) => s.setFlags);

  // 一次「进入场景」只 roll 一次：仅依赖 scene 变化；玩家/对话状态变化不重新 roll。
  useEffect(() => {
    if ((ENCOUNTER_SCENES as string[]).includes(scene)) {
      const pl = useGame.getState().player;
      const r = rollEncounter(scene as EncounterScene, pl);
      if (r && r.npcId === 'mystery_tea_person') {
        // 神秘茶人：低频且受「天」约束——同一天最多遇一次（轻量 flag 记忆）。
        const key = 'mystery_seen_' + pl.day;
        if (pl.flags[key]) clearEncounter();
        else { setFlags({ [key]: 1 }); triggerEncounter(r); }
      } else if (r) {
        triggerEncounter(r);
      } else {
        clearEncounter();
      }
    } else {
      clearEncounter();
    }
    // 仅 scene 入依赖；player 通过 getState() 取最新值，避免每次状态变更都重 roll
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  if (!active) return null;
  const npcDef = ENCOUNTERS.find((n) => n.id === active.npcId);
  const ev = npcDef?.events.find((e) => e.id === active.eventId);
  if (!npcDef || !ev) return null;
  const npc = getNpc(active.npcId);

  // 偶遇 NPC 站位：使用当前场景自己的 encounterFigure（缺省回退 figure）。
  // 全部是「相对场景画布（.scene，position:relative）的百分比」坐标系，
  // 因此 NPC 永远落在 Scene Container 内，不会随浏览器宽度跑到页面右侧。
  const sceneFig = SCENES[active.sceneArt]?.encounterFigure ?? SCENES[active.sceneArt]?.figure;
  const figStyle = sceneFig
    ? { left: `${sceneFig.left}%`, bottom: `${sceneFig.bottom}%`, width: `${sceneFig.width}%`, maxWidth: 200 }
    : { left: '30%', bottom: '16%', width: '42%', maxWidth: 180 };

  // 仅「山路 + 林姑娘」缩小显示尺寸（约 75%）：transform-origin 取脚底中心，
  // 缩放后仍然扎根场景、不越界。不动林姑娘原始 PNG / 其他场景尺寸 / 全局 NPC 尺寸 / 其它 NPC。
  const figScale = active.sceneArt === 'mountain' && active.npcId === 'linggu' ? 0.75 : 1;
  const figTransform = figScale !== 1
    ? { transform: `scale(${figScale})`, transformOrigin: 'bottom center' as const }
    : null;

  return (
    <div className="encounter-layer">
      {/* NPC 立绘层：相对 .scene 定位；zIndex 低于对话渐变层，对话期间始终留在原位置，
          且不遮挡文字（NPC 下半部由渐变遮罩隐入场景）。 */}
      <div className="encounter-figure" style={{ ...figStyle, ...figTransform }} aria-hidden>
        <NpcPortrait id={active.npcId} />
      </div>

      {/* 对话渐变遮罩层：位于 NPC 之上、文字之下。
          让 NPC 下半部自然隐入场景，从而文字始终清晰（绘本式层次：人物→渐变→文字）。 */}
      <div className="encounter-gradient" aria-hidden />

      {/* 对话层（当前场景的 Dialogue Layer）：Speaker Name + Dialogue Text + Choices，
          位于渐变之上，不重渲染背景 / NPC，不改变场景尺寸。 */}
      <EncounterDialogue
        npcId={active.npcId}
        ev={ev}
        npcName={npc.name}
        onClose={clearEncounter}
      />
    </div>
  );
}

/**
 * 偶遇对话：从旧独立 EncounterView 抽取的逻辑，复用现有播放 / 赠茶 / 买茶流程。
 * 仅作为当前场景的 Dialogue Layer 渲染（不包 NpcStage、不 fixed、不切换路由）。
 */
function EncounterDialogue({
  npcId,
  ev,
  npcName,
  onClose,
}: {
  npcId: string;
  ev: EncounterEvent;
  npcName: string;
  onClose: () => void;
}) {
  const { player, go, setFlags, addCoins, addTea, unlockComic, addClue, meetNpc } = useGame();
  const [applied, setApplied] = useState<EncounterOutcome | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [phase, setPhase] = useState<'lines' | 'result'>('lines');
  const [pendingBuy, setPendingBuy] = useState<{ choice: EncounterChoice; price: number; remaining: number } | null>(null);
  // 跟进分支（如「拒绝后被劝一次」）：选了带 followup 的选项后，替换当前对白与选项，不直接结算 outcome。
  const [activeFollowup, setActiveFollowup] = useState<{ lines: DialogueLine[]; choices?: EncounterChoice[] } | null>(null);
  const [gain, setGain] = useState<{ name: string; grade: string } | null>(null);
  const [spent, setSpent] = useState(0);
  const [lock, setLock] = useState(false); // 获得动画播放期间禁用继续

  // 入场即记为「见过」（持久化）。是否在本次开场加「又见面了」前缀，用入场前的快照判断。
  const metBefore = useRef(useGame.getState().player.metNpcs.includes(npcId)).current;
  useEffect(() => { meetNpc(npcId); }, [npcId, meetNpc]);
  useEffect(() => {
    if (!lock) return;
    const t = setTimeout(() => setLock(false), 900);
    return () => clearTimeout(t);
  }, [lock]);

  // 跨场景再遇：复用 metNpcs，不新建关系/好感度系统。
  const lines = metBefore ? [{ text: '诶，又见面了。' }, ...ev.lines] : ev.lines;

  function apply(o: EncounterOutcome) {
    if (o.setsFlags) setFlags(o.setsFlags);
    if (o.addCoins) addCoins(o.addCoins);
    if (o.giveTea) {
      addTea(o.giveTea.teaId, o.giveTea.grade, o.giveTea.roastLevel ?? '足火', o.giveTea.count ?? 1, o.giveTea.unitValue);
      setGain({ name: teaName(o.giveTea.teaId), grade: o.giveTea.grade });
      setLock(true);
    }
    if (o.unlockComic) unlockComic(o.unlockComic);
    if (o.addClue) addClue(o.addClue);
    if (o.addCoins && o.addCoins < 0) setSpent(-o.addCoins);
    setToast(o.toast ?? null);
    setApplied(o);
    setPhase('result');
  }

  function onChoice(c: EncounterChoice) {
    const cost = choiceCost(c);
    if (cost > 0) {
      // 买茶：先确认，展示余额/茶价/剩余；余额不足不让买
      setPendingBuy({ choice: c, price: cost, remaining: player.coins - cost });
      return;
    }
    if (c.followup) {
      // 跟进分支：替换当前对白与选项，不直接结算 outcome（递归复用同一套 onChoice）
      setActiveFollowup(c.followup);
      return;
    }
    apply(c.outcome ?? {});
  }

  function finish() {
    // 偶遇结束后回到「你所在的地方」，不把玩家拽到地图（goTo 明确跳转的场景除外）。
    if (applied?.goTo) {
      go(applied.goTo as Scene);
      onClose();
      return;
    }
    onClose();
  }

  const isPurchase = applied != null && spent > 0;

  return (
    <div className="encounter-dialogue">
      <div className="dialog-meta">
        <span className="dialog-npc-inline">{npcName}</span>
        <span className="dialog-role-inline">{getNpc(npcId).role}</span>
      </div>
      {lines.map((ln, i) => (
        <p className="dialog-line" key={i}>{ln.text}</p>
      ))}
      {activeFollowup && activeFollowup.lines.map((ln, i) => (
        <p className="dialog-line dialog-line-follow" key={`f${i}`}>{ln.text}</p>
      ))}

      {phase === 'lines' ? (
        pendingBuy ? (
          <div className="buy-confirm">
            <div className="buy-row"><span>🪙 茶钱</span><span>{player.coins} 文</span></div>
            <div className="buy-row"><span>这包茶</span><span>{pendingBuy.price} 文</span></div>
            <div className="buy-row buy-remain"><span>买下后剩余</span><span>{pendingBuy.remaining} 文</span></div>
            {pendingBuy.remaining < 0 ? (
              <>
                <p className="hint warn">你摸了摸钱袋，好像还差一点。</p>
                <div className="dialog-choices">
                  <button className="btn" onClick={() => setPendingBuy(null)}>再想想</button>
                </div>
              </>
            ) : (
              <div className="dialog-choices">
                <button
                  className="btn btn-primary"
                  onClick={() => { const c = pendingBuy.choice; setPendingBuy(null); apply(c.outcome ?? {}); }}
                >买下</button>
                <button className="btn" onClick={() => setPendingBuy(null)}>算了，不买</button>
              </div>
            )}
          </div>
        ) : activeFollowup && activeFollowup.choices && activeFollowup.choices.length > 0 ? (
          <div className="dialog-choices">
            {activeFollowup.choices.map((c, k) => (
              <button key={k} className="btn" onClick={() => onChoice(c)}>{c.label}</button>
            ))}
          </div>
        ) : ev.choices && ev.choices.length > 0 ? (
          <div className="dialog-choices">
            {ev.choices.map((c, k) => (
              <button key={k} className="btn" onClick={() => onChoice(c)}>{c.label}</button>
            ))}
          </div>
        ) : (
          <button className="btn btn-primary dialog-continue" onClick={() => apply(ev.outcome ?? {})}>继续</button>
        )
      ) : (
        <>
          {gain && (
            <div className="tea-gain">
              <span className="tea-gain-icon">🍵</span>
              <span className="tea-gain-text">+1 {gain.name}（{GRADE_LABEL[gain.grade] ?? gain.grade}）</span>
              <div className="tea-gain-sub">已放入茶篓</div>
            </div>
          )}
          {isPurchase && <p className="hint" style={{ margin: '2px 0 6px' }}>花了 {spent} 文。</p>}
          {toast && <p className="hint" style={{ margin: '2px 0 8px' }}>{toast}</p>}
          <button className="btn btn-primary dialog-continue" disabled={lock} onClick={finish}>
            {lock ? '稍候…' : (applied?.goTo ? '去看看' : '继续逛')}
          </button>
        </>
      )}
    </div>
  );
}
