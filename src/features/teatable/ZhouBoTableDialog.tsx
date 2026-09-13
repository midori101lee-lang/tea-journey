import { useEffect, useState } from 'react';
import { useGame } from '../../store/gameStore';
import { NpcStage } from '../../components/NpcStage';
import { DIALOGUES, DERIVED_DIALOGUE_FLAGS } from '../../core/data/dialogues';
import { getNpc } from '../../core/data/npcs';
import { regionTeaIds } from '../../core/data/regions';
import { pickZhouBoTopic } from '../../core/data/zhouboChat';
import type { Dialogue } from '../../core/types';

/**
 * 周伯茶桌对话（武夷山 teatable / 杭州 hz-teatable 共用）。
 *
 * 与旧 NpcDialog 的区别：repeat 对白不再是一条写死的台词（那是「泡龙井说九曲红梅」错配的根源），
 * 而是 按优先级组合当前上下文：
 *   ① 特殊对白（首次引导 / 派生条件触发，如牛姐彩蛋辨茶）——原样走 DIALOGUES 的匹配与效果；
 *   ② 话题闲聊：地区(player.currentRegion) × 当前茶叶(lastResult.teaId/grade) × 话题类型
 *      （first_taste / reaction / tasting / compare / region / culture / lifestyle，权重近似
 *      品茶40·文化地域20·生活20·回应玩家20），见 core/data/zhouboChat.ts。
 *
 * 数据源一致性：这里的茶叶上下文与底部评价（zhouBoAdvice，finishBrewing 时按同一包茶生成）
 * 同源于 lastResult——对话与底部小字永不分裂。
 */
export default function ZhouBoTableDialog({
  scene,
  onDone,
}: {
  scene: 'teatable' | 'hz-teatable';
  onDone?: () => void;
}) {
  const { player, lastResult, setFlags, unlockComic, meetNpc, setFlag } = useGame();
  const npc = getNpc('zhoubo');

  // ── 特殊对白：首次（!met）或 派生/普通条件命中的 conditional（如 zhoubo_niujie_tea）──
  const [special] = useState<Dialogue | null>(() => {
    const st = useGame.getState();
    const pool = DIALOGUES.filter((d) => d.scene === scene && d.npcId === 'zhoubo');
    const met = st.player.metNpcs.includes('zhoubo');
    const first = pool.find((d) => d.trigger.kind === 'first' && !met);
    const cond = pool.find((d) => {
      if (d.trigger.kind !== 'conditional') return false;
      const derived = DERIVED_DIALOGUE_FLAGS[d.trigger.flag];
      if (derived) return derived(st.player) === (d.trigger.value ?? true);
      const fv = st.player.flags[d.trigger.flag];
      return d.trigger.value === undefined ? !!fv : (fv ?? false) === d.trigger.value;
    });
    return first ?? cond ?? null;
  });

  // ── 话题闲聊：无特殊对白时，按 当前地区 × 当前茶叶 × 玩家行为 抽一个话题 ──
  const [topic] = useState(() => {
    if (special) return null;
    const st = useGame.getState();
    const p = st.player;
    const teaId = st.lastResult?.teaId;
    const grade = st.lastResult?.grade;
    const wuyiMade = regionTeaIds('wuyishan').some((id) => p.madeTeas[id]);
    const hzMade = regionTeaIds('hangzhou').some((id) => p.madeTeas[id]);
    return pickZhouBoTopic({
      regionId: p.currentRegion || 'wuyishan',
      teaId,
      grade,
      firstTaste: !!teaId && !p.flags[`zhoubo_tasted_${teaId}`],
      bothRegions: wuyiMade && hzMade,
      rand: Math.random,
    });
  });

  // 特殊对话逐句推进；话题闲聊单句展示。
  const [i, setI] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    meetNpc('zhoubo');
    // 首次品到这泡茶：落轻量 flag（下次不再用「第一次喝」话题），不新增系统。
    if (topic?.topic === 'first_taste' && lastResult) {
      setFlag(`zhoubo_tasted_${lastResult.teaId}`, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lines = special ? special.lines : topic?.lines ?? [];
  const step = special ? special.lines[i] : null;
  const isLast = special ? i + 1 >= special.lines.length : true;
  const sceneKey = special?.sceneArt ?? (special ? npc.sceneArt : scene);

  function advance() {
    if (finished) return;
    if (special && isLast) {
      // 与 NpcDialog 相同：末句结算对白效果（辨茶对话需要 setsFlags + unlocksComic）
      if (special.setsFlags) setFlags(special.setsFlags);
      if (special.unlocksComic) unlockComic(special.unlocksComic);
    }
    if (special && !isLast) { setI(i + 1); return; }
    setFinished(true);
    onDone?.();
  }

  return (
    <NpcStage sceneKey={sceneKey} npcId="zhoubo">
      <div className="dialog-meta">
        <span className="dialog-npc-inline">{step?.speaker && step.speaker !== npc.name ? step.speaker : npc.name}</span>
        {(!step?.speaker || step.speaker === npc.name) && <span className="dialog-role-inline">{npc.role}</span>}
      </div>
      <p className="dialog-line">{step ? step.text : topic?.lines[0] ?? '……'}</p>
      {finished ? null : (
        <button className="btn btn-primary dialog-continue" onClick={advance}>
          {special && !isLast ? '继续' : '嗯'}
        </button>
      )}
    </NpcStage>
  );
}
