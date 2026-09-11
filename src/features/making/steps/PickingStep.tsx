import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { StepOutcome, StepParams, FaultTag, Difficulty, BasketQuality } from '../../../core/types';
import { TeaShootSvg, BasketSvg } from '../../../components/art/Art';
import { TeaGardenScene } from '../../../components/scenes/TeaGardenScene';
import { NpcPortrait } from '../../../components/art/NpcPortrait';
import { getTea } from '../../../core/data/teas';

/**
 * 采茶：同一套「挑对的那一梢」玩法，采摘标准由茶种决定（数据驱动）。
 * - open-face（岩茶 / 红茶）：开面采，看芽叶关系与张开程度，判断「太嫩 / 合适 / 太老」。
 * - bud（绿茶 · 西湖龙井）：嫩芽采，看嫩度与完整度——一芽一叶最佳、一芽二叶合适、老叶不要。
 * 颜色只是同色系深浅，不当答案。
 * 产出「这一篓鲜叶」的隐藏品质档 basketQuality，供后续制茶轻量影响容错。
 */

type Kind = 'good' | 'tender' | 'old' | 'bud1' | 'bud2';
type PickMode = 'open-face' | 'bud';

/** 默认引导（武夷山 · 阿秀 · 开面采）：是跟着人学采茶，不是读教程弹窗 */
const TUTORIAL = [
  '先别急着摘。',
  '看看这一梢。',
  '有些太嫩，有些又老了。',
  '今天咱们采开面合适的。',
  '你自己挑挑看。',
];

/** 默认评价（阿秀对这一篓）：前台只给自然语言，隐藏档不显示 */
const BASKET_COMMENT: Record<BasketQuality, string> = {
  good: '嗯，这一篓叶子挺齐。',
  normal: '有几片稍老了，不过还能做。',
  rough: '这篓叶子有点杂，后面得仔细做。',
};

/** 嫩芽采（绿茶）的默认引导：重点从「开面」换成「嫩度与完整」 */
const TUTORIAL_BUD = [
  '绿茶采的不是开面叶。',
  '要的是嫩芽——一枚芽，带一片叶最好。',
  '带两片叶也行，再大就老了。',
  '你挑挑看，挑嫩的摘。',
];

const BASKET_COMMENT_BUD: Record<BasketQuality, string> = {
  good: '嗯，这一篓嫩得很齐。',
  normal: '有几片偏大了，不过还能做。',
  rough: '这篓叶子老嫩不匀，做出来要吃亏的。',
};

interface Props {
  params: StepParams;
  difficulty: Difficulty;
  teaId: string;
  taught?: boolean;        // 是否已引导过（由外层按存档传入，保持本组件无状态依赖）
  onTaught?: () => void;
  onDone: (o: StepOutcome) => void;
  /** ── 地区化（可选，缺省=武夷山 · 阿秀）──
   *  采茶这一步各茶区共用同一套判断玩法，但「跟着谁采、在哪儿采」不同。 */
  presenterNpcId?: string;                 // 站在茶园里的人（默认 axiu）
  presenterName?: string;                  // 引导者署名（默认「阿秀 · 采茶人」）
  sceneNode?: ReactNode;                   // 茶园场景大图（默认武夷山茶园 SVG）
  tutorial?: string[];                     // 引导语
  basketComment?: Record<BasketQuality, string>; // 收篓评价
  hint?: string;                           // 底部操作提示
}

export default function PickingStep({
  difficulty, teaId, taught, onTaught, onDone,
  presenterNpcId = 'axiu', presenterName = '阿秀 · 采茶人',
  sceneNode, tutorial: tutorialProp, basketComment: basketProp, hint: hintProp,
}: Props) {
  const cfg = getTea(teaId).gameProfile.picking;
  // 采摘标准由茶种数据决定（不写死 if (茶名)）：开面采 / 嫩芽采。
  const mode: PickMode = cfg?.pickingMethod === 'bud' ? 'bud' : 'open-face';
  const attemptCount = cfg?.attemptCount ?? 12;   // 树上可选的茶梢总数（有限选择）
  const basketNeed = cfg?.basketNeed ?? 8;        // 采满「这一篓」所需
  const tolerance = (cfg?.tolerance ?? 0.6) - (difficulty === 'casual' ? 0.1 : 0);
  const tutorial = tutorialProp ?? (mode === 'bud' ? TUTORIAL_BUD : TUTORIAL);
  const basketComment = basketProp ?? (mode === 'bud' ? BASKET_COMMENT_BUD : BASKET_COMMENT);
  const hint = hintProp ?? (mode === 'bud'
    ? '挑嫩的摘——一枚芽带一片叶的最好。'
    : '按住茶梢，往下一带，就摘下来了。');

  const [phase, setPhase] = useState<'teach' | 'pick' | 'result'>(taught ? 'pick' : 'teach');
  const [teachIdx, setTeachIdx] = useState(0);
  const [removed, setRemoved] = useState<number[]>([]);
  const [picked, setPicked] = useState<Kind[]>([]);
  const [flying, setFlying] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ id: number; startY: number; dy: number } | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  // 茶梢分布：形态差异（开面：good 7 / tender 3 / old 2；嫩芽：bud1 5 / bud2 4 / old 3），位置沿茶垄散开
  const shoots = useMemo(() => {
    const kindOf = (i: number): Kind => {
      const r = i % 12;
      if (mode === 'bud') {
        if (r === 3 || r === 5 || r === 11) return 'old';            // 老叶（不要）
        if (r === 1 || r === 4 || r === 7 || r === 10) return 'bud2'; // 一芽二叶（合适）
        return 'bud1';                                               // 一芽一叶（最佳）
      }
      if (r === 2 || r === 6 || r === 9) return 'tender';
      if (r === 4 || r === 11) return 'old';
      return 'good';
    };
    return Array.from({ length: attemptCount }, (_, i) => ({
      id: i,
      kind: kindOf(i),
      x: 7 + ((i * 37) % 74),
      y: 26 + ((i * 53) % 46),
      rot: ((i * 13) % 12) - 6,
    }));
  }, [attemptCount, mode]);

  // 采满一篓 → 交给阿秀看这一篓
  useEffect(() => {
    if (phase === 'pick' && picked.length >= basketNeed) setPhase('result');
  }, [picked.length, basketNeed, phase]);

  function harvest(id: number) {
    if (phase !== 'pick') return;
    if (removed.includes(id) || flying === id) return;
    const s = shoots.find((x) => x.id === id);
    if (!s) return;
    setDrag(null);
    setFlying(id);
    timer.current = window.setTimeout(() => {
      setFlying(null);
      setRemoved((r) => [...r, id]);
      setPicked((p) => [...p, s.kind]);
    }, 520);
  }

  function onDown(e: React.PointerEvent<HTMLDivElement>, id: number) {
    if (phase !== 'pick') return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDrag({ id, startY: e.clientY, dy: 0 });
  }
  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag || phase !== 'pick') return;
    const dy = e.clientY - drag.startY;
    if (dy > 30) { harvest(drag.id); return; }   // 往下一带，摘下来
    setDrag({ ...drag, dy });
  }
  function onUp() { setDrag(null); }

  function nextTeach() {
    if (teachIdx < tutorial.length - 1) { setTeachIdx(teachIdx + 1); return; }
    onTaught?.();
    setPhase('pick');
  }

  // 这一篓挑得怎么样：开面采只看「合适的」；嫩芽采认一芽一叶（1.0）、一芽二叶（0.62）、老叶（0）。
  const weightOf = (k: Kind): number => {
    if (mode === 'bud') return k === 'bud1' ? 1 : k === 'bud2' ? 0.62 : 0;
    return k === 'good' ? 1 : 0;
  };
  const ratio = picked.length ? picked.reduce((s, k) => s + weightOf(k), 0) / picked.length : 0;
  const quality: BasketQuality =
    ratio >= tolerance ? 'good' : ratio >= tolerance - 0.2 ? 'normal' : 'rough';

  function finish() {
    const score = quality === 'good' ? 88 : quality === 'normal' ? 70 : 52;
    const faults: FaultTag[] = quality === 'rough' ? ['picking_poor'] : [];
    onDone({
      step: 'picking',
      score,
      faults,
      // 采茶这一步的干茶色按采摘标准取：开面采（岩茶/红茶）=青绿；嫩芽采（绿茶）=鲜绿。
      visualState: { dryColor: mode === 'bud' ? '#b3bc6e' : '#8fae6a', shape: 'flat', edgeRed: 0, sheen: 0.2 },
      comment: basketComment[quality],
      basketQuality: quality,
    });
  }

  return (
    <div className="pick-wrap">
      <div className="pick-stage">
        {/* 场景：茶园环境层（不含人物）。缺省=武夷山茶园，杭州传入本地茶园。 */}
        <div className="pick-bg">{sceneNode ?? <TeaGardenScene />}</div>

        {/* 引导者：站在茶园里的人，不是头像卡片 */}
        <div className="pick-axiu"><NpcPortrait id={presenterNpcId} /></div>

        {/* 茶梢：按住往下一带即采下 */}
        {shoots.map((s) => {
          if (removed.includes(s.id)) return null;
          const isFly = flying === s.id;
          const isDrag = drag?.id === s.id;
          return (
            <div
              key={s.id}
              role="button"
              aria-label="茶梢"
              className={`pick-shoot${isDrag ? ' is-drag' : ''}`}
              style={{
                left: isFly ? '50%' : `${s.x}%`,
                top: isFly ? '78%' : `${s.y}%`,
                transform: isFly
                  ? 'translate(-50%, -50%) scale(0.3)'
                  : `rotate(${s.rot}deg) translateY(${isDrag ? drag!.dy : 0}px)`,
                opacity: isFly ? 0 : 1,
                transition: isFly ? 'all .5s ease-in' : 'none',
              }}
              onPointerDown={(e) => onDown(e, s.id)}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
            >
              <TeaShootSvg kind={s.kind} size={44} />
            </div>
          );
        })}

        {/* 竹篮：这一篓，不是长期背包 */}
        <div className="pick-basket">
          <div className="pick-basket-leaves">
            {picked.slice(0, 8).map((k, i) => <TeaShootSvg key={i} kind={k} size={16} />)}
          </div>
          <BasketSvg width={72} />
          <div className="pick-basket-count">今日这一篓　{picked.length} / {basketNeed}</div>
        </div>

        {/* 采茶引导 */}
        {phase === 'teach' && (
          <div className="pick-overlay">
            <div className="pick-sayer">{presenterName}</div>
            <p className="pick-line">{tutorial[teachIdx]}</p>
            <button className="btn btn-primary" onClick={nextTeach}>
              {teachIdx < tutorial.length - 1 ? '嗯' : '好，我挑挑看'}
            </button>
          </div>
        )}

        {/* 看这一篓 */}
        {phase === 'result' && (
          <div className="pick-overlay">
            <div className="pick-sayer">{presenterName}</div>
            <p className="pick-line">{basketComment[quality]}</p>
            <button className="btn btn-primary" onClick={finish}>收工，去制茶</button>
          </div>
        )}
      </div>

      {phase === 'pick' && (
        <p className="hint pick-hint">{hint}</p>
      )}
    </div>
  );
}
