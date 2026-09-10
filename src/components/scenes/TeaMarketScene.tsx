/**
 * 茶集市（露天）。暖木棚 + 茶摊 + 灯笼 + 背景丹霞茶山。
 * 小满由透明人物层叠加在摊位前（见 index.ts figure）。内联 SVG，零位图。
 */
export function TeaMarketScene() {
  return (
    <svg viewBox="0 0 390 560" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" role="img" aria-label="茶集市">
      <defs>
        <linearGradient id="mk-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e8d9b8" />
          <stop offset="1" stopColor="#dcc7a2" />
        </linearGradient>
        <linearGradient id="mk-hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b08a63" />
          <stop offset="1" stopColor="#9a7048" />
        </linearGradient>
        <linearGradient id="mk-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c8ab7e" />
          <stop offset="1" stopColor="#b8996c" />
        </linearGradient>
      </defs>
      {/* 天空 */}
      <rect x="0" y="0" width="390" height="300" fill="url(#mk-sky)" />
      {/* 远处丹霞茶山 */}
      <path d="M0 300 Q70 210 150 250 T300 220 T390 260 L390 300 0 300 Z" fill="url(#mk-hill)" opacity="0.95" />
      <path d="M0 300 Q90 245 190 268 T390 250 L390 300 0 300 Z" fill="#a87f55" opacity="0.7" />
      {/* 地面 */}
      <rect x="0" y="300" width="390" height="260" fill="url(#mk-ground)" />
      {/* 木棚顶（横向竹棚） */}
      <g transform="translate(40,108)">
        <rect x="0" y="0" width="310" height="16" rx="3" fill="#8a6f52" />
        <g stroke="#7c5f3c" strokeWidth="2">
          <line x1="14" y1="16" x2="14" y2="60" />
          <line x1="150" y1="16" x2="150" y2="60" />
          <line x1="296" y1="16" x2="296" y2="60" />
        </g>
        {/* 棚下茶幡 */}
        <rect x="44" y="16" width="40" height="64" rx="3" fill="#c0584e" opacity="0.92" />
        <text x="64" y="44" fontSize="16" fill="#fff4e0" textAnchor="middle" fontFamily="serif">茶</text>
        <text x="64" y="66" fontSize="16" fill="#fff4e0" textAnchor="middle" fontFamily="serif">市</text>
      </g>
      {/* 摊位长桌（小满立于前） */}
      <g transform="translate(70,360)">
        <rect x="0" y="0" width="250" height="20" rx="4" fill="#b58d5b" stroke="#8a6f52" strokeWidth="2" />
        <rect x="16" y="20" width="16" height="92" fill="#9c7d52" />
        <rect x="218" y="20" width="16" height="92" fill="#9c7d52" />
        {/* 桌上茶罐 */}
        <g fill="#9d7e54" stroke="#7c5f3c" strokeWidth="1">
          <ellipse cx="50" cy="6" rx="13" ry="14" />
          <ellipse cx="96" cy="6" rx="13" ry="14" />
          <ellipse cx="142" cy="6" rx="13" ry="14" />
          <ellipse cx="188" cy="6" rx="13" ry="14" />
        </g>
        <g fill="#c9b48a">
          <circle cx="50" cy="-4" r="3" /><circle cx="96" cy="-4" r="3" /><circle cx="142" cy="-4" r="3" /><circle cx="188" cy="-4" r="3" />
        </g>
        {/* 秤 */}
        <g transform="translate(214,2)" stroke="#6e4a30" strokeWidth="1.4" fill="none">
          <line x1="0" y1="0" x2="22" y2="0" />
          <line x1="22" y1="-6" x2="22" y2="10" />
          <path d="M14 -6 L30 -6 L26 8 L18 8 Z" fill="#e7dcc4" />
        </g>
      </g>
      {/* 灯笼串 */}
      <g>
        <line x1="20" y1="92" x2="370" y2="92" stroke="#8a6f52" strokeWidth="1.2" />
        <g fill="#c0584e" opacity="0.9">
          <ellipse cx="80" cy="104" rx="10" ry="13" />
          <ellipse cx="170" cy="104" rx="10" ry="13" />
          <ellipse cx="260" cy="104" rx="10" ry="13" />
          <ellipse cx="340" cy="104" rx="10" ry="13" />
        </g>
      </g>
    </svg>
  );
}
