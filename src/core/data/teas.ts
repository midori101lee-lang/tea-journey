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
      // 轻做青·中火求香：绿区略偏急侧；火性由 roastStyle:'aroma' 参与焙火软加分（非现实焙火标准）
      roastBias: { center: 0.04, width: -0.02 },
      roastStyle: 'aroma',
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
      // 从容做青·中足火求醇：绿区稍宽、略偏缓侧；火性由 roastStyle:'mellow' 参与焙火软加分（非现实焙火标准）
      roastBias: { center: -0.04, width: 0.03 },
      roastStyle: 'mellow',
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
      // 平衡做青·火功灵活：绿区最窄（精度承担难度）；火性由 roastStyle:'balanced' 参与——轻/中/足皆有效风格
      roastBias: { center: 0, width: -0.03 },
      roastStyle: 'balanced',
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

  // ─────────── 杭州篇（第二阶段起步：九曲红梅可做，龙井预留锁定） ───────────
  {
    id: 'jiuquhongmei',
    name: '九曲红梅',
    fullName: '杭州 · 九曲红梅',
    category: 'hongcha',
    regionId: 'hangzhou',
    basePrice: { fail: 3, normal: 13, good: 25, fine: 40 },
    unlockCondition: { type: 'initial' },
    facts: [
      { level: 'S', source: '杭州地方名茶（传统工夫红茶）', category: 'identity', text: '九曲红梅是杭州传统工夫红茶，以红茶工艺制成，与西湖龙井同出杭州、做法迥异。' },
      { level: 'B', source: '地方制茶经验', category: 'making', text: '红茶的核心在发酵（渥红）：叶子由绿转红、青气散去、甜香生出，是工夫红茶最关键的一步。' },
      { level: 'B', source: '品饮经验', category: 'taste', text: '汤色红亮，滋味甜润，常带一点梅香或花香——「红梅」之名，也来自这一口。' },
    ],
    copies: [
      { kind: 'player_hint', text: '和岩茶完全两条路：不摇青、不焙火，靠的是发酵。' },
      { kind: 'npc_opinion', text: '玲姨：「我们杭州的红茶，喝的是那一口红亮甜润——急不得，发酵要看准了。」' },
    ],
    gameProfile: {
      difficulty: 1,
      roastBias: { center: 0, width: 0 },
      // 红茶嫩采（一芽一叶~一芽二叶初展），与岩茶开面采分开；交互复用 PickingStep 的 bud 模式
      picking: {
        pickingMethod: 'bud', targetMaturity: 'bud-one-leaf', attemptCount: 12, basketNeed: 8, tolerance: 0.66,
        knowledgeNote: '九曲红梅嫩采：一芽一叶、一芽二叶初展都正当时；游戏做三类茶青判断（太嫩/合适/太老）',
      },
      unlockCondition: { type: 'initial' },
    },
  },
  {
    id: 'longjing',
    name: '西湖龙井',
    fullName: '杭州 · 西湖龙井',
    category: 'green',
    regionId: 'hangzhou',
    basePrice: { fail: 3, normal: 16, good: 30, fine: 48 },
    // 龙井暂不开放制作：等梅家坞那条线走通后置 longjing_unlocked 再解锁。本阶段仅作数据预留。
    unlockCondition: { type: 'flag', flag: 'longjing_unlocked', note: '梅家坞那条线还没走通——龙井的事，以后再说。' },
    facts: [
      { level: 'S', source: 'GB/T 18650 地理标志产品', category: 'identity', text: '西湖龙井是绿茶，以「色绿、香郁、味甘、形美」著称，核心在嫩芽与杀青，不发酵。' },
      { level: 'B', source: '地方制茶经验', category: 'making', text: '绿茶要的是嫩芽、快杀青——锅一烫就定住鲜爽，跟红茶、岩茶完全是两回事。' },
    ],
    copies: [
      { kind: 'player_hint', text: '玲姨说，龙井是另一回事——要嫩芽，锅一烫就杀青。' },
    ],
    gameProfile: {
      difficulty: 2,
      roastBias: { center: 0, width: 0 },
      // 绿茶采的是嫩芽：一芽一叶为最佳、一芽二叶次之（游戏参数，非审评数字）
      picking: {
        pickingMethod: 'bud', targetMaturity: 'bud-one-leaf', attemptCount: 12, basketNeed: 8, tolerance: 0.62,
        knowledgeNote: '龙井重嫩采：讲芽叶鲜嫩、匀整，常见一芽一叶/一芽二叶初展；游戏做三类茶青判断（太嫩/合适/太老）',
      },
      unlockCondition: { type: 'flag', flag: 'longjing_unlocked', note: '龙井暂时锁定，等梅家坞那条线走通。' },
    },
  },
  {
    id: 'wuniuzao',
    name: '乌牛早',
    fullName: '乌牛早（特早生绿茶）',
    category: 'green',
    regionId: 'hangzhou',
    basePrice: { fail: 3, normal: 12, good: 24, fine: 38 },
    // 乌牛早只通过牛姐剧情彩蛋获得：不进 makeableTeasForRegion（不可制茶）、不进集市摊位，
    // 也不是「劣质茶」——它自己的茶；有问题的是把它谎称成西湖龙井来卖的行为。
    unlockCondition: { type: 'initial' },
    facts: [
      { level: 'S', source: '浙江地方茶树品种资料', category: 'identity', text: '乌牛早是浙江的特早生茶树品种，发芽、采摘明显偏早；做成扁形绿茶后，外形与龙井相近，乍一看容易认错。' },
      { level: 'B', source: '品饮经验', category: 'appearance', text: '干茶扁平挺直、芽叶较肥壮、芽锋较显，颜色翠绿光润——记成「短、肥、齐」，跟龙井的「扁、挺、秀」对着看。' },
      { level: 'B', source: '品饮经验', category: 'taste', text: '滋味鲜爽甘醇，鲜感来得直接；香气清鲜、嫩香。它是自己的茶，不是「假龙井」。' },
    ],
    copies: [
      { kind: 'player_hint', text: '短、肥、齐——芽头比龙井壮，绿得更翠一些，发芽也早。' },
    ],
    gameProfile: {
      difficulty: 1,
      roastBias: { center: 0, width: 0 },
      unlockCondition: { type: 'initial' },
    },
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
  if (c.type === 'flag') return !!player.flags[c.flag];
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
  withering: { id: 'withering', gameName: '萎凋', realProcessName: '萎凋（摊青走水）', simplificationNote: '萎凋程度以「含水」状态判断，压缩为看准时机收青' },
  fixation: {
    id: 'fixation',
    gameName: '杀青',
    realProcessName: '杀青（青锅）',
    simplificationNote: '绿茶不发酵，靠高温定住鲜爽；压缩为「趁锅热快手翻炒，抓准火候」',
  },
  shaping: {
    id: 'shaping',
    gameName: '理条',
    realProcessName: '理条 / 辉锅（抓·压·推，压扁挺直）',
    simplificationNote: '龙井的「形」在这道手里出来；压缩为抓、压、推三个手法按序做对',
  },
  rolling: { id: 'rolling', gameName: '揉捻', realProcessName: '揉捻（塑形 / 破壁）', simplificationNote: '揉捻力度压缩为多轮掌握；过重会断条' },
  drying: { id: 'drying', gameName: '干燥', realProcessName: '干燥（足干定香 / 收灰）', simplificationNote: '烘干压缩为几轮稳住火候；过急则火气压茶' },
  fermentation: { id: 'fermentation', gameName: '发酵', realProcessName: '发酵（渥红 / 转色生香）', simplificationNote: '发酵程度以「转色 / 香气」判断，是红茶的核心；压缩为看准出堆时机', knowledgeComicId: 'comic_jiuquhongmei' },
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
      // 结算构成：命中质量×60 + 稳定性×20 + 火性合拍×20（火性软分，见 core/making/roasting.ts）
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

// ─────────── 杭州工夫红茶配方（九曲红梅）───────────
// 与岩茶完全不同的一条线：萎凋 → 揉捻 → 发酵 → 烘干。核心记忆点是「发酵」。
// 沿用同一套 data-driven 制茶框架（ProcessingRecipe），步骤开关决定走哪条线，不写死 if (region)。

export const HONGCHA_RECIPE: ProcessingRecipe = {
  id: 'hongcha_hangzhou',
  regionId: 'hangzhou',
  appliesTo: ['jiuquhongmei'],
  steps: ['picking', 'withering', 'rolling', 'fermentation', 'drying'],
  displayNote: '本流程取自工夫红茶最具辨识度的节点（萎凋 → 揉捻 → 发酵 → 烘干），非完整工艺。',
  params: {
    picking: { rounds: 12 },
    // 萎凋：收青区间收窄（见 WitheringStep）——看叶态、判断收青的压力更实，不再轻松上品
    withering: { moistureTarget: [50, 57], moistureRate: 1.15 },
    // 揉捻：理想力度区间收窄；过重更易断条（band 收窄 → inBand 更难，分数更依赖精准）
    rolling: { rounds: 3, idealRollForce: [0.50, 0.66], breakRatePerSec: 0.06 },
    // 发酵：九曲红梅记忆点——最佳窗口收窄（见 FermentationStep），「甜香正浓」的窗口更小，出堆更讲究
    fermentation: { fermentTarget: [70, 76], fermentRate: 0.95 },
    // 烘干：火候指针，每轮绿区轻微漂移（见 DryingStep；绿区宽度在组件内收窄）
    drying: { rounds: 3 },
  },
  casual: {
    withering: { moistureTarget: [45, 60], moistureRate: 0.95 },
    rolling: { rounds: 2, idealRollForce: [0.44, 0.70] },
    fermentation: { fermentTarget: [66, 80], fermentRate: 0.85 },
    drying: { rounds: 2 },
  },
};

/**
 * 杭州绿茶配方（西湖龙井）：采嫩芽 → 杀青 → 理条 → 干燥成形。
 * 与岩茶（摇青+炒揉+焙火）、红茶（萎凋+揉捻+发酵+烘干）都不同的一条线，
 * 关键词是「嫩、快、轻、形」——不发酵，靠高温定鲜，靠手上功夫做出扁平挺直的茶形。
 */
export const GREEN_TEA_RECIPE: ProcessingRecipe = {
  id: 'green_hangzhou',
  regionId: 'hangzhou',
  appliesTo: ['longjing'],
  steps: ['picking', 'fixation', 'shaping', 'drying'],
  displayNote: '本流程取自绿茶最具辨识度的节点（杀青 → 理条 → 干燥），非完整工艺。',
  params: {
    picking: { rounds: 12 },
    // 杀青：锅温上升快、绿区明显收窄（见 FixationStep）——要「快、准」，慢了青味压不住，急了就焦边；
    //       绿区窄 + 逐轮回移 → 上品需要轮轮压在合适段，失误即掉出上品
    fixation: { rounds: 3, heatRisePerSec: 0.42, safeBand: { centerBase: 0.5, widthBase: 0.14, driftPerRound: 0.06, randomDrift: 0.04 } },
    // 理条：抓·压·推三式按序做对，把茶叶压扁、挺直（见 ShapingStep；好拍窗口收窄、准拍权重降低）
    shaping: { rounds: 3, gestureCount: 3 },
    // 干燥：火候指针，每轮绿区轻微漂移（见 DryingStep；绿区宽度在组件内收窄）
    drying: { rounds: 3 },
  },
  casual: {
    fixation: { rounds: 2, safeBand: { centerBase: 0.5, widthBase: 0.18, driftPerRound: 0.04, randomDrift: 0.04 } },
    shaping: { rounds: 2, gestureCount: 3 },
    drying: { rounds: 2 },
  },
};

/** 按茶种取配方：九曲红梅走红茶线，龙井走绿茶线，其余走岩茶线。 */
export function getRecipeFor(teaId: string): ProcessingRecipe {
  if (teaId === 'jiuquhongmei') return HONGCHA_RECIPE;
  if (teaId === 'longjing') return GREEN_TEA_RECIPE;
  return YANCHA_RECIPE;
}

export function getRecipe(teaId?: string): ProcessingRecipe {
  return teaId ? getRecipeFor(teaId) : YANCHA_RECIPE;
}

/** 某茶区茶园可选（含尚未解锁、仅作未来预留）的茶列表。 */
export function makeableTeasForRegion(regionId: string): string[] {
  if (regionId === 'hangzhou') return ['jiuquhongmei', 'longjing'];
  return YANCHA_RECIPE.appliesTo;
}

/**
 * 该茶是否已有「已实现的配方」——决定能否真正进入制茶流程。
 * 未实装配方的茶为 false：即使剧情解锁，也不会误用别的茶（别的茶类）的工序开做。
 */
export function isCraftable(teaId: string): boolean {
  return (
    YANCHA_RECIPE.appliesTo.includes(teaId) ||
    HONGCHA_RECIPE.appliesTo.includes(teaId) ||
    GREEN_TEA_RECIPE.appliesTo.includes(teaId)
  );
}

/**
 * 三茶手感差异（仅游戏参数，非现实茶学事实）：用现有工序参数实现，
 * 不显示难度数字、不新建难度系统。做青与焙火分开塑造（用户 2026-09-13 定稿）：
 *   肉桂=轻做青护香（摇青区间下移收窄）、水仙=从容走水（区间宽+静置观察容错更宽 idleLimit）、
 *   大红袍=平衡（不覆盖，用基础值）。焙火差异由 gameProfile.roastBias（绿区位置/宽度）
 *   与 gameProfile.roastStyle（火性软加分，见 core/making/roasting.ts）共同承担。
 *   差异的「玩家可感知面」由各步骤的茶种提示文案承担（ZuoqingStep/RoastingStep）。
 */
export const TEA_STEP_OVERRIDES: Record<string, Partial<Record<StepId, Partial<StepParams>>>> = {
  rougui: {
    daoqing: { softnessTarget: [57, 76] },
    // 轻做青：摇青区间整体下移（中心 0.585→0.54），手要比别的茶轻
    zuoqing: { idealShakeForce: [0.42, 0.66] },
    'chao-rou': { idealRollForce: [0.42, 0.68] },
  },
  shuixian: {
    daoqing: { softnessTarget: [52, 80] },
    zuoqing: { idealShakeForce: [0.42, 0.75], idleLimit: 14 },
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
  const r = getRecipeFor(teaId);
  const base = r.params[step] ?? {};
  const teaOv = TEA_STEP_OVERRIDES[teaId]?.[step] ?? {};
  let merged: StepParams = { ...base, ...teaOv } as StepParams;
  if (difficulty === 'casual') merged = { ...merged, ...(r.casual?.[step] ?? {}) };
  return { ...merged, basketQuality: bq } as StepParams;
}
