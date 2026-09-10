/**
 * 林姑娘的独立场景（廊下 / 亭子，游历茶客的临时落脚处）。
 * 与老陈茶馆不同氛围：通透自然光、竹影、风铃、简茶席、卷轴与行囊，透出远山。
 * 林姑娘由透明人物层叠加在茶席旁（见 index.ts focus）。
 */
export function LingguScene() {
  return (
    <svg viewBox="0 0 390 560" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" role="img" aria-label="林姑娘的廊下">
      <defs>
        <linearGradient id="lg-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eef2ec" />
          <stop offset="1" stopColor="#e3ebe1" />
        </linearGradient>
        <linearGradient id="lg-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fafdf8" stopOpacity="0" />
          <stop offset="1" stopColor="#fafdf8" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="390" height="560" fill="url(#lg-sky)" />
      {/* 远处茶山（透过廊柱） */}
      <path d="M0 220 Q90 188 180 214 T390 206 L390 330 0 330 Z" fill="#cdd6c4" opacity="0.5" />
      <ellipse cx="220" cy="240" rx="160" ry="16" fill="#fafdf8" opacity="0.4" />
      {/* 廊下木柱（左） */}
      <g transform="translate(26,60)">
        <rect x="0" y="0" width="16" height="320" rx="3" fill="#a98a5e" stroke="#7c5f3c" strokeWidth="2" />
        <rect x="-6" y="0" width="28" height="14" rx="3" fill="#8f6f46" />
        <rect x="-6" y="306" width="28" height="14" rx="3" fill="#8f6f46" />
      </g>
      {/* 檐（顶） */}
      <path d="M0 56 L390 56 L390 86 Q200 70 0 86 Z" fill="#9c7d52" stroke="#7c5f3c" strokeWidth="2" />
      {/* 栏杆（下） */}
      <g stroke="#8f6f46" strokeWidth="5" strokeLinecap="round">
        <line x1="0" y1="430" x2="390" y2="430" />
      </g>
      <g stroke="#9c7d52" strokeWidth="4">
        <line x1="60" y1="430" x2="60" y2="490" /><line x1="150" y1="430" x2="150" y2="490" />
        <line x1="240" y1="430" x2="240" y2="490" /><line x1="330" y1="430" x2="330" y2="490" />
      </g>
      {/* 风铃（挂柱） */}
      <g transform="translate(34,96)">
        <line x1="8" y1="0" x2="8" y2="22" stroke="#7c5f3c" strokeWidth="1.4" />
        <path d="M0 22 L16 22 L12 36 L4 36 Z" fill="#c9b48a" stroke="#8a6f52" strokeWidth="1" />
        <line x1="8" y1="36" x2="8" y2="46" stroke="#8a6f52" strokeWidth="1" />
      </g>
      {/* 竹影（前景右，半透） */}
      <g transform="translate(300,150)" stroke="#9aae78" strokeWidth="7" strokeLinecap="round" opacity="0.55">
        <line x1="0" y1="0" x2="6" y2="200" /><line x1="26" y1="0" x2="32" y2="180" />
      </g>
      <g transform="translate(300,210)" fill="#88a063" opacity="0.6">
        <path d="M0 8 Q-16 -2 -12 -20 Q4 -6 0 8 Z" /><path d="M26 6 Q10 -4 14 -22 Q30 -8 26 6 Z" />
      </g>
      {/* 简茶席（右中）：盖碗 + 杯 + 卷轴 + 行囊 */}
      <g transform="translate(232,388)">
        <rect x="0" y="0" width="120" height="16" rx="4" fill="#a9824f" stroke="#7c5f3c" strokeWidth="2" />
        <g transform="translate(16,2)">
          <ellipse cx="16" cy="20" rx="16" ry="4" fill="#cbb79a" stroke="#8a6f52" strokeWidth="1" />
          <path d="M6 11 Q16 7 26 11 L23 21 Q16 25 9 21 Z" fill="#efe7d6" stroke="#8a6f52" strokeWidth="1" />
          <ellipse cx="16" cy="9" rx="13" ry="3.6" fill="#f1e8d8" stroke="#8a6f52" strokeWidth="1" />
        </g>
        <g transform="translate(70,4)" fill="#efe7d6" stroke="#8a6f52" strokeWidth="1">
          <path d="M0 0 L14 0 L11 11 L3 11 Z" /><ellipse cx="7" cy="0" rx="7" ry="2" fill="#cbb79a" opacity="0.7" />
        </g>
        {/* 卷轴（立） */}
        <g transform="translate(96,-30)">
          <rect x="0" y="0" width="14" height="46" rx="3" fill="#efe7d6" stroke="#8a6f52" strokeWidth="1" />
          <rect x="-2" y="-3" width="18" height="6" rx="3" fill="#b98f6a" /><rect x="-2" y="43" width="18" height="6" rx="3" fill="#b98f6a" />
        </g>
        {/* 行囊（布包） */}
        <g transform="translate(2,8)">
          <path d="M0 8 Q14 0 28 8 L26 26 Q14 32 2 26 Z" fill="#c2b6cf" stroke="#8f8099" strokeWidth="1.4" />
          <path d="M8 8 Q14 2 20 8" fill="none" stroke="#8f8099" strokeWidth="1.4" />
        </g>
      </g>
    </svg>
  );
}
