/**
 * 平台检测：构建期由 vite --mode 决定。
 * XHS 版走 `vite build --mode xhs`（dev：`vite --mode xhs`），
 * 故 `import.meta.env.MODE === 'xhs'` 是「当前是否运行在小红书外壳」的可靠信号。
 * Web 版 MODE 为 'web'（或默认 ''）。
 *
 * 约定：只有「平台能力差异」的代码（分享入口、移动端外壳行为）才读这个标志，
 * 核心玩法 / 数据 / 难度一律共用，绝不在业务判断里散落平台分支。
 */
export const IS_XHS = import.meta.env.MODE === 'xhs';
