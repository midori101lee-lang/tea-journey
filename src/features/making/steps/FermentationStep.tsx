import { useEffect, useRef, useState } from 'react';
import type { StepOutcome, StepParams, FaultTag, Difficulty } from '../../../core/types';
import { TeaLeafSvg } from '../../../components/art/Art';
import { targetWindowScore } from '../../../core/making/scoring';

interface Props {
  params: StepParams;
  difficulty: Difficulty;
  /** 游戏内「第几天」：用于发酵最佳窗口的轻微确定性漂移（同一天可复现，不同天略有不同）。 */
  day?: number;
  onDone: (o: StepOutcome) => void;
}

function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16); const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255, ag = (pa >> 8) & 255, ab = pa & 255;
  const br = (pb >> 16) & 255, bg = (pb >> 8) & 255, bb = pb & 255;
  const c = (x: number, y: number) => Math.round(x + (y - x) * t);
  const r = c(ar, br), g = c(ag, bg), bl = c(ab, bb);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

/** 确定性散列（同输入同结果）：用于发酵窗口的轻微漂移，避免「纯随机坑玩家」。 */
function hash01(...nums: number[]): number {
  let h = 2166136261 >>> 0;
  for (const n of nums) {
    const v = Math.round(n) | 0;
    h ^= v & 0xff; h = Math.imul(h, 16777619) >>> 0;
    h ^= (v >>> 8) & 0xff; h = Math.imul(h, 16777619) >>> 0;
  }
  return (h >>> 0) / 4294967296;
}

/** 发酵颜色：青绿 → 黄绿 → 黄褐 → 红褐（随转色推进）。 */
function fermentColor(f: number): string {
  if (f < 25) return mix('#8fae6a', '#b0b85e', f / 25);
  if (f < 50) return mix('#b0b85e', '#b98a45', (f - 25) / 25);
  if (f < 75) return mix('#b98a45', '#b05a35', (f - 50) / 25);
  return mix('#b05a35', '#8f3a25', Math.min(1, (f - 75) / 25));
}

/** 色卡：四个阶段的标准色，供玩家拿眼前这堆叶子对照（不给数字，只给「看」的参照）。 */
const COLOR_CARD: { label: string; color: string }[] = [
  { label: '青绿', color: '#8fae6a' },
  { label: '黄绿', color: '#b0b85e' },
  { label: '黄褐', color: '#b98a45' },
  { label: '红褐', color: '#a8492c' },
];

/** 当前这一堆属于色卡上的哪一档。 */
function colorStage(f: number): number {
  if (f < 25) return 0;
  if (f < 50) return 1;
  if (f < 75) return 2;
  return 3;
}

/** 香气的大致走向（一直可见，但只是「大致」）。 */
function aromaRough(f: number, lo: number, hi: number): string {
  if (f < 20) return '青气重';
  if (f < 40) return '青里透出花香';
  if (f < lo) return '香气转柔，甜香将起';
  if (f <= hi) return '甜香正浓，隐隐梅香';
  if (f < 92) return '甜香转熟香';
  return '香气发闷';
}

/** 叶态的细看描述（点「翻看茶叶」才给）。 */
function leafDetail(f: number): string {
  if (f < 20) return '叶子还青绿、挺着，水分没走。';
  if (f < 40) return '转成黄绿，叶边开始发软。';
  if (f < 62) return '黄褐色出来了，叶面发润、摸着柔。';
  if (f < 80) return '红褐均匀，叶缘转红，梗也软了。';
  if (f < 92) return '颜色转深，叶面发暗、有点发乌。';
  return '叶色暗沉，堆里有温热感，再堆就过了。';
}

/** 凑近闻一闻的细描述（点「凑近闻一闻」才给）。 */
function aromaDetail(f: number, lo: number, hi: number): string {
  if (f < 20) return '一股青涩的草木气，还没转过来。';
  if (f < 40) return '青涩淡了，香气柔和下来，带着一点花香。';
  if (f < lo) return '甜香开始浮现，但还压着一丝生青。';
  if (f <= hi) return '蜜甜香里透出一丝梅子香——香气正浓，是出堆的时候了。';
  if (f < 92) return '甜香里泛出熟香，再堆下去就要闷了。';
  return '香气沉下去，带点酸熟的闷味。';
}

/**
 * 发酵（红茶线的核心记忆点）：叶子由绿转红、青气散去、甜香生出。
 * 玩法是「看色 · 闻香 · 出堆」——靠眼睛看叶色、靠鼻子闻香气，自己判断什么时候出堆。
 * 全程不给数字、不给「正确时间」：只给色卡参照 + 可以主动凑近闻、翻看叶。
 * 最佳窗口存在轻微确定性漂移（同一天可复现），玩家仍可靠观察判断，不是纯随机。
 * 颜色与文案只是感觉，不代表现实工艺数值。
 */
export default function FermentationStep({ params, difficulty, day = 1, onDone }: Props) {
  const base = params.fermentTarget ?? [67, 79];
  const shift = Math.round((hash01(3, day, base[0]) - 0.5) * 8); // -4..+4
  const lo = base[0] + shift;
  const hi = base[1] + shift;
  const rate = (params.fermentRate ?? 0.95) * (difficulty === 'casual' ? 0.85 : 1);

  const [f, setF] = useState(0);
  const [smell, setSmell] = useState('还没凑近闻过。');
  const [look, setLook] = useState('还没翻看过。');
  const [flipCount, setFlipCount] = useState(0);
  const [done, setDone] = useState(false);
  const st = useRef({ f: 0, finished: false });

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      const s = st.current;
      if (s.finished) return;
      s.f = Math.min(100, s.f + rate);
      setF(s.f);
      if (s.f >= 100) finish();
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, rate]);

  /** 翻堆：把堆子翻匀，发酵缓一缓（给玩家一个「收一下」的手感）。 */
  function turn() {
    if (done || st.current.finished) return;
    st.current.f = Math.max(0, st.current.f - 4);
    setF(st.current.f);
    setFlipCount((n) => n + 1);
    setLook('翻了一遍堆，叶子摊开，颜色看着匀了些。');
  }

  function finish() {
    if (st.current.finished) return;
    st.current.finished = true;
    setDone(true);
    const v = st.current.f;
    const score = targetWindowScore(v, [lo, hi]);
    const faults: FaultTag[] = [];
    if (v < lo - 6) faults.push('ferment_short');     // 发酵没发起
    else if (v > hi + 6) faults.push('ferment_over'); // 发酵过了
    onDone({
      step: 'fermentation',
      score: Math.round(score),
      faults,
      visualState: { dryColor: '#6b3a26', shape: 'curled', edgeRed: v / 100, sheen: 0.4 },
      comment: faults.includes('ferment_short') ? '发酵不足，转色不够，喝着偏青。'
        : faults.includes('ferment_over') ? '发酵过度，香气发沉、滋味略闷。'
        : score >= 75 ? '发酵到位，红褐均匀、甜香明显。' : '发酵的度差了点。',
    });
  }

  const leafColor = fermentColor(f);
  const stage = colorStage(f);

  return (
    <div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>发酵 · 看色 · 闻香 · 出堆</div>
      <p className="hint">堆着让叶子由绿转红、生出甜香。别盯着时间——看叶色、闻香气，自己觉得「转红均匀、甜香正浓」了，就出堆。早了没发透，晚了会闷。</p>

      <div style={{ background: mix('#f3f6ee', '#f6ece4', Math.min(1, f / 85)), borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background .3s' }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <TeaLeafSvg key={i} size={38} color={leafColor} redEdge={f / 100} />
        ))}
      </div>

      {/* 色卡：拿眼前这堆和色卡对一对（只给「看」的参照，不给数字） */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10 }}>
        <span className="hint" style={{ fontSize: 12 }}>色卡</span>
        {COLOR_CARD.map((c, i) => (
          <span key={c.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span
              style={{
                width: 26, height: 26, borderRadius: 6, background: c.color,
                border: i === stage ? '2px solid var(--seal)' : '1px solid rgba(0,0,0,0.12)',
                boxShadow: i === stage ? '0 0 0 2px rgba(200,162,75,0.35)' : 'none',
              }}
            />
            <span className="hint" style={{ fontSize: 11, opacity: i === stage ? 1 : 0.6 }}>{c.label}</span>
          </span>
        ))}
      </div>

      <p className="note" style={{ marginTop: 10 }}>香气：{aromaRough(f, lo, hi)}</p>

      <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => setSmell(aromaDetail(f, lo, hi))} disabled={done}>凑近闻一闻</button>
        <button className="btn" onClick={() => setLook(leafDetail(f))} disabled={done}>翻看茶叶</button>
        <button className="btn" onClick={turn} disabled={done}>翻堆{flipCount > 0 ? `（${flipCount}）` : ''}</button>
      </div>

      <div style={{ marginTop: 10 }}>
        <p className="hint" style={{ margin: 0 }}>闻一闻：{smell}</p>
        <p className="hint" style={{ margin: '2px 0 0' }}>翻一翻：{look}</p>
      </div>

      <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={finish} disabled={done}>出堆</button>
    </div>
  );
}
