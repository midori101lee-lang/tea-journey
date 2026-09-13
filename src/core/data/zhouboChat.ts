import type { Grade } from '../types';

// ─────────── 周伯茶桌话题系统（茶桌闲聊，非制茶点评） ───────────
// 定位：周伯不是「每次帮玩家鉴定茶叶的人」，而是一个坐在茶桌边、什么都能聊两句的老茶客。
//
// 三维度组合（spec 2026-09-12）：地区决定「在哪里、聊什么地方」，茶叶决定「正在喝什么」，
// 话题决定「这次聊什么」——三者组合，不互相写死。
//
// 硬规则（防跨茶错配）：
//   - TASTING[teaId] 的台词只允许提该茶自己（含其产地/工艺），绝不提别的茶名。
//   - REGION_TALK / COMPARE / CULTURE / LIFESTYLE 是「茶agnostic」池，不点名具体某泡茶。
//   - 底部评价（zhouBoAdvice）与本系统都读同一个 lastResult.teaId，永不分裂。
// 比例目标约：品茶 40 / 茶文化·地域 20 / 生活 20 / 回应玩家 20（用权重近似）。
// 语气：朴实、自然、慢悠悠、有生活经验；不写论文腔、不做绝对化结论。

/** 品茶评价（与当前茶叶强绑定；key=teaId）。每句只谈这一种茶。 */
export const ZHOUBO_TASTING: Record<string, string[]> = {
  rougui: [
    '这肉桂香气够冲，一上来就把人叫醒了。',
    '桂皮香站得住，汤也有劲——肉桂就该是这个样子。',
  ],
  shuixian: [
    '水仙喝着柔，汤感也顺。不是一上来就抢人的那种。',
    '水仙的兰底在后面，别急，多坐会儿就出来了。',
  ],
  dahongpao: [
    '大红袍嘛，坐下来慢慢喝。别急着一口定输赢。',
    '焙火到家的大红袍，香是沉在汤里的，不飘。',
  ],
  wangba: [
    '……嗯。这茶，你买的时候没多想吧？',
    '喝着还行。就是这茶啊，别问价，问了我替你心疼。',
  ],
  jiuquhongmei: [
    '九曲红梅是红茶，喝起来和龙井完全是两路性子。',
    '这红梅甜香挺讨喜，慢慢喝，后面还有味道。',
  ],
  longjing: [
    '这龙井入口挺鲜，香气也清爽。春茶喝的就是这一口鲜活。',
    '龙井这茶，嫩的时候好喝，手上火候也得跟着快。',
  ],
  wuniuzao: [
    '乌牛早是自己的味儿——鲜爽来得直接，不装。',
    '别拿它当龙井喝，它有它的喝法。这样才对。',
  ],
};

/** 回应玩家（按这泡茶的品质；茶agnostic）。 */
export const ZHOUBO_REACTION: Record<'fail' | 'normal' | 'good' | 'fine', string[]> = {
  fail: ['没事，茶又不会跑。下次再试。', '这锅没弄好？正常。茶这东西，手熟而已。'],
  normal: ['能喝。再练练，会更有样子。', '中规中矩——不过自己做的，怎么都香一点。'],
  good: ['不错，像点样子了。', '可以做给你认识的人尝尝了。'],
  fine: ['好。这锅你自己该得意——我挑不出什么毛病。', '自己做出来的，喝着就是不一样吧？'],
};

/** 第一次喝某种茶的回应（模板按茶名拼）。 */
export function zhouboFirstTasteLine(teaName: string, rand: () => number = Math.random): string {
  const lines = [
    `第一次喝${teaName}？别急，慢慢尝。`,
    `头一回喝${teaName}的人，都容易喝急了。你稳住。`,
  ];
  return lines[Math.floor(rand() * lines.length)];
}

/** 地区印象（key=茶区；不点名玩家杯里的茶）。 */
export const ZHOUBO_REGION_TALK: Record<string, string[]> = {
  wuyishan: [
    '回到武夷山，还是这个味儿亲切。',
    '这地方的茶，急不得。尤其焙火，火候要慢慢看。',
    '武夷山的人喝茶，往往一坐就是半天。',
    '山里人喝茶没那么多花样——水烧开了，茶泡上，慢慢聊。',
  ],
  hangzhou: [
    '杭州这地方啊，春天一到，茶园里就热闹起来了。',
    '梅家坞这一带的茶园，山势不算陡，走起来倒挺舒服。',
    '杭州人喝龙井，讲究个鲜。刚炒出来那股清鲜劲儿，很有意思。',
    '以前我来杭州，总觉得这里的茶园和武夷山是两副性子。',
  ],
};

/** 两座茶山都走过之后的比较（比较的是地方与性子，不贬低任何茶）。 */
export const ZHOUBO_COMPARE: string[] = [
  '杭州和武夷山啊，喝茶的性子就不太一样。',
  '杭州的春天清清爽爽，龙井也跟着这个性子；武夷山山多水多，岩茶喝起来又是另一番滋味。',
  '茶没有谁一定比谁好。地方不一样，做法不一样，喝茶的人也不一样。',
];

/** 茶文化（通用，不点名具体某泡茶）。 */
export const ZHOUBO_CULTURE: string[] = [
  '以前的人喝茶，讲究的东西可多了。现在倒简单，找个舒服地方坐下来，也挺好。',
  '茶从来不只是拿来解渴的。很多时候，是人坐到一块儿了，才开始喝茶。',
  '你看各地喝茶的方法不一样，其实都是当地人的日子。',
  '同样是喝茶，杭州喜欢鲜爽，到了武夷山，又讲究岩茶的香和韵。',
];

/** 喝茶生活（完全不聊专业知识）。 */
export const ZHOUBO_LIFESTYLE: string[] = [
  '这茶啊，不能光看第一口。有些茶第一口热闹，后面才见真章。',
  '喝茶这事儿，没那么多规矩。自己喝着舒服，才是要紧的。',
  '茶喝多了，嘴巴倒是挑了。可真渴的时候，白水还是最解渴。',
  '喝茶嘛，最重要的是有人陪着说两句话。',
  '茶凉了就重新烧水，日子不也是这么过的。',
  '好茶不一定非得找个好日子喝，今天高兴，今天就能喝。',
  '你要是坐得住，一杯茶能喝很久。',
];

export interface ZhouBoTopicInput {
  regionId: string;
  /** 当前泡的茶（lastResult.teaId；没有则不聊品茶）。 */
  teaId?: string;
  grade?: Grade;
  /** 这泡茶第一次上茶桌（由 flag zhoubo_tasted_{teaId} 派生）。 */
  firstTaste?: boolean;
  /** 两座茶山都有亲手做的茶 → 可以聊比较。 */
  bothRegions?: boolean;
  rand?: () => number;
}

export interface ZhouBoTopic {
  topic: 'first_taste' | 'reaction' | 'tasting' | 'compare' | 'region' | 'culture' | 'lifestyle';
  lines: string[];
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

/**
 * 抽一个茶桌话题（纯函数，随机源可注入）。
 * 优先级近似 spec：特殊事件由调用方先行处理；此处按权重近似
 * 品茶 40 / 茶文化·地域 20 / 生活 20 / 回应玩家 20。
 */
export function pickZhouBoTopic(input: ZhouBoTopicInput): ZhouBoTopic {
  const { regionId, teaId, grade, firstTaste, bothRegions } = input;
  const rand = input.rand ?? Math.random;

  type Cand = { topic: ZhouBoTopic['topic']; w: number; make: () => string[] };
  const cands: Cand[] = [];

  if (firstTaste && teaId) {
    cands.push({ topic: 'first_taste', w: 24, make: () => [zhouboFirstTasteLine(teaNameOf(teaId), rand)] });
  }
  if (grade === 'fail') {
    cands.push({ topic: 'reaction', w: 16, make: () => [pick(ZHOUBO_REACTION.fail, rand)] });
  } else if (grade === 'fine') {
    cands.push({ topic: 'reaction', w: 10, make: () => [pick(ZHOUBO_REACTION.fine, rand)] });
  }
  if (teaId && ZHOUBO_TASTING[teaId]) {
    cands.push({ topic: 'tasting', w: 32, make: () => [pick(ZHOUBO_TASTING[teaId], rand)] });
  }
  if (bothRegions) {
    cands.push({ topic: 'compare', w: 10, make: () => [pick(ZHOUBO_COMPARE, rand)] });
  }
  if (ZHOUBO_REGION_TALK[regionId]) {
    cands.push({ topic: 'region', w: 12, make: () => [pick(ZHOUBO_REGION_TALK[regionId], rand)] });
  }
  cands.push({ topic: 'culture', w: 10, make: () => [pick(ZHOUBO_CULTURE, rand)] });
  cands.push({ topic: 'lifestyle', w: 10, make: () => [pick(ZHOUBO_LIFESTYLE, rand)] });

  const total = cands.reduce((s, c) => s + c.w, 0);
  let r = rand() * total;
  for (const c of cands) {
    r -= c.w;
    if (r <= 0) return { topic: c.topic, lines: c.make() };
  }
  const last = cands[cands.length - 1];
  return { topic: last.topic, lines: last.make() };
}

/** 茶名（避免本模块反向依赖 teas.ts 全量数据，由调用方保证 teaId 合法）。 */
function teaNameOf(teaId: string): string {
  const NAMES: Record<string, string> = {
    rougui: '肉桂', shuixian: '水仙', dahongpao: '大红袍', wangba: '这茶',
    jiuquhongmei: '九曲红梅', longjing: '龙井', wuniuzao: '乌牛早',
  };
  return NAMES[teaId] ?? '这茶';
}
