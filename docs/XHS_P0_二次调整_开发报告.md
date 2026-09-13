# 《茶游记》XHS 版 P0 二次调整 · 开发报告

> 范围：在已交付的 XHS P0（固定 casual + 三分享节点）基础上做**最小改动、不推翻架构**的两项产品决策调整。
> 核心原则：**Shared Core + XHS 外壳**——玩法核心 Web/XHS 共用，分享能力属 XHS 增强。
> 构建：`vite --mode xhs` / `--mode web`，`import.meta.env.MODE === 'xhs'` 即「运行在小红书外壳」的可靠信号。

---

## ① XHS / Web 难度一致性

### 结论
**已删除** `XhsApp.tsx` 中强制 casual 的副作用，`XHS` 现与 `Web` 完全一致——两者都使用 store 默认难度 `standard`，不做任何平台降难度。

### 改动
- 删除 `src/app/XhsApp.tsx` 中的：
  ```tsx
  const setDifficulty = useGame((s) => s.setDifficulty);
  useEffect(() => { setDifficulty('casual'); }, [setDifficulty]); // ← 已删除
  ```
- 保留系统返回键拦截（`popstate` → `store.back()`）与 `<WebApp /><DayIntro /><Toast />` 渲染。
- 难度数据来源：`WebApp` 从 `useGame()` 读取 `difficulty`（store 默认值 `'standard'`，且 `difficulty` 不持久化，每次加载回默认），并透传给 `BrewingFlow difficulty={difficulty}`。`XHS` 与 `Web` 走同一套，故两者 `casual` 分支（泡茶 +6 分、计时放慢）同时关闭。
- **未新增**任何 XHS 专属难度选择 UI；沿用 Web 既有机制，不散落平台分支。

### 效果验证
- `WebApp` 读 `difficulty`（`WebApp.tsx:39`）→ 传 `BrewingFlow`（`WebApp.tsx:187`）。
- store 默认 `difficulty: 'standard'`（`gameStore.ts`），`XhsApp` 不再覆盖 → XHS 继承 `'standard'`，与 Web 等价。
- XHS dev server 实测 `import.meta.env.MODE === 'xhs'`，`IS_XHS=true`，难度判定不受影响。

---

## ② 分享机制实现（制茶 / 泡茶 / 茶席三节点）

复用现有评价数据，**不新建评价系统**；三个入口均 `IS_XHS` 门控、可选、不阻断主线。

### 公共件
- `src/core/platform.ts`：`export const IS_XHS = import.meta.env.MODE === 'xhs';`（平台差异唯一来源，业务判断不散落平台分支）。
- `src/components/ShareSheet.tsx`：截图友好的分享卡 + 分享动作。
  - 有 `navigator.share`：调用并以其 `Promise` 解析为成功依据；
  - 无 share API：展示明细 + 「我已发布」手动确认按钮。
  - 成功回调 `onConfirm()`（内部调 `grantShareReward`）+ 关闭。
- `src/styles/base.css`：新增 `.share-sheet / .share-card / .share-line` 等样式，复用现有主题变量，视觉不额外复杂。

### 三处入口
| 节点 | 文件 | 触发时机 | payload.kind | 复用数据 |
|---|---|---|---|---|
| 制茶结果 | `ResultView.tsx` | 结果页「分享制茶结果」按钮 | `making` | `lastResult`：茶名、`GRADE_LABEL[grade]`、`comment`、`roastLevel`、熟练度 |
| 泡茶结果 | `WebApp.tsx`（teatable / hz-teatable） | 周伯点评展示区「分享泡茶结果」按钮 | `brewing` | `lastResult` + `zhouBoAdvice.comment/suggestion` |
| 茶席 | `TeaSeatView.tsx` | 茶席结束页「分享茶席」按钮 | `teaseat` | 当前茶席：地区 / 所选茶 `GRADE_LABEL` / 同饮 NPC |

每处点击均 `setSharePayload(...)` → 渲染 `<ShareSheet>` → 用户走分享/发帖流程 → 成功 → `grantShareReward(kind)`。

---

## ③ 发帖成功判断（平台能力限制）

### 现状与结论
当前 XHS 以 **webview** 运行、无小红书 JSbridge，`navigator.share` **无法可靠回传「已成功发帖」** 的确认信号。

因此本版本采取「**先做卡 + 入口 + 奖励接口 + 防重复数据结构，暂不发钱、不伪造回调**」策略：
- 分享卡、三入口、`grantShareReward`、防刷字段（`player.shareRewardDate`）**全部落地可用**；
- 发钱受 `SHARE_PAYOUT_ENABLED` 控制，当前置 `false`——只记录防刷日期，**不发茶钱、不伪造平台回调**。

### 后续接入
待接入 XHS 平台发帖确认能力后，仅需将 `gameStore.ts` 中 `const SHARE_PAYOUT_ENABLED = false` 改为 `true`，**其余逻辑无需改动**即可启用 +20 茶钱。

---

## ④ 茶钱奖励规则

| 项 | 规则 |
|---|---|
| 奖励额度 | 玩家**每日第一次**成功分享（making / brewing / teaseat **任意一种**）即 **+20 茶钱** |
| 每日上限 | 每天仅首次分享发钱 → 最多 **20 茶钱 / 天** |
| 防重刷 | `player.shareRewardDate: string`（YYYY-MM-DD）记录当日是否已领；同日已领则 `grantShareReward` 返回 `false`，不重复触发 |
| 不发钱条件 | 点击分享 ≠ 发钱；必须走完「分享 → 发帖流程 → 成功发布 → 确认」才落奖；当前平台无法确认发帖，`SHARE_PAYOUT_ENABLED=false`，仅记录 |
| 旧档兼容 | `migrate()` 中删除旧 `shareRewards` 结构（`delete player.shareRewards`），新档以 `shareRewardDate` 单字段记录，避免脏字段残留 |

> 注：原 P0 设计为「每类各一次 / 每日 60 上限」，本次验收已简化为「每日一次 / 20 上限」——逻辑更轻、不易刷，且旧档 `shareRewards` 经 `migrate` 安全丢弃。

`grantShareReward` 实现要点（`gameStore.ts`）：
```ts
grantShareReward: (type) => {            // type 仅用于未来平台回调日志，不用于判重
  const { player } = get();
  const today = new Date().toISOString().slice(0, 10);
  if (player.shareRewardDate === today) return false;   // 今日已领每日分享奖励，防重复刷
  const next: Player = {
    ...player,
    shareRewardDate: today,
    coins: SHARE_PAYOUT_ENABLED ? Math.max(0, player.coins + SHARE_REWARD_AMOUNT) : player.coins,
  };
  persist(next); set({ player: next });
  return SHARE_PAYOUT_ENABLED;
}
```

`Web` 版**不改动**：分享入口 `IS_XHS` 门控，Web 下根本不渲染；奖励经现有 `gameStore`/`addCoins` 机制接入，未复制 inventory/store，未改 Web 茶钱经济。

---

## ⑤ 修改 / 新增文件清单

### 删除的强制逻辑
- `src/app/XhsApp.tsx`：移除 `setDifficulty('casual')` 副作用及 `setDifficulty` 引用。

### 研判后**保留**的修改（非机械恢复）
- `src/store/gameStore.ts`：`iron_palm` 隐藏成就**未恢复** `difficulty === 'standard'` 条件（详见下文「iron_palm 研判」）。

### 新增文件
- `src/core/platform.ts`：`IS_XHS` 平台信号。
- `src/components/ShareSheet.tsx`：可复用分享卡组件 + 分享动作 + 成功回调。

### 修改文件
- `src/core/types.ts`：`Player` 字段由 `shareRewards?: { making?; brewing?; teaseat? }` 简化为 `shareRewardDate?: string`（每日分享奖励日期）。
- `src/core/storage/storage.ts`：`migrate()` 删除旧档残留 `shareRewards`（安全丢弃，不回填）；新档以 `defaultPlayer()` 默认 `shareRewardDate` 缺省兼容。
- `src/store/gameStore.ts`：新增 `SHARE_PAYOUT_ENABLED` / `SHARE_REWARD_AMOUNT` 常量、`grantShareReward` 接口与实现；更新 `iron_palm` 注释。
- `src/features/result/ResultView.tsx`：制茶结果页「分享制茶结果」入口 + `<ShareSheet>`。
- `src/app/WebApp.tsx`：teatable / hz-teatable 周伯点评区「分享泡茶结果」入口 + `brewSharePayload` + `<ShareSheet>`。
- `src/features/teaseat/TeaSeatView.tsx`：茶席结束页「分享茶席」入口 + `teaseatSharePayload` + `<ShareSheet>`。
- `src/styles/base.css`：分享卡样式。

---

## ⑥ 测试结果

| 验证项 | 方法 | 结果 |
|---|---|---|
| TypeScript 类型检查 | `npm run typecheck` | ✅ 通过（全量，含三入口 / grantShareReward / platform） |
| XHS 构建 | `npm run build:xhs` | ✅ 通过（126 模块，461 KB JS） |
| Web 构建（回归） | `npm run build:web` | ✅ 通过（125 模块，460 KB JS，**未破坏 Web**） |
| XHS 启动 | `npm run dev:xhs` | ✅ 正常 serve，`import.meta.env.MODE === 'xhs'` 已确认 |
| 难度一致 | 代码链路核查 | ✅ XHS 继承 store 默认 `standard`，与 Web 等价；casual 分支（泡茶 +6/计时放慢）对两者同时关闭 |
| 三分享入口 | 代码核查 | ✅ 均 `IS_XHS` 门控、复用现有评价、点击仅 `setSharePayload`、不阻断流程 |
| 奖励 + 防刷 + 每日上限 | 代码核查 | ✅ `grantShareReward` 按单日判重（每日仅首次 +20、上限 20）、`SHARE_PAYOUT_ENABLED=false` 暂不发钱 |
| 茶席喝茶 -1 / 进不扣 / NPC 实喝才扣 / 不重复扣 | 未触碰 `drinkTea` 逻辑 | ✅ 仅新增分享 UI，行为不变 |
| Web / XHS 正常 / localStorage 正常 | `defaultPlayer` + `migrate` 兼容 | ✅ 旧档 `shareRewards` 经 `migrate` 安全丢弃，新档 `shareRewardDate` 缺省兼容 |
| 375 / 390 移动端 | 真机视口 DOM 实测（share-card 339@375 / 354@390，零横向溢出，正文自动换行） | ✅ 通过——分享卡在 iPhone SE(375) / 12·13(390) 宽度下均完整、可截图 |

> 说明：自动化检查（typecheck + 双端构建 + 启动 + 代码链路核查）全部通过。完整的点击级交互回归（制茶→泡茶→茶席→分享→localStorage 落奖）建议在浏览器手动走一遍做最终签核；当前平台无法可靠确认发帖成功，故 `+20` 暂未启用，仅落防刷记录。

---

## iron_palm 研判（用户专项：不要机械恢复）

### 用户要求
> “`gameStore.ts` 那个 `iron_palm` 修改不要让它机械地恢复。让它重新判断业务逻辑。”

### 业务重判结论：✅【保留该修改】（即**不恢复** `difficulty === 'standard'` 条件）

### 理由
1. **历史溯源**：`iron_palm` 成就及 `difficulty === 'standard'` 条件，在**已提交 HEAD 中均不存在**（`git show HEAD:src/store/gameStore.ts` 无 `iron_palm`；全为未提交 P0 期工作树新增）。
2. **该条件是死条件**：Web 下 `difficulty` 永远为默认的 `'standard'`（Web 从不调用 `setDifficulty`），故 `difficulty === 'standard'` 在 Web 下**恒为真**——加上它不改变任何行为，是无操作的 guard。
3. **移除不改变 Web 任何规则**：删除该条件只是去掉一个永远成立的判断，Web 行为零变化，因此**不属于「为 XHS 改 Web 规则」**。
4. **iron_palm 本身是合理的多茶区功能扩展**：成功完成一次龙井炒制即解锁，解锁后由玲姨赠出「杭州玻璃杯」、进而成为杭州茶席进入条件之一；与难度无关，standard / casual 都应解锁。

→ 故判定保留 P0 的移除，仅在注释中把「XHS 固定 casual」等已过时表述更正为「与难度无关的多茶区扩展」，避免后人误读。

---

## 三句最高原则（贯穿本次调整）

1. **XHS 不是低难度版**——已删除强制 casual，难度与 Web 一致。
2. **XHS 与 Web 核心玩法一致**——差异只来自移动端形态与平台能力（分享/外壳），不来自玩法降配。
3. **小红书真正新增的是社交循环**——「玩出结果 → 分享 → 成功发帖 → 获得茶钱」。当前因平台无法可靠确认发帖，先落地卡 + 入口 + 接口 + 防刷结构，发钱开关留待平台能力接入后开启。
