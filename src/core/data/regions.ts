import type { Region, Clue, Player, LocationId } from '../types';
import { TEAS } from './teas';

// ─────────── 茶区（先做一座山，再做整个中国） ───────────
// 第一章固定：武夷山。地点用轻量列表，不做大地图（MVP 原则）。

export const REGIONS: Region[] = [
  {
    id: 'wuyishan',
    name: '武夷山',
    accent: '#7a9a5b', // 茶区主题色：山绿
    intro: '丹霞红岩之间，一片茶山正醒着。你从茶馆老陈那儿，第一次走进武夷山。',
    locations: [
      { id: 'teahouse', name: '老陈的茶馆', npcIds: ['laochen', 'linggu'], accent: '#b9c9a3', blurb: '进山的第一个落脚点。一杯茶，一段闲话。' },
      { id: 'garden', name: '茶园', npcIds: ['axiu'], accent: '#c2d6a0', blurb: '阿秀守着这片开面采的茶青。' },
      { id: 'workshop', name: '制茶坊', npcIds: ['yanbo'], accent: '#cdb48a', blurb: '岩伯看火的地方，也是你认识制茶工序的门槛。真要做茶，从茶园选茶那头进。' },
      { id: 'teatable', name: '茶桌', npcIds: ['zhoubo'], accent: '#c9b79c', blurb: '周伯的盖碗。自己做的茶，在这里见真章。' },
      // 九龙窠解锁条件：玩家亲手完成过一次武夷山制茶流程（player.flags.tea_made）。
      // 不放任为「随时可进」——否则仅完成老陈对话就会提前解锁，违背「做完茶才进九龙窠」的产品逻辑。
      // 具体门禁在 MapView 中按 tea_made 判断；此处 locked 仅作数据默认态，不影响判断。
      { id: 'mothertree', name: '九龙窠母树', npcIds: ['yanbo'], accent: '#bb8a7a', blurb: '做完一锅茶，周伯会跟你提起这地方。', locked: true },
      { id: 'market', name: '茶集市', npcIds: ['xiaoman'], accent: '#c8b27a', blurb: '买卖茶与茶具的地方。', locked: true },
    ],
  },
  // ─────────── 杭州（第二阶段起步：先跑通九曲红梅最小闭环；龙井/梅家坞剧情后置） ───────────
  // 与武夷山共享同一批功能场景（茶馆/茶园/制茶坊/茶桌/茶集市），只是数据与本地场景不同；
  // 梅家坞对标九龙窠，是本阶段唯一的地域探索入口（占位，后续挂载龙井线剧情）。
  {
    id: 'hangzhou',
    name: '杭州',
    accent: '#8fb0a8', // 茶区主题色：江南青
    intro: '西湖边的茶山，一层一层绿到山脚。林姑娘说的那个杭州，你到了。',
    locations: [
      { id: 'teahouse', name: '玲姨的茶馆', npcIds: ['lingyi'], accent: '#cfe0d6', blurb: '玲姨的茶馆，一杯龙井配一小碟茶点，坐下就不想走。', scene: 'hz-teahouse' },
      { id: 'garden', name: '杭州茶园', npcIds: ['aqing'], accent: '#bfe0b6', blurb: '茶园里有个小大人一样的孩子，说起茶来头头是道。', scene: 'hz-garden' },
      { id: 'workshop', name: '制茶坊', npcIds: [], accent: '#cdb48a', blurb: '杭州做茶是另一条路：萎凋、揉捻、发酵、烘干。', scene: 'hz-workshop' },
      { id: 'teatable', name: '茶桌', npcIds: [], accent: '#c9b79c', blurb: '自己做的九曲红梅，在这儿泡一壶尝尝。', scene: 'hz-teatable' },
      { id: 'meijiawu', name: '梅家坞', npcIds: ['yinshi_laoren'], accent: '#a8c8b0', blurb: '梅家坞——龙井的核心山场，茶园里常有位爱吟诗的老人。', scene: 'meijiawu' },
      { id: 'market', name: '茶集市', npcIds: ['xiaoman'], accent: '#c8b27a', blurb: '买卖茶与茶具的地方。（各地共用）', scene: 'market', locked: true },
    ],
  },
];

export function getRegion(id: string): Region {
  const r = REGIONS.find((x) => x.id === id);
  if (!r) throw new Error(`unknown region: ${id}`);
  return r;
}

/** 某茶区某功能地点对应的「场景 key」：茶馆/茶园/制茶坊/茶桌等在各茶区可绑定不同本地场景。 */
export function regionLocationScene(regionId: string, locId: LocationId): string {
  const r = REGIONS.find((x) => x.id === regionId);
  const loc = r?.locations.find((l) => l.id === locId);
  return loc?.scene ?? locId;
}

// ─────────── 茶集市解锁 ───────────
// 条件：玩家亲手完成过武夷山三种茶各至少一次（记录于 player.madeTeas，与背包无关）。
// 不使用熟练度 / 次数 / 随机 / 单纯剧情门槛。
export const MARKET_REQUIRED_TEAS = ['rougui', 'shuixian', 'dahongpao'];

export function isMarketUnlocked(player: Player): boolean {
  return MARKET_REQUIRED_TEAS.every((id) => !!player.madeTeas[id]);
}

// ─────────── 线索（探索驱动，不自动弹窗解锁） ───────────
// 集齐后不弹「已解锁杭州」，而是林姑娘/老陈问一句「想不想出去走走？」由玩家主动触发。

export const CLUES: Clue[] = [
  {
    id: 'clue_hangzhou',
    fromRegion: 'wuyishan',
    toRegion: 'hangzhou',
    text: '林姑娘：「杭州那边做茶可不摇这个——他们要嫩芽，锅一烫就杀青。同一片叶子，换个山头，做法完全两样。」',
    triggerFlag: 'heard_about_hangzhou',
    sourceNpc: 'linggu',
  },
  {
    id: 'clue_fuzhou',
    fromRegion: 'wuyishan',
    toRegion: 'fuzhou',
    text: '老陈：「福州人拿茶坯去窨花，茉莉香是『吃』进去的，不是长出来的。你以后去南方，闻闻就懂。」',
    triggerFlag: 'heard_about_fuzhou',
    sourceNpc: 'laochen',
  },
];

export function getCluesFrom(regionId: string): Clue[] {
  return CLUES.filter((c) => c.fromRegion === regionId);
}

// ─────────── 尚未抵达的茶区（仅占位展示，本次不加任何实际内容） ───────────
// 「我的茶山足迹」里要让玩家看见自己还没去过的地方，但这些茶区目前没有
// 地点 / NPC / 茶叶 / 漫画，点击只提示「还没去过」，不进入任何页面。

export interface UpcomingRegion {
  id: string;
  name: string;
  icon: string;
  accent: string;
  hint: string;   // 尚未抵达时的一句话
}

export const UPCOMING_REGIONS: UpcomingRegion[] = [
  { id: 'fuzhou', name: '福州', icon: '🌸', accent: '#d3a6ac', hint: '老陈说过：拿茶坯去窨花，茉莉香是吃进去的。' },
  { id: 'chaozhou', name: '潮州', icon: '🌱', accent: '#b8a06a', hint: '还没人跟你提起过那里。' },
];

// ─────────── 茶区探索进度（与制茶熟练度是两个维度，不合并） ───────────
// 探索 = 我在这里发现了多少地方；熟练度 = 我在这里做茶做到了什么程度。
// 只用现有 metNpcs 派生，不新增访问记录系统。
// 茶馆是进山的起点，不计入探索；未解锁的地点（茶集市）计入分母但标「未解锁」。

export function regionExploration(player: Player, region: Region): { visited: number; total: number } {
  // 茶馆是进山的起点，不计入探索；未解锁的地点（如茶集市）要等开市后才计入分母。
  const marketOpen = isMarketUnlocked(player);
  const targets = region.locations.filter(
    (l) => l.id !== 'teahouse' && (l.id !== 'market' || marketOpen),
  );
  const visited = targets.filter((l) => l.npcIds.some((n) => player.metNpcs.includes(n))).length;
  return { visited, total: targets.length };
}

// ─────────── 章节衔接：武夷山走完 → 老陈收束 → 林姑娘引出杭州 ───────────
// 复用现有探索进度（regionExploration），不新增第二套探索系统、不引入熟练度。

/** 武夷山是否已「走完一遍」= 探索 5/5。茶集市开市后探索分母为 5，故 visited>=5 即满。 */
export function isWuyishanExplored(player: Player): boolean {
  const r = REGIONS.find((x) => x.id === 'wuyishan');
  if (!r) return false;
  const { visited, total } = regionExploration(player, r);
  return total >= 5 && visited >= total;
}

/** 玩家是否还带着「老陈送的武夷山茶」（区域告别礼）。供未来各 NPC 的旅途记忆读取。 */
export function hasWuyishanGiftTea(player: Player): boolean {
  return player.inventory.some((s) => s.giftTag === 'farewell_gift_wuyishan' && s.count > 0);
}

/** 某茶区的茶叶记录：只用 madeTeas（曾经亲手做过），与背包无关。 */
export function regionTeaIds(regionId: string): string[] {
  return TEAS.filter((t) => t.regionId === regionId).map((t) => t.id);
}
