/**
 * 杭州茶园（占位 SVG）。方向：西湖茶山 —— 江南清秀、轻盈、规整：
 * 远山淡影、白墙黛瓦、低矮茶垄、一条小路、矮竹篱笆、薄雾。
 * 构图约束（P0）：**前景干净、无高株遮挡**——茶叶/嫩芽是视觉重点，
 * 装饰只放在远处与画面边缘，不与采茶交互区（画面中带）竞争。
 */
export function HangzhouGardenScene() {
  return (
    <svg viewBox="0 0 390 560" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" role="img" aria-label="杭州茶园">
      <defs>
        <linearGradient id="hzg-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0f5ee" />
          <stop offset="1" stopColor="#e2edda" />
        </linearGradient>
        <linearGradient id="hzg-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbfdf9" stopOpacity="0" />
          <stop offset="1" stopColor="#fbfdf9" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="390" height="380" fill="url(#hzg-sky)" />

      {/* 远山（江南圆润山丘，两层淡影） */}
      <path d="M0 200 Q70 168 150 196 T290 186 Q345 180 390 198 L390 300 0 300 Z" fill="#cfdccb" opacity="0.55" />
      <path d="M0 244 Q95 220 185 242 T390 232 L390 330 0 330 Z" fill="#c2d3b2" opacity="0.7" />

      {/* 白墙黛瓦村落（远景，很小、不抢戏） */}
      <g transform="translate(236,222)" opacity="0.9">
        <rect x="0" y="8" width="34" height="18" fill="#f2efe6" stroke="#cbc6ba" strokeWidth="0.9" />
        <path d="M-4 8 Q17 0 38 8 L38 11 -4 11 Z" fill="#6f747c" />
        <rect x="38" y="12" width="22" height="14" fill="#f2efe6" stroke="#cbc6ba" strokeWidth="0.9" />
        <path d="M35 12 Q49 5 63 12 L63 15 35 15 Z" fill="#6f747c" />
      </g>

      {/* 中景缓坡 */}
      <path d="M0 300 Q110 280 210 300 T390 290 L390 400 0 400 Z" fill="#b9cbA0" opacity="0.9" />

      {/* 层叠茶垄（低矮、嫩黄绿、等高线式，规整留白） */}
      <g stroke="#a3b56e" strokeWidth="4" fill="none" opacity="0.85" strokeLinecap="round">
        <path d="M0 336 Q100 320 200 338 T390 330" />
        <path d="M0 376 Q110 360 215 378 T390 370" />
        <path d="M0 420 Q120 404 225 422 T390 414" />
        <path d="M0 466 Q120 452 235 468 T390 460" />
      </g>
      <g stroke="#b7c687" strokeWidth="2.4" fill="none" opacity="0.55" strokeLinecap="round">
        <path d="M0 352 Q100 338 200 354 T390 346" />
        <path d="M0 394 Q110 380 215 396 T390 388" />
        <path d="M0 442 Q120 428 230 444 T390 436" />
      </g>
      <rect x="0" y="492" width="390" height="68" fill="#a3b56e" opacity="0.32" />

      {/* 小路（右侧婉转上坡，窄窄一条，指向村落） */}
      <path d="M330 560 Q318 500 336 448 Q350 408 322 372 Q310 356 288 348" fill="none" stroke="#e6dfc9" strokeWidth="10" strokeLinecap="round" opacity="0.9" />
      <path d="M330 560 Q318 500 336 448 Q350 408 322 372 Q310 356 288 348" fill="none" stroke="#d6cca9" strokeWidth="2" strokeDasharray="1 9" strokeLinecap="round" opacity="0.9" />

      {/* 矮竹篱笆（沿小路外侧，高约 22px，纯装饰、绝不进入交互中带） */}
      <g stroke="#b3a173" strokeWidth="2.6" strokeLinecap="round" opacity="0.85">
        <line x1="352" y1="470" x2="352" y2="492" />
        <line x1="366" y1="474" x2="366" y2="496" />
        <line x1="380" y1="478" x2="380" y2="500" />
        <line x1="346" y1="477" x2="386" y2="483" />
      </g>

      {/* 远处两三个采茶人剪影（点景，极小） */}
      <g fill="#7f9464" opacity="0.6">
        <ellipse cx="128" cy="330" rx="4.5" ry="6" />
        <rect x="124" y="335" width="8" height="11" rx="3" />
        <ellipse cx="206" cy="366" rx="4.5" ry="6" />
        <rect x="202" y="371" width="8" height="11" rx="3" />
      </g>

      {/* 薄雾（压低画面底部，让茶叶更突出） */}
      <rect x="0" y="440" width="390" height="120" fill="url(#hzg-haze)" />
    </svg>
  );
}
