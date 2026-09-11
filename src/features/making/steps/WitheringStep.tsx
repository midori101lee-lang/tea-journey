import { useEffect, useRef, useState } from 'react';
import type { StepOutcome, StepParams, FaultTag, Difficulty } from '../../../core/types';
import { TeaLeafSvg } from '../../../components/art/Art';
import { targetWindowScore } from '../../../core/making/scoring';

interface Props {
  params: StepParams;
  difficulty: Difficulty;
  /** 天气对走水的轻微倍率（晴略快 / 雨略慢），默认 1，不显示数值。 */
  weatherRate?: number;
  onDone: (o: StepOutcome) => void;
}

/**
 * 萎凋（红茶线第一步）：叶子摊开走水，含水由高往低。
 * 玩家要做的是「看准时机收青」——太早叶子还硬挺（萎凋没到），太晚失水过头。
 * 与岩茶「倒青」是两条不同的路：这里不晒不晾地反复，而是单看走水程度。
 * 含水区间为游戏参数，不代表现实数字。
 */
export default function WitheringStep({ params, difficulty, weatherRate = 1, onDone }: Props) {
  const [lo, hi] = params.moistureTarget ?? [40, 62];
  const rate = (params.moistureRate ?? 1.05) * weatherRate;
  const casual = difficulty === 'casual';

  const [moisture, setMoisture] = useState(100);
  const [note, setNote] = useState('叶子摊开了，水汽在走。');
  const [done, setDone] = useState(false);
  const st = useRef({ moisture: 100, finished: false });

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      const s = st.current;
      if (s.finished) return;
      s.moisture = Math.max(0, s.moisture - rate * (casual ? 0.85 : 1));
      setMoisture(s.moisture);
      // 叶态随走水变化：鲜绿挺立 → 变软 → 失去光泽 → 发脆/过度
      if (s.moisture > 80) setNote('叶子鲜绿挺立，水汽还重。');
      else if (s.moisture > hi) setNote('叶片开始变软，还差一点。');
      else if (s.moisture >= lo) setNote('叶软、失去部分光泽——正好，可以收青了。');
      else if (s.moisture > lo - 8) setNote('有点干了，叶面发脆。');
      else setNote('萎软过度了，快收不住。');
      if (s.moisture <= 0) finish();
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, rate, lo, hi, casual]);

  /** 翻一翻：把叶子翻松，走水缓一缓（给玩家一个「救一下」的手感）。 */
  function flip() {
    if (done || st.current.finished) return;
    st.current.moisture = Math.min(100, st.current.moisture + 6);
    setMoisture(st.current.moisture);
    setNote('翻松了一遍，走水慢下来。');
  }

  function finish() {
    if (st.current.finished) return;
    st.current.finished = true;
    setDone(true);
    const m = st.current.moisture;
    const score = targetWindowScore(m, [lo, hi]);
    const faults: FaultTag[] = [];
    if (m > hi + 6) faults.push('wither_short');      // 萎凋没到，还太湿
    else if (m < lo - 6) faults.push('wither_over');  // 萎凋过头，失水太多
    onDone({
      step: 'withering',
      score: Math.round(score),
      faults,
      visualState: { dryColor: '#7f9a5e', shape: 'flat', edgeRed: 0, sheen: 0.28 },
      comment: faults.includes('wither_short') ? '萎凋不足，叶子还硬挺。'
        : faults.includes('wither_over') ? '萎凋过度，叶子失水太多。'
        : score >= 75 ? '萎凋到位，叶子软硬正好。' : '收青的时机差了点。',
    });
  }

  const inWindow = moisture <= hi && moisture >= lo;
  const soft = moisture < 62;

  return (
    <div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>萎凋 · 摊青走水</div>
      <p className="hint">叶子摊开，水汽慢慢走。看准叶软梗弯的时候收青——早了太挺，晚了太干。</p>

      <div style={{ background: '#f3f6ee', borderRadius: 12, padding: 16, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <TeaLeafSvg key={i} size={38} color={soft ? '#7f9a5e' : '#8fae6a'} withered={soft} />
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <div className="hint">含水 {Math.round(moisture)}</div>
        <div className="meter"><i style={{ left: 0, width: `${moisture}%`, background: 'var(--bud)' }} /></div>
        <div className="hint" style={{ marginTop: 4, opacity: 0.75 }}>收青区间大约在 {lo}–{hi}（游戏参数）</div>
      </div>

      <p className="note" style={{ marginTop: 10 }}>{note}</p>

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button className="btn" onClick={flip} disabled={done}>翻一翻</button>
        <button className="btn btn-primary" onClick={finish} disabled={done}>
          {inWindow ? '正好，收青' : '收青'}
        </button>
      </div>
    </div>
  );
}
