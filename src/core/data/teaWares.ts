// ─────────────────────────────────────────────────────────────
// 茶具系统 V0.3：茶具是玩家消费茶钱、逐渐改善喝茶体验的长期目标。
//
// 设计铁律（来自用户规范）：
//   1) 茶具不是 RPG 装备：不携带任何数值属性（无「香气 +10 / 滋味 +5」之类）。
//   2) 茶具与茶叶背包(inventory)分开：茶叶是消耗品，茶具是长期收藏（买一次长期拥有）。
//   3) 不建第二套茶钱；沿用 coins。
//   4) 茶具永远不能把一锅差茶变成好茶（不影响茶叶品质 / 王霸茶评价）。
//   5) 本轮不接入 BrewingFlow；未来 P1/P2 才可能轻微改变「操作体验」，而非「茶叶品质」。
// ─────────────────────────────────────────────────────────────

export type TeaWareRarity = 'common' | 'intermediate' | 'advanced' | 'rare';

export interface TeaWare {
  id: string;
  /** 展示名（与稀有度标签、价格并列，不写数值属性）。 */
  name: string;
  /** 游戏自有经济参数，不代表现实茶具价格。 */
  price: number;
  rarity: TeaWareRarity;
  /** 一句话描述（看物不看数）。 */
  description: string;
  /** public 下相对路径，经 import.meta.env.BASE_URL 解析（注意：精选紫砂壶实际素材文件名为「特选紫砂壶.png」）。 */
  asset: string;
}

/** 稀有度中文标签（前端轻量展示：卡片边框 / 小标签 / 价格，不做装备面板）。 */
export const RARITY_LABEL: Record<TeaWareRarity, string> = {
  common: '入门',
  intermediate: '中级',
  advanced: '高级',
  rare: '稀有',
};

/** 第一批上架茶具（全部 10 件素材，本轮一次性上线；功能加成暂不做）。 */
export const MARKET_TEA_WARES: TeaWare[] = [
  { id: 'white-teacup', name: '白瓷品茗杯', price: 10, rarity: 'common',
    description: '简单的一只杯子，喝茶从这里开始。', asset: 'assets/teaware/白瓷品茗杯.png' },
  { id: 'white-gaiwan', name: '白瓷盖碗', price: 18, rarity: 'common',
    description: '一只白瓷盖碗，够你慢慢把茶喝明白。', asset: 'assets/teaware/白瓷盖碗.png' },
  { id: 'bamboo-teaware', name: '竹木茶具', price: 35, rarity: 'common',
    description: '轻便朴素，带一点山里的气息。', asset: 'assets/teaware/竹木茶具.png' },
  { id: 'blue-white-tea-caddy', name: '青花瓷茶叶罐', price: 45, rarity: 'common',
    description: '装一点自己喜欢的茶，也很好看。', asset: 'assets/teaware/青花瓷茶叶罐.png' },
  { id: 'celadon-gaiwan', name: '青瓷盖碗', price: 55, rarity: 'intermediate',
    description: '颜色温润，摆在茶桌上也很好看。', asset: 'assets/teaware/青瓷盖碗.png' },
  { id: 'blue-gray-tea-caddy', name: '青灰色茶叶罐', price: 60, rarity: 'intermediate',
    description: '朴素安静，适合慢慢收藏。', asset: 'assets/teaware/青灰色茶叶罐.png' },
  { id: 'fairness-cup', name: '公道杯', price: 70, rarity: 'intermediate',
    description: '茶汤分得匀一些，也方便慢慢喝。', asset: 'assets/teaware/公道杯.png' },
  { id: 'beginner-zisha-pot', name: '入门紫砂壶', price: 120, rarity: 'advanced',
    description: '终于有了一把属于自己的小壶。', asset: 'assets/teaware/入门紫砂壶.png' },
  { id: 'selected-zisha-pot', name: '精选紫砂壶', price: 180, rarity: 'advanced',
    description: '做工更讲究一些，值得好好收着。', asset: 'assets/teaware/特选紫砂壶.png' },
  { id: 'rare-travel-teaware', name: '稀有旅行茶具', price: 320, rarity: 'rare',
    description: '装进包里，走到哪儿都能喝上一壶。', asset: 'assets/teaware/稀有旅行茶具.png' },
];

export const getTeaWare = (id: string): TeaWare | undefined =>
  MARKET_TEA_WARES.find((w) => w.id === id);
