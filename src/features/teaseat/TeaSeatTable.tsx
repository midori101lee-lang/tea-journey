/**
 * 茶席茶桌（纯前景组件，东方手绘 + 轻水彩 + 淡墨线稿）。
 * 定位：背景负责环境（不画桌），本组件负责「坐在哪里喝茶」——
 * 低矮横向的江南木桌，由代码绘制，桌面永远干净（茶具由槽位层动态叠加）。
 *
 * 层级约定（与 TeaSeatView 配合）：
 *   背景(z0) → NPC(z1) → 茶桌(z2，遮住 NPC 下半身) → 茶具槽位(z3) → 玩家侧/前景(z4)。
 * 组件占位：舞台 left 6% / top 63% / width 88% / height 16.5%（≈舞台宽度的 88%，不铺满、不挡湖景主体）。
 * viewBox 495×165 与该容器比例一致，避免拉伸变形。
 */
export default function TeaSeatTable() {
  return (
    <svg
      viewBox="0 0 495 165"
      style={{ position: 'absolute', left: '6%', top: '63%', width: '88%', height: '16.5%', zIndex: 2 }}
      aria-hidden
    >
      {/* 落地阴影 */}
      <ellipse cx="247" cy="153" rx="228" ry="9" fill="#3a2c1c" opacity="0.10" />
      {/* 桌腿（矮桌，微外撇） */}
      <path d="M46 96 L70 96 L64 148 L52 148 Z" fill="#9a744a" stroke="#6b513a" strokeWidth="2" />
      <path d="M425 96 L449 96 L443 148 L431 148 Z" fill="#9a744a" stroke="#6b513a" strokeWidth="2" />
      {/* 前围板（牙板，微弧） */}
      <path d="M10 95 L485 95 L485 106 Q247 122 10 106 Z" fill="#a87f4e" stroke="#6b513a" strokeWidth="2.2" />
      {/* 桌面（梯形，近宽远窄） */}
      <path d="M55 30 L440 30 L485 95 L10 95 Z" fill="#c9a06b" stroke="#6b513a" strokeWidth="2.6" strokeLinejoin="round" />
      {/* 木材拼接线（随透视走） */}
      <path d="M40 52 L455 52" stroke="#b38a56" strokeWidth="1.6" opacity="0.75" />
      <path d="M25 73 L470 73" stroke="#b38a56" strokeWidth="1.6" opacity="0.75" />
      {/* 顺纹木丝（淡，手绘感） */}
      <path d="M70 40 q60 -3 130 -2 M240 62 q50 2 120 1 M120 84 q70 2 150 0"
        stroke="#b38a56" strokeWidth="1.1" fill="none" opacity="0.5" strokeLinecap="round" />
      {/* 后沿高光 */}
      <path d="M55 30 L440 30" stroke="#e0bd8a" strokeWidth="2" opacity="0.8" />
    </svg>
  );
}
