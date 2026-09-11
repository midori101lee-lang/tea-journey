// ─────────────────────────────────────────────────────────────
// 茶具系统 V0.3：茶具是玩家消费茶钱、逐渐改善喝茶体验的长期目标。
//
// 设计铁律（来自用户规范）：
//   1) 茶具不是 RPG 装备：不携带任何数值属性（无「香气 +10 / 滋味 +5」之类）。
//   2) 茶具与茶叶背包(inventory)分开：茶叶是消耗品，茶具是长期收藏（买一次长期拥有）。
//   3) 不建第二套茶钱；沿用 coins。
//   4) 茶具永远不能把一锅差茶变成好茶（不影响茶叶品质 / 王霸茶评价）。
//   5) 茶具不改变茶叶品质：本优化只让「玩家选择的茶具」出现在泡茶场景里（外观 + 代入感），
//      不接入任何评分/属性/加成。克制起见，仅「盖碗类 / 紫砂壶」可进入泡茶，杯/罐/旅行具为收藏展示。
// ─────────────────────────────────────────────────────────────

export type TeaWareRarity = 'common' | 'intermediate' | 'advanced' | 'rare';
/** 茶具形态：决定是否能作为泡茶容器（盖碗/壶可泡；杯/罐/套具仅收藏）。 */
export type TeaWareKind = 'gaiwan' | 'pot' | 'cup' | 'caddy' | 'set' | 'tray';

export interface TeaWare {
  id: string;
  /** 展示名（与稀有度标签、价格并列，不写数值属性）。 */
  name: string;
  /** 游戏自有经济参数，不代表现实茶具价格。 */
  price: number;
  rarity: TeaWareRarity;
  /** 形态：盖碗/壶可进入泡茶，其余为收藏展示。 */
  type: TeaWareKind;
  /** 是否可作为泡茶容器（盖碗类 / 紫砂壶 = true）。不影响品质，只决定能否在泡茶前被选用。 */
  usableForBrew: boolean;
  /** 一句话描述（看物不看数）。 */
  description: string;
  /** public 下相对路径，经 import.meta.env.BASE_URL 解析（注意：精选紫砂壶实际素材文件名为「特选紫砂壶.webp」）。 */
  asset: string;
}

/** 稀有度中文标签（前端轻量展示：卡片边框 / 小标签 / 价格，不做装备面板）。 */
export const RARITY_LABEL: Record<TeaWareRarity, string> = {
  common: '入门',
  intermediate: '中级',
  advanced: '高级',
  rare: '稀有',
};

/** 第一批上架茶具（全部 10 件素材，本轮一次性上线；功能加成暂不做）。
 *  usableForBrew：盖碗类(白瓷/青瓷)与紫砂壶(入门/特选)可进入泡茶；杯/罐/旅行具为收藏展示。 */
export const MARKET_TEA_WARES: TeaWare[] = [
  { id: 'white-teacup', name: '白瓷品茗杯', price: 10, rarity: 'common', type: 'cup', usableForBrew: false,
    description: '简单的一只杯子，喝茶从这里开始。', asset: 'assets/teaware/白瓷品茗杯.webp' },
  { id: 'white-gaiwan', name: '白瓷盖碗', price: 18, rarity: 'common', type: 'gaiwan', usableForBrew: true,
    description: '一只白瓷盖碗，够你慢慢把茶喝明白。', asset: 'assets/teaware/白瓷盖碗.webp' },
  { id: 'bamboo-teaware', name: '竹木茶盘', price: 35, rarity: 'common', type: 'tray', usableForBrew: false,
    description: '朴素的一方茶盘，泡茶时把盖碗、公道杯都摆在上面。', asset: 'assets/teaware/竹木茶盘.webp' },
  { id: 'blue-white-tea-caddy', name: '青花瓷茶叶罐', price: 45, rarity: 'common', type: 'caddy', usableForBrew: false,
    description: '装一点自己喜欢的茶，也很好看。', asset: 'assets/teaware/青花瓷茶叶罐.webp' },
  { id: 'celadon-gaiwan', name: '青瓷盖碗', price: 55, rarity: 'intermediate', type: 'gaiwan', usableForBrew: true,
    description: '颜色温润，摆在茶桌上也很好看。', asset: 'assets/teaware/青瓷盖碗.webp' },
  { id: 'blue-gray-tea-caddy', name: '青灰色茶叶罐', price: 60, rarity: 'intermediate', type: 'caddy', usableForBrew: false,
    description: '朴素安静，适合慢慢收藏。', asset: 'assets/teaware/青灰色茶叶罐.webp' },
  { id: 'fairness-cup', name: '公道杯', price: 70, rarity: 'intermediate', type: 'cup', usableForBrew: false,
    description: '茶汤分得匀一些，也方便慢慢喝。', asset: 'assets/teaware/公道杯.webp' },
  { id: 'beginner-zisha-pot', name: '入门紫砂壶', price: 120, rarity: 'advanced', type: 'pot', usableForBrew: true,
    description: '终于有了一把属于自己的小壶。', asset: 'assets/teaware/入门紫砂壶.webp' },
  { id: 'selected-zisha-pot', name: '精选紫砂壶', price: 180, rarity: 'advanced', type: 'pot', usableForBrew: true,
    description: '做工更讲究一些，值得好好收着。', asset: 'assets/teaware/特选紫砂壶.webp' },
  { id: 'rare-travel-teaware', name: '稀有旅行茶具', price: 320, rarity: 'rare', type: 'set', usableForBrew: false,
    description: '装进包里，走到哪儿都能喝上一壶。', asset: 'assets/teaware/稀有旅行茶具.webp' },
];

export const getTeaWare = (id: string): TeaWare | undefined =>
  MARKET_TEA_WARES.find((w) => w.id === id);

/** 从玩家已拥有的茶具里，取第一个属于某形态（如茶盘/茶叶罐）的茶具。用于泡茶场景按组合动态显示底座 / 装饰。 */
export function ownedWareOfType(owned: string[], type: TeaWareKind): TeaWare | undefined {
  return MARKET_TEA_WARES.find((w) => owned.includes(w.id) && w.type === type);
}

/** 「还没买过任何茶具」时的默认泡茶容器：茶桌上常备的素盖碗（内联 SVG 绘制，非商品、不进收藏/出售）。
 *  章节推荐使用某种茶具 ≠ 玩家自动拥有——白瓷盖碗等仍需在茶集市购买后才可选。 */
export const DEFAULT_BREW_WARE: TeaWare = {
  id: 'default-gaiwan',
  name: '素盖碗',
  price: 0,
  rarity: 'common',
  type: 'gaiwan',
  usableForBrew: true,
  description: '茶桌上常备的一只素盖碗，虽然朴素，泡茶够用。',
  asset: '', // 空 = 由 BrewWare 用内联 SVG 绘制（GaiwanSvg），不加载位图
};
