import { useEffect, useRef, useState } from 'react';
import type { StepOutcome, StepParams, Difficulty } from '../../../core/types';
import { RoastPotSvg } from '../../../components/art/Art';
import { getTea } from '../../../core/data/teas';
import { computeRoastBand } from '../../../core/making/roastBand';
import { evaluateRoasting, type RoastStyle } from '../../../core/making/roasting';

interface Props {
  params: StepParams;
  difficulty: Difficulty;
  teaId: string;
  proficiency: number;
  day: number;
  zuoqingScore?: number;
  onDone: (o: StepOutcome) => void;
}

type Zone = 'center' | 'edge' | 'warn' | 'bad';

/** 各火性倾向的一句焙火心法（按茶种 gameProfile.roastStyle 给，纯文案） */
const STYLE_HINT: Record<RoastStyle, string> = {
  aroma: '肉桂求香，中火把香留住——别贪高，火一急香就收走了。',
  mellow: '水仙吃得住火，中火足火都行，要紧的是焙透、焙稳。',
  balanced: '大红袍轻中足都是路子，要紧的是不偏不倚、一炉稳到底。',
};

/**
 * 焙火：动态火候指针（V0.3 第 9 节）
 * 绿区随 茶种 / 前序表现 / 轮次 / 熟练度 / 随机 漂移，不是固定温度。
 * 「低温久烘」= 多次稳定累积，而不是一次爆发。
 *
 * 手感优化（V0.2 首玩修正）：指针持续运动 → 玩家主动点击 → 在当前位置锁定 → 判定。
 * 不采用「鼠标碰到绿区自动判定」。降速、加宽有效区、减小随机漂移、加接近提示、加容错。
 */
export default function RoastingStep({ params, difficulty, teaId, proficiency, day, zuoqingScore = 60, onDone }: Props) {
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
    return computeRoastBand({
      teaId,
      day,
      proficiency,
      tapIndex: i,
      band: b0,
      biasCenter: bias.center,
      biasWidth: bias.width,
      profTol,
      basketTol,
      carry,
    });
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
    // 反馈文案：分方向的自然语言（偏左=火轻、偏右=火足），无数值。
    // 正中（dist 极小）时 side 是随机的，按「稳」处理，不误导方向。
    setNote(
      zone === 'bad' ? '这一下火散了。'
        : zone === 'warn' ? (side > 0 ? '火明显过了一点。' : '火明显轻了一点。')
          : dist < 0.015 ? '火候走得稳。'
            : side > 0 ? '火有点急了。'
              : '火还没跟上来。',
    );

    const next = tapIndex + 1;
    setTapIndex(next);
    if (next >= taps) setTimeout(finish, 700);
  }

  function finish() {
    setFinished(true);
    const style: RoastStyle = getTea(teaId).gameProfile.roastStyle ?? 'balanced';
    // 结算走纯函数（core/making/roasting.ts）：组件与模拟验证共用同一份评分逻辑
    const r = evaluateRoasting({
      taps: st.current.taps,
      teaId,
      style,
      casual,
      hasteThreshold,
    });

    onDone({
      step: 'roasting',
      score: r.score,
      faults: r.faults,
      haste: r.haste,
      lean: r.lean,
      visualState: { dryColor: r.level === '足火' || r.level === '高火' || r.level === '病火' ? '#3a2e22' : '#4a3a2a', shape: 'curled', edgeRed: 0, sheen: r.score / 100 },
      comment: r.comment,
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
      <p className="hint">{STYLE_HINT[getTea(teaId).gameProfile.roastStyle ?? 'balanced']}</p>
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
