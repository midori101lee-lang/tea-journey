/**
 * 老陈的茶馆（室内）。暖墙 + 木地板 + 茶桌（盖碗/壶/公道）+ 背景茶柜茶罐 + 窗透茶山 + 暖灯 + 小灯笼。
 * 老陈由透明人物层叠加在茶桌后（见 index.ts focus）。
 */
export function TeaHouseScene() {
  return (
    <svg viewBox="0 0 390 560" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" role="img" aria-label="老陈的茶馆">
      <defs>
        <linearGradient id="th-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ecdcbf" />
          <stop offset="1" stopColor="#ddc9a8" />
        </linearGradient>
        <linearGradient id="th-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cbb38c" />
          <stop offset="1" stopColor="#bda476" />
        </linearGradient>
        <radialGradient id="th-glow" cx="0.5" cy="0.12" r="0.7">
          <stop offset="0" stopColor="#fff4d8" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff4d8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="390" height="366" fill="url(#th-wall)" />
      <rect x="0" y="366" width="390" height="194" fill="url(#th-floor)" />
      {/* 地板木纹 */}
      <g stroke="#b1936a" strokeWidth="1" opacity="0.4">
        <path d="M0 404 H390" /><path d="M0 446 H390" /><path d="M0 494 H390" /><path d="M0 540 H390" />
      </g>
      {/* 暖灯光晕 */}
      <rect x="0" y="0" width="390" height="320" fill="url(#th-glow)" />
      {/* 窗（右）：透出淡青茶山 + 云雾 */}
      <g transform="translate(250,70)">
        <rect x="0" y="0" width="104" height="150" rx="4" fill="#cfdacb" />
        <path d="M4 98 Q42 72 76 94 T104 88 L104 150 0 150 Z" fill="#a6b389" opacity="0.9" />
        <ellipse cx="58" cy="64" rx="58" ry="12" fill="#fbf7ee" opacity="0.5" />
        <rect x="-5" y="-5" width="114" height="160" rx="6" fill="none" stroke="#8a6f52" strokeWidth="6" />
        <line x1="52" y1="-5" x2="52" y2="155" stroke="#8a6f52" strokeWidth="5" />
        <line x1="-5" y1="72" x2="109" y2="72" stroke="#8a6f52" strokeWidth="5" />
      </g>
      {/* 背景茶柜（左）+ 茶罐 */}
      <g transform="translate(20,82)">
        <rect x="0" y="0" width="104" height="184" rx="4" fill="#b89a70" stroke="#8a6f52" strokeWidth="2" />
        <rect x="8" y="10" width="88" height="46" rx="2" fill="#a98a5e" stroke="#8a6f52" strokeWidth="1" />
        <rect x="8" y="64" width="88" height="46" rx="2" fill="#a98a5e" stroke="#8a6f52" strokeWidth="1" />
        <rect x="8" y="118" width="88" height="46" rx="2" fill="#a98a5e" stroke="#8a6f52" strokeWidth="1" />
        <g fill="#9d7e54" stroke="#7c5f3c" strokeWidth="1">
          <ellipse cx="26" cy="26" rx="11" ry="12" /><ellipse cx="52" cy="26" rx="11" ry="12" /><ellipse cx="78" cy="26" rx="11" ry="12" />
          <ellipse cx="26" cy="80" rx="11" ry="12" /><ellipse cx="52" cy="80" rx="11" ry="12" /><ellipse cx="78" cy="80" rx="11" ry="12" />
          <ellipse cx="26" cy="134" rx="11" ry="12" /><ellipse cx="52" cy="134" rx="11" ry="12" /><ellipse cx="78" cy="134" rx="11" ry="12" />
        </g>
        <g fill="#c9b48a"><circle cx="26" cy="16" r="3" /><circle cx="52" cy="16" r="3" /><circle cx="78" cy="16" r="3" /><circle cx="26" cy="70" r="3" /><circle cx="52" cy="70" r="3" /><circle cx="78" cy="70" r="3" /><circle cx="26" cy="124" r="3" /><circle cx="52" cy="124" r="3" /><circle cx="78" cy="124" r="3" /></g>
      </g>
      {/* 小灯笼 */}
      <g transform="translate(338,92)">
        <line x1="6" y1="-18" x2="6" y2="-4" stroke="#8a6f52" strokeWidth="1.5" />
        <ellipse cx="6" cy="8" rx="13" ry="16" fill="#c0584e" opacity="0.92" />
        <path d="M-7 8 Q6 16 19 8" stroke="#9b3f37" strokeWidth="1.4" fill="none" />
        <line x1="6" y1="24" x2="6" y2="34" stroke="#9b3f37" strokeWidth="1.4" />
      </g>
      {/* 茶桌（中部，老陈坐其后） */}
      <g transform="translate(96,352)">
        <rect x="0" y="0" width="200" height="18" rx="4" fill="#b58d5b" stroke="#8a6f52" strokeWidth="2" />
        <rect x="14" y="18" width="14" height="66" fill="#9c7d52" />
        <rect x="172" y="18" width="14" height="66" fill="#9c7d52" />
        {/* 桌上：盖碗 */}
        <g transform="translate(36,2)">
          <ellipse cx="16" cy="20" rx="17" ry="5" fill="#cbb79a" stroke="#8a6f52" strokeWidth="1" />
          <path d="M6 11 Q16 7 26 11 L23 21 Q16 25 9 21 Z" fill="#efe7d6" stroke="#8a6f52" strokeWidth="1.1" />
          <ellipse cx="16" cy="9" rx="13" ry="4" fill="#f1e8d8" stroke="#8a6f52" strokeWidth="1.1" />
        </g>
        {/* 桌上：紫砂壶 */}
        <g transform="translate(118,2)">
          <path d="M0 8 Q15 0 30 8 L26 24 Q15 30 4 24 Z" fill="#9c6f4e" stroke="#6e4a30" strokeWidth="1.2" />
          <path d="M30 11 Q40 10 38 18" fill="none" stroke="#6e4a30" strokeWidth="2.4" strokeLinecap="round" />
          <rect x="11" y="1" width="9" height="5" rx="2" fill="#6e4a30" />
        </g>
        {/* 桌上：公道杯 */}
        <g transform="translate(84,5)">
          <path d="M0 6 L22 6 L19 22 L3 22 Z" fill="#efe7d6" stroke="#8a6f52" strokeWidth="1.1" />
          <ellipse cx="11" cy="6" rx="11" ry="3.4" fill="#cbb79a" opacity="0.7" />
        </g>
      </g>
    </svg>
  );
}
