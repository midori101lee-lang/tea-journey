import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 双端构建：web（GitHub Pages）/ xhs（小红书，Preact alias 预留）
export default defineConfig(({ mode }) => {
  const isXhs = mode === 'xhs';
  return {
    plugins: [react()],
    build: {
      target: 'es2018',
      rollupOptions: {
        input: isXhs ? { xhs: 'xhs.html' } : { web: 'index.html' },
      },
    },
    // XHS 轻量版与 Web 共用同一套 React 代码，仅通过 xhs.html / mode 走线性精简流。
    // preact/compat 的 alias 为预留优化（未安装依赖，暂不启用，避免构建失败）。
    resolve: {},
  };
});
