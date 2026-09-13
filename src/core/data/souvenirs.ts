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
  // ─────────── 杭州 · 梅家坞：吟诗老人赠的旅途收藏 ───────────
  // 文字类收藏（诗笺），与玲姨茶馆的「茶联」是两回事：来源、赠予者、叙事意义都不同。
  // 诗句为用户指定原文（唐韬《访西湖梅家坞茶村》），保持原样，不改写。
  {
    id: 'poem_meijiawu',
    regionId: 'hangzhou',
    kind: 'note',
    title: '梅家坞诗笺',
    place: '浙江 · 杭州 · 梅家坞',
    lines: [
      '梅家坞村翠千重，',
      '一缕香烟绕秀峰。',
      '如此湖山归去得，',
      '诗人不做做茶农。',
    ],
    attribution: '唐韬《访西湖梅家坞茶村》',
    backText: '吟诗老人留下的一张小诗笺。',
    motto: '陶冶情操，有缘再见。',
    giverName: '吟诗老人',
  },
  // ─────────── 杭州 · 玲姨茶馆：玲姨送的茶联 ───────────
  // 一副完整茶联 = 上联 + 下联两个独立图片资源（120×420 原样，等比缩放，不改字、不合并），
  // 但收藏上仍是**一件**收藏品（kind:'couplet'）。卷轴展开体验见 CoupletScroll。
  {
    id: 'couplet_hangzhou',
    regionId: 'hangzhou',
    kind: 'couplet',
    title: '杭州茶联',
    place: '浙江 · 杭州 · 玲姨的茶馆',
    photo: 'assets/couplets/couplet_upper.webp',  // 上联（← background picture/茶联上.PNG）
    photo2: 'assets/couplets/couplet_lower.webp', // 下联（← background picture/茶联下.PNG）
    backText: '听说是某位名家留下的。也可能是隔壁老王写的。',
    motto: '挂在哪里，哪里就是茶馆。',
    giverName: '玲姨',
  },
];

export function getSouvenir(id: string): SouvenirDef | undefined {
  return SOUVENIRS.find((s) => s.id === id);
}

/** 某茶区的旅行收藏（缺省归武夷山，兼容早期数据）。 */
export function souvenirsOfRegion(regionId: string): SouvenirDef[] {
  return SOUVENIRS.filter((s) => (s.regionId ?? 'wuyishan') === regionId);
}
