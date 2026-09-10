/**
 * NpcStage：NPC 对话的「场景化」布局骨架。
 * 结构 = 场景大图（满铺）+ 透明 NPC 人物层（按 focus 叠加）+ 底部对话浮层。
 * 由 NpcDialog / OpeningScene 共用，使 NPC 像「在场景中说话」而非「网页卡片」。
 */
import type { ReactNode } from 'react';
import { SCENES } from './scenes';
import { NpcPortrait } from './art/NpcPortrait';
import { useGame } from '../store/gameStore';

export function NpcStage({
  sceneKey,
  npcId,
  showFigure = true,
  children,
}: {
  sceneKey: string;
  npcId?: string;
  showFigure?: boolean;
  children?: ReactNode;
}) {
  const { activeEncounter } = useGame();
  // 偶遇激活时，当前场景主线 NPC（人物 + 姓名）与主线对话浮层必须暂时隐藏，
  // 但「背景」保留。两条 Layer 互斥：Encounter Layer 接管显示，主线回到普通状态才恢复。
  // 这样阿秀 / 老陈 / 小满等主线角色不会与偶遇 NPC 同时出现、不会两套对话并存。
  const encounterActive = !!activeEncounter;

  const entry = SCENES[sceneKey];
  const Scene = entry?.Component;
  const fig = entry?.figure;
  const bg = entry?.bg;
  return (
    <div className="npc-stage">
      <div className="npc-scene">
        {bg ? (
          <img
            className="npc-scene-bg"
            src={`${import.meta.env.BASE_URL}${bg}`}
            alt=""
            onLoad={(e) => e.currentTarget.classList.add('is-loaded')}
            onError={(e) => e.currentTarget.classList.add('is-error')}
          />
        ) : Scene ? (
          <Scene />
        ) : null}
      </div>
      {showFigure && npcId && fig && !encounterActive && (
        <div
          className="npc-figure"
          style={{ left: `${fig.left}%`, bottom: `${fig.bottom}%`, width: `${fig.width}%` }}
        >
          <NpcPortrait id={npcId} />
        </div>
      )}
      {/* 主线对话浮层：偶遇激活时整体隐藏（文字 / 按钮随主线 NPC 一起消失），结束自动恢复 */}
      <div className="dialog-overlay" style={encounterActive ? { display: 'none' } : undefined}>
        {children}
      </div>
    </div>
  );
}
