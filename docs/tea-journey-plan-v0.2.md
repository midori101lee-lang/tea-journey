# 《茶游记》产品升级方案 V0.2

版本：V0.2（待确认）
日期：2026-09-08
基线：docs/tea-world-mvp-plan.md（TeaWorld MVP v0.1）
性质：**升级与融合，不是推翻重来**

---

## 0. 一句话定位

> **《茶游记》是一场可以玩的中国茶山游历。**
> 中国每一座茶山，都有自己的故事。

玩家不是"完成制茶流程的用户"，而是一名**茶山游历者**：从一间茶馆开始，认识当地人，采茶、制茶、泡茶、逛集市、斗茶，然后在某句闲谈里听说——原来那边也产茶。

**长期动力的排序：探索欲 > 收集欲 > 成长欲 > 知识学习。**

---

# 1. 新产品定位：TeaWorld 如何升级成《茶游记》

原 TeaWorld 的表达式是：

```
制茶（主体）→ 顺便学两句茶知识
```

《茶游记》把它翻转成：

```
游历（主体）→ 在路上顺手做了一锅茶 → 这锅茶成为你在当地的身份与资源
```

这个翻转带来三个结构性变化：

| 维度 | TeaWorld v0.1 | 茶游记 v0.2 |
|---|---|---|
| 制茶是什么 | 游戏本体 | **进入茶世界的第一把钥匙**（第一个模块，不是全部） |
| 结果的去向 | 存进图鉴，页面结束 | **进入茶篓**，成为可泡/可送/可卖/可斗的资源 |
| 下一个目标从哪来 | 六类茶收集槽 | **从 NPC 闲谈里长出来的线索** |
| 玩家身份 | 做茶的人 | 在路上的人 |
| 故事的作用 | 装饰 | **驱动探索的燃料** |

一句话：**TeaWorld 是一个工具，《茶游记》是一个地方。**

---

# 2. 保留项（原方案直接沿用）

以下设计已经成熟，V0.2 **一字不改地保留**：

### 玩法层
1. **制茶五步骨架**：采摘 → 摊晾 → 杀青 → 揉捻 → 干燥（顺序、时长、单局 90–150 秒）
2. **各步交互方式**：点击/滑动连采、拖动摊匀、长按控火、画圈揉捻、控温干燥
3. **杀青的微型控制游戏**：按住升温 / 松手降温的惯性指针 + 安全温区 + 焦糊惩罚 + 青气条。这是全项目最好的一个玩法，原样保留
4. **叶片形态与颜色实时演进**：扁平→卷条、鲜绿→墨绿→褐斑，用 SVG 多形态图层交叉淡入
5. **每一步的即时反馈三层**：视觉 + 音效（WebAudio 合成）+ 触感
6. **兜底通道**「交给老师傅」（改名见下，但机制保留）

### 架构层
7. **Core / Shared UI / Platform 三层**，Core 禁止 import React 与 DOM
8. **数据驱动的配方流水线** `Recipe.steps: StepId[]` + `registerStep()` 注册表
9. **双端共用一份代码**，小红书端仅靠 Preact alias 与 feature flag 裁剪
10. **Vite 5 + TS + React 18 + Zustand + CSS Modules + CSS 变量 Token**
11. **全内联 SVG 美术、零位图、零音频文件**（WebAudio 合成）
12. **StorageAdapter + schema 版本号 + migrations**
13. **事件总线** `events.ts`
14. **移动端适配规范**：100dvh、pointer 事件、单手 thumb zone、`prefers-reduced-motion`
15. **动画技术分配表**：CSS 做 UI、SVG 做形态、Canvas 只做粒子

### 视觉层
16. 配色 Token（宣纸 / 墨色 / 竹青 / 嫩芽 / 汤色 / 朱砂 / 淡赭）
17. 字体方案（标题衬线、竖排标题、正文系统字体，不引外部字体）
18. UI 组件风格：宣纸签条按钮、竹节进度条、茶叶形星级、底部上滑纸条、竖版分享卡 + 朱印
19. **全站文案统一出口** `core/data/copy.ts`

---

# 3. 修改项（改什么，为什么）

| # | 原设计 | 改为 | 为什么 |
|---|---|---|---|
| M1 | 五维加权评分（采摘 15 / 摊晾 10 / 杀青 30 / 揉捻 20 / 干燥 25），输出 86 分 | **内部仍算分，但不展示数字**。对外只给：品质等级 + 一句自然语言评价 + 可售茶钱 | RPG 数值会让玩家进入"刷分"心智，与"游历"冲突。分还是要算的（程序需要），但它退居幕后 |
| M2 | 「五个工序都不会失败，只是表现不同」 | **制茶可以失败**（产出"废品"），但失败不阻断游戏 | 没有风险就没有手感。用户明确要求加入失败。代价控制为"消耗鲜叶"，而鲜叶可无限再采，所以永远不会卡死 |
| M3 | 首页 = 茶世界大地图（六个区域） | **改为轻量茶区地点列表**：茶馆 / 茶园 / 制茶坊 / 茶桌 / 集市(锁) | 大地图是茶区数量的函数。只有一座山时画大地图，是"为了形式牺牲内容" |
| M4 | 图鉴 = 六大茶类收集槽 | **改为《我的茶游记》手账**：按时间叙事的游记流，而非按类目归档的百科 | 打开手账应该感觉"这是我走过的地方"，不是"这是一本工具书" |
| M5 | 今日茶签（每天随机给一款茶） | **改为「今天山里做什么茶」**，由当前茶区 + NPC 决定，可自由选择（部分需熟练度解锁） | 随机签在游历语境下没有说服力；让茶区和当地人决定今天做什么，才像在路上 |
| M6 | 结果页 = 游戏终点 | **结果页 = 中点**。之后必须流向茶篓 → 泡茶/赠送 → NPC 评价 → 线索 | 制茶不再是终点，是循环的起点 |
| M7 | 「交给老师傅」兜底按钮 | 改名为「请岩伯代手」（NPC 化的兜底），结果固定为「普通」 | 兜底通道保留，但要用世界观语言包装，而不是 UI 术语 |
| M8 | 星级（五片小茶叶） | 保留组件，但**只用于展示本锅茶的四个维度手感**，不作为品质主指标 | 主指标改为文字等级，星级降级为"过程回顾" |

### M9 · 一个需要你拍板的工艺调整（重要）

**「摊晾」在武夷山岩茶配方中被替换为「做青（摇青）」。**

理由：武夷岩茶（肉桂 / 水仙 / 大红袍）的工艺是
`采摘 → 萎凋 → 做青（摇青+静置反复）→ 杀青 → 揉捻 → 炭焙`，
**没有"摊晾"这一步**，而"做青"恰恰是岩茶「岩骨花香」的来源——不做青的岩茶不是岩茶。

处理方式：
- 「摊晾」step 组件**不删除、不改写**，完整保留在组件库里，将来做西湖龙井时直接挂载
- 新增一个 `zuoyao`（做青）step 组件并注册进 `registerStep()`
- 武夷山配方：`picking → zuoyao → fixation → rolling → drying(炭焙)`
- 这正是配方数据驱动的价值：**换工序 = 改一行数组 + 加一个组件，不动任何已有代码**

做青的玩法：手机**摇一摇 / 快速左右滑动**摇动竹筛（摇青），然后**静置等待**（走水），交替 3 轮。摇得太狠 → 叶片破损死青；摇得不够 → 青气不散。这是手机上极有记忆点的交互，也是岩茶最有辨识度的一道工序。

> 如果你希望 MVP 保守一些，也可以第一版先用「摊晾」，把做青留到 V1.1。我倾向前者——既然第一章是武夷山，就该做像武夷山的事。

---

# 4. 新增项

## 4.1 世界层（World）

| 概念 | 说明 |
|---|---|
| **茶区 Region** | 一座茶山 = 一个 Region（武夷山 / 杭州 / 福州 / 潮州 ……）。含地点、NPC、茶叶、主题色、解锁条件 |
| **地点 Location** | 茶区内的可进入场景：茶馆、茶园、制茶坊、茶桌、集市、山道 |
| **茶区主题 Theme** | 每个 Region 携带一组 CSS 变量覆盖值。武夷山偏丹霞赭红，杭州偏西湖青绿 —— 换茶区时整站色调跟着变，成本极低，感知极强 |

## 4.2 人物层（NPC & Dialogue）

| 概念 | 说明 |
|---|---|
| **NPC** | 有 id、名字、身份、性格、头像 SVG、台词表 |
| **对话系统** | 极简：`first`（初见）/ `repeat`（再见）/ `when`（条件触发）。按 `visitCount` 与 `flags` 选段 |
| **NPC 记忆** | `npcMemory[npcId] = { met, visitCount, lastLineId, impression }`。让他"记得你昨天那锅做急了" |

**MVP 五位 NPC（武夷山）**

| NPC | 身份 | 性格 | 作用 |
|---|---|---|---|
| 老陈 | 茶馆老板 | 热情、见多识广 | 开场引导、熟练度反馈、售卖/收茶、给线索 |
| 阿秀 | 采茶人 | 熟练、爽快 | 茶园采茶、讲山场差异 |
| 岩伯 | 老制茶师 | 话少、嘴硬 | 制茶坊主持、关键节点插话、兜底代手 |
| 周伯 | 老茶客 | 爱点评，嘴毒但准 | 茶桌品评你的茶，制造幽默与人情味 |
| 林姑娘 | 游历茶客（杭州人） | 好奇、爱聊外地 | **提供下一座茶山的线索**（杭州） |

（后续可加：景区茶商、讨茶人——用于表现"景区茶为什么贵"这类现实幽默）

## 4.3 资源层（Inventory & Economy）

| 概念 | 说明 |
|---|---|
| **茶篓（背包）** | `TeaStack { teaId, grade, count, value }`，按 茶种+品质 堆叠。真正的资源容器 |
| **茶钱** | 单一货币。来源：卖茶、赠送回礼、斗茶。用途：买鲜叶/茶具/茶种、付茶资 |
| **鲜叶** | 制茶的门票。茶园可无限采（一局约 30 秒），因此**失败永远不会卡死玩家** |
| **熟练度** | 单一数值，不拆分。四档文字表现：`手生 → 渐入佳境 → 得心应手 → 山里有名的手艺人`。效果：容错率↑、高品质概率↑、解锁对话与线索 |

## 4.4 驱动层（探索的核心）

| 概念 | 说明 |
|---|---|
| **线索 Clue** | `{ id, targetRegionId, text, source }`。来自 NPC 闲谈、茶叶、漫画、事件 |
| **解锁条件 UnlockCondition** | **声明式条件树**（见第 7 节），纯函数求值，可测试、可扩展 |
| **主动出发** | 线索集齐后不会自动弹窗解锁，而是 NPC 问一句「想不想出去走走？」——**解锁由玩家主动触发** |

> 这是整个设计里最重要的一条：**下一座茶山不是任务奖励，是好奇心兑现。**

## 4.5 记录层（Journal & Comic）

| 概念 | 说明 |
|---|---|
| **茶游记手账** | 按时间倒序的游记流：去过哪、做过什么茶、最好成绩、遇见过谁、听过什么传闻 |
| **漫画 Comic** | 2–4 格，三类：制茶知识 / 地域知识 / 人物故事。由玩过什么解锁，不是独立入口 |

## 4.6 未来模块接口（MVP 只留接口）

| 模块 | 预留方式 | 计划版本 |
|---|---|---|
| 泡茶 | `core/brew/`，同为 recipe 驱动；复用盖碗/公道杯素材 | MVP 做简化版 |
| 集市 | `core/market/`：商品表、商人、价格事件；读 `Tea`/`coins` | V1.2 |
| 斗茶 | `core/battle/`：输入 `TeaStack[]`，输出茶钱/声望/线索 | V1.3 |
| 茶馆副本「七日茶馆」 | `core/events/sevenDays/`：独立的 7 天状态机 | V2 |

---

# 5. MVP 范围

> **第一版只做「武夷山第一日」。**

```
茶馆开场
 ↓ 老陈递一杯茶
认识茶馆老板
 ↓ "光喝有什么意思？要不要自己做一锅？"
进入茶园（阿秀）
 ↓ 选茶：肉桂 / 水仙 / 大红袍(需熟练度)
采茶
 ↓ 获得鲜叶
制茶坊（岩伯）
 ↓ 做青 → 杀青 → 揉捻 → 炭焙
获得 肉桂 / 水仙 / 大红袍 之一（含失败可能）
 ↓
茶叶进入茶篓
 ↓
茶桌：简单泡茶（温杯→投茶→注水→出汤）
 ↓
周伯点评 + 老陈熟练度反馈
 ↓
游历茶客出现 → 获得下一座茶山的线索
```

### MVP 明确包含
- 一个茶区：武夷山（5 个地点，其中集市锁定）
- 三款茶：肉桂、水仙、大红袍
- 五位 NPC，各 2–3 段对话（按访问次数切换）
- 制茶五步（含做青替换、含失败机制）
- 简化泡茶（4 步）
- 茶篓、茶钱、熟练度
- 线索系统（3 条，指向杭州）
- 茶游记手账（最小版：去过的地方 / 做过的茶 / 遇见的人）
- 结果分享卡（小红书端核心）
- 漫画：接口 + 4 张占位（1 张制茶知识 + 1 张地域知识 + 2 张人物）

### MVP 明确不做
- 中国地图 / 多茶区切换（仅预告"下一站：杭州"）
- 集市、斗茶、七日茶馆
- 完整 NPC 好感度系统
- 云存档
- 任意形式的数值商城

---

# 6. 产品信息架构

## 6.1 页面结构

```
《茶游记》
└── 开场（首次进入：竖排标题 + 武夷山淡彩剪影 + 「第一站 · 武夷山」）
    │
    └── 武夷山（茶区界面，非大地图，是一张可点的地点卡片列表）
        │
        ├── 🏮 茶馆       老陈 · 林姑娘 · 周伯
        │                 开场 / 喝茶 / 卖茶 / 赠送 / 听闲话 / 熟练度
        │
        ├── 🌱 茶园       阿秀
        │                 采茶小游戏 → 获得鲜叶
        │
        ├── 🔥 制茶坊     岩伯
        │                 做青 → 杀青 → 揉捻 → 炭焙 → 结果
        │
        ├── 🫖 茶桌       周伯
        │                 泡茶（温杯/投茶/注水/出汤）→ NPC 点评
        │
        └── 🏮 集市       🔒 锁定（V1.2）
        │
        └── 🧭 山道       🔒 锁定（集齐线索后开放 → 下一站：杭州）
    │
    └── 常驻底部栏
        ├── 🎒 茶篓
        ├── 💰 茶钱
        └── 📖 我的茶游记
```

**注意**：这不是一个"首页菜单"，是**一个茶区里的五个地方**。玩家在地点之间来回走，才是游历。

## 6.2 玩家状态结构

```
玩家
├── 🎒 茶篓（茶叶背包）
│     └── 肉桂·上品 ×2 / 水仙·良好 ×1 / 大红袍·普通 ×1
├── 💰 茶钱
├── 🖐 制茶熟练度（手生 → 渐入佳境 → 得心应手 → 山里有名的手艺人）
├── 📖 茶游记（手账）
│     ├── 去过的地方
│     ├── 做过的茶（最好的一锅）
│     ├── 遇见的人
│     ├── 听来的传闻（线索）
│     └── 看过的漫画
└── 🗺 已解锁茶区：武夷山（已解锁） / 杭州（线索 0/3，锁定）
```

---

# 7. Core 数据结构（建议）

> 全部为纯 TS 类型，放 `src/core/types.ts` 与 `src/core/**`，不含任何 UI 依赖。

```ts
// ─────────── 基础枚举 ───────────
type Grade = 'waste' | 'normal' | 'good' | 'fine' | 'supreme';
//            废品      普通      良好    上品     神品（隐藏彩蛋）

type StepId = 'picking' | 'withering' | 'zuoyao' | 'fixation' | 'rolling' | 'drying';
type LocationKind = 'teahouse' | 'garden' | 'workshop' | 'teatable' | 'market' | 'road';

// ─────────── 茶叶 ───────────
interface Tea {
  id: 'rougui' | 'shuixian' | 'dahongpao';
  name: string;
  category: 'yancha';                 // 未来：green / white / oolong / black / dark
  regionId: string;
  basePrice: number;                  // 普通品的基准茶钱
  difficulty: 1 | 2 | 3;              // 影响容错窗口
  recipeId: string;
  flavor: { aroma: string[]; taste: string[]; note: string };
  art: { leaf: string; dry: string; liquor: string };   // SVG 组件 key
  brief: string;                      // 一句人话介绍，不是百科
}

// ─────────── 工艺配方 ───────────
interface ProcessingRecipe {
  id: string;
  teaId: string;
  steps: StepId[];                    // ★ 数据驱动的核心
  params: Record<StepId, StepParams>; // 温区/时长/圈数/容错
  casual?: Partial<Record<StepId, StepParams>>;  // 小红书档
}

interface StepParams {
  durationMs?: number;
  safeBand?: [number, number];
  dangerLine?: number;
  targetValue?: number;
  tolerance?: number;                 // 受熟练度影响
  [k: string]: unknown;
}

// ─────────── 制茶结果 ───────────
interface StepOutcome {              // 每步的产出（内部）
  step: StepId;
  score: number;                     // 0–100，仅内部使用
  fault?: FaultTag;                  // 'burnt' | 'broken' | 'green' | 'stale' …
  comment: string;
}

interface ProcessingResult {         // 对外的结果
  teaId: string;
  grade: Grade;
  gradeLabel: string;                // 上品 / 良好 / 普通 / 废品
  comment: string;                   // 一句自然语言评价
  value: number;                     // 可售茶钱（废品极低）
  faults: FaultTag[];
  visuals: { dryColor: string; shape: 'flat' | 'curled' | 'broken'; sheen: number };
  comicUnlockId?: string;            // 顺手解锁的漫画
  madeAt: string;
}

// ─────────── 茶篓 / 背包 ───────────
interface TeaStack {
  id: string;
  teaId: string;
  grade: Grade;
  count: number;
  unitValue: number;
  firstMadeAt: string;
}
interface Inventory { stacks: TeaStack[]; }

// ─────────── 玩家 ───────────
interface Player {
  name: string;
  coins: number;
  proficiency: number;                 // 0–100，单一数值
  proficiencyLabel: string;            // 文字档位，UI 只显示这个
  inventory: Inventory;
  freshLeaves: Record<string, number>; // teaId → 份数（制茶门票）
  currentRegionId: string;
  unlockedRegionIds: string[];
  npcMemory: Record<string, NpcMemory>;
  flags: Record<string, boolean | number>;
  journal: TravelJournal;
  draft: MakingDraft | null;
}

interface NpcMemory {
  met: boolean;
  visitCount: number;
  lastDialogueId?: string;
  impression: number;                  // -2 ~ +2，仅影响台词选择，不显示为数值
  giftedTeaIds?: string[];
}

// ─────────── 茶区 / 地点 ───────────
interface Region {
  id: string;
  name: string;
  province: string;
  subtitle: string;                    // 「岩骨花香」
  intro: string;
  theme: Partial<ThemeTokens>;         // ★ 换茶区即换色调
  art: { silhouette: string; bg: string };
  locationIds: string[];
  teaIds: string[];
  npcIds: string[];
  unlock: UnlockCondition;
  order: number;
}

interface Location {
  id: string;
  regionId: string;
  name: string;                        // 茶馆 / 茶园 / 制茶坊 / 茶桌 / 集市
  kind: LocationKind;
  icon: string;
  npcIds: string[];
  actions: LocationAction[];           // 数据驱动的可执行行为
  unlock?: UnlockCondition;
  lockedHint?: string;
}

interface LocationAction {
  id: string;
  label: string;
  type: 'dialogue' | 'minigame' | 'brew' | 'shop' | 'travel';
  payload: Record<string, unknown>;
  unlock?: UnlockCondition;
}

// ─────────── NPC / 对话 ───────────
interface Npc {
  id: string;
  name: string;
  role: string;                        // 茶馆老板
  regionId: string;
  personality: string;                 // 写给自己看的，保证语气一致
  avatar: string;                      // SVG key
  dialogues: {
    first: DialogueLine[];
    repeat: DialogueLine[];
    conditional?: { when: UnlockCondition; lines: DialogueLine[] }[];
  };
}

interface DialogueLine {
  id: string;
  who: string;
  text: string;
  mood?: 'idle' | 'happy' | 'serious' | 'tease';
  giveClueId?: string;                 // ★ 台词即线索来源
  setFlag?: [string, boolean];
}

// ─────────── 线索与解锁 ───────────
interface Clue {
  id: string;
  targetRegionId: string;
  text: string;                        // 「听说杭州那边，做茶不用摇青。」
  source: { type: 'npc' | 'tea' | 'comic' | 'event'; id: string };
  obtainedAt?: string;
}

type UnlockCondition =
  | { type: 'always' }
  | { type: 'flag'; flag: string }
  | { type: 'proficiency'; min: number }
  | { type: 'clues'; regionId: string; count: number }
  | { type: 'teaMade'; teaId?: string; minGrade?: Grade; count?: number }
  | { type: 'coins'; min: number }
  | { type: 'npcMet'; npcId: string }
  | { type: 'and'; all: UnlockCondition[] }
  | { type: 'or'; any: UnlockCondition[] };

// isUnlocked(cond, player, world) → boolean   纯函数，可单测

// ─────────── 手账 ───────────
interface TravelJournal {
  entries: JournalEntry[];             // ★ 按时间倒序的一条流，不是分类表格
  comics: string[];
  stats: { totalMade: number; bestGrade: Record<string, Grade>; daysPlayed: number };
}

interface JournalEntry {
  id: string;
  at: string;
  kind: 'region' | 'tea' | 'npc' | 'clue' | 'comic' | 'event';
  refId: string;
  title: string;
  note: string;                        // 一句带情绪的记录，不是数据
}

// ─────────── 漫画 ───────────
interface Comic {
  id: string;
  title: string;
  category: 'making' | 'region' | 'people';
  panels: ComicPanel[];                // 2–4 格
  caption: string;
  unlock: UnlockCondition;
}
interface ComicPanel {
  art: string;                         // SVG key
  text?: string;
}
```

---

# 8. 第一章：武夷山第一日（可直接进入开发）

> 目标时长：首次 8–10 分钟（含引导）；后续每次访问 2–4 分钟。
> 首次进入的引导**藏在对话里**，不出现任何"教程"字样。

## 场景 0 · 开场

竖排标题《茶游记》，淡彩武夷山剪影（丹霞赤壁 + 九曲溪 + 岩间茶树）淡入。

```
      第 一 站
      武 夷 山
   「岩骨花香」
        ↓
    [ 进 山 ]
```

## 场景 1 · 茶馆（老陈）

**首次进入**，老陈站在柜台后，桌上有一只盖碗。

```
老陈：「第一次来武夷山？」
   　　「先喝一杯。喝了再说。」
```

**互动：喝一杯茶**（点击盖碗 → 揭盖 → 热气升 → 分汤 → 茶汤色出现）
点击后浮出一张小签：`汤色橙黄明亮 · 有一股火香`

```
老陈：「这是我们这儿的肉桂。」
　    「你喝着怎么样？」

  [ 有点冲 ]      [ 挺香 ]
   （都给同一句回应，只是语气不同 —— 不设对错）

老陈：「岩茶就这样，头一口不讨好人。」
　    「光喝有什么意思？要不要自己做一锅？」
　    「后山茶园，找阿秀。」
　    → 解锁「茶园」，底部提示「去茶园看看」
```

> 这里是全作第一句台词，也是玩家对这个世界的第一印象。不做教程，做的是"被递了一杯茶"。

## 场景 2 · 茶园（阿秀）

```
阿秀：「来啦。今天想做哪个？」
```

三张茶叶卡并排（点击展开一句人话介绍）：

| 茶 | 一句话 | 状态 |
|---|---|---|
| 🌿 肉桂 | 「性子烈，火候最要紧。」 | 可选 |
| 🌿 水仙 | 「温和，新手不容易做坏。」 | 可选 |
| 🌿 大红袍 | 「不是一种树，是一手的功夫。」 | 🔒 熟练度 ≥ 30 |

选完 → 进入**采茶小游戏**（沿用 v0.1 设计：点击/滑动连采、抛物入篓、嫩芽率影响品质）

```
阿秀（采完后）：「够了。这山场长出来的，脾气跟别处不一样。」
→ 获得：鲜叶 ×1
→ 手账新增：遇见了阿秀
```

## 场景 3 · 制茶坊（岩伯）

```
岩伯：（看了你一眼）
　    「火这东西，急不得。」
```

**NPC 插话机制**（这是让制茶"活起来"的关键）：岩伯会在节点说话，且**内容依赖你的实时表现**：

| 时机 | 表现好 | 表现差 |
|---|---|---|
| 做青 第 2 轮 | 「嗯，走水了。」 | 「别停，接着摇。」 |
| 杀青 温区外 | — | 「火小了。」/「过了！」 |
| 杀青 焦糊 | — | 「糊了。」（只两个字，最狠） |
| 揉捻 过重 | — | 「轻点，那是茶叶不是面团。」 |
| 炭焙 完成 | 「还行。」（= 他最高的赞美） | 「下次早点收。」 |

**制茶流程**（武夷山岩茶配方）：

```
① 做青（摇青 + 静置 ×3 轮）   ~40s
② 杀青（长按控火）            ~30s
③ 揉捻（画圈成条）            ~25s
④ 炭焙（控温慢烘）            ~30s
```

**结果呈现**（不再是分数）：

```
      【武夷岩茶 · 肉桂】

           上 品

   火候拿捏得不错，桂皮香已经出来了。

        可售：38 茶钱

      🎒 已收入茶篓
```

失败时：

```
      【武夷岩茶 · 肉桂】

           废 品

   火太急了，这锅……还是留着自己喝吧。

        可售：3 茶钱

   （消耗鲜叶 ×1，茶园可以再去）
```

## 场景 4 · 茶桌（周伯）

**简化泡茶**（4 步轻交互，MVP 版）：

```
温杯 → 投茶 → 注水 → 出汤
```

- 注水：**水温**影响（岩茶要沸水）
- 出汤：**时机**影响（早了淡，晚了涩），用一个"汤色由浅到深"的可视条，玩家自己决定何时出汤

周伯点评（按品质分支，带幽默）：

| 品质 | 周伯的话 |
|---|---|
| 上品 | 「哟，这不是本地人做的吧？……你做的？那我再喝一杯。」 |
| 良好 | 「能喝。搁我年轻时候，这叫及格。」 |
| 普通 | 「……茶是茶，就是没什么话说。」 |
| 废品 | 「这锅茶，适合用来招待讨厌的人。」 |

→ 熟练度 +（做成 +3，上品额外 +2，失败 +1——**失败也有成长，鼓励继续**）

## 场景 5 · 回到茶馆（收尾）

```
老陈：「今天第一锅，做成这样，可以了。」
　    （熟练度提升：手生 → 渐入佳境）

老陈：「要不，把这茶留店里？38 茶钱。」
  [ 卖掉 ]     [ 留着自己喝 ]
```

**若选择卖掉** → 茶钱 +38，手账记一笔。
**若选择留下** → 后续可赠送 NPC 换线索。

> 无论选哪个都给正反馈，不做"最优解"设计。这是"认真做茶，但不端着"。

## 场景 6 · 线索（第一日结尾）

```
林姑娘（坐在角落，外地口音）：
　　「老板，你这茶……和我老家的不是一个路子。」
老陈：「这位是杭州来的。」
林姑娘：「我们那边做茶，不摇青，是炒的。」
　　「一片叶子，杀青一把就定了性。」
　　（顿了顿）
　　「有机会，你去看看？」

      📜 获得线索：杭州 · 西湖龙井    （1/3）
```

另外两条线索的来源（MVP 内）：

| # | 来源 | 场景 |
|---|---|---|
| 2 | 周伯闲谈 | 茶桌上「凤凰单丛，光香型就上百种，吵了几十年」→ 潮州 |
| 3 | 漫画《一片叶子为什么要揉？》看完后 | 老陈「安溪那边做茶，又是另一套」→ 安溪 |

集齐 3 条 → 山道解锁：

```
老陈：「听说你要走了？」
　    （去杭州的路，我给你问好了。）

   [ 出发去杭州 ]     [ 再待一天 ]
```

> 「再待一天」永远可选。不去不会被惩罚，只是山还在那儿 —— 这是《茶游记》的气质。

**第一日收束** → 手账自动写入：

```
第一日 · 武夷山
到过：茶馆、茶园、制茶坊、茶桌
做了：肉桂 · 上品
遇见：老陈、阿秀、岩伯、周伯、林姑娘
听来：杭州做茶不摇青（1/3）
```

---

# 9. 双平台架构

## 9.1 共享什么（≥85%）

```
Core（一份，零分支）
├── tea data       茶叶谱
├── region data    茶区与地点
├── NPC data       NPC 与对话
├── recipe data    工艺配方（含 casual/standard 双档参数）
├── processing     制茶逻辑与评分（内部分数 → 品质等级）
├── brewing        泡茶逻辑
├── inventory      茶篓
├── player state   玩家状态与熟练度
├── unlock system  线索与解锁条件求值
├── achievement    成就
├── journal        手账
└── collection     漫画收集

Shared UI（一份，零分支）
├── UI 组件        宣纸按钮 / 纸条 / 竹节进度 / 茶叶星级 / 印章
├── 制茶工序组件    做青 / 杀青 / 揉捻 / 炭焙（+ 保留的摊晾）
├── 泡茶组件
├── NPC 组件       DialogueBox / NpcAvatar
├── 茶叶卡片 / 茶篓条目 / 线索便签 / 手账页 / 漫画条
├── 全部 SVG 美术
└── 手感 hooks + WebAudio 音效
```

## 9.2 平台差异（只有这些分叉）

| 维度 | GitHub Pages | 小红书 |
|---|---|---|
| 进入方式 | 开场 → 武夷山茶区界面（5 个地点可走） | 一句话首屏 → 「今天做一锅」→ 直接进制茶 |
| 地点导航 | ✅ 有（茶馆/茶园/制茶坊/茶桌） | ❌ 无，线性流：选茶 → 采 → 制 → 结果 |
| NPC | 完整对话（含 repeat/conditional） | **压缩为单句提示卡**（岩伯的一句提醒 + 周伯的一句点评） |
| 泡茶 | 完整 4 步交互 | 保留，但合并为 2 步（投茶注水 → 出汤） |
| 手账 | 完整游记流 + 人物 + 传闻 + 漫画 | 「我的茶篓」+ 已解锁茶区进度 + 最近一锅 |
| 线索系统 | ✅ 完整（收集 → 山道 → 下一站） | ✅ 保留但简化为「下一站线索 n/3」的小签 |
| 分享 | 结果卡 PNG | **结果卡 PNG 为第一优先级**（竖版 3:4，含茶区名与朱印） |
| 时长 | 首次 8–10 分钟 | ≤ 90 秒一锅 |
| 难度参数 | `standard` | `casual`（温区更宽、圈数更少、失败阈值更松） |
| 运行时 | React 18 | Preact alias |

**依然绝对禁止**：平台差异用 feature flag + 同一份 `params` 双档实现，代码里不出现散落的 `if (isXhs)`。

## 9.3 目录增量（在 v0.1 基础上加，不推倒）

```
src/core/
├── data/
│   ├── regions/wuyishan.ts      ← 新增（未来 hangzhou.ts、chaozhou.ts）
│   ├── teas/rougui.ts shuixian.ts dahongpao.ts
│   ├── npcs/wuyishan.ts
│   ├── recipes.ts  knowledge.ts  copy.ts
├── world/        ← 新增：region.ts location.ts unlock.ts clue.ts theme.ts
├── npc/          ← 新增：dialogue.ts npcMemory.ts
├── inventory/    ← 新增：basket.ts coins.ts freshLeaf.ts
├── player/       ← 新增：player.ts proficiency.ts
├── journal/      ← 新增：journal.ts comic.ts
├── making/       ← 保留（steps 增加 zuoyao.ts）
├── brew/         ← 新增（MVP 简化版）
├── market/ battle/ events/  ← V1.2+ 预留空目录 + 类型
└── events.ts     ← 扩展事件：TEA_FINISHED / CLUE_FOUND / REGION_UNLOCKED / NPC_MET

src/features/     ← 新增 world/ npc/ inventory/ journal/ comic/
src/components/   ← 新增 DialogueBox NpcAvatar LocationCard TeaBasketItem
                          CoinBadge ClueNote JournalPage ComicStrip
```

---

# 10. 开发优先级

## P0 · 必须做（MVP 的骨头）

| # | 任务 |
|---|---|
| P0-1 | Core 类型全量定义（第 7 节全部接口） |
| P0-2 | 武夷山茶区数据：Region + 5 个 Location + 3 款 Tea + 5 位 NPC |
| P0-3 | 玩家状态：茶篓 / 茶钱 / 熟练度 / 鲜叶 / NPC 记忆 |
| P0-4 | 制茶四步（做青 / 杀青 / 揉捻 / 炭焙）+ 失败机制 + 品质等级输出 |
| P0-5 | 制茶坊场景 + MakingFlow 数据驱动（recipe.steps） |
| P0-6 | 采茶小游戏 + 茶园场景 |
| P0-7 | 对话系统：DialogueBox + NpcAvatar + 按 visitCount 切段 |
| P0-8 | 茶馆开场（递一杯茶 → 引导去茶园） |
| P0-9 | 存储层 v2（schema 版本 + 迁移 + 隐私模式降级） |

## P1 · 建议做（让第一日完整）

| # | 任务 |
|---|---|
| P1-1 | 简化泡茶（4 步）+ 茶桌场景 |
| P1-2 | 周伯点评分支（按品质 4 套台词） |
| P1-3 | 线索系统 + 3 条线索 + 山道解锁 |
| P1-4 | 茶篓 UI + 卖茶 / 留着选择 |
| P1-5 | 茶游记手账（最小版游记流） |
| P1-6 | 熟练度表现（容错率 / NPC 语气变化） |
| P1-7 | 结果分享卡 PNG 导出 |
| P1-8 | 小红书端线性流 + casual 参数 + Preact 构建 |
| P1-9 | 武夷山主题色（丹霞赭红）覆盖 |

## P2 · 以后做（明确留到后续版本）

| # | 任务 | 版本 |
|---|---|---|
| P2-1 | 第二座茶山：杭州（西湖龙井 / 九曲红梅） | V1.1 |
| P2-2 | 正式漫画内容（4 张以上） | V1.1 |
| P2-3 | 中国茶山地图（茶区 ≥3 时才做） | V1.1 |
| P2-4 | 完整泡茶（水温/器具/多泡） | V1.2 |
| P2-5 | 集市：买卖、商人、价格事件 | V1.2 |
| P2-6 | 斗茶 | V1.3 |
| P2-7 | 七日茶馆副本 | V2 |
| P2-8 | 福州（茉莉花茶）/ 潮州（凤凰单丛）/ 安溪 / 福鼎 / 云南 | V1.1+ |
| P2-9 | 云存档 | TBD |

---

# 11. 视觉补充（在 v0.1 基础上）

保留 v0.1 全部视觉基础，新增三件事：

1. **茶区主题色机制**：`Region.theme` 覆盖 CSS 变量。武夷山用丹霞赭红 `#A85B3C` 与岩骨灰 `#5A5750` 作为点缀色，纸底与墨色不变 → 换山如换季，成本近乎为零。
2. **新增美术清单**：丹霞赤壁剪影、九曲溪、茶树丛（岩茶老丛）、木质茶馆内景、制茶坊（焙笼/摇青筛）、盖碗与公道杯、五位 NPC 头像（手绘淡彩，Q 版偏写实之间）、三种干茶插画。
3. **生产方式约束**：优先"小场景 + 头像 + 卡片 + UI"，不投入超大地图。目标是**统一、有辨识度、可持续生产**，不是商业游戏级画面。

---

# 12. 待确认（确认后进入编码）

1. **M9 工艺调整**：武夷山岩茶是否用「做青（摇青）」替换「摊晾」？（我建议是）
2. **失败惩罚力度**：当前方案是只消耗鲜叶（可无限再采），是否还要加"少量茶钱"？
3. **熟练度是否显示数字**：建议只显示文字档位（手生 / 渐入佳境 / …），不显示 0–100。
4. **MVP 结局**：集齐 3 条线索后，是"出现下一站预告但锁定"（推荐，MVP 闭环完整），还是直接开放杭州？
5. **存档**：继续用 localStorage（MVP），云存档留到 TBD？
