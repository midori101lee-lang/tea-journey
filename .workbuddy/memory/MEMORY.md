# 茶世界 /《茶游记》长期约定

## 项目
- 设计定稿 `docs/茶游记_产品方案_V0.3.md`；代码在仓库根（Vite+TS+React18+Zustand+CSS变量）。工作方式：文档驱动、逐阶段确认，先出方案再编码；决策记录写在方案文档末尾编号章节。

## 铁律
1. 不为考证而考证：不影响玩法的专业细节用保守自然表达；游戏内不显示克数/秒数等数字。
2. 真实世界定规则，游戏机制降复杂度；简化保留工艺因果。
3. 组件可复用，茶文化表达不能偷懒（武夷山叫炒青/倒青/焙火，不叫杀青/摊晾/干燥）。
4. `src/core/**` 禁 import React/DOM；features 不硬编码步骤顺序，一切从 `recipe.steps` 取。
5. 双端差异只用 feature flag + `params.standard/casual`，禁止散落 `if (isXhs)`。
6. 美术内联 SVG；例外（用户授权）：NPC 立绘/场景背景可用用户提供的 webp（`public/assets/npcs|scenes/**`，经 `import.meta.env.BASE_URL` 解析）。音效 WebAudio 合成；不引 UI 库/Tailwind/外部字体。
7. 前台不显示评分数字：品质等级+自然语言+茶钱；熟练度只显示 初学/入门/熟手/老练。
8. 品质四档：失败/普通/良好/上品（「失败」是结果等级）；失败不扣茶钱只耗鲜叶。
9. 茶种差异全走 `gameProfile` 游戏参数；禁止「肉桂天生更难」等现实茶学断言。
10. 存储 `teaworld.save.v3`（StorageAdapter+migrations，隐私模式降级内存）。

## 架构要点
- 三条配方线（`teas.ts`，`getRecipeFor(teaId)` 选线）：`YANCHA_RECIPE` 倒青→做青→炒揉→焙火（摇/揉/火）；`HONGCHA_RECIPE` 萎凋→揉捻→发酵→烘干（看/等/判断，发酵是九曲红梅记忆点）；`GREEN_TEA_RECIPE` 采茶→杀青→理条→干燥（嫩/快/轻/形，理条=抓压推，龙井记忆点）。`isCraftable` 判定可做；结果页过程标签按 category：岩茶火功/红茶发酵/绿茶杀青。
- 采茶两模式（`PickingStep`，由 `gameProfile.picking.pickingMethod` 驱动）：`open-face`（开面采）与 `bud`（一芽一叶最佳/一芽二叶合适/老叶不要，龙井）。
- 场景 key：杭州 `hz-teahouse/hz-garden/hz-workshop/hz-teatable` + 探索点 `meijiawu`；集市共用 `market`。`regions.locations[].scene` 数据绑定 + `regionLocationScene()`；进区统一 `enterRegion()`。
- 杭州解锁链：武夷山探索 5/5（`isWuyishanExplored`，复用 regionExploration）→ 老陈收束+告别礼 → 林姑娘线索 → `heard_about_hangzhou` → TeaWorld 卡片 `unlockFlag` 亮起。龙井由梅家坞吟诗老人置 `longjing_unlocked`（勿用熟练度解锁）。
- 派生对话条件写 `dialogues.DERIVED_DIALOGUE_FLAGS`（即时计算不落盘，天然兼容旧存档），别写死 flags。
- 旅行收藏 `souvenirs`（kind: postcard/note/couplet）：母树明信片、梅家坞诗笺（唐韬诗为指定原文，勿改写）、杭州茶联（`CoupletArt` 120×420 竖条占位，玲姨首次茶馆聊完赠，flag `saw_hangzhou_couplet`）。
- 告别礼/旅途茶：`TeaStack.source = made|purchased|gift` + `giftTag`，`addGiftTea` 独立成栈；礼物茶可泡不可卖（MarketView filter source!=='gift'）；NPC 旅途反应走派生条件，彩蛋非强制。禁止：好感度/任务树/数值奖励/第二套库存。
- 茶具收藏两源：`MARKET_TEA_WARES`（茶集市卖）+ `GIFT_TEA_WARES`（剧情赠礼，不标价/不进 MarketView）；`getTeaWare`/`ownedWareOfType` 合并两源。`giveTeaWare(id)` 与 `buyTeaWare` 并列、共享 `player.teaWareInventory`、`Dialogue.givesTeaWare` 进收藏而非茶叶背包。`usableForBrew:false` = 收藏型（为「我的茶席」预留——茶席已实现：读 teaWareInventory 摆桌，不进现有泡茶容器选择、不强制装备）。杭州玻璃杯=玲姨赠礼（条件：隐藏成就 iron_palm + 未领过），绿豆糕=`cha dian/绿豆糕.png`→`assets/snacks/lvdocake.webp`，阿青茶席首访赠（flag received_lvdocake 后常驻配件槽）。
- 我的茶席（hz-teaseat + wuyi-teaseat，**区域化**）：`TEA_SEAT_BY_REGION` 按 regionId 配置 bg/firstNpc/firstDoneFlag/npcPool/greetings/chat(byTea 可按茶种覆盖，如周伯岩茶性格)；组件/状态机/分层锚点/回礼完全共用。**分层铁律**——背景(z0,纯环境)→NPC(z1,坐桌后下半身被遮)→茶桌TeaSeatTable(z2)→三槽位(z3,**必须显式 z-index**)→玩家侧(z4)→UI；容器 aspect=背景比例不裁切。门禁 `canEnterTeaSeat(player,region)`：hangzhou=拥有任意茶具；wuyishan=flag `wuyishan_teaseat_unlocked`（老陈寒暄剧情解锁，旧档默认未解锁）。偶遇 35%（可能没人），**牛姐/神秘茶人永不入茶席池**。回礼同茶区随机、`TEA_SEAT_GIFT_EXCLUDED=['wuniuzao','wangba']`（彩蛋茶不回流）、giftTag 'teaseat_return'、概率 fail0/normal.25/good.45/fine.65。不消耗库存、无好感度/任务。
- 武夷山茶席解锁链（轻量剧情，无任务面板）：杭州茶席坐过一次后入席 → 林姑娘固定登场邀请（可「再等等」不落 flag 可重复触发）→ 接受落 `linggu_wuyi_accepted` → 回武夷山茶馆 derived `laochen_wuyi_return_ready` 触发 `laochen_wuyi_return` 寒暄 → 落 `wuyishan_teaseat_unlocked` → 武夷山茶桌 footer 入口。
- 买茶=「想喝/想看看别人的」，不是奖励；禁止买茶经验/积分/返金币/购物车。
- 偶遇按茶区过滤：`EncounterNpc.regions?: string[]`（缺省=全茶区，旧行为不变），`rollEncounter` 按 currentRegion 筛。`EncounterOutcome.giveTeas?` = 一次给多包（套装）。剧情彩蛋触发链范本（牛姐彩蛋）：偶遇买茶落 flag → `finishBrewing` 按 teaId 落 pending flag → 茶桌 derived conditional 对话 → setsFlags 收口 + unlocksComic。乌牛早 `wuniuzao`：独立茶品、不可制茶、不进摊位、只能牛姐剧情获得；底层永远是 wuniuzao，「龙井」只是牛姐话术；乌牛早≠劣质/假茶，冒充才是问题。
- 周伯对话（2026-09-12 重构）：茶桌日常闲聊走 `core/data/zhouboChat.ts` 话题池（地区×茶叶×话题三维组合，ZHOUBO_TASTING 按 teaId 强绑定、REACTION 按 grade、REGION/COMPARE/CULTURE/LIFESTYLE 茶agnostic），`ZhouBoTableDialog` 组件替换两茶桌 NpcDialog（特殊对白=首次/派生条件仍走 DIALOGUES，如牛姐辨茶）。当前茶上下文=lastResult（与底部 zhouBoAdvice 同源，不分裂）。**静态 repeat 周伯台词已废除**（错配根源）；跨茶对照句（红梅提龙井）是 spec 白名单。回礼排除表 TEA_SEAT_GIFT_EXCLUDED=['wuniuzao','wangba']。
- 区域探索 vs 茶席分工（2026-09-12 定）：**探索=出去逛（每日3次随机遇见），茶席=回来坐（社交空间）**，互不跳转。`visitExplore(target)` 与 `visitMountain` 共用「每日3次+歇一晚/换区重置」（计数 mountainVisitsToday）。杭州探索=「梅家坞走走」（MapView 按钮→hz-stroll，bg hangzhou_stroll.webp；事件池 `core/data/strolls.ts`：生活/茶文化/联动(requires madeTeas.longjing)/NPC(linggu,lingyi,gu_shu)/彩蛋/nothing，**奖励克制仅1事件**=九曲红梅 giftTag 'stroll_meijiawu'）。未来茶区加自己的池；武夷山偶遇仍走 encounters.ts 偶遇引擎。

## 资源与工具链
- 原始素材：`background picture/`、`npc picture/`、`chaju picture/`（中文名大小写混杂，先 `ls` 再用，别猜）。转 webp 用托管 venv `/Users/lorilee/.workbuddy/binaries/python/envs/default/bin/python`（Pillow；cwebp/ImageMagick 无，sips 只读不写）。竖版背景≈1100 宽 q82；NPC 立绘高 1400 透明 RGBA。
- 杭州背景已接：hangzhou_teahouse/workshop/meijiawu.webp；杭州茶园暂无正式图（SVG 占位 `HangzhouGardenScene`）。

## 部署 / Git
- 部署构建用 `npm run build:web`（--base=./）；`build:xhs` 是小红书精简版，别用于部署。无客户端路由，刷新不 404。
- 远端 SSH `git@github.com:midori101lee-lang/tea-journey.git`，分支 main；Cloudflare Pages（tea-journey-d2z.pages.dev）每次 push 自动构建。本地改动不自动上线；push 由用户手动（或当次明确授权）。「已更新」= push 成功 + CF 部署成功实测，缺一不可。
- WorkBuddy 只改代码 + 展示 diff，不默认 commit/push。
- `build:xhs` 是小红书构建但当前 XhsApp 仅为线性 demo，未达可用版本（见 2026-09-12 评估，勿误当已完成 XHS）。

## XHS 打包流程（2026-09-12 定稿，规约见 .skill/minitool-zip-builder/）
- **隔离铁律**：build:web→`dist/`（Cloudflare 用）；build:xhs→`dist-xhs/`（vite.config isXhs 分支 outDir 已配置）。跑 XHS 打包永不动 Web 产物。
- 打包步骤：`npm run build:xhs` → Pillow 只压 dist-xhs 产物副本（源 public/ 不动；scenes q66 宽1000 / npcs q74 高820 / teaworld·teaware q76 宽640·512）→ `mv dist-xhs/xhs.html dist-xhs/index.html`（Vite input key 不改 HTML 输出名）→ `cd dist-xhs && zip -rq ../tea-journey-xhs.zip .`。
- 容器合规：IIFE 经典脚本（无 type=module/import/export）、禁 clipboard/execCommand、总包 ≤10MiB（当前 8.3MiB 解压 / zip 7.9MB）、index.html 必须在 zip 根、中文文件名 zip 后需解压回读校验。
- 白屏排障经验：5173 白屏+无 vite-error-overlay+typecheck 通过 = 陈旧 dev server 进程（会话中断遗留），kill 后重启即愈，勿先怀疑代码。

## 小红书版本（评估结论 2026-09-12）
- 方向：**网页版本=当前完整游戏；小红书版本=移动端轻量化复用同一份内容**。首期双茶区（武夷山+杭州），福州/潮州后续数据化加入（卡片占位已留 `teaRegions.ts`）。
- 复用：单一 store + 数据驱动内容 + region-agnostic 组件，Web/XHS 共用；构建 `build:xhs`/`dev:xhs`/`xhs.html` 已通。无 isXhs 散落（铁律 5）。
- XhsApp 现状：仅线性 demo（无茶区/NPC/探索/茶席/剧情），**需升级为复用 WebApp 全量流程的移动外壳**（退役 stub），默认 `casual`、系统返回键→`store.back()`。
- 最大风险（P0 先验证）：XHS webview 是否持久化 localStorage（否则进度丢）；资源体积（背景~5.5MB/立绘~6MB）；`window.confirm`/`reload` 改应用内确认+`store.reset()`。
- 茶区扩展：内容已数据驱动，地点叙事流写死 WebApp 逐茶区分支；双茶区不重构，扩 3+ 再抽 `REGION_LOCATION_UI` 配置。
- 评估文档：`docs/小红书版本_开发评估.md`（P0/P1/P2 顺序）。
