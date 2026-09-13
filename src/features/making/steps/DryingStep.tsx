import { useEffect, useRef, useState } from 'react';
import type { StepOutcome, StepParams, FaultTag, Difficulty } from '../../../core/types';
import { RoastPotSvg } from '../../../components/art/Art';

interface Props {
  params: StepParams;
  difficulty: Difficulty;
  /** 用于每轮绿区的轻微确定性漂移（同一天可复现）。 */
  teaId?: string;
  day?: number;
  onDone: (o: StepOutcome) => void;
}

type Zone = 'center' | 'edge' | 'warn' | 'bad';

function hash01(seed: string, a: number, b: number): number {
  let h = 2166136261 >>> 0;
  const feed = (v: number) => { h ^= v & 0xffff; h = Math.imul(h, 16777619) >>> 0; };
  for (let i = 0; i < seed.length; i++) feed(seed.charCodeAt(i));
  feed(a); feed(b);
  return (h >>> 0) / 4294967296;
}

/**
 * 烘干（红茶线收尾）：把发酵好的叶子烘干定香。
 * 火候指针来回走，看准了点一下锁定；每轮最佳火候区会轻微移动（不是机械点同一个位置）。
 * 火太高 → 香气散失；火太低 → 干燥不足；稳住 → 香气保留较好。
 */
export default function DryingStep({ params, difficulty, teaId = 'jiuquhongmei', day = 1, onDone }: Props) {
  const taps = params.rounds ?? 3;
  const speed = 1.0;
  const hasteThreshold = 1.5;
  const casual = difficulty === 'casual';
  const width = 0.11;

  const [pos, setPos] = useState(0.5);
  const [tapIndex, setTapIndex] = useState(0);
  const [results, setResults] = useState<{ zone: Zone; center: number }[]>([]);
  const [note, setNote] = useState('火候还没定。');
  const [finished, setFinished] = useState(false);
  const st = useRef({ phase: 0, taps: [] as Zone[], haste: 0 });

  /** 每轮绿区中心：0.5 附近轻微漂移（±0.06），同一天可复现。 */
  const centerFor = (i: number) => 0.5 + (hash01(teaId, day, i) - 0.5) * 2 * 0.06;
  const center = centerFor(tapIndex);

  useEffect(() => {
    if (finished) return;
    let raf = 0;
    let prev = performance.now();
    const loop = (t: number) => {
      const dt = (t - prev) / 1000; prev = t;
      st.current.phase += speed * dt;
      setPos(0.5 + 0.5 * Math.sin(st.current.phase));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [speed, finished]);

  function tap() {
    if (finished) return;
    const c = centerFor(tapIndex);
    const dist = Math.abs(pos - c);
    const side = pos > c ? 1 : -1;
    let zone: Zone = 'bad';
    if (dist <= width * 0.36) zone = 'center';
    else if (dist <= width * 0.72) zone = 'edge';
    else if (dist <= width * 1.2) zone = 'warn';

    st.current.taps.push(zone);
    if (zone === 'bad') st.current.haste += 0.45;
    else if (zone === 'warn') st.current.haste += 0.16;
    else st.current.haste += side > 0 ? 0.12 : 0.05;

    setResults(st.current.taps.map((z, i) => ({ zone: z, center: centerFor(i) })));
    setNote(
      zone === 'center' ? '火候稳，香气保住了。'
        : zone === 'edge' ? '还行，再稳一点。'
          : side > 0 ? '火太高了，香气要散。'
            : '火太低，干燥不足。',
    );

    const next = tapIndex + 1;
    setTapIndex(next);
    if (next >= taps) setTimeout(finish, 700);
  }

  function finish() {
    setFinished(true);
    const zs = st.current.taps;
    const quality = zs.reduce((s, z) => s + ({ center: 1, edge: 0.7, warn: 0.35, bad: 0 }[z] ?? 0), 0) / Math.max(1, zs.length);
    const haste = st.current.haste;
    let score = quality * 74 + Math.max(0, 1 - haste) * 26 - (haste > hasteThreshold ? 18 : 0);
    if (casual) score += 5;
    score = Math.max(0, Math.min(100, score));
    const faults: FaultTag[] = [];
    if (haste > hasteThreshold) faults.push('drying_over');
    onDone({
      step: 'drying',
      score: Math.round(score),
      faults,
      visualState: { dryColor: '#4a2e22', shape: 'curled', edgeRed: 0, sheen: score / 100 },
      comment: faults.includes('drying_over') ? '烘得急了，火气压住了香。'
        : score >= 75 ? '烘干稳，香气留住了。' : score >= 50 ? '干了，火稍微急了点。' : '火没管住。',
    });
  }

  const pct = (v: number) => `${Math.max(0, Math.min(100, v * 100))}%`;

  return (
    <div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>烘干 · 足干定香</div>
      <p className="hint">指针来回走，看准了点一下锁定火候。红茶不要重火，稳住把叶子收干。第 {Math.min(tapIndex + 1, taps)} / {taps} 次</p>

      <div style={{ textAlign: 'center' }}>
        <RoastPotSvg width={220} />
      </div>

      <div
        onPointerDown={tap}
        style={{ position: 'relative', height: 46, borderRadius: 10, background: '#efe7d6', border: '1px solid var(--ochre)', overflow: 'hidden', touchAction: 'none', cursor: 'pointer' }}
      >
        <i style={{ position: 'absolute', left: pct(center - width), width: pct(width * 2), top: 0, bottom: 0, background: 'rgba(200,162,75,0.28)' }} />
        <i style={{ position: 'absolute', left: pct(center - width * 0.36), width: pct(width * 0.72), top: 0, bottom: 0, background: 'rgba(110,140,106,0.7)' }} />
        <i style={{ position: 'absolute', left: pct(pos), width: 4, top: -4, bottom: -4, background: 'var(--seal)' }} />
      </div>
      <div className="hint" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span>弱火</span><span>合适</span><span>急火</span>
      </div>

      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10 }}>
        {Array.from({ length: taps }).map((_, i) => {
          const r = results[i];
          const color = !r ? '#e2dbcc' : r.zone === 'center' ? 'var(--bamboo)' : r.zone === 'edge' ? '#9ab37f' : r.zone === 'warn' ? 'var(--liquor)' : 'var(--seal)';
          return <span key={i} style={{ width: 22, height: 22, borderRadius: 11, background: color, border: '1px solid rgba(0,0,0,0.08)' }} />;
        })}
      </div>

      <p className="note" style={{ marginTop: 10 }}>{note}</p>
      <button className="btn btn-seal" style={{ marginTop: 8 }} onPointerDown={tap} disabled={finished}>落火</button>
    </div>
  );
}
