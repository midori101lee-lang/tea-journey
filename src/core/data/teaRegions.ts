/**
 * 茶世界（Tea World）首页数据：四宫格茶区旅行卡片。
 * 只描述「世界入口」这一层的展示数据（印象图 / 地域印象 / 代表茶 / 解锁态），
 * 不重复 REGIONS 里的地点 / NPC / 制茶逻辑——后者仍由 regions.ts 与游戏核心负责。
 *
 * 数据驱动：以后加「安溪 / 福鼎 / 云南 / 黄山」只需在数组里加项，
 * 卡片渲染与分页（每页 4 张）会自动覆盖，无需改组件。
 */
export interface TeaRegionCard {
  id: string;
  name: string;
  impression: string; // 地域印象
  teas: string;       // 代表茶（展示文案，如「肉桂 · 水仙 · 大红袍」）
  image: string;      // 已解析的图片 URL（BASE_URL + public 相对路径）
  unlocked: boolean;  // 当前是否可进入；解锁逻辑沿用项目既有状态（首版仅武夷山）
  /** 解锁 flag：存在时忽略静态 unlocked，改由 player.flags[unlockFlag] 决定（用于章节解锁，如杭州）。 */
  unlockFlag?: string;
  /** 对应 REGIONS 的 id；未实装的茶区（杭州/福州/潮州）留空，点击只提示未解锁。 */
  regionId?: string;
}

const base = import.meta.env.BASE_URL;

export const TEA_WORLD_REGIONS: TeaRegionCard[] = [
  {
    id: 'wuyishan',
    name: '武夷山',
    impression: '丹霞山间，岩茶生长其中',
    teas: '肉桂 · 水仙 · 大红袍',
    image: base + 'assets/teaworld/武夷山.jpg',
    unlocked: true,
    regionId: 'wuyishan',
  },
  {
    id: 'hangzhou',
    name: '杭州',
    impression: '西湖春色里的茶香',
    teas: '西湖龙井 · 九曲红梅',
    image: base + 'assets/teaworld/杭州.jpg',
    // 章节解锁：走完武夷山（探索 5/5）→ 回老陈茶馆 → 老陈收束 → 林姑娘杭州线索 → heard_about_hangzhou → 解锁。
    // 不因「第一次与老陈对话」提前解锁；旧存档若已置位则保持解锁。
    unlocked: false,
    unlockFlag: 'heard_about_hangzhou',
    regionId: 'hangzhou',
  },
  {
    id: 'fuzhou',
    name: '福州',
    impression: '茉莉花香，融进一盏茶里',
    teas: '茉莉花茶',
    image: base + 'assets/teaworld/福州.jpg',
    unlocked: false,
  },
  {
    id: 'chaozhou',
    name: '潮州',
    impression: '凤凰山里，单丛茶香',
    teas: '凤凰单丛',
    image: base + 'assets/teaworld/潮州.jpg',
    unlocked: false,
  },
];

/** 每页卡片数（预留多页扩展：未来第二页 安溪/福鼎/云南/黄山）。 */
export const TEA_WORLD_PER_PAGE = 4;

export function teaWorldPages(): number {
  return Math.max(1, Math.ceil(TEA_WORLD_REGIONS.length / TEA_WORLD_PER_PAGE));
}

/** 取某个茶区数据；仅作展示用，找不到返回 undefined（理论上不会发生）。 */
export function getTeaRegionCard(id: string): TeaRegionCard | undefined {
  return TEA_WORLD_REGIONS.find((r) => r.id === id);
}
