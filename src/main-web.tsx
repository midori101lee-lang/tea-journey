import { createRoot } from 'react-dom/client';
import WebApp from './app/WebApp';
import DayIntro from './components/DayIntro';
import './styles/tokens.css';
import './styles/base.css';

const el = document.getElementById('root');
if (el) {
  // EncounterLayer 已移入 WebApp 各世界场景的 .scene 容器内（见 WebApp.tsx），
  // 这样偶遇 NPC 立绘相对场景画布定位，不会脱离场景跑到页面外。
  // DayIntro 为回茶馆歇一晚后的「新的一天」轻量提示，挂在根层覆盖所有场景。
  createRoot(el).render(
    <div className="app">
      <WebApp />
      <DayIntro />
    </div>,
  );
}
