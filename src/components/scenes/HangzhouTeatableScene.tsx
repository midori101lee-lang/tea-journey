/**
 * 杭州茶桌（占位 SVG）。方向：江南茶席一角 —— 浅木茶桌、白瓷盖碗与品茗杯、
 * 一壶红亮茶汤（九曲红梅），窗外西湖茶山。用于「茶桌」这处固定场景。
 */
export function HangzhouTeatableScene() {
  return (
    <svg viewBox="0 0 390 560" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" role="img" aria-label="杭州茶桌">
      <defs>
        <linearGradient id="hztb-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6f1e7" />
          <stop offset="1" stopColor="#ece4d5" />
        </linearGradient>
        <linearGradient id="hztb-table" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e0c8a2" />
          <stop offset="1" stopColor="#cdb287" />
        </linearGradient>
        <linearGradient id="hztb-liquor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e0915a" />
          <stop offset="1" stopColor="#b24627" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="390" height="560" fill="url(#hztb-wall)" />

      {/* 圆窗（右上）——西湖茶山 */}
      <g transform="translate(300,80)">
        <circle cx="0" cy="0" r="60" fill="#eaf1ea" stroke="#b98f6a" strokeWidth="5" />
        <path d="M-52 22 Q0 -6 52 20 L52 52 -52 52 Z" fill="#b9cba6" opacity="0.85" />
        <path d="M-52 40 Q0 24 52 36 L52 52 -52 52 Z" fill="#a2bd88" opacity="0.9" />
        <circle cx="0" cy="0" r="60" fill="none" stroke="#b98f6a" strokeWidth="3" />
      </g>

      {/* 木茶桌（占据下半屏） */}
      <rect x="0" y="392" width="390" height="168" fill="url(#hztb-table)" />
      <line x1="0" y1="392" x2="390" y2="392" stroke="#ad8f68" strokeWidth="3" opacity="0.7" />

      {/* 盖碗（左） */}
      <g transform="translate(58,330)">
        <ellipse cx="46" cy="62" rx="46" ry="13" fill="#efe7d6" stroke="#c3b49a" strokeWidth="1.4" />
        <path d="M8 14 Q46 4 84 14 L79 52 Q46 62 14 52 Z" fill="#f5edde" stroke="#c3b49a" strokeWidth="1.6" />
        <ellipse cx="46" cy="14" rx="40" ry="11" fill="#f8f1e4" stroke="#c3b49a" strokeWidth="1.6" />
        <ellipse cx="46" cy="13" rx="16" ry="4.6" fill="url(#hztb-liquor)" opacity="0.85" />
      </g>

      {/* 公道杯（中） */}
      <g transform="translate(170,342)">
        <path d="M6 0 Q30 -6 54 0 L50 44 Q30 52 10 44 Z" fill="#f5edde" stroke="#c3b49a" strokeWidth="1.6" />
        <path d="M12 30 Q30 34 48 30 L46 42 Q30 48 14 42 Z" fill="url(#hztb-liquor)" opacity="0.85" />
      </g>

      {/* 品茗杯（右） */}
      <g transform="translate(258,352)">
        <path d="M2 0 Q18 -4 34 0 L30 28 Q18 33 6 28 Z" fill="#f5edde" stroke="#c3b49a" strokeWidth="1.5" />
        <path d="M6 16 Q18 20 30 16 L28 27 Q18 31 8 27 Z" fill="url(#hztb-liquor)" opacity="0.8" />
      </g>

      {/* 茶点小碟（最右） */}
      <g transform="translate(306,376)">
        <ellipse cx="30" cy="12" rx="30" ry="9" fill="#f4ecdd" stroke="#c3b49a" strokeWidth="1.2" />
        <circle cx="22" cy="9" r="5.4" fill="#c9a86a" />
        <circle cx="38" cy="10" r="4.6" fill="#b98f6a" />
      </g>
    </svg>
  );
}
