import { useEffect, useRef, useState } from 'react';
import type { StepOutcome, StepParams, FaultTag, Difficulty } from '../../../core/types';
import { RoastPotSvg } from '../../../components/art/Art';
import { getTea } from '../../../core/data/teas';

interface Props {
  params: StepParams;
  difficulty: Difficulty;
  teaId: string;
  proficiency: number;
  zuoqingScore?: number;
  onDone: (o: StepOutcome) => void;
}

type Zone = 'center' | 'edge' | 'warn' | 'bad';

/**
 * 焙火：动态火候指针（V0.3 第 9 节）
 * 绿区随 茶种 / 前序表现 / 轮次 / 熟练度 / 随机 漂移，不是固定温度。
 * 「低温久烘」= 多次稳定累积，而不是一次爆发。
 *
 * 手感优化（V0.2 首玩修正）：指针持续运动 → 玩家主动点击 → 在当前位置锁定 → 判定。
 * 不采用「鼠标碰到绿区自动判定」。降速、加宽有效区、减小随机漂移、加接近提示、加容错。
 */
export default function RoastingStep({ params, difficulty, teaId, proficiency, zuoqingScore = 60, onDone }: Props) {
  const casual = difficulty === 'casual';
  const taps = params.rounds ?? 5;
  const speed = params.swingSpeed ?? 0.9; // 降速：周期约 7s，更从容
  const hasteThreshold = params.hasteThreshold ?? 2.2;

  const [pos, setPos] = useState(0.5);
  const [tapIndex, setTapIndex] = useState(0);
  const [results, setResults] = useState<{ zone: Zone; dist: number; side: number }[]>([]);
  const [note, setNote] = useState('火候还没定。');
  const [finished, setFinished] = useState(false);

  const st = useRef({ phase: 0, taps: [] as { zone: Zone; dist: number; side: number }[], haste: 0 });
  const bandRef = useRef({ center: 0.5, width: 0.26 });

  const b0 = params.band ?? { centerBase: 0.5, widthBase: 0.26, driftPerRound: 0.02, randomDrift: 0.03 };
  const bias = getTea(teaId).gameProfile.roastBias ?? { center: 0, width: 0 };
  const profTol = (params.toleranceByProficiency ?? 0.05) * (proficiency / 100);
  // 采茶「这一篓」的成色：轻量影响判断窗口（隐藏档，前台只看得到反馈，不显示数值）
  const basketTol = params.basketQuality === 'rough' ? -0.04 : params.basketQuality === 'normal' ? -0.015 : 0;
  // 前序做青表现影响：做青偏轻（含水高）宜缓 → 中心左移
  const carry = (0.5 - zuoqingScore / 200) * 0.12;

  function bandFor(i: number) {
    const drift = (b0.driftPerRound ?? 0) * i * (Math.random() > 0.5 ? 1 : -1);
    const rand = (Math.random() - 0.5) * (b0.randomDrift ?? 0.03);
    const center = Math.max(0.25, Math.min(0.78, b0.centerBase + bias.center + carry + drift + rand));
    const width = Math.max(0.14, b0.widthBase + bias.width + profTol + basketTol - (b0.driftPerRound ?? 0) * i * 0.5);
    return { center, width };
  }

  // 指针摆动（持续运动，玩家点击锁定）
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

  useEffect(() => { bandRef.current = bandFor(tapIndex); }, [tapIndex]);

  function tap() {
    if (finished) return;
    const { center, width } = bandRef.current;
    const dist = Math.abs(pos - center);
    const side = pos > center ? 1 : -1;
    // 放宽容错：中心带更宽，整体有效区更宽容
    let zone: Zone = 'bad';
    if (dist <= width * 0.34) zone = 'center';
    else if (dist <= width * 0.68) zone = 'edge';
    else if (dist <= width * 1.15) zone = 'warn';

    st.current.taps.push({ zone, dist, side });
    // 火气累积更温和：仅明显偏离才明显加火气，单轮偏差不直接强失
    if (zone === 'bad') st.current.haste += 0.5;
    else if (zone === 'warn') st.current.haste += 0.18;
    else st.current.haste += side > 0 ? 0.12 : 0.06;

    setResults([...st.current.taps]);
    // 反馈文案：自然语言，无温度数值
    setNote(
      zone === 'center' ? '火候走得稳。'
        : zone === 'edge' ? '火候还算稳。'
          : '火有些急了。',
    );

    const next = tapIndex + 1;
    setTapIndex(next);
    if (next >= taps) setTimeout(finish, 700);
  }

  function finish() {
    setFinished(true);
    const tapsData = st.current.taps;
    const quality = tapsData.reduce((s, t) => s + ({ center: 1, edge: 0.7, warn: 0.35, bad: 0 }[t.zone] ?? 0), 0) / tapsData.length;
    const dists = tapsData.map((t) => t.dist);
    const variance = dists.reduce((s, d) => s + Math.pow(d - dists.reduce((a, b) => a + b, 0) / dists.length, 2), 0) / dists.length;
    const stability = Math.max(0, 1 - variance * 10); // 忽左忽右扣分（放宽）
    const haste = st.current.haste;

    let score = quality * 70 + stability * 30 - (haste > hasteThreshold ? 18 : 0);
    if (casual) score += 5;
    score = Math.max(0, Math.min(100, score));

    const faults: FaultTag[] = [];
    if (haste > hasteThreshold) faults.push('roast_over');
    else if (haste > hasteThreshold * 0.7) faults.push('roast_hasty');

    const roastLevel = haste > 1.2 ? '足火' : score >= 65 ? (haste > 0.6 ? '足火' : '中火') : '轻火';

    onDone({
      step: 'roasting',
      score: Math.round(score),
      faults,
      haste,
      visualState: { dryColor: roastLevel === '足火' ? '#3a2e22' : '#4a3a2a', shape: 'curled', edgeRed: 0, sheen: score / 100 },
      comment: score >= 78 ? '这一炉，火走得不错。' : score >= 55 ? '火还行，就是不够稳。' : haste > hasteThreshold ? '这锅茶……焙得过头了。' : '火散了。',
    });
  }

  const { center, width } = bandRef.current;
  const pct = (v: number) => `${Math.max(0, Math.min(100, v * 100))}%`;

  // 接近提示：指针越靠近绿区中心，提示越明显
  const distNow = Math.abs(pos - center);
  const near = Math.max(0, 1 - distNow / (width * 1.5));
  const pointerGlow = `0 0 0 ${2 + near * 6}px rgba(110,140,106,${0.15 + near * 0.5})`;

  return (
    <div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>焙火 · 低温久烘</div>
      <p className="hint">指针来回走，看准了点一下锁定火候。不是一次定生死，要一次一次稳住。第 {Math.min(tapIndex + 1, taps)} / {taps} 次</p>

      <div style={{ textAlign: 'center' }}>
        <RoastPotSvg width={220} />
      </div>

      <div
        onPointerDown={tap}
        style={{ position: 'relative', height: 46, borderRadius: 10, background: '#efe7d6', border: '1px solid var(--ochre)', overflow: 'hidden', touchAction: 'none', cursor: 'pointer' }}
      >
        {/* 绿区（有效区，开始即稳定显示，可预判） */}
        <i style={{ position: 'absolute', left: pct(center - width), width: pct(width * 2), top: 0, bottom: 0, background: 'rgba(200,162,75,0.30)' }} />
        <i style={{ position: 'absolute', left: pct(center - width / 2), width: pct(width), top: 0, bottom: 0, background: 'rgba(110,140,106,0.50)' }} />
        <i style={{ position: 'absolute', left: pct(center - width * 0.34), width: pct(width * 0.68), top: 0, bottom: 0, background: 'rgba(110,140,106,0.78)', opacity: 0.5 + near * 0.5, transition: 'opacity .12s' }} />
        {/* 指针 */}
        <i style={{ position: 'absolute', left: pct(pos), width: 4, top: -4, bottom: -4, background: 'var(--seal)', boxShadow: pointerGlow, transition: 'box-shadow .12s' }} />
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
