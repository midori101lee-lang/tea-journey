/**
 * 武夷山进入 · establishing shot（独立场景大图）
 * 目标：玩家第一眼产生「我到了武夷山」的空间感。
 * 远山层叠 + 茶田梯田 + 蜿蜒山路 + 云雾 + 近景茶树。淡彩水墨、低饱和、暖调。
 */
export function WuyiEstablishingScene() {
  return (
    <svg viewBox="0 0 390 560" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" role="img" aria-label="武夷山远山茶田">
      <defs>
        <linearGradient id="wy-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4ecd9" />
          <stop offset="0.6" stopColor="#efe7d2" />
          <stop offset="1" stopColor="#e7e0cc" />
        </linearGradient>
        <linearGradient id="wy-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbf7ee" stopOpacity="0" />
          <stop offset="1" stopColor="#fbf7ee" stopOpacity="0.65" />
        </linearGradient>
      </defs>
      <rect width="390" height="560" fill="url(#wy-sky)" />
      {/* 最远山（最浅） */}
      <path d="M0 232 Q70 196 150 224 T300 214 Q350 210 390 226 L390 560 0 560 Z" fill="#cdd4c6" opacity="0.55" />
      {/* 中远山 */}
      <path d="M0 286 Q80 246 170 280 T330 268 Q365 264 390 282 L390 560 0 560 Z" fill="#bcc6ac" opacity="0.8" />
      {/* 近山（茶山主体） */}
      <path d="M0 344 Q90 312 190 342 T390 332 L390 560 0 560 Z" fill="#a6b389" />
      {/* 茶田梯田垄（几条曲线，近山表面） */}
      <g stroke="#94a074" strokeWidth="2.4" fill="none" opacity="0.75" strokeLinecap="round">
        <path d="M0 372 Q100 356 200 374 T390 368" />
        <path d="M0 404 Q110 388 210 406 T390 400" />
        <path d="M0 440 Q120 424 220 442 T390 436" />
        <path d="M0 482 Q120 468 230 484 T390 478" />
      </g>
      {/* 云雾横带 */}
      <ellipse cx="120" cy="300" rx="150" ry="20" fill="#fbf7ee" opacity="0.55" />
      <ellipse cx="300" cy="332" rx="160" ry="22" fill="#fbf7ee" opacity="0.45" />
      {/* 蜿蜒山路 */}
      <path d="M150 560 Q166 470 236 408 Q268 380 262 340" fill="none" stroke="#e7dcc0" strokeWidth="7" strokeLinecap="round" opacity="0.85" />
      <path d="M150 560 Q166 470 236 408 Q268 380 262 340" fill="none" stroke="#d8c9a4" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 10" opacity="0.6" />
      {/* 近景茶树丛（左下，做前景框） */}
      <g transform="translate(20,470)">
        <g fill="#7f965c" stroke="#5c6f44" strokeWidth="1">
          <path d="M0 50 Q-6 22 6 6 Q18 22 12 50 Z" />
          <path d="M14 52 Q8 24 22 8 Q36 24 28 52 Z" />
          <path d="M30 50 Q24 22 38 6 Q50 22 44 50 Z" />
        </g>
      </g>
      <g transform="translate(320,486)">
        <g fill="#88a063" stroke="#5c6f44" strokeWidth="1" opacity="0.92">
          <path d="M0 44 Q-6 20 6 4 Q18 20 12 44 Z" />
          <path d="M14 46 Q8 22 22 6 Q36 22 28 46 Z" />
        </g>
      </g>
      {/* 底部柔光压暗，给文字留白 */}
      <rect x="0" y="430" width="390" height="130" fill="url(#wy-haze)" />
    </svg>
  );
}
