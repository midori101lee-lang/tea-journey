import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// 双端构建：web（GitHub Pages）/ xhs（小红书小工具，离线 classic script）
export default defineConfig(({ mode }) => {
  const isXhs = mode === 'xhs';

  // 小红书小工具容器约束（见 minitool-zip-builder skill）：
  //  - 脚本必须是经典脚本，禁止 type="module" / import / export
  //  - 入口 index.html 必须在 zip 根
  //  - JS 须转译到 Chrome 61 / ES2017 基线
  // 故 xhs 构建输出 IIFE 单一包，并剥离 HTML 里的 type="module" / crossorigin。
  const xhsClassic: Plugin = {
    name: 'xhs-classic-script',
    transformIndexHtml(html) {
      return html
        .replace(/ type="module"/g, '')
        .replace(/\s+crossorigin(="[^"]*")?/g, '')
        // 剥离 type="module" 后脚本失去默认的「延迟执行」语义，会变成 head 同步脚本：
        // 执行时 #root 还未解析，React 静默不挂载（症状=只有纯色背景）。补 defer 恢复该语义。
        .replace(/<script (src="\.\/)/g, '<script defer $1');
    },
  };

  return {
    plugins: [react(), ...(isXhs ? [xhsClassic] : [])],
    build: {
      target: isXhs ? ['es2017', 'chrome61'] : 'es2018',
      ...(isXhs
        ? {
            // 隔离铁律：XHS 产物输出到独立目录，绝不覆盖 Web 的 dist/
            outDir: 'dist-xhs',
            emptyOutDir: true,
            modulePreload: false,
            rollupOptions: {
              // key 用 index：让产物 HTML 名为 index.html（小工具容器要求 zip 根有 index.html）
              input: { index: 'xhs.html' },
              output: {
                format: 'iife',
                inlineDynamicImports: true,
                entryFileNames: 'assets/index.js',
                chunkFileNames: 'assets/[name].js',
                assetFileNames: 'assets/[name][extname]',
              },
            },
          }
        : { rollupOptions: { input: { web: 'index.html' } } }),
    },
    resolve: {},
  };
});
