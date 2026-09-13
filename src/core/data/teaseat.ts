import type { Grade, Player } from '../types';
import { regionTeaIds } from './regions';

// ─────────── 我的茶席（分茶区配置 · 杭州/武夷山共用一套玩法） ───────────
// 定位（2026-09-12 明确）：茶席 = 玩家自己的喝茶社交空间（坐下 → 偶遇 → 邀请 → 聊天/回礼），
// 与「区域探索」（出去逛）职责分开。武夷山茶席是杭州茶席的地区扩展：
// **玩法/组件/状态机完全复用，只有 背景、NPC池、对白风格、地区门禁 不同。**
//
// 硬约束：
//   - 牛姐（niujie）只属于杭州茶市场彩蛋体系，**永不进入任何茶席 NPC 池**。
//   - 神秘茶人保持武夷山原有偶遇概率与设定（encounters.ts），**不因茶席改变**，不入茶席池。
//   - 回礼走 addGiftTea（source='gift'，可泡不可卖），概率随品质提高但永不 100%；
//     乌牛早不回流（牛姐专属）。
// 本模块只放纯数据与判定（无 React/DOM），供 TeaSeatView 消费、便于断言测试。

/** 茶席偶遇概率（两茶区共用同一参数；「可能没人来」）。 */
export const TEA_SEAT_ENCOUNTER_CHANCE = 0.35;

/** 茶席入口门禁（按茶区）：
 *  - 杭州：拥有任意一件茶具即可（设计路径=玲姨赠的杭州玻璃杯）。
 *  - 武夷山：完成「林姑娘邀请 → 回武夷山 → 老陈寒暄」剧情后解锁（flag；旧存档默认未解锁，不报错）。 */
export function canEnterTeaSeat(player: Player, regionId: string): boolean {
  if (regionId === 'wuyishan') return !!player.flags['wuyishan_teaseat_unlocked'];
  return player.teaWareInventory.length > 0;
}

/** 是否该茶区茶席的首次入席（首次=固定地区引路人登场）。 */
export function isTeaSeatFirstVisit(player: Player, regionId: string): boolean {
  const cfg = TEA_SEAT_BY_REGION[regionId as 'hangzhou' | 'wuyishan'];
  return !cfg || !player.flags[cfg.firstDoneFlag];
}

/** 单个闲聊池：直接给一组台词，或对象形式（lines + 可选按茶种覆盖）。 */
export type TeaSeatChatEntry = string[] | { lines?: string[]; byTea?: Record<string, string[]> };

export interface TeaSeatRegionConfig {
  regionId: 'hangzhou' | 'wuyishan';
  /** 茶席环境背景（只负责环境，不画桌/茶具——桌与茶具由组件/槽位动态叠加）。 */
  bg: string;
  /** 首次入席固定登场的引路人 + 台词。 */
  firstNpc: string;
  firstLines: string[];
  firstDoneFlag: string;
  /** 随机偶遇 NPC 池（权重；可能抽到「没人来」）。 */
  npcPool: { npcId: string; weight: number }[];
  greetings: Record<string, string[]>;
  /** 喝完茶的闲聊：chat[npcId][category] = 台词组（可按茶种覆盖）；对白风格按地区写。 */
  chat: Record<string, Record<string, TeaSeatChatEntry>>;
}

// ── 杭州 · 茶席（既有内容原样收编为地区配置，玩法不变） ──
const HANGZHOU: TeaSeatRegionConfig = {
  regionId: 'hangzhou',
  bg: 'assets/scenes/hangzhou_teaseat.webp',
  firstNpc: 'aqing',
  firstLines: [
    '你也来这儿喝茶啦？',
    '给你带了点绿豆糕。',
    '龙井配点绿豆糕，倒挺有滋有味。',
  ],
  firstDoneFlag: 'teaseat_first_done',
  npcPool: [
    { npcId: 'aqing', weight: 4 },   // 阿青：茶园的孩子，最常来蹭茶
    { npcId: 'zhoubo', weight: 3 },  // 周伯：遛弯路过，顺口点评
    { npcId: 'lingyi', weight: 3 },  // 玲姨：送茶点路过，坐一坐
  ],
  greetings: {
    aqing: ['咦，你也来这儿喝茶啦？', '这个位置好，看得见湖。'],
    zhoubo: ['哦？你也寻到这儿来了。', '这地方选得好——喝水看山，两不耽误。'],
    lingyi: ['哎，你在这儿呀？我路过瞧瞧。', '一个人坐着也挺好，湖风吹着舒服。'],
  },
  chat: {
    aqing: {
      green: ['龙井就要这么喝——叶子在水里慢慢站起来的样子最好看。', '你这一泡，比集市上糊弄人的强多了。'],
      hongcha: ['九曲红梅是红亮红亮的，跟我家园子里的绿完全是两个脾气。', '甜的！这个我喜欢。'],
      other: ['好喝就行。茶嘛，喝着舒服最重要。'],
    },
    zhoubo: {
      green: ['嗯，鲜爽是有的。龙井这一口，就图一个「清」字。', '叶子舒展得开，说明水温、出汤都没大错。'],
      hongcha: ['红亮，甜润——九曲红梅这一口，跟岩茶是两个路数。', '发酵到位了，青气没带进来。'],
      other: ['能喝。茶没有高低，喝着顺就好。'],
    },
    lingyi: {
      green: ['龙井就该这么慢慢喝——看着叶子在水里开，心也跟着慢下来。', '春茶就要鲜着喝。'],
      hongcha: ['我们杭州的红茶，就图这一口红亮甜润。', '焖得不错，回头我那儿也照这个来。'],
      other: ['喝着好就好。回头把茶具备齐了，常来坐坐。'],
    },
  },
};

// ── 武夷山 · 茶席（复用同一套玩法；人/茶/景/说话方式换成武夷山） ──
// 对白风格：老陈=朴实熟络有经验；阿秀=直白热情；岩伯=看茶说话；周伯=懂茶一针见血；林姑娘=两地都熟。
// 「岩茶性格」通过 byTea 按茶种体现（水仙柔/肉桂冲/大红袍慢），只是对白表现、不新增数值。
const WUYISHAN: TeaSeatRegionConfig = {
  regionId: 'wuyishan',
  bg: 'assets/scenes/wuyishan_teaseat.webp',
  firstNpc: 'laochen',
  firstLines: [
    '后头这块地方，收拾出来还像样吧？',
    '想喝什么自己挑——咱们武夷山的茶，管够。',
  ],
  firstDoneFlag: 'teaseat_first_done_wuyishan',
  npcPool: [
    { npcId: 'laochen', weight: 4 },  // 老陈：茶馆主人，常来坐
    { npcId: 'axiu', weight: 3 },     // 阿秀：采茶下来歇脚
    { npcId: 'yanbo', weight: 3 },    // 岩伯：看茶说话的老制茶师
    { npcId: 'zhoubo', weight: 2 },   // 周伯：两座山都跑的老茶客
    { npcId: 'linggu', weight: 2 },   // 林姑娘：本来就两头跑的旅人
  ],
  greetings: {
    laochen: ['哟，舍得回来了？', '来了就坐，别站着。'],
    axiu: ['来都来了，喝一杯再走。', '今儿得空来茶席坐坐啦？'],
    yanbo: ['嗯，坐。', '正好，陪我喝一泡。'],
    zhoubo: ['哦？这茶桌，摆到武夷山来了。', '行啊，换个山头接着喝。'],
    linggu: ['路过，讨一杯喝。', '你的茶席，比我想的有样子。'],
  },
  chat: {
    laochen: {
      yancha: ['岩茶这东西，得慢慢喝。火气刚退的时候，和放一放以后，滋味还不一样。', '自己做的？嗯，手上有数了。'],
      green: ['杭州来的？这龙井倒是清清爽爽。', '绿茶喝个鲜——跟咱们岩茶是两个路数，都好。'],
      hongcha: ['九曲红梅？杭州的红茶，甜润，喝着倒也顺口。'],
      other: ['茶没有高低，合口味就是好茶。'],
    },
    axiu: {
      yancha: ['这是我们山场里的茶做的吧？喝着就是亲切。', '这泡还行，再坐会儿。'],
      green: ['这么绿的汤，看着就凉快。'],
      hongcha: ['红的？闻着挺香。'],
      other: ['来都来了，喝一杯再走。'],
    },
    yanbo: {
      yancha: ['火功看得出分寸，香在汤里，不浮。', '岩茶讲香、清、甘、活——你这一泡，占了两样。'],
      green: ['绿茶看叶底，嫩就嫩得坦白。'],
      hongcha: ['发酵到位，汤是活的。'],
      other: ['茶怎么样，喝过才知道。'],
    },
    zhoubo: {
      yancha: {
        lines: ['火气退得正好，这泡喝着顺。', '岩茶就得这样，一口一口来。'],
        // 「岩茶性格」按茶种命中（水仙柔/肉桂冲/大红袍慢）——只是对白表现，不新增数值。
        byTea: {
          rougui: ['这香气够冲，一进嘴就知道是肉桂——做得也正。'],
          shuixian: ['水仙喝着倒是柔和，汤也顺——这泡稳。'],
          dahongpao: ['大红袍嘛，坐下来慢慢喝，急不得。'],
        },
      },
      green: ['龙井到了武夷山还是龙井——清鲜，藏不住。'],
      hongcha: ['红茶的甜是发出来的，岩茶的甜是焙出来的——都不是一回事，都好。'],
      other: ['能喝。茶没有高低，喝着顺就好。'],
    },
    linggu: {
      yancha: ['回武夷山喝岩茶，感觉又不一样了——一个鲜，一个醇。'],
      green: ['在杭州喝惯的口，回这儿换换嘴，正好。'],
      hongcha: ['两座山的茶摆在一起喝，才喝得出各自的脾气。'],
      other: ['好茶不怕比较，就怕不比。'],
    },
  },
};

export const TEA_SEAT_BY_REGION: Record<'hangzhou' | 'wuyishan', TeaSeatRegionConfig> = {
  hangzhou: HANGZHOU,
  wuyishan: WUYISHAN,
};

/** 按权重抽一位茶席 NPC（纯函数，随机源由调用方传入便于测试）；null=今天没人来。 */
export function rollTeaSeatNpc(config: TeaSeatRegionConfig, rand: () => number = Math.random): string | null {
  if (rand() > TEA_SEAT_ENCOUNTER_CHANCE) return null;
  const total = config.npcPool.reduce((s, n) => s + n.weight, 0);
  let r = rand() * total;
  for (const n of config.npcPool) {
    r -= n.weight;
    if (r <= 0) return n.npcId;
  }
  return config.npcPool[config.npcPool.length - 1].npcId;
}

function chatList(entry: TeaSeatChatEntry | undefined): string[] | undefined {
  return Array.isArray(entry) ? entry : entry?.lines;
}

/** 按茶叶大类（可按茶种覆盖）取一句闲聊（纯函数，随机源可注入）。 */
export function teaSeatChatLine(
  config: TeaSeatRegionConfig,
  npcId: string,
  category: string,
  teaId?: string,
  rand: () => number = Math.random,
): string {
  const catEntry = config.chat[npcId]?.[category];
  const byTea = teaId && catEntry && !Array.isArray(catEntry) ? catEntry.byTea?.[teaId] : undefined;
  const list = byTea
    ?? chatList(catEntry)
    ?? chatList(config.chat[npcId]?.other)
    ?? ['一起喝了这杯。茶没有高低，喝着顺就好。'];
  return list[Math.floor(rand() * list.length)];
}

/**
 * 茶叶回礼概率（仅游戏参数）：品质越好概率越高，但永不 100%——
 * 「不是每次都有回礼」，保持人情往来而非奖励机制。不新增数值系统。
 */
export const TEA_SEAT_GIFT_CHANCE: Record<Grade, number> = {
  fail: 0,
  normal: 0.25,
  good: 0.45,
  fine: 0.65,
};

export function teaSeatGiftChance(grade: Grade): number {
  return TEA_SEAT_GIFT_CHANCE[grade] ?? 0.25;
}

/**
 * 回礼茶：从「与所喝的茶同一茶区」的茶里随机挑。
 * 彩蛋专属茶不回流：乌牛早（牛姐彩蛋）、王霸茶（老贾彩蛋）都不从回礼再次流通。
 */
export const TEA_SEAT_GIFT_EXCLUDED = ['wuniuzao', 'wangba'];

export function rollTeaSeatGift(servedTeaId: string, servedTeaRegion: string, rand: () => number = Math.random): string {
  const pool = regionTeaIds(servedTeaRegion).filter((id) => !TEA_SEAT_GIFT_EXCLUDED.includes(id));
  const fallback = ['jiuquhongmei'];
  const list = pool.length > 0 ? pool : fallback;
  return list[Math.floor(rand() * list.length)];
}

/** 林姑娘的「回武夷山」邀请台词（杭州茶席触发；剧情收口在老陈寒暄）。 */
export const LINGGU_WUYI_INVITE_LINES = [
  '「这阵子，杭州的茶席倒是越来越热闹了。」',
  '你笑了笑——在这儿坐下来喝杯茶，是挺舒服的。',
  '「你在杭州也待了一阵了吧？」',
  '「要不，跟我一道回趟武夷山？」',
  '「也让乡亲们瞧瞧，杭州是怎么喝茶、怎么待客的。」',
];

export const LINGGU_WUYI_DECLINE_LINES = [
  '「也成。杭州还有不少地方没逛呢。」',
  '「那你再多待几日——等想回去了，再来找我。」',
];
