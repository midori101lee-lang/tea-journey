/**
 * 杭州制茶坊（占位 SVG）。方向：江南明亮作坊 —— 米白墙、浅木案、
 * 竹匾（揉捻用）、竹筐（发酵堆）、烘笼（烘干）、窗外茶山。
 * 强调红茶这条线（萎凋/揉捻/发酵/烘干），与武夷山灶火焙笼的岩茶坊区分。
 */
export function HangzhouWorkshopScene() {
  return (
    <svg viewBox="0 0 390 560" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" role="img" aria-label="杭州制茶坊">
      <defs>
        <linearGradient id="hzw-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7f2e8" />
          <stop offset="1" stopColor="#efe7d7" />
        </linearGradient>
        <linearGradient id="hzw-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ddc9a6" />
          <stop offset="1" stopColor="#cbb086" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="390" height="436" fill="url(#hzw-wall)" />
      <rect x="0" y="436" width="390" height="124" fill="url(#hzw-floor)" />
      <line x1="0" y1="436" x2="390" y2="436" stroke="#b9a074" strokeWidth="3" opacity="0.55" />

      {/* 高窗（右）——窗外茶山 */}
      <g transform="translate(258,64)">
        <rect x="0" y="0" width="104" height="132" rx="5" fill="#e9f1e8" stroke="#b98f6a" strokeWidth="5" />
        <path d="M8 84 Q46 60 96 80 L96 124 8 124 Z" fill="#b9cba6" opacity="0.85" />
        <path d="M8 104 Q48 90 96 100 L96 124 8 124 Z" fill="#a2bd88" opacity="0.9" />
        <line x1="52" y1="0" x2="52" y2="132" stroke="#b98f6a" strokeWidth="4" />
        <line x1="0" y1="66" x2="104" y2="66" stroke="#b98f6a" strokeWidth="4" />
      </g>

      {/* 墙上挂的竹匾（装饰） */}
      <g transform="translate(40,92)">
        <ellipse cx="46" cy="46" rx="46" ry="46" fill="#e3cd8f" stroke="#b08f4f" strokeWidth="3" />
        <ellipse cx="46" cy="46" rx="34" ry="34" fill="none" stroke="#c2a768" strokeWidth="1.6" />
        <g fill="#8fae6a" stroke="#5c6f44" strokeWidth="0.6">
          <ellipse cx="36" cy="40" rx="9" ry="4" transform="rotate(-18 36 40)" />
          <ellipse cx="52" cy="44" rx="9" ry="4" transform="rotate(14 52 44)" />
          <ellipse cx="44" cy="54" rx="8" ry="3.6" transform="rotate(-4 44 54)" />
        </g>
      </g>

      {/* 长木案（前景中） */}
      <g transform="translate(30,376)">
        <rect x="0" y="0" width="330" height="22" rx="5" fill="#dcc39c" stroke="#ad8f68" strokeWidth="2" />
        <rect x="20" y="22" width="16" height="84" fill="#c2a67e" />
        <rect x="294" y="22" width="16" height="84" fill="#c2a67e" />
      </g>

      {/* 揉捻竹匾（案上左） */}
      <g transform="translate(56,344)">
        <ellipse cx="42" cy="20" rx="42" ry="15" fill="#e6d39a" stroke="#b08f4f" strokeWidth="2" />
        <ellipse cx="42" cy="17" rx="30" ry="9" fill="none" stroke="#c2a768" strokeWidth="1.2" />
        <g fill="#6f9048"><ellipse cx="34" cy="15" rx="8" ry="3" /><ellipse cx="48" cy="17" rx="8" ry="3" /></g>
      </g>

      {/* 发酵竹筐（案上右，堆着转红的叶子） */}
      <g transform="translate(226,326)">
        <ellipse cx="44" cy="44" rx="44" ry="16" fill="#c8a98a" stroke="#8a6f52" strokeWidth="2" />
        <path d="M4 44 Q4 8 44 8 Q84 8 84 44" fill="none" stroke="#8a6f52" strokeWidth="2" />
        <path d="M10 28 L78 28 M12 36 L76 36" stroke="#8a6f52" strokeWidth="1.2" opacity="0.7" />
        <g fill="#a85a3e" opacity="0.9">
          <ellipse cx="34" cy="8" rx="12" ry="6" />
          <ellipse cx="52" cy="6" rx="12" ry="6" />
        </g>
      </g>

      {/* 烘笼（右下地面） */}
      <g transform="translate(300,466)">
        <ellipse cx="34" cy="66" rx="34" ry="12" fill="#c2a67e" stroke="#8a6f52" strokeWidth="1.6" />
        <path d="M6 66 Q6 22 34 22 Q62 22 62 66" fill="none" stroke="#8a6f52" strokeWidth="2" />
        <path d="M4 40 Q34 30 64 40" fill="none" stroke="#8a6f52" strokeWidth="1.6" />
        <ellipse cx="34" cy="22" rx="28" ry="8" fill="#e6d39a" stroke="#b08f4f" strokeWidth="1.6" />
      </g>
    </svg>
  );
}
