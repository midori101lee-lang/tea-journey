import { useGame } from '../store/gameStore';

/**
 * 全局轻量 toast：固定在底部居中，展示一次性提示（如「进度已保存」）。
 * 不阻塞交互，1.8s 后由 store 自动清除。挂在根层，覆盖所有场景。
 */
export default function Toast() {
  const toast = useGame((s) => s.toast);
  if (!toast) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      {toast}
    </div>
  );
}
