import { useEffect, useRef, useState } from 'react';
import type { ProcessingResult, Difficulty, BrewOutcome, Grade } from '../../core/types';
import { KettleSvg, TeaLeafSvg } from '../../components/art/Art';
import { teaVisual, brewLiquor } from '../../core/data/teaVisuals';
import { useGame } from '../../store/gameStore';
import { getTea } from '../../core/data/teas';
import { getTeaWare, MARKET_TEA_WARES, ownedWareOfType, DEFAULT_BREW_WARE } from '../../core/data/teaWares';
import { GaiwanSvg } from '../../components/art/Art';
import type { TeaWare } from '../../core/data/teaWares';
import {
  steepProfile,
  steepStageText,
  steepTiming,
  timingLabel,
  evaluateBrew,
  type SteepTiming,
} from '../../core/data/brewEval';

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
  timing?: SteepTiming;
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
// 盖碗视觉中心 = 舞台中心，与拖拽「near」判定一致，避免错位。
const GAICENTER = { x: 190, y: 160 };
const KETTLE = { w: 84, h: 76 };
const NEAR = 70;

// 投茶舞台的「取茶来源」锚点：茶叶位置只由 takeMode + teaJarOpen 决定，两模式不共用坐标。
// 直接投茶：盖碗正下方居中、底排茶具上方（不遮挡茶叶罐）。
const DIRECT_LEAF = { x: 132, y: 236 };
// 使用茶叶罐且已打开：罐口上方（在茶叶罐左侧列、罐身之上，不遮挡罐体与「点我打开」提示）。
const JAR_LEAF = { x: 10, y: 120 };

/**
 * 阶段化茶具可见性（核心原则：拥有 ≠ 每个阶段都显示）。
 * 茶具只在「真正使用它的阶段」出现：
 *   - 茶盘  : 仅品饮（茶席底座）
 *   - 公道杯: 出汤 + 品饮
 *   - 品茗杯: 仅品饮
 *   - 茶叶罐: 仅投茶
 *   - 盖碗/茶壶: 贯穿全程（核心冲泡器）
 * 各 Phase 据此只渲染自己需要的茶具，画面始终干净、不互相遮挡。
 */
type WareRole = 'caddy' | 'gongdao' | 'cup' | 'tray';
const PHASE_WARES: Record<string, WareRole[]> = {
  warm: [], discard: [], add: ['caddy'], pour: [], smell: [], steep: ['gongdao'], taste: ['gongdao', 'cup', 'tray'],
};

/** 茶名一律取自茶数据（按 teaId），不再对未知茶种回退成「大红袍」——避免跨章节串线。 */
function teaLabel(id: string) {
  try { return getTea(id).name; } catch { return '茶'; }
}

/** 闻香一句话：按茶种给不同香气描述；未知茶种给中性描述（不回退成岩茶口吻）。 */
function aromaNote(teaId: string): string {
  const notes: Record<string, string> = {
    rougui: '桂皮般的香气一下子窜了出来。',
    shuixian: '清幽的兰花香，慢慢浮了出来。',
    dahongpao: '香气不急着冒出来，倒像是慢慢铺开。',
    jiuquhongmei: '甜香里透出一丝梅子般的气息，红茶的暖香。',
    longjing: '豆香清鲜，像刚剥开的嫩栗子。',
  };
  return notes[teaId] ?? '香气淡淡的，静静飘着。';
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
  // 红茶（杭州 · 九曲红梅）：按红茶口吻说，不套岩茶的「岩骨花香」。
  const category = (() => { try { return getTea(result.teaId).category; } catch { return 'yancha'; } })();
  if (category === 'hongcha') {
    if (result.grade === 'fail') return '周伯：「……能喝。发酵没走匀，味有点闷。」';
    if (brewScore < 50) return '周伯：「出汤早了，甜香还没发出来。」';
    if (brewScore > 85) return '周伯：「红亮甜润，这一泡正。跟武夷山那路，完全是两回事。」';
    if (brewScore > 72) return '周伯：「甜香出来了，汤也顺——不错。」';
    return '周伯：「自己做的，喝着就是不一样。」';
  }
  // 绿茶（杭州 · 西湖龙井）：清亮鲜爽、豆香回甘，不套岩茶的「岩骨花香」与红茶的「甜润」。
  if (category === 'green') {
    if (result.grade === 'fail') return '周伯：「……能喝。青气还压着，火候没到。」';
    if (brewScore < 50) return '周伯：「出汤早了，鲜爽还没打开——绿茶就是要那一口鲜。」';
    if (brewScore > 85) return '周伯：「清亮、鲜爽，豆香干净。这一泡，是龙井的样子。」';
    if (brewScore > 72) return '周伯：「鲜爽出来了，汤也清——不错。」';
    return '周伯：「自己炒的，喝着就是不一样。」';
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

/**
 * 泡茶用的茶具容器：显示「玩家选择的茶具」图片（WebP，经 BASE_URL 解析），
 * 并在碗口叠加一层按茶种着色的「茶汤」色（保留三茶茶汤颜色差异）。
 * 纯视觉，不参与任何评分 / 品质计算。
 */
function BrewWare({ ware, teaId, grade, level = 0, liquidColor, leaves = false, steam = false, leafColor, size = 150 }: {
  ware: TeaWare; teaId?: string; grade?: Grade; level?: number;
  liquidColor?: string; leaves?: boolean; steam?: boolean; leafColor?: string; size?: number;
}) {
  const color = liquidColor ?? (teaId && grade && level > 0.05 ? brewLiquor(teaId, level, grade) : undefined);
  // 没买过任何茶具时的默认容器：素盖碗用内联 SVG 绘制（GaiwanSvg 自带汤/叶/汽状态），不加载位图。
  if (!ware.asset) {
    return (
      <div className="brew-ware" style={{ width: size, height: Math.round(size * 0.93) }}>
        <GaiwanSvg
          width={size}
          liquor={color}
          leaves={leaves}
          steam={steam}
          leafColor={leafColor ?? '#5c4a34'}
          lid
        />
      </div>
    );
  }
  return (
    <div className="brew-ware" style={{ width: size, height: Math.round(size * 0.93) }}>
      <img src={`${import.meta.env.BASE_URL}${ware.asset}`} alt={ware.name} className="brew-ware-img" draggable={false} />
      {leaves && <span className="brew-ware-leaves" style={{ color: leafColor ?? '#5c4a34' }}>🍃</span>}
      {color && <span className="brew-ware-liquor" style={{ background: color, opacity: Math.min(0.92, 0.35 + level * 0.5) }} />}
      {steam && <span className="brew-ware-steam" />}
    </div>
  );
}

/**
 * 泡茶前的轻量「选茶具」步骤：**只列玩家真正拥有的可泡茶具**——
 * 没买过的茶具（包括白瓷盖碗）一律「未拥有」并禁用，章节推荐不代表自动拥有；
 * 一件可泡茶具都没有时，退回茶桌上常备的素盖碗（内联 SVG，非商品）。
 */
function SelectWarePhase({ teaName, owned, onSelect }: { teaName: string; owned: string[]; onSelect: (id: string) => void }) {
  const ownedBrewable = MARKET_TEA_WARES.filter((w) => w.usableForBrew && owned.includes(w.id));
  // hooks 必须无条件调用（有无茶具两个分支都要走同一 hook 序列）。
  const [picked, setPicked] = useState(ownedBrewable[0]?.id ?? DEFAULT_BREW_WARE.id);
  // 一件可泡茶具都没有 → 不展示商品列表，直接给默认素盖碗（不卡住首泡）。
  if (ownedBrewable.length === 0) {
    return (
      <div className="brew-select">
        <div className="brew-select-title">先用手边这只</div>
        <p className="hint">「{teaName}」要用一只茶具来泡。你还没买过茶具——先用工夫茶桌上那只素盖碗吧，想要讲究的，去茶集市挑一只。</p>
        <div className="ware-cards">
          <div className="ware-card active" style={{ cursor: 'default' }}>
            <GaiwanSvg width={84} />
            <span className="ware-name">{DEFAULT_BREW_WARE.name}</span>
            <span className="ware-own">常备</span>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => onSelect(DEFAULT_BREW_WARE.id)}>就用它泡</button>
      </div>
    );
  }
  return (
    <div className="brew-select">
      <div className="brew-select-title">今天用哪套茶具？</div>
      <p className="hint">「{teaName}」要用一只茶具来泡。挑一只你拥有的——没买过的茶具用不了。</p>
      <div className="ware-cards">
        {MARKET_TEA_WARES.filter((w) => w.usableForBrew).map((w) => {
          const avail = owned.includes(w.id);
          const active = picked === w.id;
          return (
            <button
              key={w.id}
              type="button"
              className={`ware-card${active ? ' active' : ''}`}
              disabled={!avail}
              onClick={() => avail && setPicked(w.id)}
            >
              <img src={`${import.meta.env.BASE_URL}${w.asset}`} alt={w.name} className="ware-thumb" draggable={false} />
              <span className="ware-name">{w.name}</span>
              <span className="ware-own">{avail ? '已拥有' : '未拥有'}</span>
            </button>
          );
        })}
      </div>
      <button className="btn btn-primary" onClick={() => onSelect(picked)}>用这只泡</button>
    </div>
  );
}

export default function BrewingFlow({ result, difficulty, onDone }: Props) {
  const owned = useGame((s) => s.player.teaWareInventory);
  // 按玩家实际拥有的茶具动态组合：各茶具只在对应阶段出现（见 PHASE_WARES），不互相绑定。
  const tray = ownedWareOfType(owned, 'tray');
  const caddy = ownedWareOfType(owned, 'caddy');
  const cup = owned.includes('white-teacup') ? getTeaWare('white-teacup') : undefined;
  const gongdao = owned.includes('fairness-cup') ? getTeaWare('fairness-cup') : undefined;
  const [selectedWareId, setSelectedWareId] = useState<string | null>(null);
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

  // 进入正式泡茶前，先让玩家选一只茶具（复用已购买的 teaWareInventory；白瓷盖碗为随身默认款）。
  if (!selectedWareId) {
    return <SelectWarePhase teaName={teaName} owned={owned} onSelect={setSelectedWareId} />;
  }
  const ware = selectedWareId === DEFAULT_BREW_WARE.id ? DEFAULT_BREW_WARE : getTeaWare(selectedWareId) ?? DEFAULT_BREW_WARE;

  const header = (label: string, hint: string) => (
    <div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--ink-2)' }}>{teaName} · {ware.name}　{idx + 1}/{STEPS.length}</div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginTop: 4 }}>{label}</div>
      <p className="hint">{hint}</p>
    </div>
  );

  switch (idx) {
    case 0: return <><div>{header('温杯', STEPS[0].hint)}</div><WarmPhase casual={casual} ware={ware} onAdvance={addMark} /></>;
    case 1: return <><div>{header('倒掉温杯水', STEPS[1].hint)}</div><DiscardPhase ware={ware} onAdvance={addMark} /></>;
    case 2: return <><div>{header('投茶', STEPS[2].hint)}</div><AddPhase teaId={result.teaId} grade={result.grade} ware={ware} caddy={caddy} onAdvance={addMark} /></>;
    case 3: return <><div>{header('注水', STEPS[3].hint)}</div><PourPhase casual={casual} teaId={result.teaId} grade={result.grade} ware={ware} onAdvance={addMark} /></>;
    case 4: return <><div>{header('揭盖 · 闻香', STEPS[4].hint)}</div><SmellPhase teaId={result.teaId} grade={result.grade} ware={ware} onAdvance={addMark} /></>;
    case 5: return <><div>{header('出汤', STEPS[5].hint)}</div><SteepPhase casual={casual} teaId={result.teaId} grade={result.grade} ware={ware} gongdao={gongdao} onAdvance={addMark} /></>;
    case 6: return <TastePhase marks={marks} brewScore={brewScore()} result={result} teaName={teaName} ware={ware} gongdao={gongdao} cup={cup} tray={tray} onDone={onDone} />;
    default: return null;
  }
}

/** 温杯：拖茶壶到盖碗上方 → 水流 → 盖碗暖起来（仅盖碗 + 茶壶，无其它茶具） */
function WarmPhase({ casual, ware, onAdvance }: { casual: boolean; ware: TeaWare; onAdvance: (m: BrewMark) => void }) {
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
    <>
      <div className="brew-stage" ref={stageRef}>
        <div className="brew-gaiwantarget"><BrewWare ware={ware} level={warm > 0.1 ? 0.9 : 0} liquidColor={warm > 0.1 ? '#e9dcc0' : undefined} size={120} /></div>
        {near && <div className="brew-splash" style={{ left: GAICENTER.x - 6, top: 150 }} />}
        <div className="brew-item" style={{ left: pos.x, top: pos.y }} {...bind}>
          <KettleSvg width={KETTLE.w} pour={near} />
        </div>
      </div>
      <div className="brew-actionbar">
        <div className="brew-meter"><i style={{ width: `${warm * 100}%`, background: 'var(--bamboo)' }} /></div>
        <p className="brew-tip">{done ? '盖碗暖起来了。' : near ? '水注下去，碗壁慢慢烫起来……' : '把茶壶拖到盖碗上方。'}</p>
        <button className="btn btn-primary" disabled={!done} onClick={() => onAdvance({ key: 'warm', quality: 'good', sub: 100, note: '盖碗暖起来了。' })}>继续</button>
      </div>
    </>
  );
}

/** 倒掉温杯水：拖盖碗倾斜 → 水倒出（仅盖碗，无其它茶具） */
function DiscardPhase({ ware, onAdvance }: { ware: TeaWare; onAdvance: (m: BrewMark) => void }) {
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
    <>
      <div className="brew-stage" ref={stageRef}>
        <div className="brew-item" style={{ left: pos.x, top: pos.y, transform: `rotate(${tilt * 34}deg)`, transformOrigin: '50% 90%' }} {...bind}>
          <BrewWare ware={ware} level={pour < 1 ? 0.9 : 0} liquidColor={pour < 1 ? '#e9dcc0' : undefined} />
        </div>
        {pouring && !done && <div className="brew-splash" style={{ left: pos.x + 40, top: pos.y + 70, opacity: 0.8 }} />}
      </div>
      <div className="brew-actionbar">
        <p className="brew-tip">{done ? '温杯水倒了，碗空了。' : pouring ? '倾着，水哗地倒出去……' : '往一边拖动盖碗，把水倒掉。'}</p>
        <button className="btn btn-primary" disabled={!done} onClick={() => onAdvance({ key: 'discard', quality: 'good', sub: 100, note: '温杯水倒了。' })}>继续</button>
      </div>
    </>
  );
}

/**
 * 投茶：拖茶青入碗。
 *
 * 固定「茶具舞台」布局（见 base.css .brew-stage / .brew-caddy）：
 *   盖碗居中（上，主要操作区） ＋ 茶叶罐(底排左，仅「使用茶叶罐」模式出现)；
 * 品茗杯不在此阶段出现（只在品饮阶段出现）。茶叶罐投茶完成后随阶段切换自动退出。
 *
 * 茶叶位置由 takeMode + teaJarOpen 共同决定，两模式不共用固定坐标：
 *   - 直接投茶：茶叶出现在默认取茶点（盖碗下方居中）。
 *   - 使用茶叶罐且已打开：茶叶从罐口上方出现；罐关闭时不显示任何茶叶。
 * 因此切换模式时，上一方式的茶叶立即消失，不存在残留。
 * 以上均不改变任何品质计算（消耗 / 判定 / Grade / 茶汤 等）。
 */
function AddPhase({ teaId, grade, ware, caddy, onAdvance }: { teaId: string; grade: Grade; ware: TeaWare; caddy?: TeaWare; onAdvance: (m: BrewMark) => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  // 拖拽初始位置用直接投茶锚点；切换来源时由 chooseDirect/chooseCaddy/toggleCaddy 重置到对应锚点。
  const { pos, dragging, bind, setPos } = useDrag(stageRef, DIRECT_LEAF);
  const [inBowl, setInBowl] = useState(false);
  const [caddyOpen, setCaddyOpen] = useState(false);
  const hasCaddy = !!caddy;
  // 默认「直接投茶」；有茶叶罐也不强制，玩家可随时切换到用罐。
  const [mode, setMode] = useState<'caddy' | 'direct'>('direct');

  const center = { x: pos.x + 46, y: pos.y + 20 };
  const over = Math.hypot(center.x - GAICENTER.x, center.y - GAICENTER.y) < NEAR;
  const leafColor = teaVisual(teaId).leafColor;

  function drop() { if (over) setInBowl(true); }
  // 切到「直接投茶」：茶叶回到默认取茶点；罐关闭、碗里清空。
  function chooseDirect() {
    setMode('direct');
    setCaddyOpen(false);
    setInBowl(false);
    setPos(DIRECT_LEAF);
  }
  // 切到「使用茶叶罐」：先不显示茶叶（罐未开），预留罐口位置；罐体才出现。
  function chooseCaddy() {
    setMode('caddy');
    setCaddyOpen(false);
    setInBowl(false);
    setPos(JAR_LEAF);
  }
  function toggleCaddy() {
    const next = !caddyOpen;
    setCaddyOpen(next);
    if (next) setPos(JAR_LEAF); // 打开后才在罐口附近生成茶叶
  }

  // 茶叶只依附当前「取茶来源」：直接投茶恒显示（未入碗前）；用罐且已打开才显示；其余一律不显示 → 不会残留。
  const showLeaf = !inBowl && (mode === 'direct' || (mode === 'caddy' && caddyOpen));
  const tip =
    inBowl ? '茶叶落进碗里了。'
    : mode === 'caddy' && !caddyOpen ? '点一下茶叶罐，打开它。'
    : over ? '松手，茶青就落进去了。'
    : dragging ? '把茶青拖进盖碗。'
    : mode === 'caddy' ? '从茶叶罐里取出一撮茶，拖进盖碗。'
    : '把茶青拖进盖碗。';

  return (
    <>
      <div className="brew-stage" ref={stageRef}>
        {/* 中央：盖碗（主要操作区，任何茶具不遮挡）；投茶阶段略缩以容纳底排茶具，不影响落茶判定 */}
        <div className="brew-gaiwantarget"><BrewWare ware={ware} leaves={inBowl} leafColor={leafColor} size={130} /></div>

        {/* 底排左：茶叶罐 —— 仅「使用茶叶罐」模式出现，投茶完成后随阶段切换自动退出 */}
        {mode === 'caddy' && caddy && (
          <div className={`brew-caddy${caddyOpen ? ' open' : ''}`} onClick={toggleCaddy} title="点一下打开茶叶罐">
            <img className="brew-caddy-img" src={`${import.meta.env.BASE_URL}${caddy.asset}`} alt={caddy.name} draggable={false} />
            <span className="brew-caddy-mouth" />
            <CaddyLid />
            {!caddyOpen && <span className="brew-caddy-hint">点我打开</span>}
          </div>
        )}

        {/* 茶叶：位置由 takeMode + teaJarOpen 决定，两模式不共用坐标；不在显示状态时整个节点不挂载 */}
        {showLeaf && (
          <div className="brew-item" style={{ left: pos.x, top: pos.y }} {...bind} onPointerUp={(e) => { bind.onPointerUp(e); drop(); }}>
            <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
              <TeaLeafSvg size={30} color={leafColor} /><TeaLeafSvg size={28} color={leafColor} /><TeaLeafSvg size={30} color={leafColor} />
            </div>
          </div>
        )}
      </div>
      <div className="brew-actionbar">
        {hasCaddy && (
          <div className="brew-choice">
            <span className="brew-choice-label">怎么取茶？</span>
            <button type="button" className={`brew-choice-btn${mode === 'direct' ? ' active' : ''}`} onClick={chooseDirect}>直接投茶</button>
            <button type="button" className={`brew-choice-btn${mode === 'caddy' ? ' active' : ''}`} onClick={chooseCaddy}>使用茶叶罐</button>
          </div>
        )}
        <p className="brew-tip">{tip}</p>
        <button className="btn btn-primary" disabled={!inBowl} onClick={() => onAdvance({ key: 'add', quality: 'good', sub: 100, note: '茶叶落进碗里了。' })}>继续</button>
      </div>
    </>
  );
}

/** 茶叶罐盖：纯 SVG，靠 CSS 位移表示开合，无需额外图片资源。 */
function CaddyLid() {
  return (
    <svg className="brew-caddy-lid" viewBox="0 0 54 24" width="54" height="24" aria-hidden>
      <ellipse cx="27" cy="16" rx="26" ry="7" fill="#caa86f" stroke="#8a6f52" strokeWidth="1.4" />
      <rect x="22" y="3" width="10" height="9" rx="3" fill="#b8915a" stroke="#8a6f52" strokeWidth="1.2" />
    </svg>
  );
}

/** 注水：拖茶壶控水量 → 好了（仅盖碗 + 茶壶） */
function PourPhase({ casual, teaId, grade, ware, onAdvance }: { casual: boolean; teaId: string; grade: Grade; ware: TeaWare; onAdvance: (m: BrewMark) => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const { pos, bind } = useDrag(stageRef, { x: 26, y: 12 });
  const kc = { x: pos.x + KETTLE.w / 2, y: pos.y + KETTLE.h / 2 };
  const near = Math.hypot(kc.x - GAICENTER.x, kc.y - GAICENTER.y) < NEAR;
  const leafColor = teaVisual(teaId).leafColor;
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
    <>
      <div className="brew-stage" ref={stageRef}>
        <div className="brew-gaiwantarget"><BrewWare ware={ware} teaId={teaId} grade={grade} level={amount > 0.05 ? amount * 0.4 : 0} leaves leafColor={leafColor} /></div>
        {near && !locked && <div className="brew-splash" style={{ left: GAICENTER.x - 6, top: 150 }} />}
        <div className="brew-item" style={{ left: pos.x, top: pos.y }} {...bind}>
          <KettleSvg width={KETTLE.w} pour={near && !locked} />
        </div>
      </div>
      <div className="brew-actionbar">
        <div className="brew-meter"><i style={{ width: `${amount * 100}%` }} /></div>
        <p className="brew-tip">{locked ? lockedNote : near ? '水注着，看计量——够了就点「好了」。' : '把茶壶拖到碗上方注水。'}</p>
        <button className="btn btn-primary" disabled={locked || amount < 0.05} onClick={lock}>{locked ? '继续' : '好了'}</button>
      </div>
    </>
  );
}

/** 揭盖 · 闻香：拖盖 → 揭盖 → 闻香（仅盖碗） */
function SmellPhase({ teaId, grade, ware, onAdvance }: { teaId: string; grade: Grade; ware: TeaWare; onAdvance: (m: BrewMark) => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const { pos, bind } = useDrag(stageRef, { x: 130, y: 120 });
  const [open, setOpen] = useState(false);
  const [smelled, setSmelled] = useState(false);
  const lifted = pos.x < 86 || pos.x > 174 || pos.y < 96;
  useEffect(() => { if (lifted) setOpen(true); }, [lifted]);

  const note = aromaNote(teaId);

  return (
    <>
      <div className="brew-stage" ref={stageRef}>
        <div className="brew-gaiwantarget"><BrewWare ware={ware} teaId={teaId} grade={grade} level={0.55} leaves steam={open} leafColor={teaVisual(teaId).leafColor} /></div>
        {!open && (
          <div className="brew-item" style={{ left: pos.x, top: pos.y }} {...bind}>
            <svg width="58" height="40" viewBox="0 0 58 40">
              <ellipse cx="29" cy="20" rx="27" ry="11" fill="#f1e8d8" stroke="#8a6f52" strokeWidth="1.6" />
              <circle cx="29" cy="12" r="3.4" fill="#8a6f52" />
            </svg>
          </div>
        )}
      </div>
      <div className="brew-actionbar">
        <p className="brew-tip">{smelled ? note : open ? '盖子掀开了，盖香冒出来。点「闻香」。' : '把盖子拖开。'}</p>
        <button className="btn btn-primary" disabled={!open || smelled} onClick={() => { setSmelled(true); onAdvance({ key: 'smell', quality: 'good', sub: 100, note }); }}>{smelled ? '继续' : '闻香'}</button>
      </div>
    </>
  );
}

/**
 * 出汤：拖盖碗倾出茶汤 → 看汤色 → 点【出汤】锁定。
 * 拥有公道杯时，茶汤明确流入公道杯（盖碗→公道杯）；无公道杯则盖碗直接出汤（保持默认出汤逻辑）。
 * 公道杯只在出汤阶段出现（品饮阶段也会用到，但此处先在此兑现「汤入公道杯」）。
 * 汤色随时间由浅变深（轻量模拟），玩家观察茶汤状态文案，主动点击判断时机。
 * 不同茶有不同最佳窗口（容错率 + 反馈节奏），但差异体现在判断点而非"背秒数"。
 */
function SteepPhase({ casual, teaId, grade, ware, gongdao, onAdvance }: { casual: boolean; teaId: string; grade: Grade; ware: TeaWare; gongdao?: TeaWare; onAdvance: (m: BrewMark) => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const { pos, bind } = useDrag(stageRef, { x: 100, y: 150 });
  const tilt = Math.max(-0.5, Math.min(0.5, (pos.x - 100) / 90));
  const pouring = Math.abs(tilt) > 0.26;
  const [t, setT] = useState(0.2);
  const [locked, setLocked] = useState(false);
  const [cup, setCup] = useState(0);
  // 各茶推进速度见 brewEval.TEA_STEEP，仅微调；casual 略慢一点。t 由 setInterval 持续递增直到锁定。
  const profile = steepProfile(teaId);
  const rate = profile.steepRate * (casual ? 0.82 : 1);
  useEffect(() => {
    if (locked) return;
    const id = setInterval(() => setT((v) => Math.min(1, v + rate)), 90);
    return () => clearInterval(id);
  }, [locked, rate]);
  useEffect(() => {
    if (!pouring || locked) return;
    const id = setInterval(() => setCup((v) => Math.min(1, v + 0.05)), 70);
    return () => clearInterval(id);
  }, [pouring, locked]);

  const liquorColor = brewLiquor(teaId, t, grade);
  const liveText = steepStageText(teaId, t);

  function lock() {
    setLocked(true);
    const timing = steepTiming(teaId, t);
    const quality: BrewMark['quality'] = timing === 'good' ? 'good' : 'off';
    const sub = timing === 'good' ? 100 : timing === 'early' ? 50 : 46;
    const note = `${liveText}（${timingLabel(timing)}）`;
    onAdvance({ key: 'steep', quality, sub, note, timing });
  }

  return (
    <>
      <div className="brew-stage" ref={stageRef}>
        <div className="brew-item" style={{ left: pos.x, top: pos.y, transform: `rotate(${tilt * 32}deg)`, transformOrigin: '50% 90%' }} {...bind}>
          <BrewWare ware={ware} teaId={teaId} grade={grade} level={locked ? 0 : 1} liquidColor={locked ? undefined : liquorColor} />
        </div>
        {gongdao && (
          <div className="brew-gongdao" style={{ left: 6, top: 150 }}>
            <img src={`${import.meta.env.BASE_URL}${gongdao.asset}`} alt={gongdao.name} className="brew-gongdao-img" draggable={false} />
            {cup > 0 && <span className="brew-gongdao-fill" style={{ background: liquorColor, height: `${cup * 70}%` }} />}
          </div>
        )}
        {pouring && !locked && <div className="brew-splash" style={{ left: pos.x + 44, top: pos.y + 70, opacity: 0.85 }} />}
      </div>
      <div className="brew-actionbar">
        <div className="brew-meter"><i style={{ width: `${t * 100}%` }} /></div>
        <p className="brew-tip">{locked ? `${liveText}（${timingLabel(steepTiming(teaId, t))}）` : liveText}</p>
        <button className="btn btn-primary" disabled={locked} onClick={lock}>出汤</button>
      </div>
    </>
  );
}

/**
 * 品饮：温香 / 喝一口 → 收杯。
 *
 * 这是茶席感最强的阶段，按阶段化茶具规则只渲染品饮相关茶具：
 *   - 茶盘（若拥有）：作最底层「茶席底座」，承托公道杯 + 品茗杯；不在此前任何阶段出现。
 *   - 公道杯（若拥有）或盖碗（默认品饮器）：主品饮器，居中坐在茶盘内。
 *   - 品茗杯（若拥有）：居侧，同样完整落在茶盘内。
 * 盖碗在此阶段不作为主体——玩家已完成冲泡，进入「看汤色 → 闻香 → 喝一口」的品饮状态。
 */
function TastePhase({ marks, brewScore, result, teaName, ware, gongdao, cup, tray, onDone }: {
  marks: BrewMark[]; brewScore: number; result: ProcessingResult; teaName: string;
  ware: TeaWare; gongdao?: TeaWare; cup?: TeaWare; tray?: TeaWare; onDone: (o: BrewOutcome) => void;
}) {
  const steep = marks.find((m) => m.key === 'steep');
  const liquorColor = brewLiquor(result.teaId, 1, result.grade);
  const [acted, setActed] = useState<'none' | 'smell' | 'sip'>('none');

  // 主品饮器：拥有公道杯则用它，否则用冲泡盖碗作为默认品饮器。
  const primary = gongdao ?? ware;
  const showCup = !!cup;
  const useTray = !!tray;

  // 两段式品鉴评价：由「茶种 × 制茶品质 × 出汤时机」决定，不依赖 brewScore 总分。
  const evalResult = evaluateBrew({
    teaId: result.teaId,
    grade: result.grade,
    timing: steep?.timing ?? 'good',
  });

  return (
    <>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--ink-2)' }}>{teaName} · 盖碗泡法　{STEPS.length}/{STEPS.length}</div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginTop: 4 }}>品饮</div>
      <p className="hint">{STEPS[6].hint}</p>
      <div className="brew-stage brew-stage-taste">
        {/* 茶盘：仅品饮阶段出现，作为茶席底座承托主品饮器与品茗杯 */}
        {useTray && (
          <div className="brew-taste-tray">
            <img src={`${import.meta.env.BASE_URL}${tray!.asset}`} alt={tray!.name} className="brew-taste-tray-img" draggable={false} />
          </div>
        )}
        {/* 主品饮器：公道杯或盖碗（默认），完整坐在茶盘内，展示汤色 */}
        <div className="brew-taste-primary">
          <BrewWare ware={primary} teaId={result.teaId} grade={result.grade} level={1} leaves steam leafColor={teaVisual(result.teaId).leafColor} size={132} />
        </div>
        {/* 品茗杯：居侧，完整落在茶盘内，同样盛着这一泡 */}
        {showCup && (
          <div className="brew-taste-cup">
            <img src={`${import.meta.env.BASE_URL}${cup!.asset}`} alt={cup!.name} className="brew-taste-cup-img" draggable={false} />
            <span className="brew-taste-cup-fill" style={{ background: liquorColor }} />
          </div>
        )}
      </div>
      <div className="brew-actionbar">
        <div className="brew-eval">
          <p className="eval-head" style={{ fontFamily: 'var(--serif)', fontSize: 17, margin: '2px 0 4px', color: 'var(--ink-1)' }}>{evalResult.headline}</p>
          <p className="note">{evalResult.body}</p>
        </div>
        {acted === 'none' && (
          <div className="brew-taste-actions">
            <button className="btn" onClick={() => setActed('smell')}>闻香</button>
            <button className="btn" onClick={() => setActed('sip')}>喝一口</button>
          </div>
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
