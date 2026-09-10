import { useEffect, useMemo, useRef, useState } from 'react';
import type { StepOutcome, StepParams, FaultTag, Difficulty, BasketQuality } from '../../../core/types';
import { TeaShootSvg, BasketSvg } from '../../../components/art/Art';
import { TeaGardenScene } from '../../../components/scenes/TeaGardenScene';
import { NpcPortrait } from '../../../components/art/NpcPortrait';
import { getTea } from '../../../core/data/teas';

/**
 * 采茶：开面采。
 * 玩家面对的是「一梢一梢的茶」，不是散落的彩色叶子。
 * 判断依据是芽叶关系 / 叶片大小 / 张开程度，颜色只是同色系深浅，不当答案。
 * 产出「这一篓鲜叶」的隐藏品质档 basketQuality，供后续制茶轻量影响容错。
 */

type Kind = 'good' | 'tender' | 'old';

/** 阿秀的引导：是跟着人学采茶，不是读教程弹窗 */
const TUTORIAL = [
  '先别急着摘。',
  '看看这一梢。',
  '有些太嫩，有些又老了。',
  '今天咱们采开面合适的。',
  '你自己挑挑看。',
];

/** 阿秀对这一篓的评价：前台只给自然语言，隐藏档不显示 */
const BASKET_COMMENT: Record<BasketQuality, string> = {
  good: '嗯，这一篓叶子挺齐。',
  normal: '有几片稍老了，不过还能做。',
  rough: '这篓叶子有点杂，后面得仔细做。',
};

interface Props {
  params: StepParams;
  difficulty: Difficulty;
  teaId: string;
  taught?: boolean;        // 是否已引导过（由外层按存档传入，保持本组件无状态依赖）
  onTaught?: () => void;
  onDone: (o: StepOutcome) => void;
}

export default function PickingStep({ difficulty, teaId, taught, onTaught, onDone }: Props) {
  const cfg = getTea(teaId).gameProfile.picking;
  const attemptCount = cfg?.attemptCount ?? 12;   // 树上可选的茶梢总数（有限选择）
  const basketNeed = cfg?.basketNeed ?? 8;        // 采满「这一篓」所需
  const tolerance = (cfg?.tolerance ?? 0.6) - (difficulty === 'casual' ? 0.1 : 0);

  const [phase, setPhase] = useState<'teach' | 'pick' | 'result'>(taught ? 'pick' : 'teach');
  const [teachIdx, setTeachIdx] = useState(0);
  const [removed, setRemoved] = useState<number[]>([]);
  const [picked, setPicked] = useState<Kind[]>([]);
  const [flying, setFlying] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ id: number; startY: number; dy: number } | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  // 茶梢分布：形态差异（good 7 / tender 3 / old 2），位置沿茶垄散开
  const shoots = useMemo(() => {
    const kindOf = (i: number): Kind => {
      const r = i % 12;
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
  }, [attemptCount]);

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
    if (teachIdx < TUTORIAL.length - 1) { setTeachIdx(teachIdx + 1); return; }
    onTaught?.();
    setPhase('pick');
  }

  const goodCount = picked.filter((k) => k === 'good').length;
  const ratio = picked.length ? goodCount / picked.length : 0;
  const quality: BasketQuality =
    ratio >= tolerance ? 'good' : ratio >= tolerance - 0.2 ? 'normal' : 'rough';

  function finish() {
    const score = quality === 'good' ? 88 : quality === 'normal' ? 70 : 52;
    const faults: FaultTag[] = quality === 'rough' ? ['picking_poor'] : [];
    onDone({
      step: 'picking',
      score,
      faults,
      visualState: { dryColor: '#8fae6a', shape: 'flat', edgeRed: 0, sheen: 0.2 },
      comment: BASKET_COMMENT[quality],
      basketQuality: quality,
    });
  }

  return (
    <div className="pick-wrap">
      <div className="pick-stage">
        {/* 场景：武夷山茶园（环境层，不含人物） */}
        <div className="pick-bg"><TeaGardenScene /></div>

        {/* 阿秀：站在茶园里的人，不是头像卡片 */}
        <div className="pick-axiu"><NpcPortrait id="axiu" /></div>

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

        {/* 阿秀引导 */}
        {phase === 'teach' && (
          <div className="pick-overlay">
            <div className="pick-sayer">阿秀 · 采茶人</div>
            <p className="pick-line">{TUTORIAL[teachIdx]}</p>
            <button className="btn btn-primary" onClick={nextTeach}>
              {teachIdx < TUTORIAL.length - 1 ? '嗯' : '好，我挑挑看'}
            </button>
          </div>
        )}

        {/* 阿秀看这一篓 */}
        {phase === 'result' && (
          <div className="pick-overlay">
            <div className="pick-sayer">阿秀 · 采茶人</div>
            <p className="pick-line">{BASKET_COMMENT[quality]}</p>
            <button className="btn btn-primary" onClick={finish}>收工，去制茶</button>
          </div>
        )}
      </div>

      {phase === 'pick' && (
        <p className="hint pick-hint">按住茶梢，往下一带，就摘下来了。</p>
      )}
    </div>
  );
}
