import { useEffect, useRef, useState } from 'react';
import type { StepOutcome, StepParams, FaultTag, Difficulty } from '../../../core/types';
import { SieveSvg } from '../../../components/art/Art';

interface Props {
  params: StepParams;
  difficulty: Difficulty;
  onDone: (o: StepOutcome) => void;
}

/**
 * 揉捻（红茶线）：把萎凋好的叶子揉出汁、揉成条。
 * 手感 = 「按住施力、看准了松手」：力太轻揉不出条，力太重会把条索揉断（rolling_broken）。
 * 力度区间为游戏参数，不代表现实机揉 / 手揉的力度数字。
 */
export default function RollingStep({ params, difficulty, onDone }: Props) {
  const rounds = params.rounds ?? 3;
  const [lo, hi] = params.idealRollForce ?? [0.42, 0.72];
  const casual = difficulty === 'casual';

  const [force, setForce] = useState(0);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [note, setNote] = useState('按住，把力揉进去。');
  const [done, setDone] = useState(false);
  const st = useRef({ force: 0, holding: false, peaks: [] as number[], finished: false });

  useEffect(() => {
    if (done) return;
    let raf = 0;
    let prev = performance.now();
    const loop = (t: number) => {
      const dt = (t - prev) / 1000; prev = t;
      if (st.current.holding) st.current.force = Math.min(1, st.current.force + dt * 1.5);
      else st.current.force = Math.max(0, st.current.force - dt * 3);
      setForce(st.current.force);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [done]);

  function down() {
    if (done || st.current.finished) return;
    st.current.holding = true;
  }
  function up() {
    if (done || st.current.finished) return;
    if (!st.current.holding) return;
    st.current.holding = false;
    const peak = st.current.force;
    st.current.peaks.push(peak);
    st.current.force = 0;
    setPeaks([...st.current.peaks]);
    setNote(
      peak < lo ? '力太轻了——叶子还是散的，没成条。'
        : peak > hi * 1.25 ? '手上有劲，但别把茶揉碎了。'
          : peak > hi ? '力偏重了，当心把条揉断。'
            : '这一下力道正好，茶条开始卷起来了。',
    );
    if (st.current.peaks.length >= rounds) setTimeout(finish, 500);
  }

  function finish() {
    if (st.current.finished) return;
    st.current.finished = true;
    setDone(true);
    const ps = st.current.peaks;
    const inBand = ps.filter((p) => p >= lo && p <= hi).length / Math.max(1, ps.length);
    const near = ps.reduce((s, p) => {
      const d = p < lo ? lo - p : p > hi ? p - hi : 0;
      return s + Math.max(0, 1 - d / 0.25);
    }, 0) / Math.max(1, ps.length);
    const broken = ps.some((p) => p > hi * 1.25);
    let score = inBand * 65 + near * 35 - (broken ? 20 : 0);
    if (casual) score += 5;
    score = Math.max(0, Math.min(100, score));
    const faults: FaultTag[] = broken ? ['rolling_broken'] : [];
    onDone({
      step: 'rolling',
      score: Math.round(score),
      faults,
      visualState: { dryColor: '#6b3a26', shape: broken ? 'broken' : 'curled', edgeRed: 0.2, sheen: 0.35 },
      comment: broken ? '揉得太重，条索断了。' : score >= 75 ? '揉捻到位，条索紧结。' : score >= 50 ? '揉得还行，力度不够匀。' : '条还没揉出来。',
    });
  }

  const pct = (v: number) => `${Math.max(0, Math.min(100, v * 100))}%`;

  return (
    <div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>揉捻 · 塑形破壁</div>
      <p className="hint">按住把力揉进去，看准了松手。第 {Math.min(peaks.length + 1, rounds)} / {rounds} 次</p>

      <div style={{ textAlign: 'center', margin: '4px 0 10px' }}>
        <SieveSvg width={220} />
      </div>

      <div style={{ position: 'relative', height: 46, borderRadius: 10, background: '#efe7d6', border: '1px solid var(--ochre)', overflow: 'hidden' }}>
        {/* 理想力度区 */}
        <i style={{ position: 'absolute', left: pct(lo), width: pct(hi - lo), top: 0, bottom: 0, background: 'rgba(110,140,106,0.5)' }} />
        <i style={{ position: 'absolute', left: pct(lo), width: pct(hi - lo), top: 0, bottom: 0, background: 'rgba(110,140,106,0.28)' }} />
        {/* 已锁定的力度标记 */}
        {peaks.map((p, i) => (
          <i key={i} style={{ position: 'absolute', left: pct(p), width: 2, top: 0, bottom: 0, background: 'var(--ochre)', opacity: 0.7 }} />
        ))}
        {/* 当前力度指针 */}
        <i style={{ position: 'absolute', left: pct(force), width: 4, top: -4, bottom: -4, background: 'var(--seal)' }} />
      </div>
      <div className="hint" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span>轻</span><span>合适</span><span>重</span>
      </div>

      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10 }}>
        {Array.from({ length: rounds }).map((_, i) => {
          const p = peaks[i];
          const color = p == null ? '#e2dbcc' : p > hi * 1.25 ? 'var(--seal)' : p >= lo && p <= hi ? 'var(--bamboo)' : 'var(--liquor)';
          return <span key={i} style={{ width: 22, height: 22, borderRadius: 11, background: color, border: '1px solid rgba(0,0,0,0.08)' }} />;
        })}
      </div>

      <p className="note" style={{ marginTop: 10 }}>{note}</p>
      <button
        className="btn btn-seal"
        style={{ marginTop: 8, touchAction: 'none' }}
        onPointerDown={down}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={(e) => { if (st.current.holding) up(); void e; }}
        disabled={done}
      >按住揉捻</button>
    </div>
  );
}
