/**
 * 武夷山茶园（户外）。淡天 + 远山 + 茶垄曲线 + 竹篱 + 近景茶树。
 * 阿秀由透明人物层叠加在茶园中（侧身采茶，见 index.ts focus）。
 */
export function TeaGardenScene() {
  return (
    <svg viewBox="0 0 390 560" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" role="img" aria-label="武夷山茶园">
      <defs>
        <linearGradient id="tg-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eef3ea" />
          <stop offset="1" stopColor="#e2ecdb" />
        </linearGradient>
        <linearGradient id="tg-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbfdf8" stopOpacity="0" />
          <stop offset="1" stopColor="#fbfdf8" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="390" height="318" fill="url(#tg-sky)" />
      {/* 远山 */}
      <path d="M0 218 Q70 182 150 212 T300 202 Q350 198 390 214 L390 320 0 320 Z" fill="#cdd6c4" opacity="0.6" />
      <path d="M0 268 Q90 238 180 266 T390 256 L390 320 0 320 Z" fill="#b6c4a3" opacity="0.85" />
      {/* 茶垄（成排曲线，绿） */}
      <g stroke="#9fb37c" strokeWidth="4" fill="none" opacity="0.8" strokeLinecap="round">
        <path d="M0 350 Q100 330 200 352 T390 344" />
        <path d="M0 392 Q110 372 210 394 T390 386" />
        <path d="M0 438 Q120 418 230 440 T390 432" />
        <path d="M0 490 Q120 472 240 492 T390 484" />
      </g>
      {/* 地面淡绿压底 */}
      <rect x="0" y="470" width="390" height="90" fill="#9fb37c" opacity="0.32" />
      {/* 竹篱（前景右） */}
      <g transform="translate(286,392)" stroke="#b89c72" strokeWidth="3" strokeLinecap="round">
        <line x1="0" y1="0" x2="0" y2="120" /><line x1="20" y1="0" x2="20" y2="120" /><line x1="40" y1="0" x2="40" y2="120" />
        <line x1="-8" y1="20" x2="50" y2="20" strokeWidth="2.4" /><line x1="-8" y1="64" x2="50" y2="64" strokeWidth="2.4" />
      </g>
      {/* 近景茶树丛（左前景，做边框） */}
      <g transform="translate(8,470)" fill="#7f965c" stroke="#5c6f44" strokeWidth="1">
        <path d="M0 56 Q-8 26 6 8 Q22 26 14 56 Z" />
        <path d="M20 58 Q12 28 30 10 Q46 28 36 58 Z" />
        <path d="M40 56 Q32 26 48 8 Q64 26 56 56 Z" />
      </g>
      <rect x="0" y="430" width="390" height="130" fill="url(#tg-haze)" />
    </svg>
  );
}
