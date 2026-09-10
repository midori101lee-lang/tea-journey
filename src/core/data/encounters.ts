import type { EncounterNpc } from '../types';

// ─────────────────────────────────────────────────────────────
// 武夷山 V1.0 偶遇池（场景级世界机制）
// 数据围绕「人物 × 场景 × 事件」组织：
//   每个 NPC 用 scenes 表达「在哪些场景更可能遇见」（倾向权重）
//   每个事件用 scenes 表达「可在哪些场景发生」
//   → 同一个 NPC 在茶园 / 茶馆 / 集市 / 山路会讲不同的事。
//
// 设计目标（贯穿）：同一 NPC 多次出现，玩家无法凭外观预判结果——
// NPC 只决定「事件池的权重形状」（人物倾向），具体哪件事由引擎按场景加权抽。
// 整体近似 70% 普通生活 / 20% 小惊喜 / 10% 小意外。
//
// 已接入全部 10 位偶遇 NPC（均有完成立绘 / WebP）：
//   三轮车茶农 / 林姑娘 / 茶商老贾（原 3 位）
//   采茶阿姨 / 年轻茶农 / 请喝茶大姐 / 路边饮茶叔 / 年轻男旅客 / 卖茶大叔 / 神秘茶人（V1.0 新增 7 位）
// 场景分布遵循产品决策：
//   茶园 garden   → 采茶阿姨 / 年轻茶农 / 三轮车 / 林姑娘 / 请喝茶大姐
//   山路 mountain → 三轮车 / 年轻茶农 / 年轻男旅客 / 林姑娘 / 路边饮茶叔 / 请喝茶大姐 / 采茶阿姨 / 神秘茶人(极低)
//   茶馆 teahouse → 林姑娘 / 路边饮茶叔 / 请喝茶大姐 / 年轻男旅客 / 茶商老贾
//   集市 market   → 采茶阿姨 / 年轻茶农 / 卖茶大叔 / 茶商老贾 / 三轮车 / 林姑娘 / 路边饮茶叔 / 请喝茶大姐 / 年轻男旅客 / 神秘茶人(极低)
// ─────────────────────────────────────────────────────────────

export const ENCOUNTERS: EncounterNpc[] = [
  // ── 三轮车茶农：山路 / 茶园 / 集市来往的茶农，偏善意但不保证好事 ──
  {
    id: 'tricycle_farmer',
    name: '三轮车茶农',
    role: '山路上的茶农',
    scenes: { mountain: 40, garden: 25, market: 30 },
    events: [
      {
        id: 'tricycle_ride',
        scenes: ['mountain', 'garden', 'market'],
        weight: 20,
        lines: [
          { speaker: '三轮车茶农', text: '突突突——' },
          { speaker: '三轮车茶农', text: '上来不？顺路。' },
        ],
        choices: [
          { label: '上车', outcome: { goTo: 'map', toast: '突突突，到了。他把你撂在山路边。' } },
          { label: '不了，谢谢', outcome: { toast: '成，那我先走一步。' } },
        ],
      },
      {
        id: 'tricycle_chat_mountain',
        scenes: ['mountain'],
        weight: 16,
        lines: [
          { speaker: '三轮车茶农', text: '这山我开了一辈子三轮。' },
          { speaker: '三轮车茶农', text: '岩茶这东西，急不得，跟开车一个理。' },
        ],
        outcome: { toast: '（你听他唠了两句山路上的闲话。）' },
      },
      {
        id: 'tricycle_chat_garden',
        scenes: ['garden'],
        weight: 14,
        lines: [
          { speaker: '三轮车茶农', text: '这园子里的茶青，今早刚采过一批。' },
          { speaker: '三轮车茶农', text: '开面采的，嫩了做不出味。' },
        ],
        outcome: { toast: '（他指了指茶垄，没多留。）' },
      },
      {
        id: 'tricycle_chat_market',
        scenes: ['market'],
        weight: 16,
        lines: [
          { speaker: '三轮车茶农', text: '集市上我也摆两块板，卖点自家茶。' },
          { speaker: '三轮车茶农', text: '价钱实在，你随便看。' },
        ],
        outcome: { toast: '（他在摊位后朝你点点头。）' },
      },
      {
        id: 'tricycle_tea',
        scenes: ['mountain', 'garden', 'market'],
        weight: 12,
        lines: [
          { speaker: '三轮车茶农', text: '路上顺手抓的，别嫌弃。' },
          { speaker: '三轮车茶农', text: '自家做的，不是什么好茶。' },
        ],
        outcome: {
          giveTea: { teaId: 'rougui', grade: 'normal', roastLevel: '足火', count: 1, unitValue: 15 },
          toast: '获得一小包茶（肉桂 · 普通）。',
        },
      },
      {
        id: 'tricycle_nothing',
        scenes: ['mountain', 'garden', 'market'],
        weight: 22,
        lines: [
          { speaker: '三轮车茶农', text: '突突突——' },
          { speaker: '三轮车茶农', text: '（他朝你点个头，一溜烟开过去了。）' },
        ],
        outcome: { toast: '（什么也没发生。）' },
      },
      {
        id: 'tricycle_reverse',
        scenes: ['mountain'],
        weight: 10,
        lines: [
          { speaker: '三轮车茶农', text: '上来！我捎你一程！' },
          { speaker: '三轮车茶农', text: '……哎，今天这车不出山，我记岔了。' },
        ],
        outcome: { toast: '（你白期待了。他挥挥手走了。）' },
      },
    ],
  },

  // ── 茶商老贾：集市做茶生意的人，偶尔来茶馆；精明但不是坏人 ──
  {
    id: 'laojia',
    name: '茶商老贾',
    role: '游动茶商',
    scenes: { market: 60, teahouse: 18 },
    events: [
      {
        id: 'laojia_fair',
        scenes: ['market'],
        weight: 30,
        lines: [
          { speaker: '老贾', text: '今年的新茶，尝个鲜？' },
          { speaker: '老贾', text: '实价，不糊弄你。' },
        ],
        choices: [
          {
            label: '买一包',
            outcome: {
              addCoins: -8,
              giveTea: { teaId: 'shuixian', grade: 'normal', roastLevel: '足火', count: 1, unitValue: 15 },
              toast: '茶不差，价钱也实在。',
            },
          },
          { label: '看看不买', outcome: { toast: '（他笑笑，没强求。）' } },
        ],
      },
      {
        id: 'laojia_pit',
        scenes: ['market'],
        weight: 25,
        lines: [
          { speaker: '老贾', text: '这个可是好茶。' },
          { speaker: '老贾', text: '九龙窠的。' },
        ],
        choices: [
          {
            label: '买一包',
            outcome: {
              addCoins: -8,
              giveTea: { teaId: 'rougui', grade: 'normal', roastLevel: '足火', count: 1, unitValue: 15 },
              toast: '包装比茶更有故事。',
            },
          },
          { label: '不买', outcome: { toast: '（袋子挺结实，他念叨着收起来。）' } },
        ],
      },
      {
        id: 'laojia_luck',
        scenes: ['market'],
        weight: 15,
        lines: [
          { speaker: '老贾', text: '别听我吹。' },
          { speaker: '老贾', text: '普通岩茶，便宜卖你一点，尝尝？' },
        ],
        choices: [
          {
            label: '买一包',
            outcome: {
              addCoins: -6,
              giveTea: { teaId: 'dahongpao', grade: 'good', roastLevel: '足火', count: 1, unitValue: 30 },
              toast: '嘿，这回真不错。',
            },
          },
          { label: '算了', outcome: { toast: '（他也不恼。）' } },
        ],
      },
      {
        id: 'laojia_chat_market',
        scenes: ['market'],
        weight: 20,
        lines: [
          { speaker: '老贾', text: '今年岩茶价稳，山里人自己喝的便宜。' },
          { speaker: '老贾', text: '你要卖茶，去集市找小满。' },
        ],
        outcome: { toast: '（你听了一段行情，没花钱。）' },
      },
      {
        id: 'laojia_chat_teahouse',
        scenes: ['teahouse'],
        weight: 30,
        lines: [
          { speaker: '老贾', text: '老陈这的茶我熟，常来坐。' },
          { speaker: '老贾', text: '今年的青叶厚实，做出来的茶该不差。' },
        ],
        outcome: { toast: '（他跟你说起山里的收成，没推销什么。）' },
      },
      {
        id: 'laojia_wangba',
        scenes: ['market'],
        weight: 45,
        // 当日冷却（与神秘茶人同思路，由 EncounterLayer 在 roll 时写 wangba_seen_{day}）：
        // 同日不刷两次；隔天可再遇；拒绝也不再永久消失（无 wangba_done 硬锁）。
        requires: (p) => !p.flags['wangba_seen_' + p.day],
        lines: [
          { speaker: '老贾', text: '来来来，走累了吧？来喝一口，不要钱。' },
          { speaker: '老贾', text: '自己家做的，尝尝——' },
          { speaker: '', text: '（你喝了一口，香气不怎么明显，但也不难喝。）' },
          { speaker: '老贾', text: '喝都喝了，要不要带点我家的茶？' },
        ],
        choices: [
          {
            label: '好啊，那我买一点',
            outcome: {
              addCoins: -25,
              giveTea: { teaId: 'wangba', grade: 'normal', roastLevel: '足火', count: 1, unitValue: 25 },
              setsFlags: { bought_wangba: 1 },
              toast: '「景区王霸茶」已放入茶篓——先别急，回去泡了再说。',
            },
          },
          {
            label: '我先再转转吧',
            // 跟进分支：被劝一次，仍可拒绝；不强制、不扣钱、不记负面。
            followup: {
              lines: [
                { speaker: '老贾', text: '喝都喝了，就带一点嘛。' },
                { speaker: '老贾', text: '这样，今天给你算便宜点，18文，拿一包？' },
              ],
              choices: [
                {
                  label: '好吧，那来一包',
                  outcome: {
                    addCoins: -18,
                    giveTea: { teaId: 'wangba', grade: 'normal', roastLevel: '足火', count: 1, unitValue: 18 },
                    setsFlags: { bought_wangba: 1 },
                    toast: '「景区王霸茶」已放入茶篓——回去泡了再说。',
                  },
                },
                {
                  label: '不了，我再看看',
                  outcome: {
                    setsFlags: { bought_wangba: 1 },
                    toast: '（老贾摆摆手：「现在的年轻人啊……」没强求。）',
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  },

  // ── 林姑娘：正在旅行的人，跨场景移动，随机性高 ──
  {
    id: 'linggu',
    name: '林姑娘',
    role: '游历茶客',
    scenes: { garden: 25, teahouse: 25, market: 22, mountain: 25 },
    events: [
      {
        id: 'linggu_pick',
        scenes: ['garden'],
        weight: 30,
        lines: [
          { speaker: '林姑娘', text: '你们这茶，摇青摇得人胳膊酸吧？' },
          { speaker: '林姑娘', text: '我们杭州可不用这么费劲。' },
        ],
        outcome: { toast: '（两个在路上的茶客，聊了两句采茶。）' },
      },
      {
        id: 'linggu_tea',
        scenes: ['teahouse'],
        weight: 30,
        lines: [
          { speaker: '林姑娘', text: '在老陈这儿喝了一盏，还行。' },
          { speaker: '林姑娘', text: '盖碗这东西，就是慢，我喜欢。' },
        ],
        outcome: { toast: '（她跟你聊了聊喝茶。）' },
      },
      {
        id: 'linggu_market',
        scenes: ['market'],
        weight: 24,
        lines: [
          { speaker: '林姑娘', text: '集市人真多，我也就是看看。' },
          { speaker: '林姑娘', text: '挑茶得靠鼻子，眼睛看不准。' },
        ],
        outcome: { toast: '（她在一堆茶样前转了转，没买。）' },
      },
      {
        id: 'linggu_travel',
        scenes: ['mountain'],
        weight: 26,
        lines: [
          { speaker: '林姑娘', text: '我也是出来逛的，一个人走走挺好。' },
          { speaker: '林姑娘', text: '下一站打算去更远的地方看看茶。' },
        ],
        outcome: { toast: '（你们在山路上闲聊了两句。）' },
      },
      {
        id: 'linggu_share',
        scenes: ['garden', 'teahouse', 'market', 'mountain'],
        weight: 18,
        lines: [
          { speaker: '林姑娘', text: '我昨天在山下喝到一杯茶，居然有股奶香。' },
          { speaker: '林姑娘', text: '至今没想明白。' },
        ],
        outcome: { toast: '（她跟你分享了个没头没尾的见闻。）' },
      },
      {
        id: 'linggu_tip',
        scenes: ['garden', 'teahouse', 'market', 'mountain'],
        weight: 14,
        lines: [
          { speaker: '林姑娘', text: '要是时间够，去九龙窠看看吧。' },
          { speaker: '林姑娘', text: '那几株老茶树，故事挺长的。' },
        ],
        outcome: { toast: '（她给你指了个地方。）' },
      },
      {
        id: 'linggu_nothing',
        scenes: ['garden', 'teahouse', 'market', 'mountain'],
        weight: 18,
        lines: [
          { speaker: '林姑娘', text: '（她朝你点点头，继续往前走。）' },
        ],
        outcome: { toast: '（什么也没发生。）' },
      },
    ],
  },

  // ── 采茶阿姨：茶园里的采茶人，山下赶集、上下山也常见 ──
  {
    id: 'caicha_ayi',
    name: '采茶阿姨',
    role: '茶园里的采茶人',
    scenes: { garden: 40, mountain: 22, market: 25 },
    events: [
      {
        id: 'caicha_pick',
        scenes: ['garden'],
        weight: 30,
        lines: [
          { speaker: '采茶阿姨', text: '采茶要趁早，露水收了就老了。' },
          { speaker: '采茶阿姨', text: '你瞧这「开面」的，三叶一芽最合适。' },
        ],
        outcome: { toast: '（她指给你看茶垄里该采的那几片。）' },
      },
      {
        id: 'caicha_mountain',
        scenes: ['mountain'],
        weight: 18,
        lines: [
          { speaker: '采茶阿姨', text: '下山顺路，背篓里是今早采的茶青。' },
          { speaker: '采茶阿姨', text: '这天气，晒一晒香气就上来了。' },
        ],
        outcome: { toast: '（她背篓一沉，继续往下走。）' },
      },
      {
        id: 'caicha_market',
        scenes: ['market'],
        weight: 24,
        lines: [
          { speaker: '采茶阿姨', text: '自家茶山出的，拿来凑个摊。' },
          { speaker: '采茶阿姨', text: '不图赚多少，图个热闹。' },
        ],
        outcome: { toast: '（她在摊前理了理茶样。）' },
      },
      {
        id: 'caicha_tea',
        scenes: ['garden', 'mountain'],
        weight: 14,
        lines: [
          { speaker: '采茶阿姨', text: '这把留着，你拿去尝。' },
          { speaker: '采茶阿姨', text: '自家喝的，不算好茶。' },
        ],
        outcome: {
          giveTea: { teaId: 'shuixian', grade: 'normal', roastLevel: '足火', count: 1, unitValue: 15 },
          toast: '获得一小包茶（水仙 · 普通）。',
        },
      },
      {
        id: 'caicha_nothing',
        scenes: ['garden', 'mountain', 'market'],
        weight: 18,
        lines: [
          { speaker: '采茶阿姨', text: '（她朝你笑笑，手上不停，继续采。）' },
        ],
        outcome: { toast: '（什么也没发生。）' },
      },
    ],
  },

  // ── 年轻茶农：山里自家茶农，学制茶、上下山运茶 ──
  {
    id: 'young_farmer',
    name: '年轻茶农',
    role: '山里自家茶农',
    scenes: { garden: 38, mountain: 24, market: 25 },
    events: [
      {
        id: 'youngfarmer_garden',
        scenes: ['garden'],
        weight: 30,
        lines: [
          { speaker: '年轻茶农', text: '我家那几垄今年长势不错。' },
          { speaker: '年轻茶农', text: '就盼着做茶时别手生。' },
        ],
        outcome: { toast: '（他蹲在垄边，捏了捏一片叶子。）' },
      },
      {
        id: 'youngfarmer_mountain',
        scenes: ['mountain'],
        weight: 18,
        lines: [
          { speaker: '年轻茶农', text: '刚把茶青挑下山，腿还有点抖。' },
          { speaker: '年轻茶农', text: '这活儿，真得年轻人扛。' },
        ],
        outcome: { toast: '（他拍拍裤腿，朝山下走了。）' },
      },
      {
        id: 'youngfarmer_market',
        scenes: ['market'],
        weight: 24,
        lines: [
          { speaker: '年轻茶农', text: '头回帮家里摆摊，手都不知道往哪放。' },
          { speaker: '年轻茶农', text: '你帮我看看这标价行不？' },
        ],
        outcome: { toast: '（你随便瞅了两眼，他挠挠头。）' },
      },
      {
        id: 'youngfarmer_tea',
        scenes: ['garden', 'mountain'],
        weight: 14,
        lines: [
          { speaker: '年轻茶农', text: '偷偷塞你一包，别跟我爹说。' },
          { speaker: '年轻茶农', text: '我自己试做的，凑合喝。' },
        ],
        outcome: {
          giveTea: { teaId: 'rougui', grade: 'normal', roastLevel: '足火', count: 1, unitValue: 15 },
          toast: '获得一小包茶（肉桂 · 普通）。',
        },
      },
      {
        id: 'youngfarmer_nothing',
        scenes: ['garden', 'mountain', 'market'],
        weight: 18,
        lines: [
          { speaker: '年轻茶农', text: '（他朝你点点头，不好意思地笑了笑。）' },
        ],
        outcome: { toast: '（什么也没发生。）' },
      },
    ],
  },

  // ── 请喝茶大姐：山下好客的大姐，走到哪都张罗人喝口茶 ──
  {
    id: 'tea_dajie',
    name: '请喝茶大姐',
    role: '山下好客的大姐',
    scenes: { garden: 28, mountain: 26, teahouse: 24, market: 22 },
    events: [
      {
        id: 'dajie_garden',
        scenes: ['garden'],
        weight: 22,
        lines: [
          { speaker: '请喝茶大姐', text: '茶园边我家院子，进来喝口嘛。' },
          { speaker: '请喝茶大姐', text: '刚沏的，还热乎。' },
        ],
        outcome: { toast: '（她硬拉你到院里坐了坐。）' },
      },
      {
        id: 'dajie_mountain',
        scenes: ['mountain'],
        weight: 20,
        lines: [
          { speaker: '请喝茶大姐', text: '山路旁歇脚，保温壶里给你留了。' },
          { speaker: '请喝茶大姐', text: '喝完才有力气往上爬。' },
        ],
        outcome: { toast: '（你接过大姐递来的茶，歇了一程。）' },
      },
      {
        id: 'dajie_teahouse',
        scenes: ['teahouse'],
        weight: 18,
        lines: [
          { speaker: '请喝茶大姐', text: '在老陈这蹭茶喝，他不轰我。' },
          { speaker: '请喝茶大姐', text: '你也坐，我请你这盏。' },
        ],
        outcome: { toast: '（她在老陈那儿给你也添了盏。）' },
      },
      {
        id: 'dajie_market',
        scenes: ['market'],
        weight: 18,
        lines: [
          { speaker: '请喝茶大姐', text: '我摊后头支了个小茶摊。' },
          { speaker: '请喝茶大姐', text: '逛累了就过来，不要钱。' },
        ],
        outcome: { toast: '（她朝你挥挥手，让你随便坐。）' },
      },
      {
        id: 'dajie_offer',
        scenes: ['garden', 'mountain', 'teahouse', 'market'],
        weight: 16,
        lines: [
          { speaker: '请喝茶大姐', text: '拿着拿着，一小包自家茶。' },
          { speaker: '请喝茶大姐', text: '带回去泡，比啥都强。' },
        ],
        outcome: {
          giveTea: { teaId: 'rougui', grade: 'normal', roastLevel: '足火', count: 1, unitValue: 15 },
          toast: '获得一小包茶（肉桂 · 普通）。',
        },
      },
      {
        id: 'dajie_nothing',
        scenes: ['garden', 'mountain', 'teahouse', 'market'],
        weight: 16,
        lines: [
          { speaker: '请喝茶大姐', text: '（她笑着摆摆手，忙着招呼别人去了。）' },
        ],
        outcome: { toast: '（什么也没发生。）' },
      },
    ],
  },

  // ── 路边饮茶叔：路边歇脚的老茶客，自带茶壶，慢悠悠 ──
  {
    id: 'roadside_uncle',
    name: '路边饮茶叔',
    role: '路边歇脚的老茶客',
    scenes: { mountain: 38, teahouse: 26, market: 22 },
    events: [
      {
        id: 'uncle_mountain',
        scenes: ['mountain'],
        weight: 26,
        lines: [
          { speaker: '路边饮茶叔', text: '走累了？陪我在这石头上坐会儿。' },
          { speaker: '路边饮茶叔', text: '我自带了茶，山路边喝最香。' },
        ],
        outcome: { toast: '（他抿一口，眯眼看了看山。）' },
      },
      {
        id: 'uncle_teahouse',
        scenes: ['teahouse'],
        weight: 22,
        lines: [
          { speaker: '路边饮茶叔', text: '老陈这的座，我占熟了。' },
          { speaker: '路边饮茶叔', text: '你这年轻人，也学着慢点喝。' },
        ],
        outcome: { toast: '（他给你腾了个位置。）' },
      },
      {
        id: 'uncle_market',
        scenes: ['market'],
        weight: 18,
        lines: [
          { speaker: '路边饮茶叔', text: '集市边看热闹，比挤里头舒服。' },
          { speaker: '路边饮茶叔', text: '茶样看多了，不如喝一口。' },
        ],
        outcome: { toast: '（他抱着茶壶，乐呵呵看人讨价还价。）' },
      },
      {
        id: 'uncle_chat',
        scenes: ['mountain', 'teahouse', 'market'],
        weight: 20,
        lines: [
          { speaker: '路边饮茶叔', text: '好茶不在贵，在自己顺口。' },
          { speaker: '路边饮茶叔', text: '我喝了一辈子，就认这个理。' },
        ],
        outcome: { toast: '（一段不端着的喝茶门道。）' },
      },
      {
        id: 'uncle_nothing',
        scenes: ['mountain', 'teahouse', 'market'],
        weight: 14,
        lines: [
          { speaker: '路边饮茶叔', text: '（他呷了一口，没抬头，自顾自歇着。）' },
        ],
        outcome: { toast: '（什么也没发生。）' },
      },
    ],
  },

  // ── 年轻男旅客：路上遇见的背包客，聊下一站 ──
  {
    id: 'young_male_traveler',
    name: '年轻男旅客',
    role: '路上遇见的旅客',
    scenes: { mountain: 34, teahouse: 26, market: 22 },
    events: [
      {
        id: 'traveler_mountain',
        scenes: ['mountain'],
        weight: 24,
        lines: [
          { speaker: '年轻男旅客', text: '我也一个人逛山路来的。' },
          { speaker: '年轻男旅客', text: '这云雾，比照片上带劲。' },
        ],
        outcome: { toast: '（你们在山路并肩走了一程。）' },
      },
      {
        id: 'traveler_teahouse',
        scenes: ['teahouse'],
        weight: 20,
        lines: [
          { speaker: '年轻男旅客', text: '逛累了，进来歇个脚。' },
          { speaker: '年轻男旅客', text: '这盖碗茶，我得学着点。' },
        ],
        outcome: { toast: '（他在你对面坐下，也点了一盏。）' },
      },
      {
        id: 'traveler_market',
        scenes: ['market'],
        weight: 18,
        lines: [
          { speaker: '年轻男旅客', text: '集市里乱逛，看什么都新鲜。' },
          { speaker: '年轻男旅客', text: '这茶样花花绿绿，真认不过来。' },
        ],
        outcome: { toast: '（他在摊位间转悠，没买。）' },
      },
      {
        id: 'traveler_tip',
        scenes: ['mountain', 'teahouse', 'market'],
        weight: 18,
        lines: [
          { speaker: '年轻男旅客', text: '前头有个凉亭，能望见整片茶山。' },
          { speaker: '年轻男旅客', text: '你要拍照，去那准没错。' },
        ],
        outcome: { toast: '（他给你指了个清静去处。）' },
      },
      {
        id: 'traveler_nothing',
        scenes: ['mountain', 'teahouse', 'market'],
        weight: 20,
        lines: [
          { speaker: '年轻男旅客', text: '（他朝你点点头，背起包继续走了。）' },
        ],
        outcome: { toast: '（什么也没发生。）' },
      },
    ],
  },

  // ── 卖茶大叔：茶集市摊主，明码标价、实在 ──
  {
    id: 'maicha_dashu',
    name: '卖茶大叔',
    role: '茶集市摊主',
    scenes: { market: 42 },
    events: [
      {
        id: 'dashu_fair',
        scenes: ['market'],
        weight: 30,
        lines: [
          { speaker: '卖茶大叔', text: '看看茶？明码标价，不玩虚的。' },
          { speaker: '卖茶大叔', text: '这包水仙，自家山上出的。' },
        ],
        choices: [
          {
            label: '买一包',
            outcome: {
              addCoins: -6,
              giveTea: { teaId: 'shuixian', grade: 'normal', roastLevel: '足火', count: 1, unitValue: 15 },
              toast: '称了包，钱货两清。',
            },
          },
          { label: '再看看', outcome: { toast: '（他也不急，让你慢慢挑。）' } },
        ],
      },
      {
        id: 'dashu_chat',
        scenes: ['market'],
        weight: 26,
        lines: [
          { speaker: '卖茶大叔', text: '今年春茶齐，价钱比往年松。' },
          { speaker: '卖茶大叔', text: '买茶别光看包装，闻闻才晓得。' },
        ],
        outcome: { toast: '（你听了一段实在的买茶经。）' },
      },
      {
        id: 'dashu_pit',
        scenes: ['market'],
        weight: 22,
        lines: [
          { speaker: '卖茶大叔', text: '这盒包装讲究，送人好看。' },
          { speaker: '卖茶大叔', text: '不过里头啥茶，你懂的。' },
        ],
        choices: [
          {
            label: '买一盒',
            outcome: {
              addCoins: -8,
              giveTea: { teaId: 'rougui', grade: 'normal', roastLevel: '足火', count: 1, unitValue: 15 },
              toast: '盒子确实比茶好看。',
            },
          },
          { label: '不买', outcome: { toast: '（他哈哈一笑，把盒子收了。）' } },
        ],
      },
      {
        id: 'dashu_nothing',
        scenes: ['market'],
        weight: 22,
        lines: [
          { speaker: '卖茶大叔', text: '（他自顾自摇着蒲扇，等你开口。）' },
        ],
        outcome: { toast: '（什么也没发生。）' },
      },
    ],
  },

  // ── 神秘茶人：极低概率出现的特殊偶遇，可能给茶、也可能什么都没有 ──
  {
    id: 'mystery_tea_person',
    name: '神秘茶人',
    role: '山中偶遇的茶人',
    scenes: { mountain: 4, market: 2 },
    events: [
      {
        id: 'mystery_appear',
        scenes: ['mountain', 'market'],
        weight: 40,
        lines: [
          { speaker: '神秘茶人', text: '年轻人。' },
          { speaker: '神秘茶人', text: '这山里的水，泡什么都不难喝。' },
        ],
        outcome: { toast: '（他看了你一眼，没再多说。）' },
      },
      {
        id: 'mystery_gift',
        scenes: ['mountain', 'market'],
        weight: 28,
        lines: [
          { speaker: '神秘茶人', text: '拿着。' },
          { speaker: '神秘茶人', text: '好茶要遇到懂喝的人。' },
        ],
        outcome: {
          giveTea: { teaId: 'dahongpao', grade: 'fine', roastLevel: '足火', count: 1, unitValue: 30 },
          toast: '获得一小包茶（大红袍 · 上品）。',
        },
      },
      {
        id: 'mystery_nothing',
        scenes: ['mountain', 'market'],
        weight: 32,
        lines: [
          { speaker: '神秘茶人', text: '（他笑了笑，转眼人不见了。）' },
        ],
        outcome: { toast: '（什么也没发生。）' },
      },
    ],
  },
];
