// 泡茶评价系统（数据 + 纯逻辑，禁止 import React / DOM）。
//
// 设计要点：
// 1. 出汤时机以「茶种最佳窗口」判定，而非背秒数；窗口差异体现在
//    「最佳判断点 / 容错率 / 茶汤状态反馈」，不暴露具体时长。
// 2. 评价 = 茶种 × 制茶品质 × 出汤时机，模板 + 条件词库驱动，
//    避免「前缀 + 香气句 + 汤感句 + 出汤句」的机械拼接。
// 3. 明确区分「制茶问题」与「泡茶问题」：
//    优秀茶底 + 失误出汤 → 可惜了这撮好茶；
//    一般茶底 + 到位出汤 → 这一泡把茶底发挥出来了。
// 4. 上方两段式品鉴（headline + body）解释「为什么得到这个结果」；
//    周伯的口语化反馈由 BrewingFlow 的 ZhouComment 单独负责，互不重复。

import type { Grade } from '../types';

export type SteepTiming = 'early' | 'good' | 'late';

export interface TeaSteepProfile {
  /** 最佳出汤窗口（t 空间 0..1，不暴露秒数） */
  window: { start: number; end: number };
  /** 汤色推进速度，仅微调，避免"背秒数"；standard 模式基准 */
  steepRate: number;
  /** 3~4 个阶段文案，按 t 从小到大 */
  stages: string[];
  /** 与 stages 等长的 t 分界（每个为该阶段上限） */
  stageCut: number[];
}

export const TEA_STEEP: Record<string, TeaSteepProfile> = {
  // 肉桂：最佳窗口较早、相对较窄 → 「果断出汤」
  rougui: {
    window: { start: 0.46, end: 0.68 },
    steepRate: 0.0084,
    stages: [
      '茶汤尚浅，桂皮香还藏着几分……',
      '香气渐渐张扬起来……',
      '桂皮香已经很明显了，茶汤也渐浓……',
      '茶汤渐厚，涩感似乎开始显露……',
    ],
    stageCut: [0.4, 0.58, 0.74, 1.01],
  },
  // 水仙：最佳窗口相对较宽 → 「从容观察」
  shuixian: {
    window: { start: 0.38, end: 0.78 },
    steepRate: 0.0076,
    stages: [
      '汤色透亮，兰花香还淡淡的……',
      '香气慢慢舒展开，汤感也柔了起来……',
      '兰香渐显，入口该是温润的……',
      '茶汤更稠了，再泡怕失了那点轻盈……',
    ],
    stageCut: [0.34, 0.52, 0.72, 1.01],
  },
  // 大红袍：窗口中等、稍靠后 → 「观察香气与层次展开」
  dahongpao: {
    window: { start: 0.5, end: 0.8 },
    steepRate: 0.008,
    stages: [
      '汤色初成，香气还敛在里层……',
      '岩韵初显，层次一点点铺开……',
      '香气与汤感都起来了，正到好处……',
      '汤色转深，再不出汤就要压住那股清润……',
    ],
    stageCut: [0.42, 0.6, 0.76, 1.01],
  },
  // 王霸茶：喜剧茶，给一个中性窗口即可（周伯反馈在 ZhouComment 单独处理）
  wangba: {
    window: { start: 0.42, end: 0.74 },
    steepRate: 0.008,
    stages: [
      '茶汤不深，香也没怎么起来……',
      '汤色平平，闻着没什么特别……',
      '这一泡看着还行，也不算惊艳……',
      '汤色渐浓，再泡怕是更寡了……',
    ],
    stageCut: [0.36, 0.54, 0.72, 1.01],
  },
  // 九曲红梅（杭州 · 红茶）：红亮甜润，出汤宜快，久泡易生涩。
  jiuquhongmei: {
    window: { start: 0.4, end: 0.72 },
    steepRate: 0.0082,
    stages: [
      '汤色浅浅地泛红，甜香还含着……',
      '红亮起来了，梅香一丝丝往外透……',
      '汤色红亮，甜香正浓，该出汤了……',
      '汤色转暗、发浑，再泡就要涩了……',
    ],
    stageCut: [0.36, 0.54, 0.72, 1.01],
  },
  // 西湖龙井（杭州 · 绿茶，预留）：清绿鲜爽，窗口偏早。
  longjing: {
    window: { start: 0.34, end: 0.66 },
    steepRate: 0.0086,
    stages: [
      '汤色清浅，豆香还淡着……',
      '清绿透亮，鲜爽气开始出来……',
      '汤色嫩绿，香气清爽，该出汤了……',
      '汤色转黄，再泡就要出苦涩了……',
    ],
    stageCut: [0.32, 0.5, 0.68, 1.01],
  },
};

export function steepProfile(teaId: string): TeaSteepProfile {
  return TEA_STEEP[teaId] ?? TEA_STEEP['rougui'];
}

/** 当前茶汤状态文案（实时反馈用，按 t 推进） */
export function steepStageText(teaId: string, t: number): string {
  const p = steepProfile(teaId);
  for (let i = 0; i < p.stages.length; i++) {
    if (t <= p.stageCut[i]) return p.stages[i];
  }
  return p.stages[p.stages.length - 1];
}

/** 由茶种窗口判定出汤时机：早 / 正好 / 晚 */
export function steepTiming(teaId: string, t: number): SteepTiming {
  const { window } = steepProfile(teaId);
  if (t < window.start) return 'early';
  if (t > window.end) return 'late';
  return 'good';
}

export function timingLabel(timing: SteepTiming): string {
  return timing === 'early' ? '出汤早了些' : timing === 'late' ? '出汤晚了些' : '出汤正好';
}

// ───────────────── 评价：茶种词库 + 组合模板 ─────────────────

interface TeaVoice {
  // 香气（泡茶维度，按出汤时机选）
  aromaOk: string;
  aromaEarly: string;
  aromaLate: string;
  // 汤感（泡茶维度，按出汤时机选）
  soupOk: string;
  soupEarly: string;
  soupLate: string;
  // 制茶维度（按制茶品质选）
  makeGreat: string;
  makeGood: string;
  makePlain: string;
  makePoor: string;
}

// 三茶评价语言本身即体现茶种性格，而非只替换茶名。
const TEA_VOICE: Record<string, TeaVoice> = {
  rougui: {
    aromaOk: '桂皮香窜得高，辛锐又利落',
    aromaEarly: '桂皮香还憋着，没怎么扬起来',
    aromaLate: '桂皮香被泡得发闷，透出几分涩',
    soupOk: '汤感浓烈爽利，落口回甘快',
    soupEarly: '汤还薄，滋味没撑开',
    soupLate: '汤变厚了，涩感也跟着上来',
    makeGreat: '茶底做得利落，条索紧实、香气足',
    makeGood: '茶底不错，香气立得住',
    makePlain: '茶底中规中矩，不算惊艳',
    makePoor: '茶底火没控稳，香气有些发闷',
  },
  shuixian: {
    aromaOk: '兰花香清幽，慢慢在杯里舒展开',
    aromaEarly: '兰花香还淡着，没完全打开',
    aromaLate: '花香被泡得有些浊，失了那点清',
    soupOk: '汤感醇厚柔滑，温润顺喉',
    soupEarly: '汤还单薄，温润感没出来',
    soupLate: '汤变稠浊了，少了那点轻盈',
    makeGreat: '茶底做得通透，枞味清楚、汤感厚',
    makeGood: '茶底不错，枞味立得住',
    makePlain: '茶底平稳，没太多惊喜',
    makePoor: '茶底偏薄，枞味没立稳',
  },
  dahongpao: {
    aromaOk: '香气一层层叠上来，岩韵清楚',
    aromaEarly: '香气还敛在里层，层次没出来',
    aromaLate: '香气给泡闷了，层次压平了',
    soupOk: '汤感醇厚，回甘里的韵味长',
    soupEarly: '汤还浅，韵味没撑开',
    soupLate: '汤色转深，清润的回甘被压住',
    makeGreat: '茶底做得扎实，岩骨花香都在',
    makeGood: '茶底不错，岩韵立得住',
    makePlain: '茶底尚可，岩韵不算很突出',
    makePoor: '茶底欠了火候，岩韵没立起来',
  },
  wangba: {
    aromaOk: '香气平平，没什么冲劲',
    aromaEarly: '香气还没起来，寡淡',
    aromaLate: '泡得更没精神了',
    soupOk: '汤感一般，喝着不功不过',
    soupEarly: '汤太淡，没什么内容',
    soupLate: '汤发闷，更没滋味',
    makeGreat: '茶底本身也就那样',
    makeGood: '茶底尚可',
    makePlain: '茶底平平',
    makePoor: '茶底差强人意',
  },
  jiuquhongmei: {
    aromaOk: '甜香里透着一丝梅子香，红亮又好闻',
    aromaEarly: '甜香还淡着，红亮没完全出来',
    aromaLate: '甜香被泡闷了，隐隐生出涩意',
    soupOk: '汤感红亮甜润，落口顺滑',
    soupEarly: '汤还薄，甜润感没撑开',
    soupLate: '汤色发暗，甜润里带上涩了',
    makeGreat: '茶底发酵得匀，红亮甜香都在',
    makeGood: '茶底不错，甜香立得住',
    makePlain: '茶底中规中矩，甜香不算突出',
    makePoor: '茶底发酵没走匀，香有些闷',
  },
  longjing: {
    aromaOk: '豆香清鲜，带着一点嫩栗子的甜',
    aromaEarly: '香气还淡，鲜爽没打开',
    aromaLate: '鲜爽被泡老了，透出一点涩',
    soupOk: '汤感清绿鲜爽，回甘干净',
    soupEarly: '汤还寡，鲜爽没起来',
    soupLate: '汤色转黄，清鲜里带出涩口',
    makeGreat: '茶底炒得透亮，鲜爽干净',
    makeGood: '茶底不错，鲜爽立得住',
    makePlain: '茶底平常，鲜爽一般',
    makePoor: '茶底没炒透，青气还压着',
  },
};

function voiceOf(teaId: string): TeaVoice {
  return TEA_VOICE[teaId] ?? TEA_VOICE['rougui'];
}

type MakeLevel = 'poor' | 'plain' | 'good' | 'great';
type BrewLevel = 'miss' | 'ok';

function makeLevelOf(grade: Grade): MakeLevel {
  return grade === 'fine' ? 'great' : grade === 'good' ? 'good' : grade === 'normal' ? 'plain' : 'poor';
}
function brewLevelOf(timing: SteepTiming): BrewLevel {
  return timing === 'good' ? 'ok' : 'miss';
}

interface BrewEvalResult {
  /** 总结：定性这一杯 */
  headline: string;
  /** 品鉴：解释为什么得到这个结果（含茶种语言） */
  body: string;
}

interface Resolved {
  aroma: string;
  soup: string;
  make: string;
}

type Tmpl = (r: Resolved, seed: number) => BrewEvalResult;

function pick<T>(arr: T[], seed: number): T {
  return arr[((seed % arr.length) + arr.length) % arr.length];
}

function hashSeed(...parts: string[]): number {
  let h = 0;
  for (const p of parts) for (let i = 0; i < p.length; i++) h = (h * 31 + p.charCodeAt(i)) & 0xffff;
  return h;
}

// 组合模板：制茶等级 × 泡茶等级。
// 每个模板在茶种词库上自然成句，必要时提供变体（按输入确定性选取，避免每次重渲染跳动）。
const TEMPLATES: Record<`${MakeLevel}:${BrewLevel}`, Tmpl> = {
  // 制茶优秀 + 泡茶到位 → 真正的好茶
  'great:ok': (r) => ({
    headline: '茶底好，这一泡也泡得到位。',
    body: `${r.make}；${r.aroma}，入口${r.soup}。制茶、泡茶都没掉链子，是一泡真正的好茶。`,
  }),
  // 制茶优秀 + 泡茶失误 → 可惜了这撮好茶
  'great:miss': (r, seed) =>
    pick(
      [
        {
          headline: '可惜了这撮好茶。',
          body: `${r.make}，本该出彩——可${r.aroma}，${r.soup}。茶底是好的，是这一泡没把它泡出来。`,
        },
        {
          headline: '这撮好茶，被这一泡耽误了。',
          body: `${r.make}；偏偏${r.aroma}，${r.soup}。好底子没泡开，怪可惜的。`,
        },
      ],
      seed,
    ),
  // 制茶良好 + 泡茶到位
  'good:ok': (r) => ({
    headline: '茶底不错，泡得也顺。',
    body: `${r.make}；${r.aroma}，汤${r.soup}。制茶泡茶都对路，喝着舒服。`,
  }),
  // 制茶良好 + 泡茶失误 → 好底子叫这一泡糟蹋了
  'good:miss': (r, seed) =>
    pick(
      [
        {
          headline: '好底子，叫这一泡糟蹋了。',
          body: `${r.make}，本该更出彩——可${r.aroma}，${r.soup}。茶不赖，是出汤没拿稳。`,
        },
        {
          headline: '可惜，这一泡没托住茶底。',
          body: `${r.make}；偏偏${r.aroma}，${r.soup}。好茶底没泡出该有的样子。`,
        },
      ],
      seed,
    ),
  // 制茶一般 + 泡茶到位 → 这一泡把茶底发挥出来了
  'plain:ok': (r, seed) =>
    pick(
      [
        {
          headline: '茶底虽平常，这一泡倒是泡出了滋味。',
          body: `${r.make}，${r.aroma}，入口${r.soup}——茶底一般，倒让你这手泡法发挥了出来。`,
        },
        {
          headline: '平平的茶底，被你泡出了几分意思。',
          body: `${r.make}；可${r.aroma}，${r.soup}，这一泡把茶底发挥出来了。`,
        },
      ],
      seed,
    ),
  // 制茶一般 + 泡茶失误
  'plain:miss': (r) => ({
    headline: '茶底一般，这一泡也没帮上忙。',
    body: `${r.make}；${r.aroma}，${r.soup}。制茶泡茶两头都平，这杯就平淡了些。`,
  }),
  // 制茶较差 + 泡茶到位 → 茶底差，但泡得用心
  'poor:ok': (r, seed) =>
    pick(
      [
        {
          headline: '茶底欠了些，这一泡算尽力了。',
          body: `${r.make}；好在${r.aroma}，${r.soup}——泡得用心，只是底子托不住。`,
        },
        {
          headline: '底子差，泡得倒不敷衍。',
          body: `${r.make}。不过${r.aroma}，${r.soup}，泡法没问题，是茶底本身没立住。`,
        },
      ],
      seed,
    ),
  // 制茶较差 + 泡茶失误 → 两处都没稳住
  'poor:miss': (r) => ({
    headline: '制茶、泡茶两处都没稳住。',
    body: `${r.make}；${r.aroma}，${r.soup}。茶底和这一泡都没顾好，这杯差了点意思。`,
  }),
};

/**
 * 生成两段式品鉴评价。
 * 文字评价不依赖 brewScore 总分，只由「茶种 × 制茶品质 × 出汤时机」决定。
 */
export function evaluateBrew(params: { teaId: string; grade: Grade; timing: SteepTiming }): BrewEvalResult {
  const v = voiceOf(params.teaId);
  const ml = makeLevelOf(params.grade);
  const bl = brewLevelOf(params.timing);
  const aroma = params.timing === 'early' ? v.aromaEarly : params.timing === 'late' ? v.aromaLate : v.aromaOk;
  const soup = params.timing === 'early' ? v.soupEarly : params.timing === 'late' ? v.soupLate : v.soupOk;
  const make = ml === 'great' ? v.makeGreat : ml === 'good' ? v.makeGood : ml === 'plain' ? v.makePlain : v.makePoor;
  const tmpl = TEMPLATES[`${ml}:${bl}`];
  const seed = hashSeed(params.teaId, params.grade, params.timing);
  return tmpl({ aroma, soup, make }, seed);
}
