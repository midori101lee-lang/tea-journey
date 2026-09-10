/**
 * 母树崖壁（武夷山）。灰岩崖壁 + 六棵母树小丛（长崖缝）+ 石阶 + 远山云雾 + 暖阳。
 * 老陈由透明人物层侧身指引叠加（见 index.ts focus）。
 */
export function MotherTreeScene() {
  return (
    <svg viewBox="0 0 390 560" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" role="img" aria-label="武夷山母树">
      <defs>
        <linearGradient id="mt-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0ead9" />
          <stop offset="1" stopColor="#e6e2d2" />
        </linearGradient>
        <linearGradient id="mt-rock" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cfc7ba" />
          <stop offset="1" stopColor="#b3a896" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="390" height="560" fill="url(#mt-sky)" />
      {/* 远山云雾 */}
      <path d="M0 150 Q90 118 180 146 T390 138 L390 320 0 320 Z" fill="#c9d1c1" opacity="0.5" />
      <ellipse cx="120" cy="170" rx="150" ry="18" fill="#fbf7ee" opacity="0.4" />
      <ellipse cx="300" cy="200" rx="150" ry="20" fill="#fbf7ee" opacity="0.35" />
      {/* 崖壁（大灰岩，占中下主体） */}
      <path d="M40 200 Q120 150 210 196 Q300 240 350 210 L360 560 30 560 Z" fill="url(#mt-rock)" />
      {/* 崖壁纹理 */}
      <g stroke="#9c9384" strokeWidth="1.4" fill="none" opacity="0.55" strokeLinecap="round">
        <path d="M70 240 Q120 300 96 380" /><path d="M150 220 Q170 320 150 440" />
        <path d="M240 230 Q250 330 232 460" /><path d="M300 230 Q318 320 300 420" />
        <path d="M110 300 Q160 340 210 300" /><path d="M180 380 Q240 410 300 380" />
      </g>
      {/* 六棵母树（小丛，长崖缝） */}
      <g transform="translate(120,196)" fill="#7f965c" stroke="#5c6f44" strokeWidth="1">
        <path d="M0 26 Q-8 6 4 -2 Q14 8 8 26 Z" /><path d="M12 28 Q4 8 18 0 Q28 10 20 28 Z" />
        <path d="M26 26 Q18 8 30 0 Q40 10 32 26 Z" />
      </g>
      <g transform="translate(176,210)" fill="#88a063" stroke="#5c6f44" strokeWidth="1">
        <path d="M0 28 Q-8 6 4 -2 Q14 8 8 28 Z" /><path d="M14 30 Q6 8 20 0 Q30 10 22 30 Z" />
        <path d="M28 28 Q20 8 32 0 Q42 10 34 28 Z" />
      </g>
      {/* 石阶（左下，引向崖前） */}
      <g fill="#bcb2a0" stroke="#9c9384" strokeWidth="1.2">
        <path d="M30 470 L150 470 L140 500 L20 500 Z" />
        <path d="M20 500 L140 500 L130 532 L10 532 Z" />
      </g>
      {/* 暖阳 */}
      <circle cx="320" cy="80" r="34" fill="#f7ecd0" opacity="0.55" />
    </svg>
  );
}
