import { useState } from 'react';
import type { StepOutcome, StepId, StepParams, Difficulty, BasketQuality } from '../../core/types';
import { STEP_META, getRecipe, getStepParams, getTea } from '../../core/data/teas';
import { getComic } from '../../core/data/comics';
import { computeResult } from '../../core/making/scoring';
import { HangzhouGardenScene } from '../../components/scenes/HangzhouGardenScene';
import { getWeatherForDay, makingRate, zuoqingWeather } from '../../core/data/weather';
import { useGame } from '../../store/gameStore';
import PickingStep from './steps/PickingStep';
import DaoqingStep from './steps/DaoqingStep';
import ZuoqingStep from './steps/ZuoqingStep';
import ChaoRouStep from './steps/ChaoRouStep';
import RoastingStep from './steps/RoastingStep';
import WitheringStep from './steps/WitheringStep';
import RollingStep from './steps/RollingStep';
import FermentationStep from './steps/FermentationStep';
import DryingStep from './steps/DryingStep';
import FixationStep from './steps/FixationStep';
import ShapingStep from './steps/ShapingStep';

/** 难度只通过 params 的 casual 档覆盖实现，代码里没有 if (isXhs) */
function resolveParams(step: StepId, teaId: string, difficulty: Difficulty, bq?: BasketQuality): StepParams {
  // 以茶种为键的轻微手感差异（仅游戏参数），不在代码里散落 if (teaId === ...)
  return getStepParams(teaId, step, difficulty, bq);
}

/** 龙井（绿茶）采的是嫩芽，不是开面叶——阿青的口吻也跟着变。 */
const HZ_BUD_TUTORIAL = [
  '做龙井？那就不是这种采法了。',
  '不要开面叶，要嫩芽。',
  '一枚芽带一片叶最好；带两片也行，再大就老了。',
  '你挑挑看。',
];
const HZ_BUD_BASKET: Record<BasketQuality, string> = {
  good: '嗯，这一篓嫩得很齐。',
  normal: '有几片偏大了，也能做。',
  rough: '老嫩不匀——龙井最挑这个。',
};

/** 九曲红梅（红茶）也是嫩采：一芽一叶到一芽二叶初展都正当时，张开了、老了就不要。 */
const HZ_HONGCHA_TUTORIAL = [
  '做九曲红梅？那采的也是嫩叶。',
  '一芽一叶、一芽二叶初展，都正当时——叶子张开了、老了就不要。',
  '九曲红梅后面还要萎凋、揉捻、发酵，这一篓鲜叶就是底子。',
  '你挑挑看。',
];
const HZ_HONGCHA_BASKET: Record<BasketQuality, string> = {
  good: '芽叶正当时，拿去做红茶正合适。',
  normal: '有几片偏老，做出来汤会粗一点。',
  rough: '老嫩不匀——红茶就吃这个亏。',
};

/** 郭叔（杭州制茶师傅）的开工提点：按茶类 × 工序给一句，每道工序动手前看一眼。
 *  教学归师傅、剧情归别人——他只负责「怎么做茶」，不给数值、不开新系统。 */
const GU_SHU_HINTS: Partial<Record<'green' | 'hongcha', Partial<Record<StepId, string>>>> = {
  green: {
    fixation: '龙井这茶，火候要快，手也不能停。看准了，跟着我的手势来。',
    shaping: '龙井讲究形。抓、压、推，手上得有节奏。',
    drying: '最后收一收火，别急——香是烘出来的，不是烤出来的。',
  },
  hongcha: {
    withering: '红茶先别急。叶子摊开走水，萎凋不到，后面都白搭。',
    rolling: '揉捻手上有劲，但别把叶子揉碎了。',
    fermentation: '红茶制得好不好，就看这一堆——转色和香气，都得看准时候。',
    drying: '烘干稳着来，火一急，香就毛了。',
  },
};

/**
 * 制茶流程：完全由配方驱动（recipe.steps 决定走哪几步），
 * 岩茶（倒青/做青/炒揉/焙火）与红茶（萎凋/揉捻/发酵/烘干）共用同一套外壳。
 */
export default function MakingFlow() {
  const { difficulty, currentTeaId, player, finishMaking, unlockComic, setFlag } = useGame();
  const teaId = currentTeaId ?? 'rougui';
  const tea = getTea(teaId);
  const recipe = getRecipe(teaId);
  const steps = recipe.steps;
  const [index, setIndex] = useState(0);
  const [outcomes, setOutcomes] = useState<StepOutcome[]>([]);
  const [basketQuality, setBasketQuality] = useState<BasketQuality | undefined>(undefined);

  // 天气：复用现有 day + currentRegion，确定性（同一天同一天气），仅轻微影响倒青/做青节奏。
  const weatherId = getWeatherForDay(player.day, player.currentRegion || 'wuyishan');
  const weatherRate = makingRate(weatherId);
  const zuoqingW = zuoqingWeather(weatherId);

  const step = steps[index];
  const meta = STEP_META[step];
  const params = resolveParams(step, teaId, difficulty, basketQuality);

  // 采茶步骤的地区化（同一玩法，不同「跟着谁、在哪儿采」）：杭州=阿青+杭州茶园。
  const isHz = tea.regionId === 'hangzhou';
  // 同一片杭州茶园里，两种茶的采摘标准不同：九曲红梅=红茶嫩采（一芽一叶~一芽二叶初展），龙井=嫩芽采。
  const isLongjing = teaId === 'longjing';
  const pickTutorial = isHz ? (isLongjing ? HZ_BUD_TUTORIAL : HZ_HONGCHA_TUTORIAL) : undefined;
  const pickBasket = isHz ? (isLongjing ? HZ_BUD_BASKET : HZ_HONGCHA_BASKET) : undefined;
  const pickHint = isHz
    ? (isLongjing
      ? '挑嫩的摘——一枚芽带一片叶的最好。'
      : '要嫩的——一芽一叶、一芽二叶都行，开叶的不要。')
    : undefined;
  // 采茶教学按「采摘模式」记：开面采沿用 picking_taught；嫩芽采（龙井/九曲红梅）用 picking_taught_bud，
  // 各教各的——玩家在武夷山学过开面采，到杭州仍会看到嫩芽采的引导（采摘逻辑不同，必须告知）。
  const pickMode = tea.gameProfile.picking?.pickingMethod === 'bud' ? 'bud' : 'open-face';
  const pickTaughtFlag = pickMode === 'bud' ? 'picking_taught_bud' : 'picking_taught';
  // 采茶底部知识小字按茶种取（龙井/九曲红梅各有嫩采小字）；其余步骤沿用 STEP_META。
  const stepNote = step === 'picking'
    ? (tea.gameProfile.picking?.knowledgeNote ?? meta.simplificationNote)
    : meta.simplificationNote;

  function handle(o: StepOutcome) {
    const next = [...outcomes, o];
    setOutcomes(next);
    if (o.basketQuality) setBasketQuality(o.basketQuality); // 这一篓鲜叶的品质，后续工序消费
    // 知识漫画按茶区解锁：采茶的知识卡（武夷山风土）不给杭州茶弹——龙井/九曲红梅采茶不串武夷山知识。
    const comicId = STEP_META[step].knowledgeComicId;
    if (comicId) {
      const comic = getComic(comicId);
      if (comic && comic.regionId === tea.regionId) unlockComic(comicId);
    }
    if (index + 1 >= steps.length) {
      const result = computeResult(teaId, next, difficulty);
      const gain = result.grade === 'fine' ? 5 : result.grade === 'good' ? 3 : result.grade === 'normal' ? 2 : 1;
      finishMaking(result, gain);
    } else {
      setIndex(index + 1);
    }
  }

  const zuoqingScore = outcomes.find((o) => o.step === 'zuoqing')?.score;
  // 郭叔的开工提点：只对杭州茶给（茶类 × 工序一句），武夷山的教学仍在岩伯身上。
  const guHint = isHz ? GU_SHU_HINTS[tea.category as 'green' | 'hongcha']?.[step] : undefined;

  return (
    <>
      {guHint && (
        <p className="note" style={{ margin: '0 0 10px', color: 'var(--ink-2)' }}>
          <span style={{ color: 'var(--ink-3)' }}>郭叔：</span>「{guHint}」
        </p>
      )}
      <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="h-serif">{meta.gameName}</span>
        <span className="hint">{index + 1} / {steps.length}</span>
      </div>
      <div className="hint" style={{ marginBottom: 10 }}>
        现实工序：{meta.realProcessName}
      </div>

      {step === 'picking' && (
        <PickingStep
          params={params}
          difficulty={difficulty}
          teaId={teaId}
          taught={!!player.flags[pickTaughtFlag]}
          onTaught={() => setFlag(pickTaughtFlag, 1)}
          onDone={handle}
          presenterNpcId={isHz ? 'aqing' : undefined}
          presenterName={isHz ? '阿青 · 茶园里的孩子' : undefined}
          sceneNode={isHz ? <HangzhouGardenScene /> : undefined}
          tutorial={pickTutorial}
          basketComment={pickBasket}
          hint={pickHint}
        />
      )}
      {step === 'daoqing' && <DaoqingStep params={params} difficulty={difficulty} weatherRate={weatherRate} onDone={handle} />}
      {step === 'zuoqing' && <ZuoqingStep params={params} difficulty={difficulty} teaId={teaId} weather={zuoqingW} onDone={handle} />}
      {step === 'chao-rou' && <ChaoRouStep params={params} difficulty={difficulty} onDone={handle} />}
      {step === 'roasting' && (
        <RoastingStep
          params={params}
          difficulty={difficulty}
          teaId={teaId}
          proficiency={player.proficiency}
          day={player.day}
          zuoqingScore={zuoqingScore}
          onDone={handle}
        />
      )}
      {step === 'withering' && <WitheringStep params={params} difficulty={difficulty} weatherRate={weatherRate} onDone={handle} />}
      {step === 'rolling' && <RollingStep params={params} difficulty={difficulty} onDone={handle} />}
      {step === 'fermentation' && <FermentationStep params={params} difficulty={difficulty} day={player.day} onDone={handle} />}
      {step === 'fixation' && <FixationStep params={params} difficulty={difficulty} teaId={teaId} day={player.day} onDone={handle} />}
      {step === 'shaping' && <ShapingStep params={params} difficulty={difficulty} teaId={teaId} day={player.day} onDone={handle} />}
      {step === 'drying' && <DryingStep params={params} difficulty={difficulty} teaId={teaId} day={player.day} onDone={handle} />}

      <div className="hint" style={{ marginTop: 14, opacity: 0.7 }}>
        {stepNote}
      </div>
      </div>
    </>
  );
}
