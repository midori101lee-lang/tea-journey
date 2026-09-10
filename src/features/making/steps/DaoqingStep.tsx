import { useEffect, useRef, useState } from 'react';
import type { StepOutcome, StepParams, FaultTag, Difficulty } from '../../../core/types';
import { TeaLeafSvg, SunMoonIcon } from '../../../components/art/Art';

interface Props {
  params: StepParams;
  difficulty: Difficulty;
  onDone: (o: StepOutcome) => void;
}

type Mode = 'sun' | 'shade';

/**
 * 倒青 / 萎凋：复式萎凋「两晒两晾」
 * 晒 → 叶态变软；晾 → 青气下降。玩家在两者间判断切换，两轮后收青。
 */
export default function DaoqingStep({ params, difficulty, onDone }: Props) {
  const targetRounds = params.rounds ?? 2;
  const [soft, setSoft] = useState(18);
  const [green, setGreen] = useState(78);
  const [mode, setMode] = useState<Mode>('sun');
  const [round, setRound] = useState(1);
  const [done, setDone] = useState(false);
  const state = useRef({ soft: 18, green: 78, mode: 'sun' as Mode, round: 1, shadeTooLong: 0 });
  const [note, setNote] = useState('叶子还挺着。');

  const casual = difficulty === 'casual';

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      const s = state.current;
      if (s.mode === 'sun') {
        s.soft = Math.min(100, s.soft + (casual ? 7 : 5.5));
        s.green = Math.max(0, s.green - (casual ? 0.8 : 0.5));
        s.shadeTooLong = 0;
      } else {
        s.soft = Math.max(0, s.soft - (casual ? 1.6 : 2.4));
        s.green = Math.max(0, s.green - (casual ? 5 : 4));
        s.shadeTooLong += 0.1;
      }
      setSoft(s.soft);
      setGreen(s.green);
      if (s.shadeTooLong > 6) setNote('晾得有点久，走水慢了。');
      else if (s.soft > 70) setNote('叶子软下来了。');
      else if (s.soft > 45) setNote('叶尖开始发软。');
      else if (s.green < 40) setNote('青气退了一些。');
      else setNote('叶子还挺着。');
    }, 100);
    return () => clearInterval(id);
  }, [done, casual]);

  function toggle(next: Mode) {
    if (done) return;
    const s = state.current;
    if (next === s.mode) return;
    if (s.mode === 'sun' && next === 'shade') {
      setRound((r) => Math.min(targetRounds, r + 1));
      s.round = Math.min(targetRounds, s.round + 1);
    }
    s.mode = next;
    setMode(next);
  }

  function finish() {
    setDone(true);
    const s = state.current;
    const [lo, hi] = params.softnessTarget ?? [55, 78];
    const greenTarget = params.greenTarget ?? 38;
    const softMid = (lo + hi) / 2;
    const softErr = Math.abs(s.soft - softMid) / 40;
    const greenErr = Math.max(0, (s.green - greenTarget) / 60);
    const stale = s.shadeTooLong > 6 ? 1 : 0;
    let score = 100 - softErr * 55 - greenErr * 60 - stale * 25;
    if (s.round < targetRounds) score -= 12; // 晒晾轮数不够
    score = Math.max(0, Math.min(100, score));
    const faults: FaultTag[] = score < 45 ? ['daoqing_off'] : [];
    onDone({
      step: 'daoqing',
      score: Math.round(score),
      faults,
      visualState: { dryColor: '#7f9a5e', shape: 'flat', edgeRed: 0, sheen: 0.3 },
      comment: score >= 75 ? '倒得透，叶子醒了。' : score >= 50 ? '倒得还行，就是不够匀。' : '倒青没倒透。',
    });
  }

  const [lo, hi] = params.softnessTarget ?? [55, 78];
  const inWindow = soft >= lo && soft <= hi && green <= (params.greenTarget ?? 38);

  return (
    <div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>倒青 · 两晒两晾</div>
      <p className="hint">晒一晒，再晾一晾。叶子要软，青气要退。第 {round} / {targetRounds} 轮</p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <button className="btn" style={{ background: mode === 'sun' ? 'var(--liquor)' : undefined }} onClick={() => toggle('sun')}>
          <SunMoonIcon sun /> 晒
        </button>
        <button className="btn" style={{ background: mode === 'shade' ? '#dfe6ea' : undefined }} onClick={() => toggle('shade')}>
          <SunMoonIcon sun={false} /> 晾
        </button>
      </div>

      <div style={{ background: mode === 'sun' ? '#fdf3dd' : '#eef1f3', borderRadius: 12, padding: 16, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <TeaLeafSvg key={i} size={38} color={soft > 60 ? '#7f9a5e' : '#8fae6a'} withered={soft > 50} />
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <div className="hint">叶态 {Math.round(soft)}</div>
        <div className="meter"><i style={{ left: 0, width: `${soft}%`, background: 'var(--bamboo)' }} /></div>
        <div className="hint" style={{ marginTop: 8 }}>青气 {Math.round(green)}</div>
        <div className="meter"><i style={{ left: 0, width: `${green}%`, background: 'var(--bud)' }} /></div>
      </div>

      <p className="note" style={{ marginTop: 10 }}>{note}</p>

      <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={finish} disabled={done}>
        {inWindow ? '正好，收青' : '收青'}
      </button>
    </div>
  );
}
