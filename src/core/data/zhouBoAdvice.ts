// 周伯品茶后的「下一步建议」纯逻辑（禁止 import React / DOM）。
//
// 设计原则（见需求文档）：
//   未体验内容优先 → 当前茶种 / 品质的自然建议 → 未体验的系统入口 → 今日茶话。
// 一次性重要探索（九龙窠）只在「可制作的武夷山茶 + 未探索」时出现；已 saw_mother_tree 后永久跳过。
// 不引入好感度 / 积分 / 等级等新状态，只读取已有 flags / metNpcs / madeTeas / day。
//
// 调用方（WebApp teatable）负责把 action.target 映射到场景跳转。
import type { Grade, Player } from '../types';
import { YANCHA_RECIPE } from './teas';

/** 武夷山可亲手制作的茶（与 YANCHA_RECIPE.appliesTo 同源，单点事实）。 */
const WUYI_MAKABLE = YANCHA_RECIPE.appliesTo;

export type ZhouBoTarget = 'mothertree' | 'market' | 'pick-tea' | 'mountain';

export interface ZhouBoAdvice {
  /** ① 品茶评价（周伯口吻，一句话） */
  comment: string;
  /** ③ 茶话 / 下一步的自然建议（可有可无） */
  suggestion?: string;
  /** 明确的下一步行动按钮（可有可无，不强制；无则只给茶话） */
  action?: { label: string; target: ZhouBoTarget };
}

export interface ZhouBoInput {
  teaId: string;
  grade: Grade;
  brewScore?: number;
  player: Player;
}

const TEA_NAME: Record<string, string> = {
  rougui: '肉桂',
  shuixian: '水仙',
  dahongpao: '大红袍',
  wangba: '景区王霸茶',
};

//  veteran 自由茶话：体验过主要内容后，不再派任务，只聊两句。
const TODAY_TALKS = [
  '喝茶这东西，越喝越知道自己喜欢什么。',
  '以前我也觉得好茶得有个标准。后来喝多了才知道，自己喜欢最重要。',
  '你现在已经不像刚来的时候了。',
  '慢慢来。茶这东西，急不出来。',
  '今天这泡，记住它。下回再喝，就知道差在哪儿了。',
];

function isFail(g: Grade) { return g === 'fail'; }
function isPlain(g: Grade) { return g === 'normal'; }
function isGood(g: Grade) { return g === 'good'; }
function isFine(g: Grade) { return g === 'fine'; }

/** 确定性变体选择（避免每次渲染抖动） */
function pick<T>(arr: T[], seed: number): T {
  return arr[((seed % arr.length) + arr.length) % arr.length];
}
function hashSeed(...parts: string[]): number {
  let h = 0;
  for (const p of parts) for (let i = 0; i < p.length; i++) h = (h * 31 + p.charCodeAt(i)) & 0xffff;
  return h;
}

/** 是否体验过主要内容：三茶都亲手做过 + 看过九龙窠 + 去过茶市 */
function experiencedMain(player: Player): boolean {
  const made = player.madeTeas ?? {};
  const allThree = ['rougui', 'shuixian', 'dahongpao'].every((id) => made[id]);
  return allThree && !!player.flags['saw_mother_tree'] && !!player.flags['met_xiaoman'];
}

/**
 * 返回周伯品茶后的完整反馈：评价 + 茶话 + 可选行动按钮。
 *
 * 优先级：
 *  P1 一次性探索：可制作的武夷山茶 + !saw_mother_tree → 九龙窠（仅一次）
 *  P2 茶种 × 品质自然建议（肉桂 / 水仙 / 大红袍 / 失败 / 王霸）
 *  P3 未体验系统入口（茶市 / 再做一锅）：已体验则降权，不重复强推
 *  P4 今日茶话：已体验主要内容时，不派任务，只聊两句
 */
export function getZhouBoAfterTeaAdvice(input: ZhouBoInput): ZhouBoAdvice {
  const { teaId, grade, brewScore, player } = input;
  const sawMotherTree = !!player.flags['saw_mother_tree'];
  const visitedMarket = !!player.flags['met_xiaoman'];
  const madeAny = Object.values(player.madeTeas ?? {}).some(Boolean);
  const seed = hashSeed(teaId, grade, String(player.day ?? 0));

  // ── P1：九龙窠只触发一次（可制作的武夷山茶 + 未探索） ──
  if (WUYI_MAKABLE.includes(teaId) && !sawMotherTree) {
    const name = TEA_NAME[teaId] ?? '这泡';
    let comment: string;
    if (isFail(grade)) comment = `这泡${name}香和味还没合到一起——不过山里那几棵树，倒可以先去看看。`;
    else if (isPlain(grade)) comment = `这泡${name}还差一点意思。既然来了武夷山，九龙窠倒值得去看看。`;
    else if (isGood(grade)) comment = '这泡挺顺，香、味、汤感开始有点合起来了。九龙窠的那几棵老茶树，也该去看看。';
    else comment = '这泡倒是有点意思，不是哪一味特别抢，反而喝着舒服。既然来了武夷山，九龙窠值得去转转。';
    return {
      comment,
      suggestion: '那几株母树的故事，就从那儿起。',
      action: { label: '去九龙窠看看', target: 'mothertree' },
    };
  }
  // 已探索九龙窠后，下面各茶种都不再把九龙窠当任务。

  // ── 王霸茶：保持原喜剧彩蛋口吻，不点破「差」 ──
  if (teaId === 'wangba') {
    const s = brewScore ?? 50;
    let comment: string;
    if (s < 50) comment = '这茶香气没什么劲，入口还偏苦了点——买之前，你该多尝两口的。';
    else if (s > 85) comment = '泡得认真，可这茶底本身没那么神，香味没怎么起来。';
    else comment = '能喝。就是这价……你买贵了吧？';
    return { comment };
  }

  // ── P2：按茶种 × 品质给评价与建议 ──
  if (teaId === 'rougui') {
    if (isFail(grade) || isPlain(grade)) {
      const comment = pick(
        ['香气是出来了，就是有点急。', '肉桂这东西，火候急一点，香气也容易跟着冒进。'],
        seed,
      );
      return { comment, suggestion: '下回做的时候，可以留意一下焙火。' };
    }
    if (isGood(grade)) {
      const comment = pick(['这回的香气挺精神。', '肉桂就该有点这样的劲儿。'], seed);
      return visitedMarket
        ? { comment, suggestion: '这路香气，你心里大概有数了。' }
        : { comment, suggestion: '去茶市转转吧，看看别人家的肉桂是什么路数。', action: { label: '去茶市转转', target: 'market' } };
    }
    // 上品
    const comment = pick(['嗯，这泡肉桂，香气走得很稳。', '有点像样了。'], seed);
    return visitedMarket
      ? { comment, suggestion: '这手肉桂，你自己喝着也该满意了。' }
      : { comment, suggestion: '拿去茶市给别人喝喝，说不定有人喜欢。', action: { label: '去茶市看看', target: 'market' } };
  }

  if (teaId === 'shuixian') {
    if (isFail(grade) || isPlain(grade)) {
      const comment = pick(['香倒还有，只是汤有点薄。', '水仙嘛，光闻香可不够。'], seed);
      return {
        comment,
        suggestion: '再做一锅，看看做青的时候能不能稳一点。',
        action: madeAny ? { label: '再做一锅', target: 'pick-tea' } : undefined,
      };
    }
    if (isGood(grade)) {
      const comment = pick(['这泡水仙，汤感出来了。', '慢慢喝，后面还有味道。'], seed);
      return { comment, suggestion: '再泡一泡，自己慢慢体会。' };
    }
    // 上品
    const comment = pick(['嗯，这汤挺稳。', '水仙的好处，就在这一口慢慢出来。'], seed);
    return { comment, suggestion: '你现在倒是越来越会喝了。' };
  }

  if (teaId === 'dahongpao') {
    // 已 saw_mother_tree（P1 已排除未探索情形）
    if (isFail(grade) || isPlain(grade)) {
      const comment = pick(['有香，也有味，就是还没合到一起。', '大红袍最怕各说各话。'], seed);
      return {
        comment,
        suggestion: '别急，再做一锅试试。',
        action: madeAny ? { label: '再做一锅', target: 'pick-tea' } : undefined,
      };
    }
    if (isGood(grade)) {
      const comment = '这泡挺顺，香、味、汤感，开始有点合起来了。';
      return visitedMarket
        ? { comment, suggestion: '武夷山的茶，可不只有那几棵树。' }
        : { comment, suggestion: '这时候去茶市看看，也许会碰到不一样的茶。', action: { label: '去茶市转转', target: 'market' } };
    }
    // 上品（已探索九龙窠）
    const comment = '这泡大红袍，倒是有点意思，不是哪一味特别抢，反而喝着舒服。';
    return {
      comment,
      suggestion: '母树你已经看过了。接下来，还是多喝几种茶吧。',
      action: visitedMarket ? undefined : { label: '去茶市转转', target: 'market' },
    };
  }

  // 兜底（理论上不会到这）：通用评价
  return { comment: `这泡${TEA_NAME[teaId] ?? '茶'}，喝着还行。` };
}
