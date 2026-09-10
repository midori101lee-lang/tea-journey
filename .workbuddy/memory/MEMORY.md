# 茶世界 /《茶游记》项目长期约定

## 项目现状
- 设计已定稿：`docs/茶游记_产品方案_V0.3.md`（V0.3，2026-09-08 用户确认）。历史文档：`tea-journey-plan-v0.2.md`、`tea-world-mvp-plan.md`、`茶游记_武夷山真实性资料库_V1.0.md`。
- 代码在仓库根目录（Vite + TS + React 18 + Zustand + CSS 变量 Token）。

## 铁律（每次开发前重读）
1. **R1–R7 不要为了考证而考证**：只确认影响 MVP 游戏机制、基础科普准确性、玩家理解的内容；不影响玩法的专业细节用自然、保守、不绝对化的表达，不阻塞开发。待考证项不进 knowledge 数据，最多以 npcOpinion 口语出现；游戏内不显示克数/秒数等数字。
2. **真实世界决定规则，游戏机制负责降低复杂度**；简化必须保留真实工艺因果。
3. **代码组件可复用，茶文化表达不能偷懒**（武夷山叫"炒青"不叫"杀青"，叫"倒青"不叫"摊晾"，叫"焙火"不叫"干燥"）。
4. `src/core/**` 禁止 import React / DOM。组件不认识"杀青"等业务概念。features 不硬编码步骤顺序，一切从 `recipe.steps` 取。
5. 双端差异只用 feature flag + `params.standard/casual` 双档，禁止散落 `if (isXhs)`。
6. 美术全内联 SVG，零位图；音效 WebAudio 合成，零音频文件；不引 UI 库/动画库/Tailwind/外部字体。
   - **例外（2026-09-08 用户授权）**：NPC 透明立绘与场景大图背景可用用户提供的 WebP 位图（`public/assets/npcs/**`、`public/assets/scenes/**`），由 `NpcPortrait`/`NpcStage` 数据驱动接入；游戏内交互美术（`Art.tsx`、SVG 场景组件、`scenes/*.tsx` 本身）仍保持内联 SVG，不引外部图。位图路径经 `import.meta.env.BASE_URL` 解析以兼容 `--base=./` 双端构建。
7. 前台不显示评分数字：只给 品质等级 + 自然语言 + 茶钱。熟练度只显示四档文字：**初学/入门/熟手/老练**（V1.0 收口，弃用旧版"手生/渐入佳境/得心应手/山里有名的手艺人"）。
8. 品质仅四档：**失败/普通/良好/上品**（神品已取消 Q2；首档是"失败"不是"废品"——它是结果等级，不是物品分类）。失败不扣茶钱，只耗鲜叶。
8b. 三茶的难度/参数/表现差异**全部降级为 `teaGameProfile` 游戏参数**，不属于知识系统；禁止表述为"肉桂天生更难制作""水仙天然更容易成功"等现实茶学事实。
8c. 泡茶 8 步：烧水→温盖碗→投茶→注水→观察茶汤→闻香→判断出汤→完成品饮。秒数/投茶量是游戏参数，不得伪装成唯一专业标准。采茶判断三类（太嫩/合适/太老，无"损伤叶"）。
9. 存储 key `teaworld.save.v3`，经 StorageAdapter，带 migrations；隐私模式降级内存。
10. 每个 step 携带 StepMeta（gameName/realProcessName/simplificationNote），工艺映射是数据不是文档。

## 已锁定的关键设计（V0.3 定稿）
- 武夷山流程：采茶(开面采判断)→倒青(两晒两晾)→做青(摇青+静置3-4轮,叶缘朱砂红)→炒揉(双炒双揉一个step两轮,3秒趁热窗口)→焙火(动态指针×5,绿区动态漂移,火功轻/中/足)。
- 双炒双揉 = 一个 Step 两轮（Q1）。做青是全章招牌玩法。
- MVP = 武夷山第一日：茶馆(老陈)→茶园(阿秀)→采茶→制茶坊(岩伯)→结果入茶篓→茶桌泡茶(周伯)→茶馆(林姑娘,杭州线索1/3)。泡茶保留（Q4）。
- 母树六棵 = NPC对话+一张漫画/知识卡，轻量，不可采、无坐标、无掉落（Q5）；结果页须注「此大红袍，非九龙窠那几棵」。
- 5 NPC：老陈/阿秀/岩伯/周伯/林姑娘。岩伯只描述所见，不给指令。
- **老陈 = 茶农兼茶馆老板，"玩家认识武夷山的第一个当地人"，贯穿式 NPC**（C4/C8 已裁决·方案2）：茶馆/山里生活/人情/茶山旧闻/母树/交易/熟客关系；不负责采茶教学也不负责制茶教学。初见→带采茶→做茶时偶遇→讲母树→聊喊山→茶馆偶遇；台词随熟练度变化。阿秀=采茶人（土地/茶青/茶季/劳作），不负责母树与百科；两人都懂茶但不承担相同教学职能。
- 三茶：肉桂(🔥张扬派·先闻香)/水仙(🌿温润派·喝的是汤)/大红袍(🟤平衡派·喝了才知道)；差异只走 gameProfile。
- 茶钱：普通10-20/良好20-30/上品30-50，游戏自有经济，不复制现实价格。
- **P0 范围（C5 上调后）**：茶馆开场、地点导航、采茶/倒青/做青/炒揉/焙火、结果、茶篓、茶钱、**泡茶8步**、**图鉴/茶山手账**、**六棵母树（对话+1漫画）**、熟练度、存储、数据分层(TeaFact/TeaCopy/gameProfile)、双端骨架。
- P1：喊山、手账增强、大红袍传说漫画（须标【传说】）、更多NPC对话与地方生活事件、多次泡茶、更多线索。
- P2 明确不做：多茶区、拣剔扬簸动画、完整天气、双炒双揉拆四节点、集市、斗茶完整玩法、老丛/牛肉马肉山场素材、云存档。
- 真实性禁止清单：水仙"适合女性"、大红袍=肉桂+水仙、牛肉一定优于马肉、老丛=固定香味、传说写成历史、专业审评数字外显、熟练度数字外显、母树可采、旅游宣传腔与百科腔。

## 工作方式
- 用户以文档驱动、逐阶段确认；每个大阶段先出方案再编码，不要跳过确认。
- 决策记录写在方案文档末尾编号章节（见 V0.3 第 23 节）。

## 买茶系统产品逻辑（V0.3 逛摊买茶 · §30 补充，长期有效）
> 同步给后续 WorkBuddy 任务：本轮重心是把「为什么买茶」融进 V0.3，**不是加奖励机制**。

### 核心动机（必须贯穿）
- 玩家买 NPC 的茶 = 「想喝 / 想看看别人做的 / 想收藏」，**不是**为了系统奖励。
- 最大购买动机：**NPC 摊位允许出现玩家当前水平之外的高品质茶（良好/上品）**，让玩家觉得「这锅比我做的好」。NPC 是偶尔拿出好茶，不是玩家永远做不出。
- 茶叶品质 = 购买欲望；茶叶来源 = 故事感；泡茶 = 使用价值；茶游记 = 长期记录；NPC 记忆 = 世界真实感。

### 三身份（最终都进同一茶篓，靠 source 区分，前端不复杂展示）
- 🍃 自己做的茶 = 我的手艺（source:'made'）
- 🍵 买来的茶 = 我的发现（source:'purchased'）
- 🎁 特殊获得的茶 = 我的旅途（神秘茶人/珍藏茶等，P2）

### P0（已实现于 V0.3 买茶 + 后续补全）
- NPC 摊位 / 多 NPC / 多茶叶 / 买茶 / 扣茶钱 / 入现有茶篓 / 购买反馈 / 可继续逛。
- 不建第二套货币/库存；不建购买奖励系统。
- ✅ **「买来的茶→泡茶」闭环已闭合**：`WebApp` 茶桌「用茶篓里的茶泡一壶」→ `TeaStackPicker` → `startBrewFromStack`（合成 `ProcessingResult` 喂 `BrewingFlow`，携带 `sourceNpc`/`bargain`）。买来的茶与自制茶都走同一泡茶流程。

### P1（结构易复用才做，不重构）
- 记录茶叶来源 `made/purchased`（types 已加 TeaStack.source）。
- NPC 记住玩家买过他的茶（复用 `flags['bought_from_'+npcId]`，轻量记忆，无好感度/声望/等级）。
- 部分好茶一句话来源文案（已是 TEA_DESC 按茶种×品质给）。

### V0.4「生活化茶市扩展」（2026-09-09 落地，增量开发、不重做核心）
> 把「茶集市可以买茶」升级为「茶集市值得逛」：让集市成为一个会发生小故事的地方。
- **逛摊更像真实集市**：每个摊位可【看看】茶（自然语言：条索/颜色/闻香，无数字评分）、可【问问】老板（按 `sellerStyle` 给不同口吻回答；话术≠真实情况）。
- **数据层**：`marketStalls.ts` 加 `SELLER_STYLE`（`honest/casual/businesslike/salesy/tea_person`）、`TEA_LOOK`（看看茶）、`ASK_QUESTIONS`+`ASK_ANSWERS`（问问应答库，按性格）。`generateStalls` 计算 `bargain` 标记。
- **捡漏 / 买贵（P1）**：好茶却便宜=deal、普通茶却贵=overpriced；买下时写入 `TeaStack.bargain`，泡茶后周伯给「捡着了 / 下次再看看」生活化反馈（无金钱奖惩）。
- **茶叶来源（P1）**：`TeaStack.sourceNpc` 记录摊主 id；买下时 `buyTea` 写入；茶桌选茶（`TeaStackPicker`）显示「（XX的摊）」。
- **NPC 轻量记忆（P1）**：再次进同一摊位时招呼语变熟客（「上次那包喝着还行吧」）；仅 flag，无数值系统。
- **王霸茶**：保持 `encounters.ts` 的 `laojia_wangba`（免费喝→推销→分支→赠茶入篓→周伯发现），作为 `special_market_event` 第一种模板，未改机制。
- **P2 尚未做（下一轮）**：熟客回访完整事件 / 茶山线索 / 特殊商人 / 人情型事件 / Journal 内「我的发现」茶叶清单。当前仅做了"熟客招呼变体"这一轻量版。
- 验收：双端 `typecheck` + `build:web` + `build:xhs` 通过；未动制茶/茶钱/库存/山路/Journal 既有逻辑。

### P2（后续，不为此重构）
- 「喝过的茶」Journal 轻量记录（与「我做过的茶」区分）。
- 来源收藏、特殊茶故事、稀有茶、NPC 珍藏茶、更丰富茶客记录。

### 明确禁止（买茶相关）
- 买茶经验 / 积分 / 声望 / 熟练度 / 任务点 / 成就点 / 返金币。不要让玩家为奖励而买。
- 不把热门行情变成无限涨价；不升品质；不新增商城式商品列表/购物车/结算。

## 场景背景资源约定（2026-09-10 起，长期有效）
- **原始素材在仓库根 `background picture/`**（中文名 + 大小写扩展名混杂，如 `山路.png`、`老陈的茶馆0909.PNG`）。绑定前必须 `ls` 实际文件名，**不要猜**。
- 运行时资源在 `public/assets/scenes/*.webp`，由 `src/components/scenes/index.ts` 的 `SCENES[key].bg` 绑定（public 相对路径，经 `import.meta.env.BASE_URL` 解析）。渲染为 `.npc-scene-bg`：`object-fit: cover`；NPC 是独立 `z-index:2` 透明层（NpcPortrait），**替换背景不会把 NPC 合并进去**。
- 现有绑定：`teahouse`=开篇茶馆（`teahouse_opening.webp` ← 老陈的茶馆0909.PNG）、`teatable`=周伯品茶（`teahouse_new.webp` ← 老陈茶馆新.jpg；两者是同一茶馆不同视角，**不可互相替换**）、`mountain`（`mountain.webp` ← 山路.png）、garden/market/workshop/mothertree 各自对应。**旧 `teahouse.webp`（← 老陈茶馆.jpg）已于 2026-09-10 清理删除**（运行时只用 teahouse_opening / teahouse_new，无引用）。
- 规格：竖版约 934–1200 宽，webp，单张 130–570KB。
- **转换工具链**：`cwebp`/ImageMagick 均无；macOS `sips` 只能读 webp **不能写**。用托管 venv `/Users/lorilee/.workbuddy/binaries/python/envs/default/bin/python`（已装 Pillow）做缩放 + webp q82。
- xhs 版是「线性精简流」，bundle 不含 SCENES/NpcStage，故无场景背景路径——属预期，不是绑定失败。

## 部署约定（2026-09-10 起）
- 技术栈：Vite 5 + React 18 + TS + Zustand。**无客户端路由**（纯 Zustand `scene` 状态机）→ 刷新不会 404，**不需要** SPA 回退 / `_redirects` / history fallback。纯静态，无 fetch/后端接口。
- 部署构建一律用 **`npm run build:web`**（= `vite build --mode web --base=./`，产物 `dist`，相对路径 `./assets/...`）。**不要**用 `build:xhs`（那是小红书精简版，产物不同）。
- Cloudflare Pages：Framework preset = None（或 Vite）；Build command = `npm run build:web`；Build output = `dist`；Root directory 留空；Node = 20（`.nvmrc` 已加，CF 侧可再设 `NODE_VERSION=20`）；无必需环境变量。
- 存档：localStorage key `teaworld.save.v3`，有隐私模式降级；跨环境/换域名互不影响（存档按 origin 隔离）。
- Git：已 init，分支 `main`。**远端 = SSH**：`git@github.com:midori101lee-lang/tea-journey.git`（用户 2026-09-10 完成 SSH 配置）。**后续一律走 SSH，不得回退 HTTPS 认证方式；不要擅自修改 remote URL。**
- **本地端 vs 线上端（Cloudflare Pages）边界（2026-09-10 用户明确）**：
  - **本地端** = `/Users/lorilee/WorkBuddy/tea game`（全部源码 `src/`、`public/assets`、`package.json`、`vite.config.ts`、`.git`、本地 `node_modules/`、本地 `dist/`、及被 .gitignore 排除的三个原始素材目录 `background picture/`、`npc picture/`、`chaju picture/`）。这是编辑与 git 仓库所在地。
  - **线上端** = Cloudflare Pages 站点 `https://tea-journey.pages.dev`，它是 Cloudflare 在**每次 push 到 GitHub `main` 后**，用 `npm run build:web` 从源码**重新构建**的产物，**不是本地 `dist/`**。线上没有可手改的源文件。
  - **两端关系**：本地改动 **不**自动影响线上；只有 `git push` 到 GitHub `main` 触发 Cloudflare 重新构建部署后，线上才更新。本地 `dist/` 与线上是两套独立构建，**不要认为本地 build 成功 = 线上已更新**。
  - **更新完成判定**：必须确认 ① 代码已 `git push` 到 GitHub `main`；② Cloudflare 构建成功（控制台显示 Deployed / 或用 `tea-journey.pages.dev` 实测）。缺任一步都不得声称"GitHub 版本已更新"。
- **每次修改后流程（用户手动步骤）**：① WorkBuddy 改本地文件 → ② WorkBuddy 展示 `git status`/`diff` 供检查 → ③ **由用户手动** `git add` / `commit` / `push`（或明确授权 WorkBuddy 代提；不要默认自动 push）→ ④ Cloudflare 自动部署（约 1–2 分钟）→ ⑤ 用户去 `tea-journey.pages.dev` 验证。WorkBuddy 不替用户执行 push，除非用户当次明确说"帮我 push"。
- 注意 `public/assets/teaware` 约 25MB（未压缩原始 PNG），必要时再压缩为 webp（属视觉资源改动，别夹带进部署改动）。
