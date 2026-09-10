import { useEffect, useRef, useState } from 'react';
import type { StepOutcome, StepParams, FaultTag, Difficulty } from '../../../core/types';
import { WokSvg } from '../../../components/art/Art';

interface Props {
  params: StepParams;
  difficulty: Difficulty;
  onDone: (o: StepOutcome) => void;
}

type Phase = 'fire' | 'roll';

// ─────────── 游戏调优参数（内部，不暴露给玩家，非真实制茶标准） ───────────
const SHAPE_TARGET = 85; // 「紧结」参考值（内部评分用，不是玩家要记的目标）
const SHAPE_RATE = 6;    // 成形速度（合适档，每秒）——一个轮次好手法约到「条索明显」，两轮到「紧结」

/**
 * 炒揉：双炒双揉（非遗工艺）
 * 一个 step 内两轮：炒青 → 趁热揉捻 → 复炒 → 复揉
 * 炒青复用「惯性指针 + 安全温区」手感（v0.1 已验证机制，仅调参）。
 * 揉捻 V0.3 定稿：玩家只看叶子的「四段形态」与一句自然语言，不出现任何数字、
 * 力度区间或进度条；揉到紧结就该停手，继续揉会断碎、碎屑飞出。
 */
export default function ChaoRouStep({ params, difficulty, onDone }: Props) {
  const casual = difficulty === 'casual';
  const rounds = params.rounds ?? 2;
  const rise = params.heatRisePerSec ?? 0.34;
  const cool = params.coolPerSec ?? 0.2;
  const greenDrop = params.greenDropPerSec ?? 0.16;
  const heatWindow = params.heatWindowMs ?? 3000;
  const rollBase = params.idealRollForce ?? [0.4, 0.7];
  const breakRate = params.breakRatePerSec ?? 0.05;

  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<Phase>('fire');
  const [heat, setHeat] = useState(0.1);
  const [green, setGreen] = useState(100);
  const [shape, setShape] = useState(0);
  const [burnt, setBurnt] = useState(0);
  const [held, setHeld] = useState(false);
  const [note, setNote] = useState('锅还没热。');
  const [endedAt, setEndedAt] = useState<number | null>(null);

  const st = useRef({
    heat: 0.1, green: 100, shape: 0, burnt: 0, held: false,
    round: 1, goodFire: 0, badFire: 0, goodRoll: 0, breakage: 0,
    heatBonus: false, total: { goodFire: 0, badFire: 0, goodRoll: 0, breakage: 0, heatBonus: 0 },
  });

  const band = () => {
    const b = params.safeBand ?? { centerBase: 0.55, widthBase: 0.22, driftPerRound: 0.06 };
    const drift = (b.driftPerRound ?? 0) * (st.current.round - 1);
    const center = Math.max(0.25, Math.min(0.8, b.centerBase + drift));
    const width = Math.max(0.12, (b.widthBase - drift * 0.5) * (casual ? 1.3 : 1));
    return { center, width, lo: center - width / 2, hi: center + width / 2 };
  };

  // 温度与青气（炒青：沿用 v0.1 惯性控火，已验证机制）
  useEffect(() => {
    if (phase !== 'fire') return;
    let raf = 0;
    let prev = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - prev) / 1000);
      prev = t;
      const s = st.current;
      s.heat += (s.held ? rise : -cool) * dt;
      s.heat = Math.max(0, Math.min(1, s.heat));
      const b = band();
      if (s.heat >= b.lo && s.heat <= b.hi) {
        s.green = Math.max(0, s.green - greenDrop * 100 * dt);
        s.goodFire += dt;
        setNote('火候正好。');
      } else if (s.heat > b.hi) {
        s.badFire += dt;
        s.burnt += dt * 0.5;
        setNote(s.heat > b.hi + 0.12 ? '锅太热了！' : '火过了。');
      } else {
        s.badFire += dt * 0.5;
        setNote('火小了。');
      }
      setHeat(s.heat); setGreen(s.green); setBurnt(s.burnt);
      if (s.green <= 0) finishFire();
      else raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round]);

  function finishFire() {
    setEndedAt(Date.now());
    setPhase('roll');
    setNote('趁热。');
  }

  // ─────────── 揉捻：画圈成条，紧接炒青之后 ───────────
  const last = useRef<{ x: number; y: number; t: number } | null>(null);
  const smoothF = useRef(0); // 平滑后的力度：判定与视觉共用，保证「所见即所判」
  function rollDown(e: React.PointerEvent) {
    if (phase !== 'roll') return;
    last.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    if (endedAt && Date.now() - endedAt <= heatWindow) {
      st.current.heatBonus = true;
      st.current.total.heatBonus += 1;
      setNote('趁热，好。');
    }
  }
  function rollMove(e: React.PointerEvent) {
    if (phase !== 'roll' || !last.current) return;
    const now = performance.now();
    const dt = Math.max(16, now - last.current.t);
    const d = Math.hypot(e.clientX - last.current.x, e.clientY - last.current.y);
    const f = Math.max(0, Math.min(1, d / (dt / 1000) / 900));
    smoothF.current += (f - smoothF.current) * 0.4;
    last.current = { x: e.clientX, y: e.clientY, t: now };
    const s = st.current;
    const [lo, hi] = rollBase;
    const step = dt / 1000;
    const force = smoothF.current;

    if (force >= lo && force <= hi) {
      // 力度合适：在「紧结」之前条索渐成；到了「紧结」再揉只会断碎
      if (s.shape < SHAPE_TARGET) {
        s.shape = Math.min(100, s.shape + SHAPE_RATE * step);
        s.goodRoll += step;
        setNote(s.shape > SHAPE_TARGET * 0.8 ? '条索紧结了。' : s.shape > SHAPE_TARGET * 0.5 ? '条索显出来了。' : '开始成形了。');
      } else {
        s.breakage += breakRate * step * 2;
        setNote('紧结了，再揉就碎。');
      }
    } else if (force > hi) {
      // 手太重：茶汁都没了，叶子开始断
      s.breakage += breakRate * step * 8;
      setNote('轻点，那是茶叶不是面团。');
    } else {
      setNote('手太轻了，使点劲。');
    }
    setShape(s.shape);
  }

  function nextRound() {
    const s = st.current;
    s.total.goodFire += s.goodFire; s.total.badFire += s.badFire;
    s.total.goodRoll += s.goodRoll; s.total.breakage += s.breakage;
    if (s.round >= rounds) return done();
    s.round += 1;
    setRound(s.round);
    s.goodFire = 0; s.badFire = 0; s.goodRoll = 0; s.breakage = 0; s.green = 60; s.heat = 0.25;
    setGreen(60); setHeat(0.25);
    setShape(s.shape); // 条索跨轮带走，不保底、不归零
    setPhase('fire');
    setNote('复炒，火要更准。');
  }

  function done() {
    const t = st.current.total;
    const fireRatio = t.goodFire / Math.max(1, t.goodFire + t.badFire);
    const shapeScore = Math.min(1, st.current.shape / SHAPE_TARGET);   // 条索成形度
    const breakScore = Math.max(0, 1 - t.breakage / 0.5);              // 碎叶率
    let score = fireRatio * 0.45 + shapeScore * 0.35 + breakScore * 0.20;
    if (st.current.heatBonus) score += 0.10;
    if (st.current.burnt > 0.8) score -= 0.25;
    score = Math.max(0, Math.min(100, score));
    const faults: FaultTag[] = [];
    if (st.current.burnt > 0.8) faults.push('chaoqing_over');
    else if (fireRatio < 0.4) faults.push('chaoqing_under');
    if (t.breakage > 0.45) faults.push('rolling_broken');
    const broken = t.breakage > 0.45;
    onDone({
      step: 'chao-rou',
      score: Math.round(score),
      faults,
      visualState: { dryColor: '#5c4a34', shape: broken ? 'broken' : st.current.shape > SHAPE_TARGET * 0.7 ? 'curled' : 'flat', edgeRed: 0, sheen: 0.5 },
      comment: score >= 78 ? '条索紧结，趁热揉得对。' : score >= 55 ? '成形了，还欠一点火。' : '这一锅，火和手都没到位。',
    });
  }

  const b = band();
  const stage = shape < 25 ? '散叶' : shape < 55 ? '开始成形' : shape < SHAPE_TARGET ? '条索明显' : '紧结';

  return (
    <div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>炒揉 · 双炒双揉（第 {round} / {rounds} 轮）</div>
      <p className="hint">炒青时按住升温、松手降温，让指针停在温区；起锅后趁热揉捻。</p>

      {phase === 'fire' ? (
        <>
          <div
            onPointerDown={() => { st.current.held = true; setHeld(true); }}
            onPointerUp={() => { st.current.held = false; setHeld(false); }}
            onPointerLeave={() => { st.current.held = false; setHeld(false); }}
            style={{ touchAction: 'none', textAlign: 'center', cursor: 'pointer' }}
          >
            <WokSvg width={250} heat={heat} leafColor={green > 50 ? '#7a8a5a' : '#5f6b3f'} />
          </div>
          <div style={{ marginTop: 6 }}>
            <div className="hint">锅温（温区 {Math.round(b.lo * 100)}–{Math.round(b.hi * 100)}）</div>
            <div className="meter" style={{ height: 18 }}>
              <i style={{ left: `${b.lo * 100}%`, width: `${b.width * 100}%`, background: 'rgba(110,140,106,0.5)' }} />
              <i style={{ left: `${heat * 100}%`, width: 3, background: 'var(--seal)' }} />
            </div>
            <div className="hint" style={{ marginTop: 8 }}>青气 {Math.round(green)}</div>
            <div className="meter"><i style={{ left: 0, width: `${green}%`, background: 'var(--bud)' }} /></div>
          </div>
          <button className="btn" style={{ marginTop: 10 }} onClick={finishFire} disabled={green > 25}>
            {green > 25 ? '青气未退，还不能起锅' : '起锅'}
          </button>
          {burnt > 0.8 && <div className="hint" style={{ color: 'var(--seal)' }}>锅里有焦味了。</div>}
        </>
      ) : (
        <>
          <div
            onPointerDown={rollDown}
            onPointerMove={rollMove}
            onPointerUp={() => { last.current = null; smoothF.current = 0; }}
            onPointerLeave={() => { last.current = null; smoothF.current = 0; }}
            style={{ touchAction: 'none', textAlign: 'center', background: '#efe7d6', borderRadius: 12, padding: 20, cursor: 'grab' }}
          >
            <RollLeavesSvg width={220} shape={shape} breakage={st.current.breakage} />
          </div>
          <div style={{ marginTop: 8 }}>
            <div className="hint">条索：{stage}</div>
            {stage === '紧结' && <div className="hint" style={{ color: 'var(--ochre)' }}>紧结了，松手正好。</div>}
          </div>
          <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={nextRound}>
            {round >= rounds ? '揉好了' : '进入复炒复揉'}
          </button>
        </>
      )}

      <p className="note" style={{ marginTop: 8 }}>{note}</p>
      {held && phase === 'fire' && <div className="hint" style={{ textAlign: 'center' }}>添柴中……</div>}
    </div>
  );
}

// ─────────── 茶叶视觉（V0.4）：手绘风卷曲叶，随条索成形从「散叶」到「紧结」 ───────────
type LeafSpec = { x: number; y: number; base: number; scale: number; L: number; W: number; cOff: number };

const LEAF_PALETTE = [
  { fill: '#94ab5e', stroke: '#6f8545', vein: '#5f7038' }, // 舒展 · 嫩绿
  { fill: '#7a9050', stroke: '#5d7138', vein: '#4d5e2c' }, // 卷曲 · 深绿
  { fill: '#657c3e', stroke: '#4c5f2e', vein: '#3e4d22' }, // 条索初成 · 墨绿
  { fill: '#52422c', stroke: '#3c3022', vein: '#2e261a' }, // 紧结 · 深褐绿
];

// 7 片叶：大小 / 方向 / 卷曲速度各不相同，避免整齐划一（确定性，渲染间不抖动）
const LEAVES: LeafSpec[] = [
  { x: -40, y: 8, base: -8, scale: 1.06, L: 42, W: 9.2, cOff: -0.05 },
  { x: -13, y: -13, base: 15, scale: 0.92, L: 40, W: 8.6, cOff: 0.04 },
  { x: 15, y: 11, base: -22, scale: 1.10, L: 44, W: 9.6, cOff: -0.02 },
  { x: -23, y: 17, base: 34, scale: 0.84, L: 37, W: 8.0, cOff: 0.08 },
  { x: 7, y: -2, base: -40, scale: 0.98, L: 41, W: 9.0, cOff: 0.0 },
  { x: 31, y: -7, base: 18, scale: 0.90, L: 39, W: 8.4, cOff: 0.06 },
  { x: 3, y: 25, base: -12, scale: 0.78, L: 35, W: 7.4, cOff: -0.10 },
];

function hx(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lerpHex(a: string, b: string, t: number): string {
  const pa = hx(a), pb = hx(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

// 卷曲叶填充轮廓：沿中脉逐段向法线偏移 ±半宽，curl 越大越卷成条索（保留叶片厚度与不规则）
function leafOutline(curl: number, L: number, Wmax: number): string {
  const N = 24;
  const thetaMax = Math.PI * (0.12 + 1.6 * curl);
  const pts: { x: number; y: number; nx: number; ny: number; w: number }[] = [];
  let x = 0, y = 0;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const a = thetaMax * Math.pow(u, 1.18);
    const dx = Math.cos(a), dy = -Math.sin(a);
    if (i > 0) { x += dx * (L / N); y += dy * (L / N); }
    const nx = -dy, ny = dx;
    const w = (Wmax * (0.18 + 0.82 * Math.pow(Math.sin(Math.PI * u), 0.7))) / 2;
    pts.push({ x, y, nx, ny, w });
  }
  let d = '';
  pts.forEach((p, i) => { d += `${i === 0 ? 'M' : 'L'} ${(p.x + p.nx * p.w).toFixed(2)} ${(p.y + p.ny * p.w).toFixed(2)} `; });
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    d += `L ${(p.x - p.nx * p.w).toFixed(2)} ${(p.y - p.ny * p.w).toFixed(2)} `;
  }
  return d + 'Z';
}
// 叶脉（中脉），沿中脉取样；u0..u1 限定显示区段（用于轻微茶汁高光）
function midrib(curl: number, L: number, u0 = 0, u1 = 1): string {
  const N = 24;
  const thetaMax = Math.PI * (0.12 + 1.6 * curl);
  let x = 0, y = 0, d = '', started = false;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const a = thetaMax * Math.pow(u, 1.18);
    const dx = Math.cos(a), dy = -Math.sin(a);
    if (i > 0) { x += dx * (L / N); y += dy * (L / N); }
    if (u < u0 || u > u1) continue;
    d += `${started ? 'L' : 'M'} ${x.toFixed(2)} ${y.toFixed(2)} `;
    started = true;
  }
  return d.trim();
}

/** 揉捻中的茶叶：随条索成形从「散叶」到「紧结」，过重则少量碎叶（V0.4 手绘风视觉，无数字） */
function RollLeavesSvg({ width = 220, shape = 0, breakage = 0 }: { width?: number; shape?: number; breakage?: number }) {
  const curl = Math.max(0, Math.min(1, shape / 100));
  const stageIdx = curl < 0.25 ? 0 : curl < 0.55 ? 1 : curl < 0.82 ? 2 : 3;
  const pal = LEAF_PALETTE[stageIdx];
  const brown = Math.min(1, Math.max(0, (breakage - 0.25) / 0.6)); // 揉断 → 偏褐
  const fill = brown > 0 ? lerpHex(pal.fill, '#6b4a2a', brown * 0.5) : pal.fill;
  const crumbN = breakage > 0.25 ? Math.min(6, Math.floor((breakage - 0.25) * 12)) : 0;

  return (
    <svg width={width} height={width * 0.6} viewBox="-130 -66 260 132">
      <ellipse cx={0} cy={42} rx={98} ry={11} fill="rgba(40,30,18,0.06)" />
      <g className="tea-leaves-sway">
        {LEAVES.map((lf, i) => {
          const lc = Math.max(0, Math.min(1, curl + lf.cOff));
          const d = leafOutline(lc, lf.L, lf.W);
          const vein = midrib(lc, lf.L);
          const sheen = stageIdx >= 2 && i % 3 === 0 ? midrib(lc, lf.L, 0.12, 0.42) : '';
          return (
            <g key={i} transform={`translate(${lf.x} ${lf.y}) rotate(${lf.base}) scale(${lf.scale})`}>
              <path d={d} fill={fill} stroke={pal.stroke} strokeWidth={0.9} strokeLinejoin="round" />
              <path d={vein} fill="none" stroke={pal.vein} strokeWidth={0.8} opacity={0.5} strokeLinecap="round" />
              {sheen && <path d={sheen} fill="none" stroke="#ffffff" strokeWidth={1.1} opacity={0.16} strokeLinecap="round" />}
            </g>
          );
        })}
        {Array.from({ length: crumbN }).map((_, i) => {
          const ang = (i / Math.max(1, crumbN)) * Math.PI * 2 + 0.4;
          const dist = 30 + (i % 3) * 14;
          return (
            <ellipse key={`b${i}`} cx={Math.cos(ang) * dist} cy={Math.sin(ang) * dist * 0.6 + 6}
              rx={3} ry={1.9} fill="#6b4a2a" opacity={0.7} />
          );
        })}
      </g>
    </svg>
  );
}
