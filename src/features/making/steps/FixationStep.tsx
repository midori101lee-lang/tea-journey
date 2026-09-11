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

type Verdict = 'good' | 'low' | 'over';

function hash01(seed: string, a: number, b: number): number {
  let h = 2166136261 >>> 0;
  const feed = (v: number) => { h ^= v & 0xffff; h = Math.imul(h, 16777619) >>> 0; };
  for (let i = 0; i < seed.length; i++) feed(seed.charCodeAt(i));
  feed(a); feed(b);
  return (h >>> 0) / 4294967296;
}

/**
 * 杀青（绿茶线 · 西湖龙井）：锅一烫就把鲜爽定住，慢了青气压不住，急了就焦边。
 * 每一轮锅温都从凉往上走，玩家看准「合适」那一段下铲翻炒——手感是「快」，不是武夷山焙火那种「等指针摆回来」。
 * **一轮一定论**：命中或失手，本轮都结束、进下一轮，锅温回到起点重新升——
 * 指针永远会重新出现，一次 miss 不会让操作失去指针或卡死（P0 修复）。
 * 每轮的合适锅温会轻微漂移（同一天可复现），玩家仍可靠看锅温判断，不是纯随机。
 */
export default function FixationStep({ params, difficulty, teaId = 'longjing', day = 1, onDone }: Props) {
  const rounds = params.rounds ?? 3;
  const rise = params.heatRisePerSec ?? 0.42;
  const casual = difficulty === 'casual';
  const band = params.safeBand;
  const width = (band?.widthBase ?? 0.2) * (casual ? 1.3 : 1);
  const base = band?.centerBase ?? 0.5;
  const drift = band?.driftPerRound ?? 0.05;
  const jitter = band?.randomDrift ?? 0.05;
  const START_HEAT = 0.05;

  const [round, setRound] = useState(0);
  const [heat, setHeat] = useState(START_HEAT);
  const [verdicts, setVerdicts] = useState<Verdict[]>([]);
  const [flash, setFlash] = useState<Verdict | null>(null); // 本轮结算反馈（短暂高亮）
  const [note, setNote] = useState('锅里还没热透，看准了再下铲。');
  const [finished, setFinished] = useState(false);
  const st = useRef({ heat: START_HEAT, verdicts: [] as Verdict[], finished: false, lock: false });

  /** 这一轮的合适锅温中心：基准 + 逐轮回移 + 轻微漂移（确定性）。 */
  const centerFor = (i: number) => {
    const d = Math.round((hash01(teaId, day, i) - 0.5) * 2 * jitter * 100) / 100;
    return Math.min(0.86, Math.max(0.14, base + i * drift + d));
  };
  const center = centerFor(round);
  const lo = center - width;
  const hi = center + width;

  // 锅温持续上升（rAF）。本轮结束后由 stir 的回拨重置到起点。
  useEffect(() => {
    if (finished) return;
    let raf = 0;
    let prev = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - prev) / 1000); prev = t;
      const s = st.current;
      if (!s.finished && !s.lock) {
        s.heat = Math.min(1, s.heat + rise * dt);
        setHeat(s.heat);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [rise, finished]);

  function stir() {
    const s = st.current;
    if (finished || s.finished || s.lock) return; // 本轮已定论：忽略连点，不会误触下一轮
    s.lock = true;
    const h = s.heat;
    const verdict: Verdict = h > hi ? 'over' : h < lo ? 'low' : 'good';
    s.verdicts.push(verdict);
    setVerdicts([...s.verdicts]);
    setFlash(verdict);
    setNote(
      verdict === 'good' ? '正好——叶子一翻，青气散开，鲜香起来了。'
        : verdict === 'over' ? '下早了……不对，是锅太热，边上开始泛焦。'
          : '锅温还不够，青气没杀透。下一轮看准些。',
    );

    // 停一拍给反馈，然后进下一轮（或收工）。锅温回到起点 → 指针重新出现。
    window.setTimeout(() => {
      if (s.finished) return;
      setFlash(null);
      const nextRound = round + 1;
      if (nextRound >= rounds) {
        finish();
      } else {
        s.heat = START_HEAT;
        s.lock = false;
        setHeat(START_HEAT);
        setRound(nextRound);
        setNote('新的一轮，锅又热起来了——看准再下铲。');
      }
    }, 750);
  }

  function finish() {
    const s = st.current;
    if (s.finished) return;
    s.finished = true;
    setFinished(true);
    const zs = s.verdicts;
    const weightOf = (v: Verdict) => (v === 'good' ? 1 : v === 'low' ? 0.5 : 0.2);
    const quality = zs.length ? zs.reduce((acc, v) => acc + weightOf(v), 0) / zs.length : 0;
    const goodCount = zs.filter((v) => v === 'good').length;
    const overCount = zs.filter((v) => v === 'over').length;
    const score = Math.max(0, Math.min(100, quality * 100 + (casual ? 5 : 0)));
    const faults: FaultTag[] = [];
    if (overCount >= 2) faults.push('fixation_over');
    else if (goodCount === 0) faults.push('fixation_under');
    onDone({
      step: 'fixation',
      score: Math.round(score),
      faults,
      // 龙井干茶：嫩黄绿色（与九曲红梅红褐、岩茶深褐区分）
      visualState: { dryColor: '#a9b263', shape: 'flat', edgeRed: 0, sheen: 0.35 },
      comment: faults.includes('fixation_over') ? '杀青过了，边上有焦，喝着会带火气。'
        : faults.includes('fixation_under') ? '杀青没杀透，青气压着，鲜爽出不来。'
        : score >= 75 ? '杀青抓得准，青气散了，鲜味定住了。' : '杀青的度差了点。',
    });
  }

  const inBand = heat >= lo && heat <= hi;
  const pct = (v: number) => `${Math.max(0, Math.min(100, v * 100))}%`;
  // 锅气：从「青」到「鲜」再到「焦」，用自然语言给状态，不给数字
  const leafNote = heat > hi ? '叶面发亮，边上要焦了'
    : inBand ? '叶子软下来，颜色转成嫩黄绿'
      : '叶子还硬挺，青气重';
  const flashColor = flash === 'good' ? 'var(--bamboo)' : flash === 'over' ? 'var(--seal)' : '#c8b06a';

  return (
    <div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>杀青 · 快手 · 抓锅温</div>
      <p className="hint">锅温从凉一直往上走。看准锅温进到「合适」那一段的时候下铲翻炒——手要快，早了青气没杀透，晚了就焦边。第 {Math.min(round + 1, rounds)} / {rounds} 轮</p>

      <div style={{ textAlign: 'center' }}>
        <RoastPotSvg width={220} />
        <div className="hint" style={{ marginTop: 2 }}>{leafNote}</div>
      </div>

      <div style={{ position: 'relative', height: 46, borderRadius: 10, background: '#efe7d6', border: '1px solid var(--ochre)', overflow: 'hidden', marginTop: 8 }}>
        <i style={{ position: 'absolute', left: pct(lo), width: pct(width * 2), top: 0, bottom: 0, background: 'rgba(200,162,75,0.28)' }} />
        <i style={{ position: 'absolute', left: pct(lo + width * 0.32), width: pct(width * 1.36), top: 0, bottom: 0, background: 'rgba(110,140,106,0.7)', boxShadow: inBand && !flash ? '0 0 10px rgba(110,140,106,0.9)' : 'none', transition: 'box-shadow .25s' }} />
        <i style={{ position: 'absolute', left: pct(heat), width: 4, top: -4, bottom: -4, background: flash ? flashColor : inBand ? 'var(--bamboo)' : 'var(--seal)', transition: 'left .05s linear' }} />
      </div>
      <div className="hint" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span>锅还没热</span><span>合适</span><span>过火</span>
      </div>

      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10 }}>
        {Array.from({ length: rounds }).map((_, i) => {
          const v = verdicts[i];
          const color = !v ? '#e2dbcc' : v === 'good' ? 'var(--bamboo)' : v === 'low' ? '#c8b06a' : 'var(--seal)';
          return <span key={i} style={{ width: 22, height: 22, borderRadius: 11, background: color, border: '1px solid rgba(0,0,0,0.08)' }} />;
        })}
      </div>

      <p className="note" style={{ marginTop: 10, color: flash ? flashColor : undefined, transition: 'color .2s' }}>{note}</p>
      <p className="hint">一锅上好的龙井，靠的就是这一手「快」，把鲜爽留住。</p>
      <button
        className="btn btn-seal"
        style={{ marginTop: 8, transform: inBand && !flash ? 'scale(1.05)' : 'scale(1)', transition: 'transform .2s' }}
        onPointerDown={stir}
        disabled={finished}
      >
        下铲翻炒
      </button>
    </div>
  );
}
