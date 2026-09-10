/**
 * 茶桌 / 工夫茶茶席（周伯）。廊下淡背景 + 木茶盘 + 盖碗/公道杯/品茗杯×2/茶滤/热水壶 + 蒲团 + 背景竹。
 * 周伯由透明人物层叠加在茶席后（见 index.ts focus）。
 */
export function TeaTableScene() {
  return (
    <svg viewBox="0 0 390 560" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" role="img" aria-label="茶桌">
      <defs>
        <linearGradient id="tt-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9e4d6" />
          <stop offset="1" stopColor="#ded7c5" />
        </linearGradient>
        <linearGradient id="tt-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c8b08a" />
          <stop offset="1" stopColor="#b89a70" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="390" height="360" fill="url(#tt-wall)" />
      <rect x="0" y="360" width="390" height="200" fill="url(#tt-floor)" />
      {/* 背景竹（右） */}
      <g transform="translate(320,80)" stroke="#9aae78" strokeWidth="6" strokeLinecap="round" opacity="0.7">
        <line x1="0" y1="0" x2="0" y2="180" /><line x1="22" y1="0" x2="22" y2="160" /><line x1="44" y1="0" x2="44" y2="184" />
      </g>
      <g transform="translate(320,150)" fill="#88a063" opacity="0.8">
        <path d="M0 8 Q-14 -2 -10 -18 Q4 -6 0 8 Z" /><path d="M22 6 Q8 -4 12 -20 Q26 -8 22 6 Z" /><path d="M44 8 Q30 -2 34 -18 Q48 -6 44 8 Z" />
      </g>
      {/* 蒲团（坐垫，左前） */}
      <g transform="translate(70,470)">
        <ellipse cx="40" cy="20" rx="44" ry="14" fill="#b08a6a" stroke="#8a6f52" strokeWidth="2" />
        <ellipse cx="40" cy="14" rx="44" ry="14" fill="#c2a07c" stroke="#8a6f52" strokeWidth="1.5" />
      </g>
      {/* 木茶盘（中部） */}
      <g transform="translate(120,402)">
        <rect x="0" y="0" width="170" height="20" rx="5" fill="#a9824f" stroke="#7c5f3c" strokeWidth="2" />
        <rect x="8" y="20" width="154" height="10" rx="3" fill="#8f6f46" />
        {/* 盖碗 */}
        <g transform="translate(28,2)">
          <ellipse cx="18" cy="22" rx="18" ry="5" fill="#cbb79a" stroke="#8a6f52" strokeWidth="1" />
          <path d="M7 12 Q18 8 29 12 L26 23 Q18 27 10 23 Z" fill="#efe7d6" stroke="#8a6f52" strokeWidth="1.1" />
          <ellipse cx="18" cy="10" rx="14" ry="4" fill="#f1e8d8" stroke="#8a6f52" strokeWidth="1.1" />
        </g>
        {/* 公道杯 */}
        <g transform="translate(78,5)">
          <path d="M0 6 L26 6 L22 24 L4 24 Z" fill="#efe7d6" stroke="#8a6f52" strokeWidth="1.1" />
          <ellipse cx="13" cy="6" rx="13" ry="3.6" fill="#cbb79a" opacity="0.7" />
        </g>
        {/* 品茗杯 ×2 */}
        <g transform="translate(120,10)" fill="#efe7d6" stroke="#8a6f52" strokeWidth="1">
          <path d="M0 0 L16 0 L13 12 L3 12 Z" /><ellipse cx="8" cy="0" rx="8" ry="2.4" fill="#cbb79a" opacity="0.7" />
        </g>
        <g transform="translate(138,22)" fill="#efe7d6" stroke="#8a6f52" strokeWidth="1">
          <path d="M0 0 L14 0 L11 10 L3 10 Z" /><ellipse cx="7" cy="0" rx="7" ry="2" fill="#cbb79a" opacity="0.7" />
        </g>
        {/* 热水壶（左） */}
        <g transform="translate(-6,2)">
          <path d="M0 6 Q12 0 24 6 L21 22 Q12 27 3 22 Z" fill="#8a7a6a" stroke="#5f5246" strokeWidth="1.2" />
          <path d="M24 9 Q30 8 28 15" fill="none" stroke="#5f5246" strokeWidth="2" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}
