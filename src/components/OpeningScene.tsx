/**
 * 第一章开场（场景化渐进引导）。
 * 两个分支：
 *  - 第一次来（player.flags.saw_opening 未置）：新人引导，含「喝茶三选项」各有轻量反馈，结束后进茶园认阿秀。
 *  - 再来（saw_opening 已置）：熟客问候，按玩家经历（做过哪些茶 / 去过母树 / 去过集市）自然带出 1–2 句，不强制喝茶、不强制三选，结束后回武夷山地图。
 * 路由由本组件用 store.go 自行决定（首次→garden，再来→map），不再由父级 onDone 强制。
 */
import { useState } from 'react';
import type { Player } from '../core/types';
import { NpcStage } from './NpcStage';
import { useGame } from '../store/gameStore';

type TeaOption = { label: string; feedback: string };
type Beat =
  | { key: 'enter'; scene: 'wuyishan'; npc?: string; text: string; cont: string }
  | { key: 'line'; scene: 'teahouse'; npc: string; text: string; choices: string[] }
  | { key: 'tea'; scene: 'teahouse'; npc: string; text: string; options: TeaOption[] }
  | { key: 'invite'; scene: 'teahouse'; npc: string; text: string; cont: string };

// ── 首次：新人引导（保留原有结构，喝茶步改为 3 选项带不同反馈） ──
const FIRST_BEATS: Beat[] = [
  {
    key: 'enter', scene: 'wuyishan',
    text: '山路绕了几道弯，茶香倒是先到了。', cont: '走进去',
  },
  {
    key: 'line', scene: 'teahouse', npc: 'laochen',
    text: '头一回来武夷山？坐。先喝一杯。', choices: ['点点头', '笑着四处看看'],
  },
  {
    key: 'tea', scene: 'teahouse', npc: 'laochen',
    text: '那先别急着上山——这杯茶，你打算怎么喝？',
    options: [
      { label: '先闻闻', feedback: '你凑近闻了闻，香气先钻进鼻子，带点花果的甜。老陈：「闻香，也算会喝。」' },
      { label: '直接喝', feedback: '你一口喝下去，老陈乐了：「爽快人。」茶汤先苦，转而又甜。' },
      { label: '先看看茶汤', feedback: '你举起来对着光看，茶汤橙黄透亮。老陈：「光看可看不明白，得喝。」' },
    ],
  },
  {
    key: 'line', scene: 'teahouse', npc: 'laochen',
    text: '这是肉桂。先别管什么岩韵不岩韵的——你先说说，喝着什么感觉？', choices: ['清冽', '醇厚', '说不上来'],
  },
  {
    key: 'invite', scene: 'teahouse', npc: 'laochen',
    text: '有意思。光喝别人做的有什么意思？要不，自己来做一锅？', cont: '去做茶',
  },
];

// ── 再来：熟客问候（按经历动态 1–2 句，不强制喝茶/三选） ──
function buildReturnBeats(player: Player): Beat[] {
  const beats: Beat[] = [
    { key: 'line', scene: 'teahouse', npc: 'laochen', text: '哟，又来了？坐。', choices: ['笑着应一声', '点点头'] },
  ];
  const ctx: string[] = [];
  const made = Object.keys(player.madeTeas).filter((k) => player.madeTeas[k]);
  if (player.flags.all_tea_made) {
    ctx.push('三种都自己做过了？手越来越稳了嘛。');
  } else {
    if (made.includes('rougui')) ctx.push('上回那锅肉桂，后来喝着怎么样？');
    if (made.length >= 2) ctx.push('肉桂、水仙都试过了？看来你是真想把这儿的茶摸个明白。');
  }
  if (player.flags.saw_mother_tree) ctx.push('九龙窠看过了？');
  if (player.flags.met_xiaoman) ctx.push('小满今天也在集市，有空去转转。');
  for (const t of ctx.slice(0, 2)) {
    beats.push({ key: 'line', scene: 'teahouse', npc: 'laochen', text: t, choices: ['（笑笑）'] });
  }
  beats.push({ key: 'invite', scene: 'teahouse', npc: 'laochen', text: '这回想去哪儿？山里你熟了。', cont: '去逛逛' });
  return beats;
}

export default function OpeningScene() {
  const { player, go, setFlags, meetNpc } = useGame();
  const isReturning = !!player.flags.saw_opening;
  const BEATS = isReturning ? buildReturnBeats(player) : FIRST_BEATS;

  const [idx, setIdx] = useState(0);
  const [chosenFeedback, setChosenFeedback] = useState<string | null>(null);

  const beat = BEATS[idx];
  const isLast = idx + 1 >= BEATS.length;

  function finish() {
    setFlags({ met_laochen: true, first_tea_offered: true, saw_opening: true });
    meetNpc('laochen');
    // 老陈开场对话结束 → 进入武夷山（首达去茶园认阿秀；熟客回武夷山地图）。
    // 开场对话是「进入茶区」的一部分，不应作为可返回的上一页，否则会出现
    // 茶世界 → 武夷山 → 老陈 → 返回 → 老陈 的循环；故从返回栈移除 intro 帧，使后续返回直达茶世界。
    go(isReturning ? 'map' : 'garden');
    useGame.setState((s) => ({ navHistory: s.navHistory.filter((h) => h.scene !== 'intro') }));
  }

  function next() {
    if (isLast) finish();
    else { setIdx(idx + 1); setChosenFeedback(null); }
  }

  const npcName = (beat as { npc?: string }).npc ? '老陈' : '';

  return (
    <NpcStage sceneKey={beat.scene} npcId={(beat as { npc?: string }).npc}>
      {beat.scene === 'wuyishan' ? (
        <p className="dialog-line dialog-establish">{beat.text}</p>
      ) : (
        <div className="dialog-meta">
          <span className="dialog-npc-inline">{npcName}</span>
          <span className="dialog-role-inline">茶农兼茶馆老板</span>
        </div>
      )}

      {beat.scene !== 'wuyishan' && <p className="dialog-line">{beat.text}</p>}

      {/* 喝茶三选项：选一个 → 显示该选项专属反馈 → 继续 */}
      {beat.key === 'tea' && !chosenFeedback && (
        <div className="dialog-choices">
          {beat.options.map((o, i) => (
            <button key={i} className="btn" onClick={() => setChosenFeedback(o.feedback)}>{o.label}</button>
          ))}
        </div>
      )}
      {beat.key === 'tea' && chosenFeedback && (
        <>
          <p className="dialog-line dialog-feedback">{chosenFeedback}</p>
          <button className="btn btn-primary dialog-continue" onClick={next}>继续</button>
        </>
      )}

      {/* 普通 flavor 选项（hi / know / 熟客寒暄）：点任意项继续 */}
      {beat.key === 'line' && (
        <div className="dialog-choices">
          {beat.choices.map((c, i) => (
            <button key={i} className="btn" onClick={next}>{c}</button>
          ))}
        </div>
      )}

      {(beat.key === 'enter' || beat.key === 'invite') && (
        <button className="btn btn-primary dialog-continue" onClick={next}>
          {beat.cont}
        </button>
      )}
    </NpcStage>
  );
}
