import { useEffect, useRef, useState } from 'react';
import type { StepOutcome, StepParams, FaultTag, Difficulty } from '../../../core/types';
import { TeaLeafSvg } from '../../../components/art/Art';
import { targetWindowScore } from '../../../core/making/scoring';

interface Props {
  params: StepParams;
  difficulty: Difficulty;
  /** 游戏内「第几天」：用于发酵最佳窗口的轻微确定性漂移（同一天可复现，不同天略有不同）。 */
  day?: number;
  onDone: (o: StepOutcome) => void;
}

function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16); const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255, ag = (pa >> 8) & 255, ab = pa & 255;
  const br = (pb >> 16) & 255, bg = (pb >> 8) & 255, bb = pb & 255;
  const c = (x: number, y: number) => Math.round(x + (y - x) * t);
  const r = c(ar, br), g = c(ag, bg), bl = c(ab, bb);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

/** 确定性散列（同输入同结果）：用于发酵窗口的轻微漂移，避免「纯随机坑玩家」。 */
function hash01(...nums: number[]): number {
  let h = 2166136261 >>> 0;
  for (const n of nums) {
    const v = Math.round(n) | 0;
    h ^= v & 0xff; h = Math.imul(h, 16777619) >>> 0;
    h ^= (v >>> 8) & 0xff; h = Math.imul(h, 16777619) >>> 0;
  }
  return (h >>> 0) / 4294967296;
}

/** 发酵颜色：青绿 → 黄绿 → 黄褐 → 红褐（随转色推进）。 */
function fermentColor(f: number): string {
  if (f < 25) return mix('#8fae6a', '#b0b85e', f / 25);
  if (f < 50) return mix('#b0b85e', '#b98a45', (f - 25) / 25);
  if (f < 75) return mix('#b98a45', '#b05a35', (f - 50) / 25);
  return mix('#b05a35', '#8f3a25', Math.min(1, (f - 75) / 25));
}

/** 色卡：五个阶段的参照色，纯知识参照——不自动高亮、不标出堆点，玩家自己对照。 */
const COLOR_CARD: { label: string; color: string }[] = [
  { label: '青绿', color: '#8fae6a' },
  { label: '黄绿', color: '#b0b85e' },
  { label: '金黄', color: '#b98a45' },
  { label: '红润', color: '#b05a35' },
  { label: '偏暗', color: '#8f3a25' },
];

/** 堆温的堆况描述（常显）。只描述「热」的感受，引导翻堆；不指向出堆时机。 */
function stackStatus(heat: number): string {
  if (heat < 25) return '茶堆安安静静地铺着。';
  if (heat < 50) return '茶堆渐渐有了点暖意。';
  if (heat < 70) return '堆里明显温热，热气慢慢往上冒。';
  if (heat < 88) return '热气渐重，贴着堆的叶子有些发闷。';
  return '堆里又闷又热，快捂坏了。';
}

/** 闻香六档（主动「凑近闻一闻」才给）。只描述香气的走向，不替玩家判断出堆时机。 */
function aromaTier(f: number): string {
  if (f < 25) return '一股青涩的草木气，还没转过来。';
  if (f < 45) return '青气渐退，闻到一点甜香了。';
  if (f < 60) return '花果香渐渐显出来，青气只剩尾巴。';
  if (f < 75) return '香气甜润、比较舒展。';
  if (f < 90) return '香气渐渐沉下去，甜里带出熟味。';
  return '香气发闷，带着点杂气。';
}

/** 叶态的细看描述（点「翻看茶叶」才给）：主动获得更细的视觉信息，不给指令。 */
function leafDetail(f: number): string {
  if (f < 20) return '叶子还青绿、挺着，水分没走。';
  if (f < 40) return '转成黄绿，叶边开始发软。';
  if (f < 62) return '黄褐色出来了，叶面发润、摸着柔。';
  if (f < 80) return '红褐均匀，叶缘转红，梗也软了。';
  if (f < 92) return '颜色转深，叶面发暗、有点发乌。';
  return '叶色暗沉发乌，堆里的热气贴着手背。';
}

/**
 * 发酵（红茶线的核心记忆点）：叶子由绿转红、青气散去、甜香生出。
 * 玩法是「观察 → 判断 → 出堆」：看叶色（对照静态色卡）、主动凑近闻香、感受堆温（常显堆况 + 热气视觉），
 * 自己判断什么时候翻堆散热、什么时候出堆——系统不替玩家做任何一个判断。
 * 隐藏堆温（heat）只做一件事：越堆越热、热了转色加速，让「翻堆」有真实的理由；不显示任何数字。
 * 最佳窗口存在当日 ±4 的确定性漂移；颜色与文案只是感觉，不代表现实工艺数值。
 */
// ─────────── 堆温机制常量（仅游戏参数，前台不显示数字） ───────────
// 堆温只做一件事：让「翻堆」有真实的理由（越堆越热 → 热了转色加速 → 翻堆散热）。
// 不做温度模拟、不加第二隐藏轴、不显示任何数值。
const HEAT_STUFFY = 70;  // 闷线：热气视觉/闻香染色/结算叙事从这条线开始
const TURN_COOL = 32;    // 一次翻堆的散热量

export default function FermentationStep({ params, difficulty, day = 1, onDone }: Props) {
  const base = params.fermentTarget ?? [67, 79];
  const shift = Math.round((hash01(3, day, base[0]) - 0.5) * 8); // -4..+4
  const lo = base[0] + shift;
  const hi = base[1] + shift;
  const rate = (params.fermentRate ?? 0.95) * (difficulty === 'casual' ? 0.85 : 1);

  const [f, setF] = useState(0);
  const [heat, setHeat] = useState(0);
  const [smell, setSmell] = useState('还没凑近闻过。');
  const [look, setLook] = useState('还没翻看过。');
  const [flipCount, setFlipCount] = useState(0);
  const [done, setDone] = useState(false);
  const st = useRef({ f: 0, heat: 0, finished: false });

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      const s = st.current;
      if (s.finished) return;
      // 堆温随发酵进程升高（中后期更快）；堆温过 40 后转色加速——热了不翻，窗口会走得更快
      s.heat = Math.min(100, s.heat + 1.0 + s.f * 0.008);
      s.f = Math.min(100, s.f + rate * (1 + Math.max(0, s.heat - 40) * 0.006));
      setF(s.f);
      setHeat(s.heat);
      if (s.f >= 100) finish();
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, rate]);

  /** 翻堆：散热 + 转色轻微回退。热的时候翻才有意义；不惩罚频繁翻堆（自然代价是 f 回退与时间）。 */
  function turn() {
    if (done || st.current.finished) return;
    const wasHot = st.current.heat >= 50;
    st.current.heat = Math.max(0, st.current.heat - TURN_COOL);
    st.current.f = Math.max(0, st.current.f - 3);
    setHeat(st.current.heat);
    setF(st.current.f);
    setFlipCount((n) => n + 1);
    setLook(wasHot
      ? '翻开茶堆，热气散了些，叶子颜色看着也匀了。'
      : '茶堆本来就不热，翻一遍叶子摊匀了些。');
  }

  function finish() {
    if (st.current.finished) return;
    st.current.finished = true;
    setDone(true);
    const v = st.current.f;
    const score = targetWindowScore(v, [lo, hi]);
    const faults: FaultTag[] = [];
    if (v < lo - 6) faults.push('ferment_short');     // 发酵没发起
    else if (v > hi + 6) faults.push('ferment_over'); // 发酵过了
    // 结算四态：说原因，不报数字。底层数值评分（targetWindowScore ± fault）不变。
    let comment: string;
    if (faults.includes('ferment_short')) comment = '茶叶的青气还没退干净，成茶少了几分红茶该有的甜润。';
    else if (faults.includes('ferment_over')) comment = '发酵过头了，香气发闷，茶汤容易失去鲜活感。';
    else if (score >= 75) comment = '叶色红润，花果香舒展——这一堆发酵得比较协调。';
    else comment = '香气已经开始发沉，茶叶的鲜活感被压住了一点。';
    if (st.current.heat > HEAT_STUFFY) comment += '堆里的热气还没散，香里微微带闷。';
    onDone({
      step: 'fermentation',
      score: Math.round(score),
      faults,
      visualState: { dryColor: '#6b3a26', shape: 'curled', edgeRed: v / 100, sheen: 0.4 },
      comment,
    });
  }

  // 视觉颜色用滞后映射（fV）：f 是逻辑进度（机制不动），颜色比 f 慢半拍——金黄→红润出现在接近窗口时
  const fV = Math.pow(f / 100, 1.35) * 100;
  const leafColor = fermentColor(fV);

  return (
    <div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>发酵 · 看色 · 闻香 · 出堆</div>
      <p className="hint">堆着让叶子由绿转红、生出甜香。别盯着时间——看叶色、闻香气，堆里热气起来了就翻一翻散散热；自己觉得时候到了，就出堆。早了没发透，晚了会闷。</p>

      {/* 叶堆 + 堆况 = 一个视觉单元：看叶色时余光就能读到堆温状态 */}
      <div style={{ position: 'relative', background: mix('#f3f6ee', '#f6ece4', Math.min(1, fV / 85)), borderRadius: 12, padding: '16px 16px 36px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background .3s' }}>
        {/* 堆温热气：越热越明显（纯视觉，无数字） */}
        <svg viewBox="0 0 220 90" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <HeatMist level={heat / 100} />
        </svg>
        {[0, 1, 2, 3, 4].map((i) => (
          <TeaLeafSvg key={i} size={38} color={leafColor} redEdge={fV / 100} />
        ))}
        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 24px)', textAlign: 'center', fontSize: 13, color: '#5a4632', background: 'rgba(255,252,244,0.85)', borderRadius: 8, padding: '4px 8px', border: '1px solid rgba(200,162,75,0.35)' }}>
          茶堆：{stackStatus(heat)}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
        <button
          className="btn"
          onClick={() => setSmell(aromaTier(f) + (heat >= HEAT_STUFFY ? '——热气重，香气有点被闷住了。' : ''))}
          disabled={done}
        >凑近闻一闻</button>
        <button className="btn" onClick={() => setLook(leafDetail(f))} disabled={done}>翻看茶叶</button>
        <button className="btn" onClick={turn} disabled={done}>翻堆{flipCount > 0 ? `（${flipCount}）` : ''}</button>
      </div>

      <div style={{ marginTop: 10 }}>
        <p className="hint" style={{ margin: 0 }}>闻一闻：{smell}</p>
        <p className="hint" style={{ margin: '2px 0 0' }}>翻一翻：{look}</p>
      </div>

      <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={finish} disabled={done}>出堆</button>

      {/* 色卡：静态知识参照（青绿→黄绿→金黄→红润→偏暗），放在操作区之后供对照，不参与判断 */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', marginTop: 12, opacity: 0.85 }}>
        <span className="hint" style={{ fontSize: 12 }}>色卡</span>
        {COLOR_CARD.map((c) => (
          <span key={c.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span
              style={{
                width: 26, height: 26, borderRadius: 6, background: c.color,
                border: '1px solid rgba(0,0,0,0.12)',
              }}
            />
            <span className="hint" style={{ fontSize: 11, opacity: 0.75 }}>{c.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** 堆温热气：叶堆上方的一缕暖白雾气，越热越明显（纯视觉反馈，无数字）。 */
function HeatMist({ level }: { level: number }) {
  const a = Math.max(0, Math.min(1, level));
  if (a < 0.04) return null;
  return (
    <g fill="#d9c9b4" opacity={0.6 * a}>
      <ellipse cx="70" cy="36" rx="22" ry="8" opacity={0.5} />
      <ellipse cx="120" cy="24" rx="28" ry="9" opacity={0.42} />
      <ellipse cx="162" cy="38" rx="20" ry="7" opacity={0.46} />
      <ellipse cx="98" cy="14" rx="18" ry="6" opacity={0.3} />
    </g>
  );
}
