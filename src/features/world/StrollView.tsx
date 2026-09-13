import { useEffect, useState } from 'react';
import { useGame } from '../../store/gameStore';
import BackButton from '../../components/BackButton';
import { NpcStage } from '../../components/NpcStage';
import { getNpc } from '../../core/data/npcs';
import { getTea } from '../../core/data/teas';
import { GRADE_LABEL, type Grade } from '../../core/types';
import { rollStrollEvent, type StrollEvent } from '../../core/data/strolls';

/**
 * 区域散步（Regional Stroll）通用视图：目前承载杭州「梅家坞走走」。
 * 定位与武夷山「山路散步」对齐——「我出去逛逛，看看今天遇见谁」；
 * 与「我的茶席」（回自己的地方坐下喝茶）职责分开、互不跳转。
 *
 * 机制完全复用山路散步：每日 3 次（visitExplore / mountainVisitsToday），
 * 回茶馆歇一晚重置；每次进入（或场景内「再走走」）按地区事件池抽一个事件。
 * 多数事件「只是遇见」——不强制给奖励。
 *
 * 布局：对话（meta + 台词）作为 NpcStage 的 children 渲染进舞台内的 .dialog-overlay
 * （与 NpcDialog 同一 popover 机制），保证文字始终叠在背景区域内；操作按钮留在舞台下方。
 */
export default function StrollView({
  events,
  heading,
  intro,
  backLabel = '回杭州',
}: {
  events: StrollEvent[];
  heading: string;
  intro: string;
  backLabel?: string;
}) {
  const { player, go, visitExplore, addGiftTea, showToast } = useGame();
  // 进入本场景时事件已在 visitExplore 处计过一次；本组件只负责抽事件与展示。
  const [event, setEvent] = useState<StrollEvent>(() => rollStrollEvent(events, player));

  const visitsLeft = Math.max(0, 3 - player.mountainVisitsToday);
  const npc = event.npcId ? getNpc(event.npcId) : null;

  // 赠茶横幅状态：沿用武夷山山路偶遇的 .tea-gain 内联提示，明确告诉玩家获得了什么茶。
  const [gain, setGain] = useState<{ name: string; grade: Grade; count: number } | null>(null);

  // 事件的小奖励：只在事件首次展示时发放一次（「再走走」重抽后重新允许）。
  useEffect(() => {
    if (!event.giveTea) { setGain(null); return; }
    const g = event.giveTea;
    addGiftTea(g.teaId, g.grade, g.count, g.giftTag);
    const name = getTea(g.teaId).name;
    setGain({ name, grade: g.grade, count: g.count });
    // 显式点名：谁赠的 + 什么茶（带品质） + 数量，避免玩家忽略获得。
    const who = npc ? `${npc.name}赠的` : '';
    showToast(`🍵 获得${who}${name}（${GRADE_LABEL[g.grade]}）×${g.count} 已放入茶篓`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  function strollAgain() {
    if (visitsLeft <= 0) return;
    visitExplore('hz-stroll'); // 计数 + 不重复压栈（已在 hz-stroll）
    setEvent(rollStrollEvent(events, useGame.getState().player));
  }

  return (
    <div className="scene">
      <BackButton />
      {/* NPC 偶遇时把 npcId 交给 NpcStage：立绘走 SCENES['hz-stroll'].figure 槽位（舞台内、对话层之下） */}
      <NpcStage sceneKey="hz-stroll" npcId={npc?.id} showFigure={!!npc}>
        <div className="dialog-meta">
          <span className="dialog-npc-inline">{heading}</span>
          {npc && <span className="dialog-role-inline">{npc.name} · {npc.role}</span>}
        </div>
        {!npc && <p className="dialog-line">{intro}</p>}
        {/* 你一句我一句：按说话人分气泡（你=右对齐绿；NPC/旁白=左对齐），key 触发淡入+上滑。 */}
        <div className="dialog-bubble-wrap">
          {event.lines.map((l, i) => {
            const norm = typeof l === 'string' ? { speaker: undefined, text: l } : l;
            const cls = norm.speaker === '你' ? 'dialog-bubble--mine' : norm.speaker ? 'dialog-bubble--npc' : 'dialog-bubble--narr';
            return (
              <div className={`dialog-bubble ${cls}`} key={i}>
                <p className="dialog-line">{norm.text}</p>
              </div>
            );
          })}
        </div>
        {/* 赠茶内联横幅：与武夷山山路偶遇同款，明确「+1 茶（品质）已放入茶篓」 */}
        {gain && (
          <div className="tea-gain" style={{ marginTop: 12 }}>
            <span className="tea-gain-icon">🍵</span>
            <span className="tea-gain-text">+{gain.count} {gain.name}（{GRADE_LABEL[gain.grade]}）</span>
            <div className="tea-gain-sub">已放入茶篓</div>
          </div>
        )}
      </NpcStage>

      <div className="scene-foot">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            disabled={visitsLeft <= 0}
            title={visitsLeft <= 0 ? '今天逛够了——回茶馆歇一晚再来。' : ''}
            onClick={strollAgain}
          >🚶 再走走（今天还能去 {visitsLeft} 回）</button>
          <button className="btn" onClick={() => go('map')}>{backLabel}</button>
        </div>
        {visitsLeft <= 0 && <p className="hint">今天逛够了。明天再来，村子每天都有新样子。</p>}
      </div>
    </div>
  );
}
