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
//
// 杭州偶遇池（2026-09-13 用户定稿）：杭州偶遇仅发生在共用 market 场景（hz-* 场景不接偶遇层），
//   阵容 = 本文件 regions 含 'hangzhou' 且 scenes.market>0 的 NPC：
//   老贾(跨区售武夷山普通茶) / 牛姐(乌牛早彩蛋, regions:['hangzhou']) / 林姑娘 / 年轻男旅客 /
//   请喝茶大姐 / 年轻茶农 / 卖茶大叔 / 路边饮茶叔 / 神秘茶人(极低, 权重与武夷山一致)。
//   复用 NPC 的 market 事件用 linesByRegion.hangzhou 说杭州的话（含「我的回应」）；
//   涉及赠/售茶的事件按茶区一分为二（requires 锁 currentRegion），杭州侧只给杭州本地茶。
// ─────────────────────────────────────────────────────────────

export const ENCOUNTERS: EncounterNpc[] = [
  // ── 三轮车茶农：山路 / 茶园 / 集市来往的茶农，偏善意但不保证好事 ──
  {
    id: 'tricycle_farmer',
    name: '三轮车茶农',
    role: '山路上的茶农',
    regions: ['wuyishan'], // 武夷山本地 NPC：仅武夷山出现，不在杭州卖外地茶
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
          { speaker: '你', text: '「弯这么多，您都不带慌的？」' },
          { speaker: '三轮车茶农', text: '岩茶这东西，急不得，跟开车一个理。' },
        ],
        outcome: { toast: '（你听他唠了两句山路上的闲话。）' }
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
    // 老贾是「跨茶区茶商」：可在武夷山 / 杭州两地出现（偶遇层 + 集市摊位）。
    // 景区王霸茶（wangba）仍严格仅武夷山可获得——靠 laojia_wangba 事件的 requires 锁当前茶区，
    // 而非锁 NPC：老贾本人在杭州只卖武夷山普通茶（外地茶），绝不带王霸茶出山。
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
        // 杭州茶馆是玲姨的场子，话术随茶区切换，避免「老陈」在杭州串台。
        linesByRegion: {
          hangzhou: [
            { speaker: '老贾', text: '玲姨这的茶我熟，常来坐。' },
            { speaker: '老贾', text: '杭州的春茶鲜，做出来的茶该不差。' },
          ],
        },
        outcome: { toast: '（他跟你说起茶山的收成，没推销什么。）' },
      },
      {
        id: 'laojia_wangba',
        scenes: ['market'],
        weight: 45,
        // 当日冷却（与神秘茶人同思路，由 EncounterLayer 在 roll 时写 wangba_seen_{day}）：
        // 同日不刷两次；隔天可再遇；拒绝也不再永久消失（无 wangba_done 硬锁）。
        // 彩蛋隔离：王霸茶仅武夷山。老贾虽可跨区出现，此事件额外锁 currentRegion === 'wuyishan'，
        // 故王霸茶绝不进入杭州（即便老贾在杭州摆摊，也只卖武夷山普通茶）。
        requires: (p) => !p.flags['wangba_seen_' + p.day] && (p.currentRegion ?? 'wuyishan') === 'wuyishan',
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
        // 茶区差异化台词：到了杭州的茶园，她讲的是龙井嫩芽那一套（机制就绪；当前杭州场景暂不接偶遇层，
        // 她在杭州的登场走 hz-teahouse 的客居闲谈——见 dialogues.ts 的 linggu_hangzhou_chat）。
        linesByRegion: {
          hangzhou: [
            { speaker: '林姑娘', text: '梅家坞的茶垄都贴着坡走，矮矮的一层，跟武夷山完全两个长法。' },
            { speaker: '林姑娘', text: '采龙井挑嫩的，一芽一叶最好——开面叶就老了，别舍不得。' },
          ],
        },
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
        linesByRegion: {
          hangzhou: [
            { speaker: '林姑娘', text: '杭州的山不高，走起来松快。山那边就是钱塘江了。' },
            { speaker: '林姑娘', text: '杭州人喝春茶讲究一个「鲜」字——火候和手上动作，都得利落。' },
          ],
        },
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
    regions: ['wuyishan'], // 武夷山本地 NPC：仅武夷山出现，不在杭州卖外地茶
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
  // 跨茶区复用：在杭州聊梅家坞的春茶与采茶（market 事件台词杭州化；赠茶事件仅武夷山场景可触发）。
  {
    id: 'young_farmer',
    name: '年轻茶农',
    role: '山里自家茶农',
    regions: ['wuyishan', 'hangzhou'], // 跨茶区漫游；台词按茶区区分
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
          { speaker: '你', text: '「挑这么沉，一天得几趟？」' },
          { speaker: '年轻茶农', text: '「三四趟吧。鲜叶耽误不得，累点也值。」' },
          { speaker: '年轻茶农', text: '这活儿，真得年轻人扛。' },
        ],
        outcome: { toast: '（他拍拍裤腿，朝山下走了。）' }
      },
      {
        id: 'youngfarmer_market',
        scenes: ['market'],
        weight: 24,
        lines: [
          { speaker: '年轻茶农', text: '头回帮家里摆摊，手都不知道往哪放。' },
          { speaker: '年轻茶农', text: '你帮我看看这标价行不？' },
        ],
        linesByRegion: {
          hangzhou: [
            { speaker: '年轻茶农', text: '头回帮家里在梅家坞口摆摊，手都不知道往哪放。' },
            { speaker: '你', text: '「今年的龙井收成怎么样？」' },
            { speaker: '年轻茶农', text: '「明前那批最好，就是采得人手疼——一芽一叶，急不来。」' },
            { speaker: '你', text: '「原来龙井采摘这么讲究。」' },
            { speaker: '年轻茶农', text: '「那可不。你帮我看看这标价写得行不？」' },
          ],
        },
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
  // 跨茶区复用（身份/美术不变）：在杭州说杭州的话（linesByRegion），赠茶只赠杭州本地茶。
  // 注意：杭州偶遇实际只在共用 market 场景触发（hz-* 场景不接偶遇层），
  // 非 market 事件无需杭州台词——若未来给杭州场景接偶遇层，需先补齐各事件 linesByRegion。
  {
    id: 'tea_dajie',
    name: '请喝茶大姐',
    role: '山下好客的大姐',
    regions: ['wuyishan', 'hangzhou'], // 跨茶区漫游；台词与赠茶按茶区区分
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
          { speaker: '你', text: '「大姐您天天都来这守着？」' },
          { speaker: '请喝茶大姐', text: '「可不是。过路人喝口热的，我心里也热乎。」' },
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
        linesByRegion: {
          hangzhou: [
            { speaker: '请喝茶大姐', text: '我这小茶摊就摆在梅家坞路口，自家炒的龙井管够。' },
            { speaker: '你', text: '「大姐，你们这儿家家都会炒茶吗？」' },
            { speaker: '请喝茶大姐', text: '「那可不。清明前后忙起来，饭都是端到垄边吃的。」' },
            { speaker: '请喝茶大姐', text: '逛累了就过来坐，不要钱。' },
          ],
        },
        outcome: { toast: '（她朝你挥挥手，让你随便坐。）' },
      },
      {
        // 赠茶分茶区：武夷山给肉桂（本地茶），杭州给九曲红梅（本地茶），权重一致。
        id: 'dajie_offer',
        scenes: ['garden', 'mountain', 'teahouse', 'market'],
        weight: 16,
        requires: (p) => (p.currentRegion ?? 'wuyishan') === 'wuyishan',
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
        // 杭州对位事件：大姐在杭州送的自然是杭州茶（九曲红梅——家常待客那口甜）。
        id: 'dajie_offer_hz',
        scenes: ['garden', 'mountain', 'teahouse', 'market'],
        weight: 16,
        requires: (p) => p.currentRegion === 'hangzhou',
        lines: [
          { speaker: '请喝茶大姐', text: '拿着拿着，一小包自家烘的九曲红梅。' },
          { speaker: '你', text: '「这怎么好意思。」' },
          { speaker: '请喝茶大姐', text: '「杭州人待客就兴这一口，甜丝丝的，回去泡泡看。」' },
        ],
        outcome: {
          giveTea: { teaId: 'jiuquhongmei', grade: 'normal', roastLevel: '到位', count: 1, unitValue: 16 },
          toast: '获得一小包茶（九曲红梅 · 普通）。',
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
  // 跨茶区复用：在杭州聊龙井豆香、玻璃杯泡茶这些杭州人的日常（market 可触发的聊天事件杭州化）。
  {
    id: 'roadside_uncle',
    name: '路边饮茶叔',
    role: '路边歇脚的老茶客',
    regions: ['wuyishan', 'hangzhou'], // 跨茶区漫游；台词按茶区区分
    scenes: { mountain: 38, teahouse: 26, market: 22 },
    events: [
      {
        id: 'uncle_mountain',
        scenes: ['mountain'],
        weight: 26,
        lines: [
          { speaker: '路边饮茶叔', text: '走累了？陪我在这石头上坐会儿。' },
          { speaker: '你', text: '「叔，您这壶里泡的什么茶？」' },
          { speaker: '路边饮茶叔', text: '「肉桂。山里的水软，泡出来不锁喉。」' },
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
        linesByRegion: {
          hangzhou: [
            { speaker: '路边饮茶叔', text: '茶市边上占个座，看人来人往买龙井。' },
            { speaker: '你', text: '「叔，您壶里泡的是龙井吗？」' },
            { speaker: '路边饮茶叔', text: '「嗯，豆香足的才对味。杭州人喝茶，一只玻璃杯就够了。」' },
            { speaker: '路边饮茶叔', text: '茶样看多了，不如喝一口。' },
          ],
        },
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
        linesByRegion: {
          hangzhou: [
            { speaker: '路边饮茶叔', text: '龙井要喝个鲜，春茶放久了就钝了。' },
            { speaker: '你', text: '「那九曲红梅呢？也是杭州的茶吧。」' },
            { speaker: '路边饮茶叔', text: '「对，知道的人少些。甜口，慢悠悠的，跟我这壶挺配。」' },
          ],
        },
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
          { speaker: '你', text: '「你从哪边上来的？」' },
          { speaker: '年轻男旅客', text: '「后山步道。人少，就是坡陡点。」' },
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
  // 跨茶区复用：在杭州只卖杭州本地茶（龙井/九曲红梅），两个售茶事件按茶区一分为二，权重不变。
  {
    id: 'maicha_dashu',
    name: '卖茶大叔',
    role: '茶集市摊主',
    regions: ['wuyishan', 'hangzhou'], // 跨茶区漫游；卖什么茶按茶区区分
    scenes: { market: 42 },
    events: [
      {
        id: 'dashu_fair',
        scenes: ['market'],
        weight: 30,
        requires: (p) => (p.currentRegion ?? 'wuyishan') === 'wuyishan',
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
        // 杭州对位事件：本地卖龙井（梅家坞收的青，一口豆香）。
        id: 'dashu_fair_hz',
        scenes: ['market'],
        weight: 30,
        requires: (p) => p.currentRegion === 'hangzhou',
        lines: [
          { speaker: '卖茶大叔', text: '看看茶？明码标价，不玩虚的。' },
          { speaker: '卖茶大叔', text: '这包龙井，梅家坞收的青，炒得干净。' },
        ],
        choices: [
          {
            label: '买一包',
            outcome: {
              addCoins: -8,
              giveTea: { teaId: 'longjing', grade: 'normal', roastLevel: '刚好', count: 1, unitValue: 13 },
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
        linesByRegion: {
          hangzhou: [
            { speaker: '卖茶大叔', text: '清明前后，梅家坞这条路上全是来买茶的。' },
            { speaker: '卖茶大叔', text: '龙井好不好，泡开了看汤色——清亮透绿的才新鲜。' },
          ],
        },
        outcome: { toast: '（你听了一段实在的买茶经。）' },
      },
      {
        id: 'dashu_pit',
        scenes: ['market'],
        weight: 22,
        requires: (p) => (p.currentRegion ?? 'wuyishan') === 'wuyishan',
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
        // 杭州对位事件：礼盒装的梗不变，茶换成杭州本地的九曲红梅。
        id: 'dashu_pit_hz',
        scenes: ['market'],
        weight: 22,
        requires: (p) => p.currentRegion === 'hangzhou',
        lines: [
          { speaker: '卖茶大叔', text: '这盒九曲红梅，礼盒装的，送人体面。' },
          { speaker: '卖茶大叔', text: '不过里头茶就一般般，你懂的。' },
        ],
        choices: [
          {
            label: '买一盒',
            outcome: {
              addCoins: -8,
              giveTea: { teaId: 'jiuquhongmei', grade: 'normal', roastLevel: '到位', count: 1, unitValue: 16 },
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
  // 跨茶区复用：场景权重（mountain 4 / market 2）与武夷山完全一致，不为入杭州偶遇池提率；
  // 杭州份额略被摊薄（0.7%→0.8% 量级）只随池子大小自然浮动。赠茶按茶区区分：杭州赠龙井上品。
  {
    id: 'mystery_tea_person',
    name: '神秘茶人',
    role: '山中偶遇的茶人',
    regions: ['wuyishan', 'hangzhou'], // 跨茶区漫游；低概率机制两区一致
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
        linesByRegion: {
          hangzhou: [
            { speaker: '神秘茶人', text: '年轻人。' },
            { speaker: '神秘茶人', text: '西湖的水养茶，也养喝茶的人。' },
          ],
        },
        outcome: { toast: '（他看了你一眼，没再多说。）' },
      },
      {
        id: 'mystery_gift',
        scenes: ['mountain', 'market'],
        weight: 28,
        requires: (p) => (p.currentRegion ?? 'wuyishan') === 'wuyishan',
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
        // 杭州对位事件：赠杭州本地的龙井上品（明前的鲜），概率与武夷山版一致。
        id: 'mystery_gift_hz',
        scenes: ['mountain', 'market'],
        weight: 28,
        requires: (p) => p.currentRegion === 'hangzhou',
        lines: [
          { speaker: '神秘茶人', text: '拿着。' },
          { speaker: '神秘茶人', text: '明前的鲜，都藏在这把叶子里。' },
        ],
        outcome: {
          giveTea: { teaId: 'longjing', grade: 'fine', roastLevel: '刚好', count: 1, unitValue: 36 },
          toast: '获得一小包茶（龙井 · 上品）。',
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

  // ── 牛姐：杭州茶集市的茶商大姐（剧情彩蛋：乌牛早冒充龙井）──
  // 表面热情实在，实际精明宰客——她知道自己卖的是乌牛早，但嘴上只说「龙井」。
  // 底层库存永远记 wuniuzao；真相由周伯在茶桌辨茶时揭晓（dialogues.zhoubo_niujie_tea）。
  // 不是反派：话术热络、「为顾客着想」，坑完还觉得自己特别会做生意。
  //
  // 稀有度对齐（用户 2026-09-12 明确：普通NPC > 牛姐≈王霸茶 > 神秘茶人，数值沿用现有配置推导）：
  //   集市 NPC 权重和（含牛姐）= 292。牛姐权重 20 → 每次逛集市 ≈ 0.5 × 20/292 ≈ 3.4%；
  //   王霸茶 ≈ 0.5 × 60/292(老贾被抽中) × 45/135(事件权重) ≈ 3.4%——两者几乎完全相等，天然同档。
  //   神秘茶人保持 market:2（≈0.34%）不动 → 牛姐比普通 NPC 少见、比神秘茶人常见一个数量级。
  //   一次偶遇只产生一个 NPC/事件（rollEncounter 结构性保证，互不覆盖）。
  {
    id: 'niujie',
    name: '牛姐',
    role: '茶集市的茶商大姐',
    regions: ['hangzhou'], // 只在杭州茶集市出现
    scenes: { market: 20 },
    // 当日冷却（同王霸茶）：同日不刷两次、隔天可再遇；冷却 flag 由 EncounterLayer 在 roll 时置位
    //（覆盖「滚到牛姐但中途离开未对话」的情形）。首次完整剧情/后续轻量彩蛋由三个事件的 requires 分态。
    requires: (p) => !p.flags['niujie_seen_' + p.day],
    events: [
      {
        // 第一次（未购买、未揭穿）：热情推销「龙井」——两个购买分支 + 一个不买。
        // 购买瞬间不揭底：toast 沿用她的话术；底层 giveTea 记 wuniuzao。
        id: 'niujie_sell',
        scenes: ['market'],
        weight: 40,
        requires: (p) => !p.flags['bought_niujie_wuniuzao'] && !p.flags['niujie_tea_revealed'],
        lines: [
          { speaker: '牛姐', text: '姑娘，来看看茶呀？' },
          { speaker: '牛姐', text: '龙井呀！今年的新茶，嫩着呢。' },
          { speaker: '', text: '（她利索地摊开一包茶样——叶子扁扁的，绿得发亮。）' },
          { speaker: '牛姐', text: '你看这扁扁的叶子，多漂亮。杭州的龙井，错不了。' },
          { speaker: '牛姐', text: '你要是喜欢，我给你算个批发价。别人我可不这个价。' },
          { speaker: '牛姐', text: '你看着就像懂茶的，我也不跟你绕弯子。' },
        ],
        choices: [
          {
            label: '买一份「龙井」· 30文',
            outcome: {
              addCoins: -30,
              giveTea: { teaId: 'wuniuzao', grade: 'good', count: 1, unitValue: 30 },
              setsFlags: { bought_niujie_wuniuzao: 1 },
              toast: '「好嘞，一份龙井，给你包好了。」',
            },
          },
          {
            // 套装：底层给 乌牛早×1 + 九曲红梅×1，绝无「龙井」库存。
            label: '批发套装 · 52文（再搭一份九曲红梅）',
            outcome: {
              addCoins: -52,
              giveTeas: [
                { teaId: 'wuniuzao', grade: 'good', count: 1, unitValue: 30 },
                { teaId: 'jiuquhongmei', grade: 'good', count: 1, unitValue: 22 },
              ],
              setsFlags: { bought_niujie_wuniuzao: 1 },
              toast: '「单买龙井多没意思——两样一起拿，套装价，都给你包好了。」',
            },
          },
          {
            label: '再看看别的',
            outcome: { toast: '（她笑眯眯地把茶样收好：「随时回来呀，姐给你留着。」）' },
          },
        ],
      },
      {
        // 买过但还没被周伯揭穿：一句催你回去泡茶的闲话，不剧透。
        id: 'niujie_wait',
        scenes: ['market'],
        weight: 30,
        requires: (p) => !!p.flags['bought_niujie_wuniuzao'] && !p.flags['niujie_tea_revealed'],
        lines: [
          { speaker: '牛姐', text: '回去泡了没呀？好茶不怕放，就怕你不喝。' },
          { speaker: '牛姐', text: '喝着怎么样，下回来跟姐说说。' },
        ],
        outcome: { toast: '（她招呼别的客人去了，笑得一如既往地热络。）' },
      },
      {
        // 揭穿之后：轻量呼应彩蛋，不追责、不退款、不惩罚。
        id: 'niujie_again',
        scenes: ['market'],
        weight: 40,
        requires: (p) => !!p.flags['niujie_tea_revealed'],
        lines: [
          { speaker: '牛姐', text: '姑娘，又来看看龙井？' },
        ],
        choices: [
          {
            label: '「你上次卖我的，好像不是龙井吧？」',
            followup: {
              lines: [
                { speaker: '', text: '（牛姐愣了一下，随即笑得更热络了。）' },
                { speaker: '牛姐', text: '哎呀……姑娘现在懂茶啦？' },
                { speaker: '牛姐', text: '做生意嘛，总得给人留点学习空间。' },
              ],
              outcome: { toast: '（她冲你眨眨眼，转身又招呼别人去了。）' },
            },
          },
          {
            label: '笑笑，随便看看',
            outcome: { toast: '（她也不恼，继续吆喝她的「新茶」。）' },
          },
        ],
      },
    ],
  },
];
