import { useEffect, useMemo, useRef, useState } from 'react';
import type { StepOutcome, StepParams, FaultTag, Difficulty } from '../../../core/types';
import { RoastPotSvg } from '../../../components/art/Art';

interface Props {
  params: StepParams;
  difficulty: Difficulty;
  /** 用于每轮手法序列的确定性生成（同一天可复现）。 */
  teaId?: string;
  day?: number;
  onDone: (o: StepOutcome) => void;
}

type Gesture = 'zhua' | 'ya' | 'tui';
type Grade2 = 'good' | 'ok' | 'rushed' | 'broken' | 'slow';

/** 龙井「理条」的三式：抓、压、推——手上的劲，把茶叶做成扁平挺直的样子。 */
const GESTURES: { id: Gesture; label: string; tip: string }[] = [
  { id: 'zhua', label: '抓', tip: '把叶子抓拢' },
  { id: 'ya', label: '压', tip: '把叶子压扁' },
  { id: 'tui', label: '推', tip: '把叶子推挺' },
];

const labelOf = (g: Gesture) => GESTURES.find((x) => x.id === g)!.label;

function hash01(seed: string, a: number, b: number): number {
  let h = 2166136261 >>> 0;
  const feed = (v: number) => { h ^= v & 0xffff; h = Math.imul(h, 16777619) >>> 0; };
  for (let i = 0; i < seed.length; i++) feed(seed.charCodeAt(i));
  feed(a); feed(b);
  return (h >>> 0) / 4294967296;
}

/** 本轮的手法序列：三式的确定性排列（同一天、同一轮可复现）。 */
function seqFor(seed: string, round: number, len: number): Gesture[] {
  const arr: Gesture[] = ['zhua', 'ya', 'tui'];
  for (let k = arr.length - 1; k > 0; k--) {
    const j = Math.floor(hash01(seed, round, k) * (k + 1));
    const tmp = arr[k]; arr[k] = arr[j]; arr[j] = tmp;
  }
  return arr.slice(0, Math.min(len, arr.length));
}

/**
 * 理条（绿茶线 · 西湖龙井）：这一道出来的是龙井最认得出的东西——扁平、挺直、光滑的茶形。
 * 玩法是**横向节奏操作**：这一轮的手法（抓→压→推）横向排成一条手法带，当前手法上有一个
 * 收缩的节拍环——跟着节奏、在环收拢时按下对应手法，像真在锅边连续做茶，而不是依次点三个竖排按钮。
 * 踩上节拍 = 手上利落（形好）；没踩上但手法对 = 勉强跟上（形差些）；按错 = 压碎。
 * 失败反馈明显但不重罚：按错只记一手碎，不清进度、不结束。
 * 不是音游：没有连击/分数/长条，只有「看提示 → 跟节奏 → 抓压推 → 茶叶变扁」。
 */
export default function ShapingStep({ params, difficulty, teaId = 'longjing', day = 1, onDone }: Props) {
  const rounds = params.rounds ?? 3;
  const len = params.gestureCount ?? 3;
  const casual = difficulty === 'casual';
  const seed = `${teaId}-${day}`;
  const BEAT_MS = casual ? 1700 : 1400;      // 一手一个节拍周期
  const GOOD_AT = 0.60;                       // 环收到这里以内 = 踩上节拍（收窄 → 上品需更准）
  const OK_AT = 0.30;                         // 再早点 = 勉强跟上（窗口也收窄）

  const [round, setRound] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [beat, setBeat] = useState(0);        // 当前节拍进度 0..1（环收缩）
  const [note, setNote] = useState('看清这一轮的手法，跟着节奏来。');
  const [flash, setFlash] = useState<Grade2 | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const st = useRef({ credit: 0, broken: 0, finished: false, lock: false });

  const seq = useMemo(() => seqFor(seed, round, len), [seed, round, len]);
  const totalSteps = useMemo(
    () => Array.from({ length: rounds }, (_, r) => seqFor(seed, r, len).length).reduce((a, b) => a + b, 0),
    [seed, rounds, len],
  );
  const cur = seq[stepIdx];
  const beatRef = useRef(0);

  // 节拍环：当前这手的进度 0→1 循环；走满仍未按 = 手慢了，自动过（轻微反馈，不清进度）。
  useEffect(() => {
    if (finished) return;
    beatRef.current = 0;
    setBeat(0);
    let raf = 0;
    let prev = performance.now();
    const loop = (t: number) => {
      const dt = t - prev; prev = t;
      const s = st.current;
      if (s.finished || s.lock) { raf = requestAnimationFrame(loop); return; }
      const next = beatRef.current + dt / BEAT_MS;
      if (next >= 1) {
        advance('slow');
        return;
      }
      beatRef.current = next;
      setBeat(next);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, stepIdx, finished, BEAT_MS]);

  function finish() {
    const s = st.current;
    if (s.finished) return;
    s.finished = true;
    setFinished(true);
    const ratio = totalSteps > 0 ? s.credit / totalSteps : 0;
    let score = ratio * 100 - s.broken * 8 + (casual ? 5 : 0);
    score = Math.max(0, Math.min(100, score));
    const faults: FaultTag[] = [];
    if (s.broken >= 2) faults.push('shaping_broken');
    else if (ratio < 0.65) faults.push('shaping_loose');
    onDone({
      step: 'shaping',
      score: Math.round(score),
      faults,
      // 龙井干茶：嫩黄绿色；压碎才是 broken，做对了就是「扁平」这一好形
      visualState: { dryColor: '#a5ad58', shape: faults.includes('shaping_broken') ? 'broken' : 'flat', edgeRed: 0, sheen: 0.45 },
      comment: faults.includes('shaping_broken') ? '手上重了，条索压碎了，形没立住。'
        : faults.includes('shaping_loose') ? '手上轻了，条索还散着，不够扁平挺直。'
        : score >= 75 ? '理条做得细，叶子压得扁平挺直，是龙井的样子。' : '理条的劲差了点。',
    });
  }

  /** 结算当前这一手（grade 由 tap/超时给出），进入下一手 / 下一轮 / 收工。 */
  function advance(grade: Grade2) {
    const s = st.current;
    s.lock = true;
    setFlash(grade);
    if (grade === 'broken') s.broken += 1;
    else {
      s.credit += grade === 'good' ? 1 : grade === 'ok' ? 0.55 : grade === 'rushed' ? 0.35 : 0.2;
      if (grade === 'good' || grade === 'ok') { setCorrectCount((c) => c + 1); }
    }
    setNote(
      grade === 'good' ? '踩上节拍了——这一手利落，叶子服帖。'
        : grade === 'ok' ? '手法对了，就是节奏稍差半拍。'
          : grade === 'rushed' ? '太快了，手上还没沉下去。'
            : grade === 'broken' ? '按错了手——条索被压碎了一下，接着来。'
              : '手慢了，这一下没赶上，条索散了点。',
    );
    window.setTimeout(() => {
      if (s.finished) return;
      s.lock = false;
      setFlash(null);
      const nextIdx = stepIdx + 1;
      if (nextIdx >= seq.length) {
        const nextRound = round + 1;
        if (nextRound >= rounds) { finish(); return; }
        setRound(nextRound);
        setStepIdx(0);
        setNote('新一轮——还是看手法带，跟着节奏。');
      } else {
        setStepIdx(nextIdx);
      }
    }, 500);
  }

  function tapGesture(g: Gesture) {
    const s = st.current;
    if (finished || s.finished || s.lock) return;
    if (g !== cur) { advance('broken'); return; }
    advance(beat >= GOOD_AT ? 'good' : beat >= OK_AT ? 'ok' : 'rushed');
  }

  const shapeProgress = Math.min(1, correctCount / Math.max(1, totalSteps));
  const ringSize = 34 + (1 - beat) * 22;
  const ringColor = beat >= GOOD_AT ? 'var(--bamboo)' : '#c8a24b';
  const flashColor = flash === 'good' ? 'var(--bamboo)' : flash === 'broken' || flash === 'slow' ? 'var(--seal)' : '#c8b06a';

  return (
    <div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>理条 · 抓 · 压 · 推</div>
      <p className="hint">龙井的形状，是手上做出来的。手法带横着走——当前手法上的环收拢时按下对应的手，跟着节奏连续做完。压轻了条索散，压重了会碎。第 {Math.min(round + 1, rounds)} / {rounds} 轮</p>

      <div style={{ textAlign: 'center' }}>
        <RoastPotSvg width={220} />
      </div>

      {/* 茶叶的形：从散乱 → 渐直 → 扁平挺直（保留原有变化动画） */}
      <div style={{ background: '#f3f6ee', borderRadius: 12, padding: '6px 10px', marginTop: 4 }}>
        <svg viewBox="0 0 200 66" width="100%" height="66" role="img" aria-label="茶叶的形">
          {Array.from({ length: 6 }).map((_, i) => {
            const p = shapeProgress;
            const ang = (1 - p) * (((i * 47) % 44) - 22);
            const w = 9 - 3.5 * p;
            const h = 20 + 16 * p;
            const x = 24 + i * 30 + (1 - p) * (((i * 29) % 12) - 6);
            const y = 26 + (1 - p) * (((i * 17) % 10) - 5);
            return (
              <g key={i} transform={`translate(${x}, ${y}) rotate(${ang})`}>
                <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={w / 2} fill={p > 0.6 ? '#a5ad58' : '#b9c274'} stroke="#8a9150" strokeWidth="0.6" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* 横向手法带：抓 → 压 → 排成一排，当前手法带节拍环 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, margin: '14px 0 4px' }}>
        {seq.map((g, i) => {
          const active = i === stepIdx;
          return (
            <div key={`${round}-${i}`} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <span style={{ width: 26, height: 2, background: '#d8cba8' }} />}
              <span
                style={{
                  position: 'relative', width: 52, height: 52, borderRadius: 26,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: active ? '#eef3e6' : '#efe9db',
                  border: `1.5px solid ${active ? 'var(--bamboo)' : '#d8cba8'}`,
                  transition: 'background .2s, border-color .2s',
                }}
              >
                {active && !finished && (
                  <span
                    style={{
                      position: 'absolute', width: ringSize, height: ringSize, borderRadius: ringSize / 2,
                      border: `2.5px solid ${ringColor}`, opacity: 0.85,
                    }}
                  />
                )}
                <span className="h-serif" style={{ fontSize: 20, color: active ? 'var(--ink)' : 'var(--ink-3)' }}>{labelOf(g)}</span>
              </span>
            </div>
          );
        })}
      </div>
      <p className="hint" style={{ textAlign: 'center', margin: 0, opacity: 0.8 }}>
        {flash ? note : `当前：${labelOf(cur)} —— 环收拢时按`}
      </p>

      {/* 横向操作排：三个手法等宽并排，连续按下去像在锅里连续做茶 */}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        {GESTURES.map((g) => (
          <button
            key={g.id}
            className="btn"
            onClick={() => tapGesture(g.id)}
            disabled={finished}
            style={{
              flex: 1, minWidth: 0, padding: '8px 4px',
              transform: g.id === cur && beat >= GOOD_AT && !flash ? 'scale(1.04)' : 'scale(1)',
              borderColor: g.id === cur ? 'var(--bamboo)' : undefined,
              transition: 'transform .18s, border-color .18s',
            }}
          >
            <span className="h-serif" style={{ fontSize: 18 }}>{g.label}</span>
            <span className="hint" style={{ display: 'block', fontSize: 11 }}>{g.tip}</span>
          </button>
        ))}
      </div>

      <p className="note" style={{ marginTop: 10, color: flash ? flashColor : undefined, transition: 'color .2s' }}>{note}</p>
      <p className="hint">「形美」是龙井被记住的一半——同样的叶子，手上功夫不一样，出来的茶形就不一样。</p>
    </div>
  );
}
