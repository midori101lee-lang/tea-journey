import { useState } from 'react';
import type { Dialogue, DialogueLine } from '../core/types';
import { DIALOGUES } from '../core/data/dialogues';
import { getNpc } from '../core/data/npcs';
import { useGame } from '../store/gameStore';
import { NpcStage } from './NpcStage';

interface Props {
  scene: string;
  npcId?: string;
  onDone?: () => void;
}

/** 一段「对话 + 其中一句」的扁平单元；整条对话链在挂载时一次性展开成线性步骤。 */
interface Step { dlg: Dialogue; line: DialogueLine; lastInDlg: boolean; }

function buildSteps(scene: string, npcId: string | undefined, player: ReturnType<typeof useGame.getState>['player']): Step[] {
  const pool = DIALOGUES.filter((d) => d.scene === scene && (!npcId || d.npcId === npcId));
  const met = player.metNpcs.includes(npcId ?? '');
  const tier = player.proficiency >= 85 ? '老练' : player.proficiency >= 55 ? '熟手' : player.proficiency >= 25 ? '入门' : '初学';
  const first = pool.find((d) => d.trigger.kind === 'first' && !met);
  const conditional = pool.find((d) => {
    if (d.trigger.kind !== 'conditional') return false;
    if (d.trigger.flag === 'proficiency_tier') return String(d.trigger.value) === tier;
    if (d.trigger.flag === 'phase') return player.flags['phase'] === d.trigger.value;
    if (d.trigger.flag === 'tea_made') return player.flags['tea_made'] === 1;
    // value:false 同时匹配「未设置」(undefined) 与显式 false，便于表达「尚未访问某场景」。
    const fv = player.flags[d.trigger.flag];
    return d.trigger.value === undefined ? !!fv : (fv ?? false) === d.trigger.value;
  });
  const repeat = pool.find((d) => d.trigger.kind === 'repeat' && met);
  const ordered: Dialogue[] = [];
  if (first) ordered.push(first);
  if (conditional) ordered.push(conditional);
  if (repeat && !first && !conditional) ordered.push(repeat);
  const chain = ordered.length ? ordered : pool;
  const steps: Step[] = [];
  chain.forEach((d) => d.lines.forEach((line, i) => steps.push({ dlg: d, line, lastInDlg: i === d.lines.length - 1 })));
  return steps;
}

/**
 * 播放当前场景 / NPC 的对话链（场景化：NPC 在场景大图中说话）。
 * 选择顺序：first（仅首次且未见过）→ conditional（按 flag 匹配）→ repeat（已见过）。
 * 整链在挂载时锁定为线性 Step[]，逐句推进；边效应在「每段对话末句」确定性应用；
 * 播到最后一步后隐藏「继续」按钮，避免「点了没反应」的死按钮错觉（父级已展示后续 UI）。
 */
export default function NpcDialog({ scene, npcId, onDone }: Props) {
  const { setFlags, unlockComic, addClue, addSouvenir, meetNpc } = useGame();
  // 挂载时按当前 player 状态构建一次（WebApp 已为每个 (scene,npcId) 加 key 强制重挂载）。
  const [steps] = useState<Step[]>(() => buildSteps(scene, npcId, useGame.getState().player));
  const [i, setI] = useState(0);
  const [finished, setFinished] = useState(false);

  if (steps.length === 0) {
    return (
      <div className="npc-stage">
        <div className="npc-scene" />
        <div className="dialog-overlay">
          <button className="btn btn-primary" onClick={onDone}>继续</button>
        </div>
      </div>
    );
  }

  const step = steps[i];
  const npc = getNpc(step.dlg.npcId);
  const sceneArt = step.dlg.sceneArt ?? npc.sceneArt;
  const text = step.line.text;
  const choices = step.line.choices ?? [];
  const isLast = i + 1 >= steps.length;

  function applyEffects(d: Dialogue) {
    if (d.setsFlags) setFlags(d.setsFlags);
    meetNpc(d.npcId);
    if (d.unlocksComic) unlockComic(d.unlocksComic);
    if (d.unlocksClue) addClue(d.unlocksClue);
    if (d.givesSouvenir) addSouvenir(d.givesSouvenir); // 游历纪念物进「游记收藏」
  }

  function advance() {
    if (finished) return;
    if (step.lastInDlg) applyEffects(step.dlg);
    if (isLast) {
      setFinished(true);
      onDone?.();
    } else {
      setI(i + 1);
    }
  }

  return (
    <NpcStage sceneKey={sceneArt} npcId={step.dlg.npcId}>
      <div className="dialog-meta">
        <span className="dialog-npc-inline">{npc.name}</span>
        <span className="dialog-role-inline">{npc.role}</span>
      </div>
      <p className="dialog-line">{text}</p>
      {finished ? null : choices.length > 0 ? (
        <div className="dialog-choices">
          {choices.map((c, k) => (
            <button key={k} className="btn" onClick={advance}>{c}</button>
          ))}
        </div>
      ) : (
        <button className="btn btn-primary dialog-continue" onClick={advance}>继续</button>
      )}
    </NpcStage>
  );
}
