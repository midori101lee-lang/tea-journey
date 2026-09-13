import type { Npc } from '../types';

// ─────────── 武夷山第一章 NPC（C4 收口：5 人各管一段，不重叠教学） ───────────
// 知识所有权矩阵：每个主题只有一个主讲人，避免「同一知识被多个 NPC 重复讲述」。

export const NPCS: Npc[] = [
  {
    id: 'laochen',
    name: '老陈',
    role: '茶农兼茶馆老板',
    coreWords: '生活 / 闲谈 / 生意 / 茶山旧闻 / 母树 / 熟客',
    knowledgeScope: [
      '武夷山日常与人情',
      '茶山旧闻与地方传说（含母树）',
      '收茶与茶钱交易',
      '把玩家从茶馆引向茶山',
    ],
    avatarBg: '#b9c9a3',
    firstMeet: 'teahouse',
    recurring: true, // 贯穿式：茶馆→茶园→制茶坊偶遇→母树→回茶馆
    sceneArt: 'teahouse',
    portrait: 'assets/npcs/wuyishan/laochen.webp',
  },
  {
    id: 'axiu',
    name: '阿秀',
    role: '采茶人',
    coreWords: '土地 / 茶青 / 茶季 / 劳作',
    knowledgeScope: [
      '茶园与开面采',
      '茶青判断（太嫩/合适/太老）',
      '茶季与山场劳作',
    ],
    avatarBg: '#c2d6a0',
    firstMeet: 'garden',
    recurring: false,
    sceneArt: 'garden',
    portrait: 'assets/npcs/wuyishan/axiu.webp',
  },
  {
    id: 'yanbo',
    name: '岩伯',
    role: '老制茶师',
    coreWords: '手艺 / 状态 / 火候',
    knowledgeScope: [
      '制茶坊实时观察',
      '只描述茶叶状态，不直接给答案',
      '焙火与火候的「看茶说话」',
    ],
    avatarBg: '#cdb48a',
    firstMeet: 'workshop',
    recurring: false,
    sceneArt: 'workshop',
    portrait: 'assets/npcs/wuyishan/yanbo.webp',
  },
  {
    id: 'zhoubo',
    name: '周伯',
    role: '老茶客',
    coreWords: '味道 / 点评 / 嘴毒',
    knowledgeScope: [
      '用盖碗泡功夫茶',
      '品评玩家自制的茶',
      '以生活语言给出反馈（不端着）',
    ],
    avatarBg: '#c9b79c',
    firstMeet: 'teatable',
    recurring: false,
    sceneArt: 'teatable',
    portrait: 'assets/npcs/fixed/zhoubo.webp',
  },
  {
    id: 'linggu',
    name: '林姑娘',
    role: '游历茶客',
    coreWords: '远方 / 比较 / 下一座茶山',
    knowledgeScope: [
      '外地视角比较不同茶山',
      '提供下一座茶山（杭州）线索',
      '让玩家意识到中国茶山是完全不同的世界',
    ],
    avatarBg: '#c2b6cf',
    firstMeet: 'teahouse',
    recurring: false,
    sceneArt: 'teahouse', // 茶区线索事件发生在老陈茶馆剧情之后，与普通偶遇分开处理
    portrait: 'assets/npcs/encounter/linguniang.webp',
    portraitScale: 0.6, // 林姑娘立绘画面占比偏大，针对性收敛到与其它偶遇 NPC 协调的比例
  },
  // ───── 以下两位属「茶集市」：xiaoman 已接入（固定摊主·交易入口）；laojia 仍为偶遇预留，未接入主线 ─────
  {
    id: 'xiaoman',
    name: '小满',
    role: '茶集市固定摊主',
    coreWords: '茶货 / 行情 / 老主顾',
    knowledgeScope: [],
    avatarBg: '#d8c79a',
    firstMeet: 'market',
    recurring: false,
    sceneArt: 'market', // 茶集市场景（已接入：位图背景 + 交易/辨茶原型）
    portrait: 'assets/npcs/fixed/xiaoman.webp',
  },
  {
    id: 'laojia',
    name: '茶商老贾',
    role: '游动茶商（偶遇）',
    coreWords: '收茶 / 走南闯北 / 比价',
    knowledgeScope: [],
    avatarBg: '#c9b27a',
    firstMeet: 'market',
    recurring: false,
    sceneArt: 'market', // 茶集市场景（P2，暂未建）
    portrait: 'assets/npcs/encounter/laojia.webp',
    stallScale: 0.70,
  },
  // ───── 偶遇 NPC（V0.1 原型）：三轮车茶农（立绘暂无，NpcStage 自动回退内联 SVG） ─────
  {
    id: 'tricycle_farmer',
    name: '三轮车茶农',
    role: '山路上的茶农',
    coreWords: '顺路 / 闲聊 / 一小包茶',
    knowledgeScope: [],
    avatarBg: '#b9a76a',
    firstMeet: 'mountain',
    recurring: false,
    sceneArt: 'garden',
    portrait: 'assets/npcs/encounter/tricycle_farmer.webp',
    stallScale: 0.60, // 茶集市卡片：含三轮车+货物，整体视觉面积明显更大，需额外压低以协调
  },
  // ───── 以下为 V1.0 接入的偶遇 NPC：已制作立绘，按「场景 × 事件」进入世界，不负责主线教学 ─────
  {
    id: 'caicha_ayi',
    name: '采茶阿姨',
    role: '茶园里的采茶人',
    coreWords: '茶垄 / 开面采 / 手快',
    knowledgeScope: [],
    avatarBg: '#bcd0a6',
    firstMeet: 'garden',
    recurring: false,
    sceneArt: 'garden',
    portrait: 'assets/npcs/encounter/caicha_ayi.webp',
    stallScale: 0.72, // 茶集市卡片：人物+背篓画面占比偏大，收敛以保留四周留白
  },
  {
    id: 'young_farmer',
    name: '年轻茶农',
    role: '山里自家茶农',
    coreWords: '自家茶山 / 学制茶 / 手痒',
    knowledgeScope: [],
    avatarBg: '#a7c184',
    firstMeet: 'garden',
    recurring: false,
    sceneArt: 'garden',
    portrait: 'assets/npcs/encounter/young_farmer.webp',
    stallScale: 0.72, // 茶集市卡片：身形高、接近卡片边界，适度缩小
  },
  {
    id: 'maicha_dashu',
    name: '卖茶大叔',
    role: '茶集市摊主',
    coreWords: '明码标价 / 茶样 / 老主顾',
    knowledgeScope: [],
    avatarBg: '#d8c79a',
    firstMeet: 'market',
    recurring: false,
    sceneArt: 'market',
    portrait: 'assets/npcs/encounter/maicha_dashu.webp',
    stallScale: 0.70,
  },
  {
    id: 'young_male_traveler',
    name: '年轻男旅客',
    role: '路上遇见的旅客',
    coreWords: '下一站 / 搭话 / 见闻',
    knowledgeScope: [],
    avatarBg: '#b9c9cf',
    firstMeet: 'mountain',
    recurring: false,
    sceneArt: 'mountain',
    portrait: 'assets/npcs/encounter/young_male_traveler.webp',
  },
  {
    id: 'tea_dajie',
    name: '请喝茶大姐',
    role: '山下好客的大姐',
    coreWords: '坐下喝口 / 自家茶 / 热闹',
    knowledgeScope: [],
    avatarBg: '#d8b6a6',
    firstMeet: 'garden',
    recurring: false,
    sceneArt: 'garden',
    portrait: 'assets/npcs/encounter/tea_dajie.webp',
  },
  {
    id: 'roadside_uncle',
    name: '路边饮茶叔',
    role: '路边歇脚的老茶客',
    coreWords: '歇脚 / 自带茶 / 慢悠悠',
    knowledgeScope: [],
    avatarBg: '#c9b79c',
    firstMeet: 'mountain',
    recurring: false,
    sceneArt: 'mountain',
    portrait: 'assets/npcs/encounter/roadside_uncle.webp',
  },
  {
    id: 'mystery_tea_person',
    name: '神秘茶人',
    role: '山中偶遇的茶人',
    coreWords: '不言 / 偶然 / 一缕茶气',
    knowledgeScope: [],
    avatarBg: '#9a9aa6',
    firstMeet: 'mountain',
    recurring: false,
    sceneArt: 'mountain',
    portrait: 'assets/npcs/encounter/mystery_tea_person.webp',
  },

  // ─────────── 杭州篇 NPC（第二阶段起步：玲姨=茶馆中枢，阿青=茶园特色） ───────────
  {
    id: 'lingyi',
    name: '玲姨',
    role: '茶馆老板',
    coreWords: '茶生活 / 日常喝茶 / 茶点 / 茶具 / 江南',
    knowledgeScope: [
      '杭州的喝茶日常与茶生活',
      '茶点、茶具这些「过日子的茶」',
      '把玩家从茶馆引向杭州茶园',
    ],
    avatarBg: '#cfe0d6',
    firstMeet: 'hz-teahouse',
    recurring: true, // 杭州中枢：茶馆常驻，串起杭州这条线
    sceneArt: 'hz-teahouse',
    portrait: 'assets/npcs/hangzhou/lingyi.webp',
  },
  {
    id: 'aqing',
    name: '阿青',
    role: '茶园里的孩子',
    coreWords: '机灵 / 嘴硬 / 看茶 / 有点小得意',
    knowledgeScope: [
      '杭州茶园与看茶',
      '茶青老嫩（从小跟着采茶看出来）',
    ],
    avatarBg: '#bfe0b6',
    firstMeet: 'hz-garden',
    recurring: false,
    sceneArt: 'hz-garden',
    portrait: 'assets/npcs/hangzhou/aqing.webp',
  },
  {
    id: 'yinshi_laoren',
    name: '吟诗老人',
    role: '梅家坞的老人',
    coreWords: '吟诗 / 梅家坞 / 茶山生活 / 旅途偶遇',
    knowledgeScope: [
      '茶诗、茶史与有意境的茶话',
      '梅家坞的地域与生活气息；把玩家自然引向西湖龙井（不承担制茶教学）',
    ],
    avatarBg: '#b9c9b0',
    firstMeet: 'meijiawu',
    recurring: false,
    sceneArt: 'meijiawu',
    portrait: 'assets/npcs/hangzhou/yinshi_laoren.webp',
  },

  // ───── 杭州 · 制茶坊：郭叔（炒茶师傅）─────
  // 角色定位（2026-09-11 明确的功能分工）：制茶师傅教「怎么做茶」，不承担长剧情；
  // 周伯管品茶、玲姨管茶馆人情、吟诗老人管茶诗茶文化、阿青管茶园采茶。
  {
    id: 'gu_shu',
    name: '郭叔',
    role: '制茶坊的炒茶师傅',
    coreWords: '手上功夫 / 火候 / 看茶做茶',
    knowledgeScope: [
      '绿茶/红茶制茶操作要领（做茶前的提点）',
      '火候与手上功夫的分寸',
    ],
    avatarBg: '#c9b18a',
    firstMeet: 'hz-workshop',
    recurring: false,
    sceneArt: 'hz-workshop',
    portrait: 'assets/npcs/hangzhou/gu_shu.webp',
  },

  // ───── 杭州 · 茶集市：牛姐（偶遇彩蛋：乌牛早冒充龙井）─────
  // 表面热情和善的「实在大姐」，实际精明会算——把乌牛早说成龙井卖。
  // 不是反派：笑眯眯地坑你，坑完还觉得自己特别会做生意。只通过偶遇出现，不进摊位系统。
  {
    id: 'niujie',
    name: '牛姐',
    role: '茶集市的茶商大姐',
    coreWords: '热络 / 批发价 / 熟人价 / 会做生意',
    knowledgeScope: [],
    avatarBg: '#d8b6a0',
    firstMeet: 'market',
    recurring: false,
    sceneArt: 'market',
    portrait: 'assets/npcs/encounter/niujie.webp',
    stallScale: 0.72,
  },
];

export function getNpc(id: string): Npc {
  const n = NPCS.find((x) => x.id === id);
  if (!n) throw new Error(`unknown npc: ${id}`);
  return n;
}

/** 知识所有权矩阵：查「某个主题该由谁讲」。用于避免平台/对话重复讲述。 */
export const KNOWLEDGE_OWNER: Record<string, string> = {
  '开面采与茶青': 'axiu',
  '武夷山旧闻与母树': 'yanbo',
  '制茶状态与火候': 'yanbo',
  '泡茶与品评': 'zhoubo',
  '外地茶山比较': 'linggu',
  '收茶与茶钱': 'laochen',
  '杭州茶生活': 'lingyi',
  '杭州茶园与茶青': 'aqing',
  '杭州制茶操作与火候': 'gu_shu',
  '茶诗与茶文化（梅家坞）': 'yinshi_laoren',
};
