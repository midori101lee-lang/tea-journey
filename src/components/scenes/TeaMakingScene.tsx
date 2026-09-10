/**
 * 制茶坊（室内工坊）。灰褐墙 + 石灶铁锅（柴火微光）+ 竹簸箕 + 木桶 + 墙上竹筛 + 暖光。
 * 岩伯由透明人物层叠加在灶前（见 index.ts focus）。
 */
export function TeaMakingScene() {
  return (
    <svg viewBox="0 0 390 560" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" role="img" aria-label="制茶坊">
      <defs>
        <linearGradient id="tm-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d8cab4" />
          <stop offset="1" stopColor="#c7b596" />
        </linearGradient>
        <linearGradient id="tm-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b89c74" />
          <stop offset="1" stopColor="#a98a5e" />
        </linearGradient>
        <radialGradient id="tm-fire" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f6b25a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#f6b25a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="390" height="372" fill="url(#tm-wall)" />
      <rect x="0" y="372" width="390" height="188" fill="url(#tm-floor)" />
      {/* 墙上竹筛（挂物） */}
      <g transform="translate(54,84)">
        <circle cx="22" cy="22" r="22" fill="none" stroke="#9c7d52" strokeWidth="3" />
        <circle cx="22" cy="22" r="16" fill="none" stroke="#b89c72" strokeWidth="1.5" />
        <line x1="6" y1="22" x2="38" y2="22" stroke="#b89c72" strokeWidth="1.2" />
        <line x1="22" y1="6" x2="22" y2="38" stroke="#b89c72" strokeWidth="1.2" />
      </g>
      {/* 暖光 */}
      <ellipse cx="230" cy="300" rx="160" ry="120" fill="url(#tm-fire)" opacity="0.4" />
      {/* 木桶（右） */}
      <g transform="translate(300,398)">
        <path d="M0 0 L40 0 L36 70 L4 70 Z" fill="#b59a72" stroke="#8a6f52" strokeWidth="2" />
        <ellipse cx="20" cy="0" rx="20" ry="6" fill="#9c7d52" stroke="#8a6f52" strokeWidth="1.5" />
        <line x1="0" y1="22" x2="40" y2="22" stroke="#8a6f52" strokeWidth="1.4" />
        <line x1="2" y1="46" x2="38" y2="46" stroke="#8a6f52" strokeWidth="1.4" />
      </g>
      {/* 竹簸箕（左） */}
      <g transform="translate(34,420)">
        <path d="M0 12 Q40 -6 80 12 L70 44 Q40 56 10 44 Z" fill="#cbb083" stroke="#8a6f52" strokeWidth="2" />
        <g fill="#6f7a4a" stroke="#566037" strokeWidth="0.8" opacity="0.92">
          <ellipse cx="24" cy="22" rx="9" ry="4" /><ellipse cx="44" cy="24" rx="9" ry="4" />
          <ellipse cx="58" cy="20" rx="8" ry="3.6" /><ellipse cx="36" cy="32" rx="8" ry="3.6" />
        </g>
      </g>
      {/* 石灶 + 铁锅（中右，柴火微光） */}
      <g transform="translate(150,330)">
        <ellipse cx="60" cy="78" rx="70" ry="30" fill="url(#tm-fire)" opacity="0.7" />
        <rect x="0" y="40" width="120" height="92" rx="10" fill="#9b9088" stroke="#6f655c" strokeWidth="2" />
        <rect x="10" y="50" width="100" height="14" rx="4" fill="#7d726a" />
        <ellipse cx="60" cy="40" rx="62" ry="16" fill="#4a4642" stroke="#2e2a26" strokeWidth="2" />
        <ellipse cx="60" cy="36" rx="50" ry="11" fill="#6f7a4a" opacity="0.85" />
        {/* 柴火 */}
        <g stroke="#7a4a2c" strokeWidth="4" strokeLinecap="round">
          <line x1="30" y1="118" x2="58" y2="100" /><line x1="58" y1="120" x2="86" y2="100" />
        </g>
        <path d="M40 116 Q52 96 64 116 Q52 108 40 116 Z" fill="#f6a14a" opacity="0.9" />
        <path d="M58 118 Q70 100 82 118 Q70 110 58 118 Z" fill="#f6b25a" opacity="0.85" />
      </g>
    </svg>
  );
}
