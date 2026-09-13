import type { FaultTag } from '../types';

// ─────────── 熟客回访文案（茶集市轻量剧情反馈） ───────────
// 失败茶 → 熟客抱怨；上品茶 → 熟客好评（含「向茶友安利」）。
// 纯 NPC 对白层面的反馈：不是声望/满意度/口碑数值，无任何奖惩。
// 文案按「茶种 + 失败原因」差异化，让玩家意识到制茶选择会影响别人喝到的茶。

export interface TeaFeedback {
  teaId: string;
  kind: 'fail' | 'fine';
  fault?: string; // FaultTag（失败茶携带）
}

export interface FeedbackLine {
  speaker: string;
  text: string;
}

/** 失败茶的熟客抱怨：先按 茶种+具体失败原因 精确匹配，再按茶种兜底。 */
const FAIL_LINES: Record<string, Partial<Record<FaultTag, string>> & { default: string }> = {
  jiuquhongmei: {
    ferment_short: '上回那包红茶喝着还有股青气，是不是发酵还没到时候？',
    ferment_over: '那包九曲红梅香气有点闷，喝起来也不够鲜。',
    wither_short: '这茶喝着还有点生，香气好像没完全出来。',
    wither_over: '上回那红茶香气偏淡，是不是叶子摊得太过了？',
    drying_over: '那包红茶火气有点重，甜香被压住了一些。',
    default: '上回那包九曲红梅，喝着总觉得差了点甜润。',
  },
  longjing: {
    picking_poor: '上回那包龙井喝着不够鲜，叶子是不是采得晚了？',
    fixation_under: '这茶的香气好像没炒出来，喝着少了点清鲜味。',
    fixation_over: '上回那龙井有点火味，鲜爽劲儿被盖住了。',
    shaping_loose: '那包龙井泡开叶子散散的，形的功夫还差一点。',
    default: '上回那包龙井，鲜爽劲儿差了些。',
  },
  rougui: {
    roast_over: '你上回那岩茶火味有点重，把香气都盖住了。',
    roast_hasty: '那包肉桂火急了点，香是有了，就是没沉下来。',
    zuoqing_light: '那泡岩茶香气没怎么出来，感觉做青还差了点功夫。',
    zuoqing_hasty: '上回那肉桂喝着有点涩，是不是摇青摇急了？',
    default: '上回那肉桂，桂皮香没出来，喝着有点闷。',
  },
  shuixian: {
    roast_over: '上回那水仙焙重了，兰香都快没了。',
    roast_hasty: '那包水仙火气没退，喝着有点燥。',
    zuoqing_light: '上回那水仙汤不够厚，做青好像没做透。',
    default: '上回那水仙，汤感薄了些，差点意思。',
  },
  dahongpao: {
    roast_over: '上回那大红袍火太重，岩骨还在，花香没了。',
    zuoqing_light: '那泡大红袍香气平平的，做青好像没到位。',
    default: '上回那大红袍，岩韵没出来，喝着平平。',
  },
};

/** 上品茶的熟客好评（按茶种，带「向茶友安利」的生活气）。 */
const FINE_LINES: Record<string, string> = {
  longjing: '你上回那包龙井真不错，清清爽爽的，香气特别鲜。',
  jiuquhongmei: '那包九曲红梅我喝着真舒服，甜香很顺——我还带给朋友尝了一杯，他问我是在哪儿买的。',
  rougui: '你这肉桂香得很，一开盖那股香就出来了，我都跟茶友夸了好几回。',
  shuixian: '你这水仙喝起来真顺，汤感又厚又滑，喝完嘴里还留着香。',
  dahongpao: '这大红袍做得漂亮，我带去给几个老茶友喝，他们都问是哪家的。',
};

const FINE_TAIL = '这么好的茶，我可得跟几个茶友说一声。';

/** 由待回访状态生成熟客回访对白（小满引出 + 熟客反馈）。 */
export function buildTeaFeedback(fb: TeaFeedback): FeedbackLine[] {
  if (fb.kind === 'fine') {
    const praise = FINE_LINES[fb.teaId] ?? '你上回那包茶真不错，喝着很舒服。';
    return [
      { speaker: '小满', text: '哎，那位熟客又来了，一进门就笑。' },
      { speaker: '熟客', text: praise },
      { speaker: '熟客', text: FINE_TAIL },
    ];
  }
  const fault = (fb.fault ?? 'default') as FaultTag;
  const table = FAIL_LINES[fb.teaId];
  const complaint = (table && (table[fault] ?? table.default)) ?? '上回那包茶，喝着总觉得差了点意思。';
  return [
    { speaker: '小满', text: '对了，前几天买你那包茶的客人又来了。' },
    { speaker: '熟客', text: complaint },
  ];
}
