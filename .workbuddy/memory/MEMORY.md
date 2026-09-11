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
- 买茶=「想喝/想看看别人的」，不是奖励；禁止买茶经验/积分/返金币/购物车。

## 资源与工具链
- 原始素材：`background picture/`、`npc picture/`、`chaju picture/`（中文名大小写混杂，先 `ls` 再用，别猜）。转 webp 用托管 venv `/Users/lorilee/.workbuddy/binaries/python/envs/default/bin/python`（Pillow；cwebp/ImageMagick 无，sips 只读不写）。竖版背景≈1100 宽 q82；NPC 立绘高 1400 透明 RGBA。
- 杭州背景已接：hangzhou_teahouse/workshop/meijiawu.webp；杭州茶园暂无正式图（SVG 占位 `HangzhouGardenScene`）。

## 部署 / Git
- 部署构建用 `npm run build:web`（--base=./）；`build:xhs` 是小红书精简版，别用于部署。无客户端路由，刷新不 404。
- 远端 SSH `git@github.com:midori101lee-lang/tea-journey.git`，分支 main；Cloudflare Pages（tea-journey-d2z.pages.dev）每次 push 自动构建。本地改动不自动上线；push 由用户手动（或当次明确授权）。「已更新」= push 成功 + CF 部署成功实测，缺一不可。
- WorkBuddy 只改代码 + 展示 diff，不默认 commit/push。
