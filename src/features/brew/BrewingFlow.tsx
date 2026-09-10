import { useEffect, useRef, useState } from 'react';
import type { ProcessingResult, Difficulty, BrewOutcome } from '../../core/types';
import { GaiwanSvg, KettleSvg, GongDaoSvg, TeaLeafSvg } from '../../components/art/Art';

interface Props {
  result: ProcessingResult;
  difficulty: Difficulty;
  onDone: (o: BrewOutcome) => void;
}

interface BrewMark {
  key: string;
  quality: 'good' | 'ok' | 'off';
  sub: number;
  note: string;
}

// 第一步逻辑（轻量拖拽小游戏，替代旧的纯点击翻页）。
// 每步：把器具拖到合适位置 → 看到水/叶/汤真实变化 → 玩家主动确认 → 进入下一步。
const STEPS = [
  { key: 'warm', label: '温杯', hint: '把茶壶拖到盖碗上方，水就注下去暖碗。' },
  { key: 'discard', label: '倒掉温杯水', hint: '拖着盖碗往一边倾，把温杯水倒掉。' },
  { key: 'add', label: '投茶', hint: '把茶青拖进盖碗里。' },
  { key: 'pour', label: '注水', hint: '拖茶壶到碗上方注水；水量够了就点「好了」。' },
  { key: 'smell', label: '揭盖 · 闻香', hint: '把盖子拖开，再点「闻香」。' },
  { key: 'steep', label: '出汤', hint: '拖盖碗倾出茶汤；看汤色，点【出汤】。' },
  { key: 'taste', label: '品饮', hint: '这是你自己做的第一泡茶。' },
] as const;

const WEIGHTS: Record<string, number> = { warm: 6, discard: 0, add: 8, pour: 12, smell: 0, steep: 40, taste: 0 };

// 舞台固定尺寸（与 base.css .brew-stage max-width 一致），便于坐标计算。
const GAICENTER = { x: 160, y: 202 }; // 盖碗中心（舞台坐标）
const KETTLE = { w: 72, h: 66 };
const NEAR = 70;

function teaLabel(id: string) {
  return id === 'rougui' ? '肉桂' : id === 'shuixian' ? '水仙' : id === 'wangba' ? '景区王霸茶' : '大红袍';
}

function ZhouComment(result: ProcessingResult, brewScore: number): string {
  // 景区王霸茶：轻描淡写的喜剧评价，点到即止，绝不点破「这茶差」。
  if (result.teaId === 'wangba') {
    if (brewScore < 50) return '周伯：「这茶香气没什么劲，入口还偏苦了点——不过买之前，你该多尝两口的。」';
    if (brewScore > 85) return '周伯：「泡得认真，可这茶底本身没那么神，香味没怎么起来。」';
    return '周伯：「能喝。就是这价……你买贵了吧？」';
  }
  // 捡漏：品质不错却便宜——周伯给正向反馈，让玩家自己发现「赚到了」（无金钱奖励）。
  if (result.bargain === 'deal') {
    if (result.grade === 'fine') return '周伯：「这茶你从哪儿淘的？上品的底子——这价可不多见。」';
    return '周伯：「咦，这茶入口还行……这价，像是让你捡着便宜了。🍃」';
  }
  // 买贵：普通茶却偏贵——周伯不扣钱、不报「错误」，只轻轻点一句。
  if (result.bargain === 'overpriced') {
    return '周伯：「茶不差，自己喝没问题……不过这价，下次可以再看看。」';
  }
  if (result.grade === 'fail') return '周伯：「……能喝。下次火别那么猛。」';
  if (brewScore < 50) return '周伯：「能喝，就是出汤早了，淡了点。」';
  if (brewScore > 85) return '周伯：「上品。岩骨花香都在里头了。」';
  if (brewScore > 72) return '周伯：「这口正好。香出来了，汤也跟得上。」';
  return '周伯：「不错，自己做的，喝着就是不一样。」';
}

/** 指针拖拽（舞台内，轻量模拟，无物理引擎）。pos 为舞台内左上角坐标。 */
function useDrag(stageRef: React.RefObject<HTMLDivElement>, initial: { x: number; y: number }) {
  const [pos, setPos] = useState(initial);
  const [dragging, setDragging] = useState(false);
  const grab = useRef({ x: 0, y: 0 });
  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const el = (e.currentTarget as HTMLElement).getBoundingClientRect();
    grab.current = { x: e.clientX - el.left, y: e.clientY - el.top };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const s = stageRef.current?.getBoundingClientRect();
    if (!s) return;
    const w = (e.currentTarget as HTMLElement).offsetWidth;
    const h = (e.currentTarget as HTMLElement).offsetHeight;
    let x = e.clientX - s.left - grab.current.x;
    let y = e.clientY - s.top - grab.current.y;
    x = Math.max(-24, Math.min(s.width - w + 24, x));
    y = Math.max(-24, Math.min(s.height - h + 24, y));
    setPos({ x, y });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    setDragging(false);
  };
  return { pos, setPos, dragging, bind: { onPointerDown, onPointerMove, onPointerUp } };
}

export default function BrewingFlow({ result, difficulty, onDone }: Props) {
  const [idx, setIdx] = useState(0);
  const [marks, setMarks] = useState<BrewMark[]>([]);
  const casual = difficulty === 'casual';
  const teaName = teaLabel(result.teaId);

  function addMark(m: BrewMark) {
    setMarks((prev) => [...prev, m]);
    setIdx((i) => i + 1);
  }
  function brewScore(): number {
    let num = 0, den = 0;
    for (const m of marks) { num += m.sub * WEIGHTS[m.key]; den += WEIGHTS[m.key]; }
    let s = den ? num / den : 70;
    if (casual) s = Math.min(100, s + 6);
    return Math.round(Math.max(0, Math.min(100, s)));
  }

  const header = (label: string, hint: string) => (
    <div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--ink-2)' }}>{teaName} · 盖碗泡法　{idx + 1}/{STEPS.length}</div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginTop: 4 }}>{label}</div>
      <p className="hint">{hint}</p>
    </div>
  );

  switch (idx) {
    case 0: return <><div>{header('温杯', STEPS[0].hint)}</div><WarmPhase casual={casual} onAdvance={addMark} /></>;
    case 1: return <><div>{header('倒掉温杯水', STEPS[1].hint)}</div><DiscardPhase onAdvance={addMark} /></>;
    case 2: return <><div>{header('投茶', STEPS[2].hint)}</div><AddPhase onAdvance={addMark} /></>;
    case 3: return <><div>{header('注水', STEPS[3].hint)}</div><PourPhase casual={casual} onAdvance={addMark} /></>;
    case 4: return <><div>{header('揭盖 · 闻香', STEPS[4].hint)}</div><SmellPhase teaName={teaName} onAdvance={addMark} /></>;
    case 5: return <><div>{header('出汤', STEPS[5].hint)}</div><SteepPhase casual={casual} onAdvance={addMark} /></>;
    case 6: return <TastePhase marks={marks} brewScore={brewScore()} result={result} teaName={teaName} onDone={onDone} />;
    default: return null;
  }
}

/** 温杯：拖茶壶到盖碗上方 → 水流 → 盖碗暖起来 */
function WarmPhase({ casual, onAdvance }: { casual: boolean; onAdvance: (m: BrewMark) => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const { pos, dragging, bind } = useDrag(stageRef, { x: 26, y: 12 });
  const kc = { x: pos.x + KETTLE.w / 2, y: pos.y + KETTLE.h / 2 };
  const near = Math.hypot(kc.x - GAICENTER.x, kc.y - GAICENTER.y) < NEAR;
  const [warm, setWarm] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!near || done) return;
    const step = casual ? 0.03 : 0.022;
    const id = setInterval(() => setWarm((v) => { const n = Math.min(1, v + step); if (n >= 1) setDone(true); return n; }), 70);
    return () => clearInterval(id);
  }, [near, done, casual]);

  return (
    <div className="brew-stage" ref={stageRef}>
      <div className="brew-gaiwantarget"><GaiwanSvg width={120} liquor={warm > 0.1 ? '#ddd0b6' : undefined} steam={warm > 0.4} /></div>
      {near && <div className="brew-splash" style={{ left: GAICENTER.x - 6, top: 150 }} />}
      <div className="brew-item" style={{ left: pos.x, top: pos.y }} {...bind}>
        <KettleSvg width={KETTLE.w} pour={near} />
      </div>
      <div className="brew-foot">
        <div className="brew-meter"><i style={{ width: `${warm * 100}%`, background: 'var(--bamboo)' }} /></div>
        <p className="brew-tip">{done ? '盖碗暖起来了。' : near ? '水注下去，碗壁慢慢烫起来……' : '把茶壶拖到盖碗上方。'}</p>
        <button className="btn btn-primary" disabled={!done} onClick={() => onAdvance({ key: 'warm', quality: 'good', sub: 100, note: '盖碗暖起来了。' })}>继续</button>
      </div>
    </div>
  );
}

/** 倒掉温杯水：拖盖碗倾斜 → 水倒出 */
function DiscardPhase({ onAdvance }: { onAdvance: (m: BrewMark) => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const { pos, bind } = useDrag(stageRef, { x: 100, y: 150 });
  const tilt = Math.max(-0.5, Math.min(0.5, (pos.x - 100) / 90));
  const pouring = Math.abs(tilt) > 0.26;
  const [done, setDone] = useState(false);
  const [pour, setPour] = useState(0);
  useEffect(() => {
    if (!pouring || done) return;
    const id = setInterval(() => setPour((v) => { const n = Math.min(1, v + 0.04); if (n >= 1) setDone(true); return n; }), 70);
    return () => clearInterval(id);
  }, [pouring, done]);

  return (
    <div className="brew-stage" ref={stageRef}>
      <div className="brew-item" style={{ left: pos.x, top: pos.y, transform: `rotate(${tilt * 34}deg)`, transformOrigin: '50% 90%' }} {...bind}>
        <GaiwanSvg width={120} liquor={pour < 1 ? '#ddd0b6' : undefined} />
      </div>
      {pouring && !done && <div className="brew-splash" style={{ left: pos.x + 40, top: pos.y + 70, opacity: 0.8 }} />}
      <div className="brew-foot">
        <p className="brew-tip">{done ? '温杯水倒了，碗空了。' : pouring ? '倾着，水哗地倒出去……' : '往一边拖动盖碗，把水倒掉。'}</p>
        <button className="btn btn-primary" disabled={!done} onClick={() => onAdvance({ key: 'discard', quality: 'good', sub: 100, note: '温杯水倒了。' })}>继续</button>
      </div>
    </div>
  );
}

/** 投茶：拖茶青入碗 */
function AddPhase({ onAdvance }: { onAdvance: (m: BrewMark) => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const { pos, dragging, bind } = useDrag(stageRef, { x: 120, y: 14 });
  const [inBowl, setInBowl] = useState(false);
  const center = { x: pos.x + 18, y: pos.y + 18 };
  const over = Math.hypot(center.x - GAICENTER.x, center.y - GAICENTER.y) < NEAR;
  function drop() {
    if (over) setInBowl(true);
  }

  return (
    <div className="brew-stage" ref={stageRef}>
      <div className="brew-gaiwantarget"><GaiwanSvg width={120} leaves={inBowl} /></div>
      {!inBowl && (
        <div className="brew-item" style={{ left: pos.x, top: pos.y }} {...bind} onPointerUp={(e) => { bind.onPointerUp(e); drop(); }}>
          <div style={{ display: 'flex', gap: 2 }}>
            <TeaLeafSvg size={34} /><TeaLeafSvg size={30} /><TeaLeafSvg size={32} />
          </div>
        </div>
      )}
      <div className="brew-foot">
        <p className="brew-tip">{inBowl ? '茶叶落进碗里了。' : over ? '松手，茶青就落进去了。' : dragging ? '移到盖碗上再松手。' : '把茶青拖进盖碗。'}</p>
        <button className="btn btn-primary" disabled={!inBowl} onClick={() => onAdvance({ key: 'add', quality: 'good', sub: 100, note: '茶叶落进碗里了。' })}>继续</button>
      </div>
    </div>
  );
}

/** 注水：拖茶壶控水量 → 好了 */
function PourPhase({ casual, onAdvance }: { casual: boolean; onAdvance: (m: BrewMark) => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const { pos, bind } = useDrag(stageRef, { x: 26, y: 12 });
  const kc = { x: pos.x + KETTLE.w / 2, y: pos.y + KETTLE.h / 2 };
  const near = Math.hypot(kc.x - GAICENTER.x, kc.y - GAICENTER.y) < NEAR;
  const [amount, setAmount] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockedNote, setLockedNote] = useState('');
  useEffect(() => {
    if (!near || locked) return;
    const id = setInterval(() => setAmount((v) => Math.min(1, v + (casual ? 0.016 : 0.02))), 70);
    return () => clearInterval(id);
  }, [near, locked, casual]);

  function lock() {
    setLocked(true);
    let quality: BrewMark['quality']; let sub: number; let note: string;
    if (amount < 0.42) { quality = 'ok'; sub = 72; note = '水稍少了些，汤会浓一点。'; }
    else if (amount > 0.86) { quality = 'ok'; sub = 74; note = '水多了点，汤会淡些。'; }
    else { quality = 'good'; sub = 100; note = '水量正好。'; }
    setLockedNote(note);
    onAdvance({ key: 'pour', quality, sub, note });
  }

  return (
    <div className="brew-stage" ref={stageRef}>
      <div className="brew-gaiwantarget"><GaiwanSvg width={120} leaves liquor={amount > 0.05 ? `rgb(${Math.round(206 - amount * 96)},${Math.round(172 - amount * 70)},${Math.round(92 - amount * 40)})` : undefined} /></div>
      {near && !locked && <div className="brew-splash" style={{ left: GAICENTER.x - 6, top: 150 }} />}
      <div className="brew-item" style={{ left: pos.x, top: pos.y }} {...bind}>
        <KettleSvg width={KETTLE.w} pour={near && !locked} />
      </div>
      <div className="brew-foot">
        <div className="brew-meter"><i style={{ width: `${amount * 100}%` }} /></div>
        <p className="brew-tip">{locked ? lockedNote : near ? '水注着，看计量——够了就点「好了」。' : '把茶壶拖到碗上方注水。'}</p>
        <button className="btn btn-primary" disabled={locked || amount < 0.05} onClick={lock}>{locked ? '继续' : '好了'}</button>
      </div>
    </div>
  );
}

/** 揭盖 · 闻香：拖盖 → 揭盖 → 闻香 */
function SmellPhase({ teaName, onAdvance }: { teaName: string; onAdvance: (m: BrewMark) => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const { pos, bind } = useDrag(stageRef, { x: 130, y: 120 });
  const [open, setOpen] = useState(false);
  const [smelled, setSmelled] = useState(false);
  const lifted = pos.x < 86 || pos.x > 174 || pos.y < 96;
  useEffect(() => { if (lifted) setOpen(true); }, [lifted]);

  const note = teaName === '水仙' ? '香气沉下来，带着一点甜。'
    : teaName === '景区王霸茶' ? '香气淡淡的，不怎么明显。'
    : '香气一下子扑了上来。';

  return (
    <div className="brew-stage" ref={stageRef}>
      <div className="brew-gaiwantarget"><GaiwanSvg width={120} leaves steam={open} liquor="#c9a24b" lid={!open} /></div>
      {!open && (
        <div className="brew-item" style={{ left: pos.x, top: pos.y }} {...bind}>
          <svg width="58" height="40" viewBox="0 0 58 40">
            <ellipse cx="29" cy="20" rx="27" ry="11" fill="#f1e8d8" stroke="#8a6f52" strokeWidth="1.6" />
            <circle cx="29" cy="12" r="3.4" fill="#8a6f52" />
          </svg>
        </div>
      )}
      <div className="brew-foot">
        <p className="brew-tip">{smelled ? note : open ? '盖子掀开了，盖香冒出来。点「闻香」。' : '把盖子拖开。'}</p>
        <button className="btn btn-primary" disabled={!open || smelled} onClick={() => { setSmelled(true); onAdvance({ key: 'smell', quality: 'good', sub: 100, note }); }}>{smelled ? '继续' : '闻香'}</button>
      </div>
    </div>
  );
}

/**
 * 出汤：拖盖碗倾出茶汤 → 看汤色 → 点【出汤】锁定。
 * 汤色随时间由浅变深（轻量模拟），玩家观察时机主动点击。
 * 反馈三句（无温度数值）：香气还没完全打开 / 出汤利落 / 这一泡更浓了些。
 */
function SteepPhase({ casual, onAdvance }: { casual: boolean; onAdvance: (m: BrewMark) => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const { pos, bind } = useDrag(stageRef, { x: 100, y: 150 });
  const tilt = Math.max(-0.5, Math.min(0.5, (pos.x - 100) / 90));
  const pouring = Math.abs(tilt) > 0.26;
  const [t, setT] = useState(0.2);
  const [locked, setLocked] = useState(false);
  const [cup, setCup] = useState(0);
  useEffect(() => { if (!locked) setT((v) => Math.min(1, v + (casual ? 0.006 : 0.008))); }, [locked, casual]);
  useEffect(() => {
    if (!pouring || locked) return;
    const id = setInterval(() => setCup((v) => Math.min(1, v + 0.05)), 70);
    return () => clearInterval(id);
  }, [pouring, locked]);

  const liquorColor = `rgb(${Math.round(206 - t * 110)},${Math.round(172 - t * 78)},${Math.round(92 - t * 44)})`;

  function lock() {
    setLocked(true);
    let quality: BrewMark['quality']; let sub: number; let note: string;
    if (t < 0.5) { quality = 'off'; sub = 50; note = '香气还没完全打开。'; }
    else if (t > 0.85) { quality = 'off'; sub = 46; note = '这一泡更浓了些。'; }
    else { quality = 'good'; sub = 100; note = '出汤利落。'; }
    onAdvance({ key: 'steep', quality, sub, note });
  }

  return (
    <div className="brew-stage" ref={stageRef}>
      <div className="brew-item" style={{ left: pos.x, top: pos.y, transform: `rotate(${tilt * 32}deg)`, transformOrigin: '50% 90%' }} {...bind}>
        <GaiwanSvg width={120} liquor={locked ? undefined : liquorColor} />
      </div>
      <div className="brew-gongdao" style={{ left: 8, top: 150 }}><GongDaoSvg width={84} liquor={cup > 0 ? liquorColor : undefined} /></div>
      {pouring && !locked && <div className="brew-splash" style={{ left: pos.x + 44, top: pos.y + 70, opacity: 0.85 }} />}
      <div className="brew-foot">
        <div className="brew-meter"><i style={{ width: `${t * 100}%` }} /></div>
        <p className="brew-tip">{locked ? (smellNote(t)) : '拖盖碗倾出茶汤，看汤色——点【出汤】。'}</p>
        <button className="btn btn-primary" disabled={locked} onClick={lock}>出汤</button>
      </div>
    </div>
  );
  function smellNote(v: number) { return v < 0.5 ? '香气还没完全打开。' : v > 0.85 ? '这一泡更浓了些。' : '出汤利落。'; }
}

/** 品饮：闻香 / 喝一口 → 收杯 */
function TastePhase({ marks, brewScore, result, teaName, onDone }: {
  marks: BrewMark[]; brewScore: number; result: ProcessingResult; teaName: string; onDone: (o: BrewOutcome) => void;
}) {
  const steep = marks.find((m) => m.key === 'steep');
  const light = steep?.note.includes('没完全打开');
  const dark = steep?.note.includes('更浓');
  const liquorColor = light ? '#ddce9a' : dark ? '#8a5a2a' : '#c9a24b';
  const [acted, setActed] = useState<'none' | 'smell' | 'sip'>('none');

  return (
    <>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--ink-2)' }}>{teaName} · 盖碗泡法　{STEPS.length}/{STEPS.length}</div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginTop: 4 }}>品饮</div>
      <p className="hint">{STEPS[6].hint}</p>
      <div className="brew-stage" style={{ height: 200 }}>
        <div className="brew-gaiwantarget"><GaiwanSvg width={120} leaves steam liquor={liquorColor} /></div>
      </div>
      {steep && <p className="note" style={{ marginTop: 8 }}>{steep.note}</p>}
      <div className="scene-foot">
        {acted === 'none' && (
          <>
            <button className="btn" onClick={() => setActed('smell')}>闻香</button>
            <button className="btn" onClick={() => setActed('sip')}>喝一口</button>
          </>
        )}
        {acted === 'smell' && <p className="note">{teaName === '景区王霸茶' ? '盖香淡淡的，没什么冲劲——和平时喝的岩茶不太一样。' : '盖香清清的，是这锅茶自己做出来的味道。'}</p>}
        {acted === 'sip' && <p className="note">{teaName === '景区王霸茶' ? '入口先苦后平……说不上难喝，也说不上惊艳。' : '喉头先苦后甜——自己做的，喝着到底不一样。'}</p>}
        {(acted === 'smell' || acted === 'sip') && (
          <button className="btn btn-primary" onClick={() => onDone({ brewScore })}>收杯</button>
        )}
        {acted === 'none' && <p className="hint" style={{ marginTop: 4 }}>{ZhouComment(result, brewScore)}</p>}
      </div>
    </>
  );
}
