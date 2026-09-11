import { useEffect, useRef, useState } from 'react';
import type { StepOutcome, StepParams, FaultTag, Difficulty } from '../../../core/types';
import { SieveSvg } from '../../../components/art/Art';

interface Props {
  params: StepParams;
  difficulty: Difficulty;
  /**
   * 天气对做青的轻微影响（来自天气系统，确定性、无 random）：
   *   force —— 理想摇青力度区间偏移（雾/雨略往外推，让玩家觉得“叶子更不好伺候”）
   *   decay —— 青气消退速率倍率（晴快 / 雨慢），不显示数值
   *   label —— 一句天气随感（如「今天下着小雨」）
   */
  weather: { force: number; decay: number; label: string };
  onDone: (o: StepOutcome) => void;
}

// ─────────── 游戏调优参数（内部，不暴露给玩家，非真实制茶标准） ───────────
const EDGE_RATE = 0.16;    // 红边增长（合适档，每秒）
const GREEN_RATE = 9;      // 青气下降（合适档，每秒）
const SOFT_RATE = 4;       // 叶态上升（合适档，每秒）
const DAMAGE_RATE = 0.35;  // 急摇损伤累积（每秒）
const SETTLE_MS = 4000;    // 静置时长（V0.3：约 4 秒，可加速）
const EDGE_FULL = 0.8;     // 红边「完全形成」参考值（内部评分用，不是玩家目标）

type Phase = 'observe' | 'shake' | 'settle' | 'decide';
type Tier = 'light' | 'fit' | 'hasty';

/**
 * 做青：观察 → 摇青（力度+时长）→ 静置走水 → 判断是否再摇
 * V0.3 定稿回归：玩家只看叶子的三个变化（红边 / 青气 / 叶态）与一句自然语言，
 * 不出现任何数字、百分比、速度值或「最佳区间」。
 */
export default function ZuoqingStep({ params, difficulty, weather, onDone }: Props) {
  const casual = difficulty === 'casual';
  const targetRounds = params.rounds ?? 3;
  const base0 = params.idealShakeForce ?? [0.45, 0.72];
  // 采茶「这一篓」的成色：叶子杂的时候，摇青可施展的余地略小（隐藏档，不显示数值）
  const shrink = params.basketQuality === 'rough' ? 0.06 : params.basketQuality === 'normal' ? 0.025 : 0;
  const base: [number, number] = [base0[0] + shrink / 2, base0[1] - shrink / 2];

  const band = useRef<[number, number]>([
    Math.max(0.2, base[0] + weather.force),
    Math.min(0.95, base[1] + weather.force),
  ]);

  const [phase, setPhase] = useState<Phase>('observe');
  const [round, setRound] = useState(0);
  const [soft, setSoft] = useState(35);   // 叶态：挺立 → 柔软
  const [green, setGreen] = useState(82); // 青气：浓 → 淡
  const [edge, setEdge] = useState(0);    // 叶缘红：无 → 朱砂红
  const [damage, setDamage] = useState(0);
  const [idle, setIdle] = useState(0);
  const [note, setNote] = useState('叶子还挺着，青气还重。');
  const [spin, setSpin] = useState(0);    // 水筛转动角度（力度只通过转速体现）

  const st = useRef({ soft: 35, green: 82, edge: 0, damage: 0, rounds: 0, idle: 0 });
  const last = useRef<{ x: number; y: number; t: number } | null>(null);
  const smoothF = useRef(0); // 平滑后的力度：判定与视觉共用，保证「所见即所判」
  const spinRaf = useRef(0);

  // 水筛惯性：松手后转速缓慢衰减（玩家看到「还在转，但慢下来了」）
  useEffect(() => {
    if (phase !== 'shake') return;
    let prev = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - prev) / 1000);
      prev = t;
      setSpin((s) => s + smoothF.current * 360 * dt);
      spinRaf.current = requestAnimationFrame(loop);
    };
    spinRaf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(spinRaf.current);
  }, [phase]);

  useEffect(() => {
    if (phase === 'settle' || phase === 'decide') {
      let prev = performance.now();
      const dec = () => {
        const now = performance.now();
        const dt = Math.min(0.05, (now - prev) / 1000);
        prev = now;
        setSpin((s) => (Math.abs(s) < 0.5 ? 0 : s * (1 - 1.2 * dt)));
        spinRaf.current = requestAnimationFrame(dec);
      };
      spinRaf.current = requestAnimationFrame(dec);
      return () => cancelAnimationFrame(spinRaf.current);
    }
  }, [phase]);

  function tierOf(f: number): Tier {
    const [lo, hi] = band.current;
    if (f < lo) return 'light';
    if (f > hi) return 'hasty';
    return 'fit';
  }

  function down(e: React.PointerEvent) {
    if (phase !== 'observe' && phase !== 'decide') return;
    st.current.idle = 0;
    setIdle(0);
    setPhase('shake');
    last.current = { x: e.clientX, y: e.clientY, t: performance.now() };
  }

  function move(e: React.PointerEvent) {
    if (phase !== 'shake') return;
    const l = last.current;
    if (!l) return;
    const now = performance.now();
    const dt = Math.max(16, now - l.t);
    const d = Math.hypot(e.clientX - l.x, e.clientY - l.y);
    const speed = d / (dt / 1000);
    const raw = Math.max(0, Math.min(1, speed / 900));
    // 用平滑值同时驱动「视觉」与「判定」，避免玩家看到的和判定的不是一回事
    smoothF.current += (raw - smoothF.current) * 0.25;
    last.current = { x: e.clientX, y: e.clientY, t: now };

    const s = st.current;
    const step = dt / 1000;
    const tier = tierOf(smoothF.current);

    if (tier === 'fit') {
      s.edge = Math.min(1, s.edge + EDGE_RATE * step);
      s.green = Math.max(0, s.green - GREEN_RATE * step * weather.decay);
      s.soft = Math.min(100, s.soft + SOFT_RATE * step);
      setNote('这一轮摇得正好。');
    } else if (tier === 'hasty') {
      // 摇得急：红边出得快，但叶子会受伤 —— 有诱惑，也有代价
      s.edge = Math.min(1, s.edge + EDGE_RATE * 1.6 * step);
      s.damage += DAMAGE_RATE * step;
      setNote('这一轮摇得有些急。');
    } else {
      s.edge = Math.min(1, s.edge + EDGE_RATE * 0.25 * step);
      setNote('这一轮手轻了些。');
    }
    setGreen(s.green); setEdge(s.edge); setSoft(s.soft); setDamage(s.damage);
  }

  function up() {
    if (phase !== 'shake') return;
    last.current = null;
    smoothF.current = 0;
    setPhase('settle');
  }

  // 观察反馈：V0.3 定稿文案（叶缘 / 青气 / 叶态三句，无数字）
  function observeNote(s: { edge: number; green: number; soft: number; damage: number }): string {
    if (s.damage > 0.5) return '摇得太急，叶子受伤了。';
    const e = s.edge > 0.6 ? '红边出来了。' : s.edge > 0.2 ? '叶缘开始有变化了。' : '叶缘还没动静。';
    const g = s.green > 55 ? '青气还重。' : s.green > 25 ? '青气退了一些。' : '青气退了。';
    return `${e}${g}`;
  }

  const settleTimer = useRef<number | null>(null);
  const settleStart = useRef(0);

  function endSettle(ratio: number) {
    const s = st.current;
    s.green = Math.max(0, s.green - 6 * ratio);
    s.soft = Math.min(100, s.soft + 8 * ratio);
    setGreen(s.green); setSoft(s.soft);
    setPhase('decide');
    setNote(observeNote(s));
  }

  // 静置走水（V0.3：叶片状态自行演变，约 4 秒，可加速）
  useEffect(() => {
    if (phase !== 'settle') return;
    const s = st.current;
    s.rounds += 1;
    setRound(s.rounds);
    setNote('走水中……');
    settleStart.current = Date.now();
    settleTimer.current = window.setTimeout(() => endSettle(1), SETTLE_MS);
    return () => { if (settleTimer.current) clearTimeout(settleTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function hurrySettle() {
    if (settleTimer.current) { clearTimeout(settleTimer.current); settleTimer.current = null; }
    const ratio = Math.min(1, (Date.now() - settleStart.current) / SETTLE_MS);
    endSettle(ratio);
  }

  // 静置过久（捂着不动）会闷
  useEffect(() => {
    if (phase !== 'decide') return;
    const id = setInterval(() => {
      st.current.idle += 0.1;
      setIdle(st.current.idle);
      if (st.current.idle > 10) setNote('捂得有点久，闷住了。');
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  function shakeAgain() {
    st.current.idle = 0;
    setIdle(0);
    setPhase('shake');
    last.current = null;
  }

  function finish() {
    const s = st.current;
    // 评分偏向「最终状态」：红边是否形成 / 青气是否退去 / 是否受伤
    const edgeScore = Math.min(1, s.edge / EDGE_FULL) * 100;
    const greenScore = Math.max(0, Math.min(1, (82 - s.green) / 60)) * 100;
    const intactScore = Math.max(0, 1 - s.damage / 0.5) * 100;
    let score = edgeScore * 0.45 + greenScore * 0.3 + intactScore * 0.25;
    if (s.rounds < targetRounds) score -= 10;
    if (s.idle > 10) score -= 15;
    score = Math.max(0, Math.min(100, score));

    const faults: FaultTag[] = [];
    if (s.damage > 0.5) faults.push('zuoqing_hasty');
    else if (s.green > 55) faults.push('zuoqing_light');
    if (s.idle > 10) faults.push('zuoqing_stale');

    onDone({
      step: 'zuoqing',
      score: Math.round(score),
      faults,
      visualState: { dryColor: '#6f8a52', shape: 'flat', edgeRed: s.edge, sheen: 0.35 },
      comment: score >= 78 ? '红边出来了，青气也退了。' : score >= 55 ? '走水走了一半。' : '这一盘，没做开。',
    });
  }

  return (
    <div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>做青 · 看青做青</div>
      <p className="hint">
        {weather.label}。按住水筛画圈摇青，松手静置走水。摇够了就收，没有标准答案。
      </p>

      <div
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        style={{ touchAction: 'none', userSelect: 'none', cursor: phase === 'shake' ? 'grabbing' : 'grab', textAlign: 'center' }}
      >
        <SieveSvg width={280}>
          {/* 青气：一缕青色雾气，从浓到淡（V0.3 定稿视觉） */}
          <GreenMist level={green / 82} />
          {/* 茶青：随摇动一起转，转速反映手上的轻重 */}
          <g transform={`rotate(${spin} 120 82)`}>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <g key={i} transform={`translate(${40 + (i % 4) * 52},${62 + Math.floor(i / 4) * 34}) rotate(${i * 37 % 180})`}>
                <ZuoqingLeafSvg size={34} soft={soft} edge={edge} damage={damage} />
              </g>
            ))}
          </g>
        </SieveSvg>
      </div>

      <p className="note" style={{ marginTop: 8, textAlign: 'center' }}>{note}</p>

      {phase === 'decide' && (
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button className="btn" onClick={shakeAgain}>再摇一轮</button>
          <button className="btn btn-primary" onClick={finish}>就到这儿</button>
        </div>
      )}
      {phase === 'observe' && (
        <button className="btn btn-primary" style={{ marginTop: 10 }} onPointerDown={down}>按住摇青</button>
      )}
      {phase === 'shake' && <div className="hint" style={{ textAlign: 'center', marginTop: 10 }}>松手即静置</div>}
      {phase === 'settle' && (
        <div style={{ marginTop: 10 }}>
          <div className="hint" style={{ textAlign: 'center' }}>静置走水中……</div>
          <button className="btn" style={{ marginTop: 6, fontSize: 13 }} onClick={hurrySettle}>不等了，看看叶子</button>
        </div>
      )}
      <div className="hint" style={{ textAlign: 'center', marginTop: 6 }}>已摇 {round} 轮</div>
    </div>
  );
}

/** 做青单片茶叶：红边自叶尖沿叶缘渐进渗出；叶态由姿态表现；受伤出现褐斑【游戏化表现】 */
function ZuoqingLeafSvg({ size = 34, soft = 35, edge = 0, damage = 0 }: {
  size?: number; soft?: number; edge?: number; damage?: number;
}) {
  const LEAF = 'M12 2 C17 6 19 12 16 18 C14 21 10 21 8 18 C5 12 7 6 12 2 Z';
  // 叶态：挺立 → 微软 → 柔软下垂
  const droop = Math.max(0, Math.min(1, (soft - 30) / 55));
  const rot = -8 + droop * 34;
  const fill = droop > 0.6 ? '#6f8a52' : droop > 0.3 ? '#7f9d5c' : '#8fae6a';
  // 红边：沿叶缘路径从叶尖向下扩展（pathLength=100，dasharray 即百分比）
  const redLen = Math.max(0, Math.min(100, edge * 100));
  // 伤斑【游戏化表现】：受伤后出现褐色斑点
  const spots = damage > 0.25 ? Math.min(4, Math.floor(damage * 6)) : 0;

  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      style={{ transform: `rotate(${rot}deg) scaleY(${1 - droop * 0.18})`, transformOrigin: '12px 2px', transition: 'transform .5s' }}>
      <path d={LEAF} fill={fill} stroke="#5a6b4a" strokeWidth="0.8" />
      {redLen > 0 && (
        <path d={LEAF} fill="none" stroke="#b45a3c" strokeWidth="1.7" pathLength={100}
          strokeDasharray={`${redLen} 100`} strokeLinecap="round" opacity={0.92} />
      )}
      <path d="M12 4 L12 19" stroke="#5a6b4a" strokeWidth="0.7" fill="none" />
      {Array.from({ length: spots }).map((_, i) => (
        <ellipse key={i} cx={10 + i * 1.6} cy={8 + (i % 3) * 4} rx={1.2} ry={0.9}
          fill="#7a5230" opacity={0.75} transform={`rotate(${i * 40} ${10 + i * 1.6} ${8 + (i % 3) * 4})`} />
      ))}
    </svg>
  );
}

/** 青气：叶片上方的一缕青色雾气，越浓说明青气越重（V0.3 定稿视觉） */
function GreenMist({ level }: { level: number }) {
  const a = Math.max(0, Math.min(1, level));
  if (a < 0.04) return null;
  return (
    <g fill="#9fc4a8">
      <ellipse cx="70" cy="46" rx="26" ry="9" opacity={0.34 * a} />
      <ellipse cx="120" cy="34" rx="32" ry="10" opacity={0.30 * a} />
      <ellipse cx="172" cy="48" rx="24" ry="8" opacity={0.32 * a} />
      <ellipse cx="100" cy="22" rx="20" ry="7" opacity={0.22 * a} />
    </g>
  );
}
