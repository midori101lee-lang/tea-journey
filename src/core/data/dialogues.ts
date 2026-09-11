import type { Dialogue, Player } from '../types';
import { isWuyishanExplored, hasWuyishanGiftTea } from './regions';

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
  // ── 老陈 · 茶馆（章节收束 + 首次离别礼，仅一次） ──
  // 触发：武夷山探索 5/5（由现有探索进度派生）且尚未领过茶礼、且尚未听到杭州线索。
  // 这是「章节收束」，不是任务公告；茶礼是「茶山给旅人的临别礼物」，三种各一份、均为上品。
  {
    id: 'laochen_teahouse_farewell',
    npcId: 'laochen',
    scene: 'teahouse',
    trigger: { kind: 'conditional', flag: 'wuyishan_farewell_ready', value: true },
    setsFlags: { farewell_gift_wuyishan: 1 },
    givesTea: [
      { teaId: 'rougui', grade: 'fine', count: 1, giftTag: 'farewell_gift_wuyishan' },
      { teaId: 'shuixian', grade: 'fine', count: 1, giftTag: 'farewell_gift_wuyishan' },
      { teaId: 'dahongpao', grade: 'fine', count: 1, giftTag: 'farewell_gift_wuyishan' },
    ],
    lines: [
      { speaker: '老陈', text: '这趟山，也算走得差不多了。', mood: 'calm' },
      { speaker: '老陈', text: '怎么样？在武夷山待这一阵，有没有开始懂点茶了。', mood: 'warm' },
      { speaker: '你', text: '……好像是有点。', mood: 'calm' },
      { speaker: '老陈', text: '光顾着往外走，可别忘了把这里的茶带走。', mood: 'calm' },
      { speaker: '你', text: '这是……', mood: 'calm' },
      { speaker: '老陈', text: '肉桂、水仙、大红袍。三样各带一点。', mood: 'warm' },
      { speaker: '老陈', text: '以后到了别的地方，喝茶的时候，也能想起这座山。', mood: 'warm' },
      { speaker: '老陈', text: '别舍不得喝。茶放着，也是茶。', mood: 'joke' },
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

  // ── 林姑娘 · 茶馆（杭州线索：章节衔接） ──
  // 前置：武夷山探索 5/5（wuyishan_explored 由现有探索进度派生）——「先走完一座茶山，再从熟悉的人口中听见下一座」。
  // 她不是任务发布者，只是「走过不同地方、知道下一座茶山」的旅人。
  {
    id: 'linggu_teahouse_first',
    npcId: 'linggu',
    scene: 'teahouse',
    trigger: { kind: 'conditional', flag: 'wuyishan_explored', value: true },
    setsFlags: { met_linggu: true, heard_about_hangzhou: true },
    unlocksClue: 'clue_hangzhou',
    lines: [
      { speaker: '林姑娘', text: '你这武夷山的茶，摇得可真费劲。', mood: 'joke' },
      { speaker: '林姑娘', text: '山也走得差不多了吧？我猜，你该想着往南边再看看了。', mood: 'calm' },
      { speaker: '林姑娘', text: '你要是准备继续往南走，杭州倒是可以去看看。', mood: 'warm' },
      { speaker: '你', text: '杭州也产茶？', mood: 'calm' },
      { speaker: '林姑娘', text: '当然。西湖边上的茶园，跟这里的山场，是两回事。', mood: 'calm' },
      { speaker: '林姑娘', text: '你在武夷山学的是怎么把茶做出来——到了杭州，说不定会看到另一种喝茶的日子。', mood: 'warm' },
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

  // ─────────── 杭州篇（第二阶段起步：玲姨 / 阿青） ───────────
  // 玲姨 · 茶馆（第一次）：杭州茶生活的引路人，把玩家引向茶园。
  {
    id: 'lingyi_teahouse_first',
    npcId: 'lingyi',
    scene: 'hz-teahouse',
    trigger: { kind: 'first' },
    setsFlags: { met_lingyi: true, hangzhou_arrived: 1 },
    lines: [
      { speaker: '玲姨', text: '来啦？先坐，喝口热的。', mood: 'warm' },
      { speaker: '玲姨', text: '我们杭州喝茶，跟武夷山不是一路——他们摇青、焙火，我们这儿喝的是嫩芽的鲜。', mood: 'calm' },
      { speaker: '玲姨', text: '后头茶园正当时。想去转转就去，想做一锅九曲红梅，也在那儿。', mood: 'warm' },
      // 轻量生活感：玲姨 × 阿青认识、关系熟——捎句话，不做成任务
      { speaker: '玲姨', text: '对了——阿青这丫头又跑茶园去了，饭都快凉了。', mood: 'joke' },
      { speaker: '玲姨', text: '你若要去茶园，替我喊她一声回来吃饭。这孩子一忙起来，什么都忘了。', mood: 'warm' },
      { speaker: '你', text: '好，我去帮你叫她。', mood: 'calm' },
    ],
  },
  // 玲姨 · 茶馆（重复）
  {
    id: 'lingyi_teahouse_repeat',
    npcId: 'lingyi',
    scene: 'hz-teahouse',
    trigger: { kind: 'repeat' },
    lines: [
      { speaker: '玲姨', text: '又来啦。今天慢慢喝，不急。', mood: 'warm' },
    ],
  },
  // 玲姨 · 茶馆（捎话的回音）：见过阿青后再回茶馆，一句轻量回应，无奖励、无任务。
  // 派生条件即时计算：见过阿青 且 没回应过 → 天然只触发一次，兼容旧存档。
  {
    id: 'lingyi_teahouse_aqing_back',
    npcId: 'lingyi',
    scene: 'hz-teahouse',
    trigger: { kind: 'conditional', flag: 'lingyi_aqing_back_ready', value: true },
    setsFlags: { lingyi_aqing_back_done: 1 },
    lines: [
      { speaker: '玲姨', text: '总算把她叫回来了。来，辛苦你了，坐下喝口茶。', mood: 'warm' },
      { speaker: '玲姨', text: '这丫头要是没人喊，怕是能在茶园里待到天黑。', mood: 'joke' },
    ],
  },
  // 玲姨 · 茶馆（旅途记忆彩蛋）：玩家还带着「老陈送的武夷山茶」时的一句轻量反应。
  // 只读库存上的 giftTag（hasWuyishanGiftTea），不做好感度/任务；茶已喝掉则不触发（无报错、不影响主线）。
  {
    id: 'lingyi_teahouse_wuyishan_tea',
    npcId: 'lingyi',
    scene: 'hz-teahouse',
    trigger: { kind: 'conditional', flag: 'lingyi_wuyishan_tea_ready', value: true },
    setsFlags: { lingyi_saw_wuyishan_tea: 1 },
    lines: [
      { speaker: '玲姨', text: '这是……从武夷山带来的茶？', mood: 'calm' },
      { speaker: '玲姨', text: '来，泡一杯我尝尝。', mood: 'warm' },
      { speaker: '玲姨', text: '嗯……武夷山的茶，果然脾气大。', mood: 'joke' },
      { speaker: '玲姨', text: '不像我们杭州的茶，慢悠悠的。', mood: 'warm' },
    ],
  },

  // 阿青 · 茶园（第一次）：小大人似的小孩，讲的是「看茶」的日常。
  {
    id: 'aqing_garden_first',
    npcId: 'aqing',
    scene: 'hz-garden',
    trigger: { kind: 'first' },
    setsFlags: { met_aqing: true },
    lines: [
      // 玲姨捎话的落地：玩家来叫阿青回家吃饭 → 阿青顺势拉玩家搭手 → 自然进入春茶/嫩芽教学。
      // 「这批茶」不点名龙井——茶园里九曲红梅/龙井都可能做，具体标准留给采茶引导。
      { speaker: '你', text: '阿青！玲姨叫你回家吃饭啦！', mood: 'calm' },
      { speaker: '阿青', text: '啊？都这个时候了？……知道啦。你来得正好，先搭把手，把这批茶做完，咱们就回去吃饭。', mood: 'joke' },
      { speaker: '你', text: '我？我也能搭手吗？', mood: 'calm' },
      { speaker: '阿青', text: '跟着我学就行。春茶可耽搁不得。', mood: 'calm' },
      { speaker: '阿青', text: '做龙井，最要紧就是一个「嫩」字——茶树顶上刚冒头的嫩芽，才是今天要找的。', mood: 'warm' },
      { speaker: '阿青', text: '行了，手别停，挑给我看看。', mood: 'warm' },
    ],
  },
  // 阿青 · 茶园（重复）：轻轻呼应「回家吃饭」，不做任务
  {
    id: 'aqing_garden_repeat',
    npcId: 'aqing',
    scene: 'hz-garden',
    trigger: { kind: 'repeat' },
    lines: [
      { speaker: '阿青', text: '玲姨是不是又让你来抓我回去吃饭？……再等一下下，这片就采完了。', mood: 'joke' },
    ],
  },

  // ── 郭叔 · 杭州制茶坊（第一次）：制茶师傅，只管「怎么做茶」的功能型 NPC，不写长剧情 ──
  {
    id: 'gu_shu_workshop_first',
    npcId: 'gu_shu',
    scene: 'hz-workshop',
    trigger: { kind: 'first' },
    setsFlags: { met_gu_shu: true },
    lines: [
      { speaker: '郭叔', text: '来了？制茶坊就是干活的屋子，话不多说。', mood: 'calm' },
      { speaker: '郭叔', text: '想在杭州做茶，先记住两个字——分寸。', mood: 'calm' },
      { speaker: '郭叔', text: '绿茶要快，红茶要等。做之前我给你提个醒，手上别慌。', mood: 'warm' },
      { speaker: '郭叔', text: '去茶园挑叶子吧。做好了回来，我看着你起锅。', mood: 'warm' },
    ],
  },
  // 郭叔（重复）
  {
    id: 'gu_shu_workshop_repeat',
    npcId: 'gu_shu',
    scene: 'hz-workshop',
    trigger: { kind: 'repeat' },
    lines: [
      { speaker: '郭叔', text: '又来了？好。做茶这事，做的就是熟。', mood: 'warm' },
    ],
  },

  // ── 林姑娘 · 玲姨茶馆（杭州客居闲谈）：偶遇 NPC 跨章节复用，台词体现她对杭州茶区的熟悉 ──
  // 讲的是杭州自己的茶山观察（梅家坞山势/挑嫩芽/春茶讲鲜），不是把武夷山台词换个地名。
  // 一次性：由派生条件「见过林姑娘且没在杭州聊过」触发，聊完落 flag，不再重复。
  {
    id: 'linggu_hangzhou_chat',
    npcId: 'linggu',
    scene: 'hz-teahouse',
    // 同类隐患：林姑娘 NPC 默认 sceneArt 是武夷山的 teahouse，不写会在杭州茶馆渲染武夷山背景。
    sceneArt: 'hz-teahouse',
    trigger: { kind: 'conditional', flag: 'linggu_hangzhou_ready', value: true },
    setsFlags: { linggu_hangzhou_chat_done: 1 },
    lines: [
      { speaker: '林姑娘', text: '咦，你也到杭州了？', mood: 'joke' },
      { speaker: '林姑娘', text: '梅家坞这一带的茶园，和武夷山不一样——山势缓些，茶树矮矮的一层，像铺在坡上。', mood: 'calm' },
      { speaker: '林姑娘', text: '采龙井可得挑嫩的。开面叶就老了，别舍不得下手。', mood: 'calm' },
      { speaker: '林姑娘', text: '杭州人喝春茶，讲究一个「鲜」字。火候和手上动作，都得利落。', mood: 'warm' },
    ],
  },

  // 吟诗老人 · 梅家坞（第一次）：先吟诗 → 轻松闲谈 → 自然引出龙井 → 赠诗笺。
  // 诗句为用户指定原文（唐韬《访西湖梅家坞茶村》），保持原样、不改写。
  // 一次性赠礼：由「首次且未见」触发，applyEffects 会 meetNpc → 之后再进只走 repeat，不会重复领取。
  {
    id: 'yinshi_laoren_meijiawu_first',
    npcId: 'yinshi_laoren',
    scene: 'meijiawu',
    trigger: { kind: 'first' },
    setsFlags: { met_yinshi_laoren: true, longjing_unlocked: 1, received_meijiawu_poem: 1 },
    givesSouvenir: 'poem_meijiawu',
    lines: [
      { speaker: '吟诗老人', text: '梅家坞村翠千重……', mood: 'calm' },
      { speaker: '吟诗老人', text: '一缕香烟绕秀峰……', mood: 'calm' },
      { speaker: '吟诗老人', text: '如此湖山归去得，诗人不做做茶农。', mood: 'warm' },
      { speaker: '你', text: '您天天都在这儿吟诗吗？', mood: 'calm' },
      { speaker: '吟诗老人', text: '兴致来了就吟两句。茶园里风一吹，诗就自己来了。', mood: 'joke' },
      { speaker: '吟诗老人', text: '你是来看茶的？', mood: 'calm' },
      { speaker: '你', text: '算是吧。', mood: 'calm' },
      { speaker: '吟诗老人', text: '那可不能只看茶馆里的杯子。梅家坞的春天，得看看茶园里的嫩芽。', mood: 'calm' },
      { speaker: '吟诗老人', text: '说起杭州的茶，绕不开龙井。', mood: 'calm' },
      { speaker: '你', text: '龙井茶，到底有什么特别？', mood: 'calm' },
      { speaker: '吟诗老人', text: '光听我说有什么意思。你自己做一回，不就知道了？', mood: 'warm' },
      { speaker: '吟诗老人', text: '拿着——一张小诗笺。陶冶情操，有缘再见。', mood: 'warm' },
    ],
  },
  // 吟诗老人 · 梅家坞（重复）：短句、温和、不端着；不重复给诗笺。
  {
    id: 'yinshi_laoren_meijiawu_repeat',
    npcId: 'yinshi_laoren',
    scene: 'meijiawu',
    trigger: { kind: 'repeat' },
    lines: [
      { speaker: '吟诗老人', text: '又来了？', mood: 'warm' },
      { speaker: '吟诗老人', text: '龙井的事，急不得。山在这儿，跑不了。', mood: 'calm' },
      { speaker: '吟诗老人', text: '诗嘛，什么时候想吟，都能吟两句。', mood: 'joke' },
    ],
  },
  // ── 周伯 · 杭州茶桌（同一 NPC，换到杭州茶馆环境；读的是当前这泡杭州茶，不串武夷山） ──
  // 周伯在武夷山就已认识（metNpcs 里），因此这里用 repeat，不重复「初次见面」。
  {
    id: 'zhoubo_hz_teatable',
    npcId: 'zhoubo',
    scene: 'hz-teatable',
    // sceneArt 必须显式指向杭州茶桌：周伯 NPC 默认 sceneArt 是武夷山的 teatable，
    // 不写会被 NpcStage 回退渲染成「老陈茶馆新」（Bug 2 根因）。
    sceneArt: 'hz-teatable',
    trigger: { kind: 'repeat' },
    lines: [
      { speaker: '周伯', text: '杭州的茶桌，跟武夷山那边，光景不一样。', mood: 'calm' },
      { speaker: '周伯', text: '你这九曲红梅，我尝了——红的，甜的，跟岩茶完全是两路。', mood: 'dry' },
      { speaker: '周伯', text: '自己做的，喝着就是不一样。', mood: 'warm' },
    ],
  },
];

export function findDialogues(scene: string, npcId?: string): Dialogue[] {
  return DIALOGUES.filter((d) => d.scene === scene && (!npcId || d.npcId === npcId));
}

/**
 * 「派生条件」：由当前世界状态即时计算、不落盘的对话触发条件。
 * NpcDialog 的 buildSteps 会优先用它匹配 conditional 对话（在普通 flag 之前）。
 * 章节里程碑 / 旅途记忆这类「派生事实」因此无需写盘，天然兼容旧存档。
 */
export const DERIVED_DIALOGUE_FLAGS: Record<string, (p: Player) => boolean> = {
  // 武夷山探索 5/5（章节里程碑，由现有探索进度派生，不新增第二套探索系统）
  wuyishan_explored: (p) => isWuyishanExplored(p),
  // 章节收束 + 首次离别礼：走完 5/5、还没领过茶礼、也还没听到杭州线索（= 尚未正式离开武夷山）
  wuyishan_farewell_ready: (p) =>
    isWuyishanExplored(p) && !p.flags['farewell_gift_wuyishan'] && !p.flags['heard_about_hangzhou'],
  // 玲姨的旅途记忆彩蛋：玩家还带着老陈送的武夷山茶，且还没被玲姨点评过
  lingyi_wuyishan_tea_ready: (p) => hasWuyishanGiftTea(p) && !p.flags['lingyi_saw_wuyishan_tea'],
  // 林姑娘在杭州的闲谈：她已登场过（武夷山认识的旅人），且还没在杭州聊过——台词按杭州茶区写
  linggu_hangzhou_ready: (p) => p.metNpcs.includes('linggu') && !p.flags['linggu_hangzhou_chat_done'],
  // 捎话的回音：见过阿青 且 玲姨还没道过谢——下次回茶馆给一句轻量回应
  lingyi_aqing_back_ready: (p) => p.metNpcs.includes('aqing') && !p.flags['lingyi_aqing_back_done'],
};
