/**
 * 梅家坞（占位 SVG）。方向：龙井核心山场 —— 山坞、层叠茶园梯田、溪流、
 * 白墙黛瓦屋舍、竹林、春季嫩绿茶山。「对标武夷山九龙窠」的杭州地域探索入口。
 * 本阶段只作入口与占位，后续在此挂载龙井线剧情 / NPC。
 */
export function MeijiawuScene() {
  return (
    <svg viewBox="0 0 390 560" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" role="img" aria-label="梅家坞">
      <defs>
        <linearGradient id="mjw-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eef4ee" />
          <stop offset="1" stopColor="#dcecdc" />
        </linearGradient>
        <linearGradient id="mjw-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbfdf9" stopOpacity="0" />
          <stop offset="1" stopColor="#fbfdf9" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="390" height="360" fill="url(#mjw-sky)" />

      {/* 三面环山的山坞（江南圆润山丘） */}
      <path d="M0 210 Q70 150 150 196 T300 186 Q350 176 390 202 L390 330 0 330 Z" fill="#c6d5bd" opacity="0.65" />
      <path d="M0 258 Q90 224 180 254 T390 240 L390 340 0 340 Z" fill="#b0c69b" opacity="0.85" />

      {/* 白墙黛瓦屋舍（中景） */}
      <g transform="translate(232,238)">
        <rect x="0" y="10" width="54" height="30" fill="#f2efe6" stroke="#cbc6ba" strokeWidth="1.2" />
        <path d="M-6 10 Q27 -4 60 10 L60 15 -6 15 Z" fill="#6f747c" />
        <rect x="58" y="18" width="34" height="22" fill="#f2efe6" stroke="#cbc6ba" strokeWidth="1.2" />
        <path d="M54 18 Q75 8 96 18 L96 22 54 22 Z" fill="#6f747c" />
      </g>

      {/* 层叠茶园梯田 */}
      <g stroke="#9dbb7f" strokeWidth="4.6" fill="none" opacity="0.88" strokeLinecap="round">
        <path d="M0 322 Q100 302 200 324 T390 314" />
        <path d="M0 362 Q110 342 210 364 T390 354" />
        <path d="M0 406 Q120 386 230 408 T390 398" />
        <path d="M0 456 Q120 436 240 458 T390 448" />
        <path d="M0 510 Q120 492 240 512 T390 502" />
      </g>
      <rect x="0" y="486" width="390" height="74" fill="#9dbb7f" opacity="0.3" />

      {/* 溪流（自山坞斜下） */}
      <path d="M120 330 Q150 410 132 560 L206 560 Q188 410 168 330 Z" fill="#cfe0dd" opacity="0.75" />
      <path d="M138 360 Q160 420 152 500" stroke="#bcd6d2" strokeWidth="3" fill="none" />

      {/* 竹林（右前景） */}
      <g transform="translate(330,300)" stroke="#7f9a5f" strokeWidth="6" strokeLinecap="round">
        <line x1="0" y1="0" x2="4" y2="220" />
        <line x1="24" y1="6" x2="26" y2="220" />
        <g fill="#8fae6a" stroke="none" opacity="0.9">
          <ellipse cx="14" cy="42" rx="16" ry="5" transform="rotate(-22 14 42)" />
          <ellipse cx="34" cy="70" rx="15" ry="4.6" transform="rotate(24 34 70)" />
        </g>
      </g>

      <rect x="0" y="440" width="390" height="120" fill="url(#mjw-haze)" />
    </svg>
  );
}
