import { useEffect } from 'react';
import { useGame } from '../store/gameStore';
import WebApp from './WebApp';
import DayIntro from '../components/DayIntro';
import Toast from '../components/Toast';

/**
 * 小红书版外壳：只负责「移动端外壳 + 平台适配」，不重新实现任何茶游记游戏逻辑。
 * 核心玩法 / 数据 / 场景 / 组件 100% 复用 Web 版（gameStore + WebApp + 各 features）。
 *
 * 适配点：
 *  1. 难度与 Web 版完全一致（store 默认 standard，不强制 casual，不加 XHS 专属难度 UI）。
 *  2. 系统返回键 → 优先游戏内 store.back()，不直接退出整个 webview。
 *  3. 复用 Web 版完整流程（茶区选择 → 探索 → NPC → 制茶 → 泡茶 → 茶席 → 评价 → 收藏）。
 *  4. 共享核心 + XHS 外壳：仅「分享入口 / 移动端壳」这类平台能力差异在 XHS 侧增强，玩法不降级。
 */
export default function XhsApp() {
  // 系统返回键：优先执行游戏内 back()，不让一次返回就退出整个 webview。
  // 做法：首次挂载压一个 dummy history 状态；监听 popstate，若还有上一页就 back() 并重新压栈，
  // 把「返回」拦截在游戏内；历史已空（已到根）则不处理，放行给平台决定是否关闭。
  useEffect(() => {
    const onPop = () => {
      const st = useGame.getState();
      if (st.navHistory.length > 0) {
        st.back();
        window.history.pushState({ xhsShell: true }, ''); // 重新压栈，避免 webview 直接关闭
      }
      // 历史为空：不处理 → 由平台决定是否退出（避免把用户永远困在 webview 里）
    };
    window.history.pushState({ xhsShell: true }, '');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return (
    <>
      <WebApp />
      <DayIntro />
      <Toast />
    </>
  );
}
