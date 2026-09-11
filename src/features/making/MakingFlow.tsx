import { useState } from 'react';
import type { StepOutcome, StepId, StepParams, Difficulty, BasketQuality } from '../../core/types';
import { STEP_META, getRecipe } from '../../core/data/teas';
import { computeResult } from '../../core/making/scoring';
import { getWeatherForDay, makingRate, zuoqingWeather } from '../../core/data/weather';
import { useGame } from '../../store/gameStore';
import PickingStep from './steps/PickingStep';
import DaoqingStep from './steps/DaoqingStep';
import ZuoqingStep from './steps/ZuoqingStep';
import ChaoRouStep from './steps/ChaoRouStep';
import RoastingStep from './steps/RoastingStep';

/** 难度只通过 params 的 casual 档覆盖实现，代码里没有 if (isXhs) */
function resolveParams(step: StepId, difficulty: Difficulty, bq?: BasketQuality): StepParams {
  const r = getRecipe();
  const base = r.params[step] ?? {};
  const merged = difficulty === 'casual' ? { ...base, ...(r.casual?.[step] ?? {}) } : base;
  // 采茶产出的「这一篓」品质贯穿后续工序，轻量影响判断窗口；good / 尚未采茶 = 原行为
  return { ...merged, basketQuality: bq } as StepParams;
}

export default function MakingFlow() {
  const { difficulty, currentTeaId, player, finishMaking, unlockComic, setFlag } = useGame();
  const teaId = currentTeaId ?? 'rougui';
  const steps = getRecipe().steps;
  const [index, setIndex] = useState(0);
  const [outcomes, setOutcomes] = useState<StepOutcome[]>([]);
  const [basketQuality, setBasketQuality] = useState<BasketQuality | undefined>(undefined);

  // 天气：复用现有 day + currentRegion，确定性（同一天同一天气），仅轻微影响倒青/做青节奏。
  const weatherId = getWeatherForDay(player.day, player.currentRegion || 'wuyishan');
  const weatherRate = makingRate(weatherId);
  const zuoqingW = zuoqingWeather(weatherId);

  const step = steps[index];
  const meta = STEP_META[step];
  const params = resolveParams(step, difficulty, basketQuality);

  function handle(o: StepOutcome) {
    const next = [...outcomes, o];
    setOutcomes(next);
    if (o.basketQuality) setBasketQuality(o.basketQuality); // 这一篓鲜叶的品质，后续工序消费
    if (STEP_META[step].knowledgeComicId) unlockComic(STEP_META[step].knowledgeComicId);
    if (index + 1 >= steps.length) {
      const result = computeResult(teaId, next, difficulty);
      const gain = result.grade === 'fine' ? 5 : result.grade === 'good' ? 3 : result.grade === 'normal' ? 2 : 1;
      finishMaking(result, gain);
    } else {
      setIndex(index + 1);
    }
  }

  const zuoqingScore = outcomes.find((o) => o.step === 'zuoqing')?.score;

  return (
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
          taught={!!player.flags['picking_taught']}
          onTaught={() => setFlag('picking_taught', 1)}
          onDone={handle}
        />
      )}
      {step === 'daoqing' && <DaoqingStep params={params} difficulty={difficulty} weatherRate={weatherRate} onDone={handle} />}
      {step === 'zuoqing' && <ZuoqingStep params={params} difficulty={difficulty} weather={zuoqingW} onDone={handle} />}
      {step === 'chao-rou' && <ChaoRouStep params={params} difficulty={difficulty} onDone={handle} />}
      {step === 'roasting' && (
        <RoastingStep
          params={params}
          difficulty={difficulty}
          teaId={teaId}
          proficiency={player.proficiency}
          zuoqingScore={zuoqingScore}
          onDone={handle}
        />
      )}

      <div className="hint" style={{ marginTop: 14, opacity: 0.7 }}>
        {meta.simplificationNote}
      </div>
    </div>
  );
}
