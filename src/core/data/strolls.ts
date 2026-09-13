import type { Grade, Player } from '../types';

// ─────────── 区域散步（Regional Stroll） ───────────
// 定位（2026-09-12 明确）：「区域探索」负责每天在当前茶区走走，随机发现当地的人、事、风景与茶文化；
// 「我的茶席」负责玩家自己的喝茶社交空间——两者职责分开，探索不跳转茶席。
//
// 复用约定：次数机制完全复用武夷山「山路散步」（每日 3 次、回茶馆歇一晚重置、换茶区重置，
// 计数存 mountainVisitsToday）；本文件只提供「各地区自己的随机事件池」——武夷山的随机偶遇
// 仍走 encounters.ts 偶遇引擎，不受本文件影响。未来茶区（凤凰村/茶街…）加自己的池即可。

export type StrollEventKind = 'life' | 'culture' | 'npc' | 'egg' | 'nothing';

/** 散步事件的一行：纯字符串=旁白；对象可带说话人（speaker='你' 即「我」的气泡）。 */
export type StrollLine = string | { speaker?: string; text: string };

export interface StrollEvent {
  id: string;
  weight: number;
  kind: StrollEventKind;
  /** 旁白（（…）开头）与对话（可直接当独立行展示）。支持 { speaker:'你' } 制造你一句我一句。 */
  lines: StrollLine[];
  /** kind='npc'：登场的已有 NPC（立绘 + 名字由调用方按 npcId 取）。 */
  npcId?: string;
  /** 少数事件给一点小奖励（走 addGiftTea：source='gift'，可泡不可卖）。多数事件无奖励。 */
  giveTea?: { teaId: string; grade: Grade; count: number; giftTag: string };
  /** 可选守卫（如「联动事件」只对亲手做过龙井的玩家出现）。 */
  requires?: (p: Player) => boolean;
}

/** 按权重抽一个事件；requires 不满足的先剔除（纯函数，随机源可注入便于测试）。 */
export function rollStrollEvent<E extends StrollEvent>(events: E[], player: Player, rand: () => number = Math.random): E {
  const pool = events.filter((e) => !e.requires || e.requires(player));
  const total = pool.reduce((s, e) => s + e.weight, 0);
  let r = rand() * total;
  for (const e of pool) {
    r -= e.weight;
    if (r <= 0) return e;
  }
  return pool[pool.length - 1];
}

// ─────────── 杭州 · 梅家坞走走（每日 3 次区域探索） ───────────
// 内容基调：生活感 + 茶乡感 + 龙井/江南特色。多数事件「只是遇见」——
// 不强制每次都拿奖励；仅一个事件塞一小包茶（回礼逻辑走 gift）。
export const HANGZHOU_STROLL_EVENTS: StrollEvent[] = [
  // ── 普通生活 ──
  {
    id: 'hz_stroll_farmer_back',
    kind: 'life', weight: 11,
    lines: [
      '（一位茶农背着竹篓从坡上下来，篓里的鲜叶还带着水气。）',
      '（他朝你点点头，脚步没停——春茶时节，人人都在赶。）',
    ],
  },
  {
    id: 'hz_stroll_courtyard',
    kind: 'life', weight: 10,
    lines: [
      '（几户人家的院子里同时响着炒茶的沙沙声，青气混着烟火气，飘了满村。）',
    ],
  },
  {
    id: 'hz_stroll_elder',
    kind: 'life', weight: 10,
    lines: [
      '（村口的老人坐在竹椅上晒太阳，脚边卧着一只打盹的狗。）',
      '（他瞧见你，笑眯眯地朝你摆了摆手。）',
    ],
  },
  {
    id: 'hz_stroll_sorting_leaves',
    kind: 'life', weight: 8,
    lines: [
      '（路边有人蹲在竹匾前整理刚采回来的鲜叶，把老叶一片一片挑出去。）',
      { speaker: '你', text: '「这挑叶子，得挑多久？」' },
      '（她抬头笑了笑：「一上午吧。鲜叶干净，做出来的茶才亮。」）',
      '（临走时，她硬塞给你一小包自家做的茶：「尝尝鲜。」）',
    ],
    // 梅家坞实物奖励：九曲红梅（杭州自己的红茶，龙井解锁线不受影响；gift 可泡不可卖）。
    giveTea: { teaId: 'jiuquhongmei', grade: 'normal', count: 1, giftTag: 'stroll_meijiawu' },
  },

  // ── 茶文化 ──
  {
    id: 'hz_stroll_spreading',
    kind: 'culture', weight: 10,
    lines: [
      '（一张大竹匾里摊着薄薄一层龙井鲜叶，正在摊放——走水回软，青气才会退。）',
      '（摊放这一步急不得。叶子「醒」过来了，杀青才杀得好。）',
    ],
  },
  {
    id: 'hz_stroll_qingguo',
    kind: 'culture', weight: 10,
    lines: [
      '（一位师傅正守着热锅「青锅」，手掌在锅里有节奏地压、抖。）',
      '（杀青定型就在这几分钟里——锅温、手劲、快慢，全在手上。）',
    ],
  },
  {
    id: 'hz_stroll_chat_spring',
    kind: 'culture', weight: 9,
    lines: [
      '（两位村里人在门口闲聊：「今年头采早了几天，芽头倒是不赖。」）',
      '（你在旁边听着，默默记下了「头采」两个字。）',
    ],
  },
  {
    id: 'hz_stroll_knowledge',
    kind: 'culture', weight: 9,
    lines: [
      '（茶垄边插着一块小木牌：龙井讲「一芽一叶」，采得嫩，做出来才秀气。）',
      '（梅家坞的茶垄贴着坡走，一垄一垄，绿得整整齐齐。）',
    ],
  },

  // ── 与制茶的轻微联动：亲手炒过龙井的玩家，进村会认得这一锅 ──
  {
    id: 'hz_stroll_longjing_fresh',
    kind: 'culture', weight: 9,
    requires: (p) => !!p.madeTeas['longjing'],
    lines: [
      '（刚炒好的龙井摊在竹匾里晾着，空气里都是清鲜的豆香。）',
      '（你认得这个香气——自己的手上，也炒出过这一锅。）',
    ],
  },

  // ── NPC 偶遇（复用杭州已有角色，立绘由调用方渲染） ──
  {
    id: 'hz_stroll_npc_linggu',
    kind: 'npc', weight: 8, npcId: 'linggu',
    lines: [
      { speaker: '林姑娘', text: '「又见面啦。」' },
      { speaker: '林姑娘', text: '「梅家坞这条路，我一天能走上三回——走不腻。」' },
      { speaker: '你', text: '「你这么熟，龙井到底好在哪？」' },
      { speaker: '林姑娘', text: '「鲜。山里的嫩芽，火候利落，泡出来那口清气，别处学不来。」' },
      { speaker: '你', text: '「那我得自己试一回。」' },
      { speaker: '林姑娘', text: '「拿包我刚炒的——你尝尝，跟武夷山不是一个路数。」' },
    ],
    // 林姑娘回礼：龙井（杭州茶）；gift 可泡不可卖。
    giveTea: { teaId: 'longjing', grade: 'normal', count: 1, giftTag: 'stroll_meijiawu' },
  },
  {
    id: 'hz_stroll_npc_lingyi',
    kind: 'npc', weight: 8, npcId: 'lingyi',
    lines: [
      { speaker: '玲姨', text: '「哟，你也来村里转悠？」' },
      { speaker: '玲姨', text: '「转累了就回茶席坐坐，我那儿茶点常备着。」' },
      { speaker: '你', text: '「玲姨，你茶馆里那个龙井，是自己炒的？」' },
      { speaker: '玲姨', text: '「哪能全自己炒，也得收村里的鲜叶。不过火候我盯着的。」' },
      { speaker: '玲姨', text: '「改天来我茶席坐坐，我泡壶红梅给你配茶点。」' },
    ],
  },
  {
    id: 'hz_stroll_npc_gushu',
    kind: 'npc', weight: 8, npcId: 'gu_shu',
    lines: [
      { speaker: '郭叔', text: '「看茶别光用眼睛。」' },
      { speaker: '郭叔', text: '「多闻、多喝，手上自然就有数了。」' },
      { speaker: '你', text: '「郭叔，杭州绿茶和武夷岩茶，差别真有那么大？」' },
      { speaker: '郭叔', text: '「一个讲鲜爽，一个讲岩骨。路子不同，急不得。」' },
      { speaker: '你', text: '「受教了。」' },
      { speaker: '郭叔', text: '「有空来坐，我泡壶龙井，咱俩对比着喝。」' },
    ],
  },
  {
    id: 'hz_stroll_npc_traveler',
    kind: 'npc', weight: 8, npcId: 'young_male_traveler',
    lines: [
      { speaker: '年轻男旅客', text: '「梅家坞——名字早听过了，今天总算自己走一趟。」' },
      { speaker: '年轻男旅客', text: '「这满村的绿，跟武夷山那个味儿完全不一样。」' },
      { speaker: '你', text: '「龙井讲一个『鲜』字，武夷岩茶讲岩骨花香，路子不同。」' },
      { speaker: '年轻男旅客', text: '「我上一站还在武夷山喝岩茶，这站就喝绿茶了，嘴都忙不过来。」' },
      { speaker: '你', text: '「慢慢喝，不急。」' },
      { speaker: '年轻男旅客', text: '「行，我接着逛——下一站听说是杭州城里，到时候再碰。」' },
    ],
  },

  // ── 小彩蛋（低权重，无奖励，纯生活） ──
  {
    id: 'hz_stroll_cat',
    kind: 'egg', weight: 7,
    lines: [
      '（茶园边上一只狸花猫摊开四肢晒太阳，肚皮朝着天。）',
      '（你看了它很久，它一眼都没给你。）',
    ],
  },
  {
    id: 'hz_stroll_call',
    kind: 'egg', weight: 7,
    lines: [
      '（远处有人扯着嗓子喊「收茶嘞——」，声音在山坳里荡了一圈才落下来。）',
    ],
  },

  // ── 没有特别事件（散步本身即目的） ──
  {
    id: 'hz_stroll_nothing',
    kind: 'nothing', weight: 10,
    lines: [
      '（你在村道上慢慢走了一圈。风是软的，茶是绿的——今天就挺好。）',
    ],
  },
];
