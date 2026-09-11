/**
 * 玲姨的茶馆（杭州 · 占位 SVG）。方向：江南茶馆 —— 浅色原木、米白墙面、
 * 青瓷/白瓷茶具、竹编、茶柜，木格窗外可见杭州茶山。整体清雅、生活化，
 * 与老陈的武夷山茶馆（暖褐、灶火感）明显区分。
 * 后续正式背景图就绪后，只需在 SCENES 里给 'hz-teahouse' 挂 bg，本组件自动退为回退。
 */
export function HangzhouTeahouseScene() {
  return (
    <svg viewBox="0 0 390 560" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" role="img" aria-label="玲姨的茶馆">
      <defs>
        <linearGradient id="hzt-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6f1e7" />
          <stop offset="1" stopColor="#efe8da" />
        </linearGradient>
        <linearGradient id="hzt-window" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eaf1ea" />
          <stop offset="1" stopColor="#d7e4d6" />
        </linearGradient>
        <linearGradient id="hzt-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dcc8a6" />
          <stop offset="1" stopColor="#cdb489" />
        </linearGradient>
      </defs>

      {/* 墙面 + 地板 */}
      <rect x="0" y="0" width="390" height="430" fill="url(#hzt-wall)" />
      <rect x="0" y="430" width="390" height="130" fill="url(#hzt-floor)" />
      <line x1="0" y1="430" x2="390" y2="430" stroke="#b9a074" strokeWidth="3" opacity="0.6" />

      {/* 木格窗（右）——窗外杭州茶山 */}
      <g transform="translate(246,70)">
        <rect x="0" y="0" width="120" height="150" rx="6" fill="url(#hzt-window)" stroke="#b98f6a" strokeWidth="5" />
        {/* 窗外：远山层叠 + 茶垄 */}
        <path d="M8 96 Q46 68 84 94 T112 88 L112 142 8 142 Z" fill="#b9cba6" opacity="0.85" />
        <path d="M8 116 Q50 100 112 112 L112 142 8 142 Z" fill="#a2bd88" opacity="0.9" />
        <g stroke="#8fae6a" strokeWidth="2.4" fill="none" opacity="0.8">
          <path d="M10 126 Q60 118 110 124" />
          <path d="M10 136 Q60 130 110 134" />
        </g>
        {/* 窗棂 */}
        <line x1="60" y1="0" x2="60" y2="150" stroke="#b98f6a" strokeWidth="4" />
        <line x1="0" y1="75" x2="120" y2="75" stroke="#b98f6a" strokeWidth="4" />
      </g>

      {/* 茶柜（左） */}
      <g transform="translate(20,96)">
        <rect x="0" y="0" width="104" height="176" rx="5" fill="#d8c3a0" stroke="#b08f63" strokeWidth="2.5" />
        <line x1="0" y1="60" x2="104" y2="60" stroke="#b08f63" strokeWidth="2.5" />
        <line x1="0" y1="118" x2="104" y2="118" stroke="#b08f63" strokeWidth="2.5" />
        <line x1="52" y1="0" x2="52" y2="176" stroke="#b08f63" strokeWidth="2" opacity="0.6" />
        {/* 柜上青瓷茶叶罐 */}
        <g>
          <rect x="16" y="-30" width="26" height="34" rx="5" fill="#a9c4b4" stroke="#7f9c8c" strokeWidth="1.6" />
          <rect x="20" y="-36" width="18" height="8" rx="4" fill="#8fae9e" stroke="#7f9c8c" strokeWidth="1.4" />
        </g>
        <g>
          <rect x="58" y="-24" width="30" height="28" rx="5" fill="#e7ded0" stroke="#b7a58c" strokeWidth="1.6" />
          <rect x="64" y="-30" width="18" height="7" rx="3.5" fill="#d9cdbb" stroke="#b7a58c" strokeWidth="1.2" />
        </g>
      </g>

      {/* 墙上挂画（水墨小山） */}
      <g transform="translate(150,120)">
        <rect x="0" y="0" width="64" height="86" rx="3" fill="#fbf8f0" stroke="#c0a97f" strokeWidth="2" />
        <path d="M8 60 Q24 38 40 58 T56 54 L56 76 8 76 Z" fill="#c3cbb6" opacity="0.8" />
        <path d="M10 68 Q30 56 54 66" stroke="#9fb07f" strokeWidth="1.6" fill="none" />
      </g>

      {/* 竹编篮（右下角地面） */}
      <g transform="translate(300,470)">
        <ellipse cx="30" cy="42" rx="34" ry="12" fill="#c8a98a" stroke="#8a6f52" strokeWidth="1.6" />
        <path d="M4 42 Q4 14 30 14 Q56 14 56 42" fill="none" stroke="#8a6f52" strokeWidth="1.6" />
        <path d="M8 30 L52 30 M10 36 L50 36" stroke="#8a6f52" strokeWidth="1" opacity="0.7" />
      </g>

      {/* 木茶桌（前景中下） */}
      <g transform="translate(58,392)">
        <rect x="0" y="0" width="286" height="20" rx="5" fill="#d9c09a" stroke="#ad8f68" strokeWidth="2" />
        <rect x="14" y="20" width="16" height="72" fill="#c2a67e" />
        <rect x="256" y="20" width="16" height="72" fill="#c2a67e" />
        {/* 白瓷盖碗 */}
        <g transform="translate(52,-30)">
          <ellipse cx="34" cy="30" rx="34" ry="9" fill="#efe7d6" stroke="#c3b49a" strokeWidth="1.2" />
          <path d="M6 8 Q34 0 62 8 L58 30 Q34 38 10 30 Z" fill="#f4ecdd" stroke="#c3b49a" strokeWidth="1.4" />
          <ellipse cx="34" cy="8" rx="31" ry="8" fill="#f7f0e3" stroke="#c3b49a" strokeWidth="1.4" />
          <ellipse cx="34" cy="7" rx="11" ry="3" fill="#c3b49a" opacity="0.5" />
        </g>
        {/* 白瓷品茗杯 */}
        <g transform="translate(150,-22)">
          <path d="M2 0 Q18 -4 34 0 L30 24 Q18 30 6 24 Z" fill="#f4ecdd" stroke="#c3b49a" strokeWidth="1.4" />
        </g>
        {/* 茶点小碟 */}
        <g transform="translate(200,-16)">
          <ellipse cx="26" cy="12" rx="26" ry="8" fill="#f4ecdd" stroke="#c3b49a" strokeWidth="1.2" />
          <circle cx="18" cy="9" r="5" fill="#c9a86a" />
          <circle cx="32" cy="10" r="4.4" fill="#b98f6a" />
        </g>
      </g>
    </svg>
  );
}
