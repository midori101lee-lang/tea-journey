import type { Tea, ProcessingRecipe, StepMeta, StepId, Difficulty, StepParams, BasketQuality } from '../types';

// ─────────── 三款武夷岩茶（事实取自资料库 S/B 级；游戏差异全部在 gameProfile） ───────────

export const TEAS: Tea[] = [
  {
    id: 'rougui',
    name: '肉桂',
    fullName: '武夷岩茶 · 肉桂',
    category: 'yancha',
    regionId: 'wuyishan',
    basePrice: { fail: 3, normal: 14, good: 26, fine: 42 },
    unlockCondition: { type: 'initial' },
    facts: [
      { level: 'S', source: 'GB/T 18745 地理标志产品', category: 'identity', text: '武夷岩茶代表性品种，以香气高锐著称，常见桂皮香、乳香或蜜桃香。' },
      { level: 'S', source: '武夷岩茶制作技艺（国家级非遗）', category: 'making', text: '做青需摇出绿叶红镶边；焙火吃火较重，是岩茶「岩骨花香」的来源之一。' },
      { level: 'B', source: '地方制茶经验', category: 'roast', text: '民间常说肉桂「吃火」，足火下香气更显沉稳。' },
    ],
    copies: [
      { kind: 'player_hint', text: '香气很有存在感的茶。' },
      { kind: 'npc_opinion', text: '岩伯：「肉桂香冲，焙火一足，满屋都是它的味。」' },
    ],
    gameProfile: {
      difficulty: 2,
      roastBias: { center: 0.06, width: -0.02 }, // 仅游戏参数：绿区略偏急
      picking: { pickingMethod: 'open-face', targetMaturity: 'middle-open', attemptCount: 12, basketNeed: 8, tolerance: 0.6 },
      unlockCondition: { type: 'initial' },
    },
  },
  {
    id: 'shuixian',
    name: '水仙',
    fullName: '武夷岩茶 · 水仙',
    category: 'yancha',
    regionId: 'wuyishan',
    basePrice: { fail: 3, normal: 12, good: 24, fine: 38 },
    unlockCondition: { type: 'initial' },
    facts: [
      { level: 'S', source: 'GB/T 18745 地理标志产品', category: 'identity', text: '武夷岩茶主要品种之一，素有「醇不过水仙」之说，滋味醇厚。' },
      { level: 'B', source: '地方品饮经验', category: 'taste', text: '水仙汤感偏厚、水路顺，常带兰花香或木质香，新手较易接受。' },
      { level: 'C', source: '民间传说（非定论）', category: 'story', text: '有「水仙是花还是茶」的趣谈——水仙是茶树品种，不是花。' },
    ],
    copies: [
      { kind: 'player_hint', text: '和肉桂不是一个路子，比较稳。' },
      { kind: 'npc_opinion', text: '周伯：「水仙顺口，不像肉桂那么冲，慢慢喝才有意思。」' },
    ],
    gameProfile: {
      difficulty: 1,
      roastBias: { center: -0.05, width: 0.04 }, // 仅游戏参数：绿区略宽、偏稳
      picking: { pickingMethod: 'open-face', targetMaturity: 'middle-open', attemptCount: 12, basketNeed: 8, tolerance: 0.66 },
      unlockCondition: { type: 'initial' },
    },
  },
  {
    id: 'dahongpao',
    name: '大红袍',
    fullName: '武夷岩茶 · 大红袍',
    category: 'yancha',
    regionId: 'wuyishan',
    basePrice: { fail: 3, normal: 18, good: 32, fine: 50 },
    // M2：大红袍不作「高级等级茶」，解锁由母树/游历内容触发，不形成等级暗示
    unlockCondition: { type: 'motherTree', note: '认得那几棵母树之后，老陈说你也试试大红袍。' },
    facts: [
      { level: 'S', source: '武夷岩茶制作技艺（国家级非遗）', category: 'identity', text: '大红袍是武夷岩茶的代表性名丛，拼配与独丛皆有，香气滋味讲究综合。' },
      { level: 'A', source: '武夷山地方史料', category: 'story', text: '九龙窠崖壁曾有六株母树，被视为武夷岩茶的重要标志物（【传说】与史实并存，详见母树漫画）。' },
      { level: 'B', source: '品饮经验', category: 'taste', text: '好的大红袍岩韵明显、回味带甜，但「大红袍 = 肉桂 + 水仙」的说法并不准确。' },
    ],
    copies: [
      { kind: 'player_hint', text: '说到武夷山，外人先问的就是它。' },
      { kind: 'npc_opinion', text: '老陈：「大红袍不是一棵茶，是一类茶。别听人一句『这就是大红袍』就信了。」' },
    ],
    gameProfile: {
      difficulty: 3,
      roastBias: { center: 0, width: 0 },
      picking: { pickingMethod: 'open-face', targetMaturity: 'middle-open', attemptCount: 12, basketNeed: 8, tolerance: 0.52 },
      unlockCondition: { type: 'motherTree', note: '认得那几棵母树之后，老陈说你也试试大红袍。' },
    },
  },
  {
    id: 'wangba',
    name: '景区王霸茶',
    fullName: '武夷山 · 景区王霸茶',
    category: 'yancha',
    regionId: 'wuyishan',
    basePrice: { fail: 3, normal: 14, good: 26, fine: 42 },
    // 剧情专用茶：永不进入「自己制作」选择（需 story_clue，正常游戏不会触发），仅由茶集市偶遇的老贾售出。
    unlockCondition: { type: 'story', note: '景区王霸茶只能从茶集市偶遇的老贾处买来，不能自己制作。' },
    facts: [],
    copies: [
      { kind: 'player_hint', text: '老板说自家做的，喝着好像没那么神。' },
    ],
    gameProfile: {
      difficulty: 1,
      roastBias: { center: 0, width: 0 },
      picking: { pickingMethod: 'open-face', targetMaturity: 'middle-open', attemptCount: 12, basketNeed: 8, tolerance: 0.6 },
      unlockCondition: { type: 'story', note: '剧情专用茶，不可制作。' },
    },
    // 特殊剧情标记：周伯在泡茶时给特殊喜剧评价（不暴露「差」，只轻描淡写）。
    specialReview: 'wangba',
  },
];

export function getTea(id: string): Tea {
  const t = TEAS.find((x) => x.id === id);
  if (!t) throw new Error(`unknown tea: ${id}`);
  return t;
}

export function isTeaUnlocked(tea: Tea, player: { flags: Record<string, boolean | number>; metNpcs: string[] }): boolean {
  const c = tea.unlockCondition;
  if (c.type === 'initial') return true;
  if (c.type === 'motherTree') return !!player.flags['saw_mother_tree'];
  if (c.type === 'exploration') return !!player.flags['explored'];
  if (c.type === 'story') return !!player.flags['story_clue'];
  return true;
}

// ─────────── 工序元数据（现实工艺 → 游戏工序映射，数据化） ───────────

export const STEP_META: Record<StepId, StepMeta> = {
  picking: {
    id: 'picking',
    gameName: '采茶',
    realProcessName: '采摘',
    simplificationNote: '岩茶开面采，非嫩芽采；游戏做三类茶青判断（太嫩/合适/太老）',
    knowledgeComicId: 'comic_wuyishan_terroir',
  },
  daoqing: {
    id: 'daoqing',
    gameName: '倒青',
    realProcessName: '倒青 / 萎凋（复式萎凋·两晒两晾）',
    simplificationNote: '两晒两晾压缩为两轮晒晾交替',
  },
  zuoqing: {
    id: 'zuoqing',
    gameName: '做青',
    realProcessName: '做青（晾青↔摇青↔静置）',
    simplificationNote: '看青做青压缩为 3-4 轮观察判断；叶缘转朱砂红为真实特征',
    knowledgeComicId: 'comic_why_zuoqing',
  },
  'chao-rou': {
    id: 'chao-rou',
    gameName: '炒揉',
    realProcessName: '炒青 + 初揉 + 复炒 + 复揉（双炒双揉）',
    simplificationNote: '非遗「双炒双揉」保留为一个 step 内两轮；趁热揉为真实要求',
  },
  roasting: {
    id: 'roasting',
    gameName: '焙火',
    realProcessName: '初焙 + 复焙 / 吃火 / 补火（低温久烘）',
    simplificationNote: '「低温久烘」译为多轮稳定累积；扬簸凉索拣剔以旁白带过',
  },
  withering: { id: 'withering', gameName: '摊晾', realProcessName: '萎凋', simplificationNote: '通用组件，未来绿茶用' },
  fixation: { id: 'fixation', gameName: '杀青', realProcessName: '杀青', simplificationNote: '通用组件，未来绿茶用' },
  rolling: { id: 'rolling', gameName: '揉捻', realProcessName: '揉捻', simplificationNote: '通用组件' },
  drying: { id: 'drying', gameName: '干燥', realProcessName: '干燥', simplificationNote: '通用组件' },
  fermentation: { id: 'fermentation', gameName: '发酵', realProcessName: '发酵', simplificationNote: '未来红茶用' },
};

// ─────────── 武夷岩茶配方（一个配方覆盖三茶；差异仅在茶种 gameProfile） ───────────

export const YANCHA_RECIPE: ProcessingRecipe = {
  id: 'yancha_wuyi',
  regionId: 'wuyishan',
  appliesTo: ['rougui', 'shuixian', 'dahongpao'],
  steps: ['picking', 'daoqing', 'zuoqing', 'chao-rou', 'roasting'],
  displayNote: '本流程取自武夷岩茶传统工艺中最具辨识度的节点，非完整工艺。',
  params: {
    picking: { rounds: 12 },
    daoqing: { rounds: 2, softnessTarget: [55, 78], greenTarget: 38, durationMs: 20000 },
    zuoqing: { rounds: 3, idealShakeForce: [0.45, 0.72], durationMs: 60000 },
    'chao-rou': {
      rounds: 2,
      heatWindowMs: 3000,
      idealRollForce: [0.4, 0.7],
      breakRatePerSec: 0.05,
      safeBand: { centerBase: 0.55, widthBase: 0.22, driftPerRound: 0.06, randomDrift: 0.04 },
      heatRisePerSec: 0.34,
      coolPerSec: 0.2,
      inertiaSec: 0.8,
      greenDropPerSec: 0.16,
    },
    roasting: {
      rounds: 5,
      swingSpeed: 1.6,
      band: { centerBase: 0.5, widthBase: 0.18, driftPerRound: 0.04, randomDrift: 0.06 },
      hasteThreshold: 2.2,
      toleranceByProficiency: 0.05,
    },
  },
  casual: {
    zuoqing: { rounds: 2 },
    roasting: { rounds: 3, swingSpeed: 1.2 },
    'chao-rou': { rounds: 2 },
  },
};

export function getRecipe(): ProcessingRecipe {
  return YANCHA_RECIPE;
}

/**
 * 三茶轻微手感差异（仅游戏参数，非现实茶学事实）：用现有工序参数实现，
 * 不显示难度数字、不新建难度系统。
 * 肉桂=张扬（节奏稍敏感：理想区间略窄）、水仙=温润（容错略宽：理想区间略宽）、
 * 大红袍=平衡（不覆盖，使用基础值）。焙火差异仍由 gameProfile.roastBias 承担。
 */
export const TEA_STEP_OVERRIDES: Record<string, Partial<Record<StepId, Partial<StepParams>>>> = {
  rougui: {
    daoqing: { softnessTarget: [57, 76] },
    zuoqing: { idealShakeForce: [0.47, 0.70] },
    'chao-rou': { idealRollForce: [0.42, 0.68] },
  },
  shuixian: {
    daoqing: { softnessTarget: [52, 80] },
    zuoqing: { idealShakeForce: [0.42, 0.75] },
    'chao-rou': { idealRollForce: [0.38, 0.72] },
  },
  // dahongpao: 不覆盖，使用基础值（平衡派）
};

/** 合并 基础配方 + 茶种覆盖 + standard/casual 两档 + 采茶成色（代码里没有 if (isXhs)） */
export function getStepParams(
  teaId: string,
  step: StepId,
  difficulty: Difficulty,
  bq?: BasketQuality,
): StepParams {
  const r = YANCHA_RECIPE;
  const base = r.params[step] ?? {};
  const teaOv = TEA_STEP_OVERRIDES[teaId]?.[step] ?? {};
  let merged: StepParams = { ...base, ...teaOv } as StepParams;
  if (difficulty === 'casual') merged = { ...merged, ...(r.casual?.[step] ?? {}) };
  return { ...merged, basketQuality: bq } as StepParams;
}
