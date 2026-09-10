import type { Dialogue } from '../types';

// ─────────── 武夷山第一章对话（轻剧情：短对话 + 重复出现 + 留白） ───────────
// 原则：NPC 像真人聊天，不写百科。岩伯只描述状态，不给答案。

export const DIALOGUES: Dialogue[] = [
  // ── 老陈 · 茶馆开场（第一次） ──
  {
    id: 'laochen_teahouse_first',
    npcId: 'laochen',
    scene: 'teahouse',
    trigger: { kind: 'first' },
    setsFlags: { met_laochen: true, first_tea_offered: true },
    lines: [
      { speaker: '老陈', text: '第一次来武夷山？坐。先喝一杯。', mood: 'warm' },
      { speaker: '老陈', text: '今年的岩茶，香还憋在叶子里。', mood: 'calm' },
      { speaker: '老陈', text: '光喝有什么意思？后头有片茶园，要不……你自己做一锅？', mood: 'warm' },
    ],
  },
  // ── 老陈 · 茶馆重复（随熟练度变化，由 store 选 tier） ──
  {
    id: 'laochen_teahouse_repeat',
    npcId: 'laochen',
    scene: 'teahouse',
    trigger: { kind: 'repeat' },
    lines: [
      { speaker: '老陈', text: '又来啦。今天想做哪样的？', mood: 'warm' },
    ],
  },
  {
    id: 'laochen_teahouse_pro',
    npcId: 'laochen',
    scene: 'teahouse',
    trigger: { kind: 'conditional', flag: 'proficiency_tier', value: '老练' },
    lines: [
      { speaker: '老陈', text: '你这手艺，山里都开始有耳朵了。', mood: 'joke' },
      { speaker: '老陈', text: '下回带你去认认那几棵母树？', mood: 'calm' },
    ],
  },

  // ── 阿秀 · 茶园（第一次） ──
  {
    id: 'axiu_garden_first',
    npcId: 'axiu',
    scene: 'garden',
    trigger: { kind: 'first' },
    setsFlags: { met_axiu: true },
    unlocksComic: 'comic_wuyishan_terroir',
    lines: [
      { speaker: '阿秀', text: '看好了——要采「开面」的。', mood: 'calm' },
      { speaker: '阿秀', text: '芽头太嫩的不要，老得发硬的也不要。我们这做岩茶，跟外头做绿茶两码事。', mood: 'calm' },
      { speaker: '阿秀', text: '点那些绿得正的，丢进篓里就行。', mood: 'warm' },
    ],
  },
  {
    id: 'axiu_garden_repeat',
    npcId: 'axiu',
    scene: 'garden',
    trigger: { kind: 'repeat' },
    lines: [
      { speaker: '阿秀', text: '手还挺准。这篓够你折腾一锅了。', mood: 'warm' },
    ],
  },

  // ── 岩伯 · 制茶坊（第一次：认门儿 + 认识工序，不教学；真做茶从茶园进） ──
  {
    id: 'yanbo_workshop_first',
    npcId: 'yanbo',
    scene: 'workshop',
    trigger: { kind: 'first' },
    setsFlags: { met_yanbo: true },
    lines: [
      { speaker: '岩伯', text: '这坊里，锅、簸箕、焙笼都齐着。你先认认门。', mood: 'dry' },
      { speaker: '岩伯', text: '武夷岩茶一路是：倒青、做青、炒揉、焙火。急不得。', mood: 'calm' },
      { speaker: '岩伯', text: '真要做一锅，去茶园把青采回来——采好了，就在那头开做，我这儿给你看着火。', mood: 'dry' },
    ],
  },

  // ── 周伯 · 茶桌（第一次，泡茶点评引导） ──
  {
    id: 'zhoubo_teatable_first',
    npcId: 'zhoubo',
    scene: 'teatable',
    trigger: { kind: 'first' },
    setsFlags: { met_zhoubo: true },
    lines: [
      { speaker: '周伯', text: '自己做的？拿来，我尝尝。', mood: 'dry' },
      { speaker: '周伯', text: '泡功夫茶讲究个「出汤时机」。早了淡，晚了闷。你看这汤色。', mood: 'calm' },
    ],
  },
  // 周伯 · 点评（条件：茶已做好，由 store 附带结果评语）
  {
    id: 'zhoubo_review',
    npcId: 'zhoubo',
    scene: 'teatable',
    trigger: { kind: 'conditional', flag: 'tea_made', value: 1 },
    lines: [
      { speaker: '周伯', text: '嗯。这锅是你自己做的，对吧？', mood: 'dry' },
    ],
  },

  // ── 老陈 · 茶集市解锁提示（条件：三种茶都亲手做过） ──
  {
    id: 'laochen_market_hint',
    npcId: 'laochen',
    scene: 'teahouse',
    trigger: { kind: 'conditional', flag: 'all_tea_made', value: 1 },
    setsFlags: { heard_market_hint: true },
    lines: [
      { speaker: '老陈', text: '肉桂、水仙、大红袍——三种都自己做过一遍了？', mood: 'calm' },
      { speaker: '老陈', text: '那你去茶集市转转吧。小满在那儿收茶，你自己做的也能卖个茶钱。', mood: 'warm' },
    ],
  },

  // ── 岩伯 · 母树（首次：少、稳、有观察感；末了赠明信片） ──
  // 用 saw_mother_tree 标志判断「是否首次到九龙窠」，而非全局 metNpcs——
  // 岩伯也出现在制茶坊，玩家通常先去制茶坊再来九龙窠，若用 met 会误判为「已见过」而跳过赠礼。
  {
    id: 'yanbo_mothertree',
    npcId: 'yanbo',
    scene: 'mothertree',
    sceneArt: 'mothertree', // 显式绑定九龙窠大红袍母树背景
    trigger: { kind: 'conditional', flag: 'saw_mother_tree', value: false },
    setsFlags: { saw_mother_tree: true },
    unlocksComic: 'comic_mother_tree',
    givesSouvenir: 'postcard_mothertree',
    lines: [
      { speaker: '岩伯', text: '到了。', mood: 'calm' },
      { speaker: '岩伯', text: '这就是九龙窠。山、石头，还有崖壁上那几棵老茶树。', mood: 'calm' },
      { speaker: '岩伯', text: '早年间，大红袍是从这儿来的。如今不让采了——看得到，喝不到，也挺好。', mood: 'calm' },
      { speaker: '岩伯', text: '大红袍不是一棵树，是一类茶。你认得它们，往后心里就有底了。', mood: 'calm' },
      { speaker: '岩伯', text: '拿着。', mood: 'warm' },
      { speaker: '岩伯', text: '留个念。', mood: 'warm' },
    ],
  },

  // ── 岩伯 · 母树（再次访问：不重复「第一次来」，只给一句问候） ──
  {
    id: 'yanbo_mothertree_repeat',
    npcId: 'yanbo',
    scene: 'mothertree',
    sceneArt: 'mothertree',
    trigger: { kind: 'conditional', flag: 'saw_mother_tree', value: true },
    lines: [
      { speaker: '岩伯', text: '又来看它们了。', mood: 'calm' },
      { speaker: '岩伯', text: '慢慢看，不急。', mood: 'calm' },
    ],
  },

  // ── 林姑娘 · 茶馆（杭州线索） ──
  {
    id: 'linggu_teahouse_first',
    npcId: 'linggu',
    scene: 'teahouse',
    trigger: { kind: 'conditional', flag: 'tea_made', value: 1 },
    setsFlags: { met_linggu: true, heard_about_hangzhou: true },
    unlocksClue: 'clue_hangzhou',
    lines: [
      { speaker: '林姑娘', text: '你这武夷山的茶，摇得可真费劲。', mood: 'joke' },
      { speaker: '林姑娘', text: '我们杭州做茶可不摇这个——要嫩芽，锅一烫就杀青。换座山头，做法两样。', mood: 'warm' },
      { speaker: '林姑娘', text: '有空去西湖边看看？那儿的龙井，又是另一回事了。', mood: 'warm' },
    ],
  },

  // ── 小满 · 茶集市（第一次，交易入口） ──
  {
    id: 'xiaoman_market_first',
    npcId: 'xiaoman',
    scene: 'market',
    trigger: { kind: 'first' },
    setsFlags: { met_xiaoman: true },
    lines: [
      { speaker: '小满', text: '来啦。自己做的茶，拿来我看看。', mood: 'warm' },
      { speaker: '小满', text: '我帮你看看，这锅到底值不值钱。', mood: 'calm' },
    ],
  },
];

export function findDialogues(scene: string, npcId?: string): Dialogue[] {
  return DIALOGUES.filter((d) => d.scene === scene && (!npcId || d.npcId === npcId));
}
