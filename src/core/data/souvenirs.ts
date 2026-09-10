import type { SouvenirDef } from '../types';

// ─────────── 旅行纪念物（V0.2） ───────────
// 仅作「游历后带回的纪念」，不是知识卡、不进茶叶背包、不带入任何评分/百科系统。
// 真实照片使用「知识卡片的实拍母树.HEIC」经 Pillow 转出的 webp（背景之外另存一张，仅此处用）。
// 未来其他茶区可在此追加不同的地方纪念物（如另一张明信片 / 一枚山场印记），机制完全复用。

export const SOUVENIRS: SouvenirDef[] = [
  {
    id: 'postcard_mothertree',
    regionId: 'wuyishan',
    title: '大红袍母树明信片',
    photo: 'assets/knowledge/mothertree_real.webp', // 真实实拍母树（HEIC 派生），非 AI 手绘
    caption: '大红袍母树',
    place: '福建 · 武夷山 · 九龙窠',
    backText: '九龙窠——武夷山的一处茶山景观。崖壁上的几棵老茶树，看得到、喝不到，是这片山的来处。',
    yanboNote: '来过，就记得。',
    source: '武夷山九龙窠实拍',
  },
];

export function getSouvenir(id: string): SouvenirDef | undefined {
  return SOUVENIRS.find((s) => s.id === id);
}

/** 某茶区的旅行收藏（缺省归武夷山，兼容早期数据）。 */
export function souvenirsOfRegion(regionId: string): SouvenirDef[] {
  return SOUVENIRS.filter((s) => (s.regionId ?? 'wuyishan') === regionId);
}
