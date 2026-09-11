import type { Comic } from '../types';

// ─────────── 武夷山第一章漫画（轻量：2–4 格；知识非百科，是游历中顺手获得） ───────────
// 触发原则：玩家先玩 → 看到变化 → NPC 说一句 → 产生好奇 → 漫画补充。
// 画面：全内联 SVG（见 features/journal/ComicArt.tsx），art = 插画 key。
// 每格都必须有 art——缺一格就会显示空白，之前的「加载不出来」多半就是这么来的。

export const COMICS: Comic[] = [
  {
    id: 'comic_why_zuoqing',
    regionId: 'wuyishan',
    kind: 'process',
    title: '为什么叶子要摇？',
    source: '武夷岩茶制作技艺（国家级非遗）· 做青',
    triggerNote: '做完青后，岩伯随口提一句，顺手解锁',
    panels: [
      { caption: '采下来的青叶，还带着一股「青气」。', art: 'fresh-leaf' },
      { caption: '摇一摇、晾一晾，再摇——叶缘被碰伤，慢慢转成朱砂红。', art: 'leaf-edge-red' },
      { caption: '这叫「绿叶红镶边」，岩骨花香就是从这里开始的。', art: 'red-edge-closeup' },
      { caption: '岩伯：「别照着数摇。看叶子，它会告诉你该不该再摇。」', art: 'shake-tray' },
    ],
  },
  {
    id: 'comic_wuyishan_terroir',
    regionId: 'wuyishan',
    kind: 'terroir',
    title: '武夷山为什么出好岩茶',
    source: '地方史料 / 地理常识（B 级）',
    triggerNote: '第一次踏进茶园，老陈闲谈里带出',
    panels: [
      { caption: '这儿的山，多是丹霞红岩，风化出带点砂感的土。', art: 'red-rock' },
      { caption: '坑、涧、岩、峰，日照和雾气各不一样——同一座山，茶味也不同。', art: 'valley-mist' },
      { caption: '老陈：「山场就是茶的出身。出身说不清好坏，只说不同。」', art: 'shan-chang' },
    ],
  },
  {
    id: 'comic_mother_tree',
    regionId: 'wuyishan',
    kind: 'story',
    title: '那几棵母树',
    source: '【传说】与史料并存，非定论',
    triggerNote: '认得母树后，老陈讲旧闻，解锁',
    panels: [
      { caption: '九龙窠崖壁上，曾有过六株老茶树，被称为「大红袍母树」。', art: 'cliff-tree' },
      { caption: '【传说】古时举子病愈谢茶，红袍披树——故事就这么传开了。', art: 'red-robe' },
      { caption: '后来母树不再采摘，成了看得到、喝不到的「活标本」。', art: 'no-pick' },
      { caption: '老陈：「你要问真正那几棵？早不让采了。现在喝的，是这片山的茶。」', art: 'laochen-talk' },
    ],
  },
  {
    id: 'comic_person_axiu',
    regionId: 'wuyishan',
    kind: 'person',
    title: '阿秀的一天',
    source: '茶季采茶人日常（生活观察）',
    triggerNote: '在茶园帮阿秀采完第一篓，解锁',
    panels: [
      { caption: '天没亮，阿秀就背着竹篓上了山。', art: 'dawn-mountain' },
      { caption: '「开面的才要，嫩芽留着——我们这儿和做绿茶的不一样。」', art: 'open-leaf' },
      { caption: '一篓茶青，要一趟趟弯腰，手指被叶齿划得发痒。', art: 'pick-hands' },
      { caption: '阿秀：「你以为喝茶轻松？做茶这碗饭，累的在后头。」', art: 'axiu-talk' },
    ],
  },

  // ─────────── 杭州（第二阶段）：九曲红梅茶漫画 ───────────
  // 玩家刚亲手做完一锅，再回头看「我做的到底是什么茶」；与武夷山同一套漫画系统与画风。
  // 内容以项目已确认的资料为准（红茶工艺：萎凋→揉捻→发酵→干燥），不为画面虚构工艺。
  {
    id: 'comic_jiuquhongmei',
    regionId: 'hangzhou',
    kind: 'process',
    title: '你刚才做的是什么茶：九曲红梅',
    source: '杭州地方名茶常识 · 工夫红茶（B 级）',
    triggerNote: '做完第一锅九曲红梅（发酵）后，顺手解锁',
    panels: [
      { caption: '杭州的茶，不止西湖龙井。九曲红梅，是杭州的另一路——红茶。', art: 'hz-tea-hills' },
      { caption: '鲜叶先摊开萎凋，再揉捻成条，然后堆起来发酵转红，最后烘干定香。', art: 'hongcha-flow' },
      { caption: '做好的九曲红梅汤色红亮、滋味甜润，常带一点梅香或花香。', art: 'red-liquor' },
      { caption: '「九曲」是这一带弯弯的山溪，「红梅」说的是那口红亮甜润——名字里，就是杭州。', art: 'meijiawu-village' },
    ],
  },
];

export function getComic(id: string): Comic | undefined {
  return COMICS.find((c) => c.id === id);
}

/** 某茶区的全部茶漫画（缺省归武夷山，兼容早期数据）。 */
export function comicsOfRegion(regionId: string): Comic[] {
  return COMICS.filter((c) => (c.regionId ?? 'wuyishan') === regionId);
}
