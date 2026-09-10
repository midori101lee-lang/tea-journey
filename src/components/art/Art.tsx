/** 简笔淡彩 SVG 器物与叶片（全内联，零位图） */

export function TeaLeafSvg({ color = '#a8c58a', size = 28, withered = false, redEdge = 0 }: {
  color?: string; size?: number; withered?: boolean; redEdge?: number;
}) {
  const edge = redEdge > 0.25 ? '#b45a3c' : color;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: withered ? 'rotate(18deg) scaleY(0.9)' : undefined, transition: 'transform .5s' }}>
      <path d="M12 2 C17 6 19 12 16 18 C14 21 10 21 8 18 C5 12 7 6 12 2 Z" fill={color} stroke="#5a6b4a" strokeWidth="0.8" />
      {redEdge > 0 && <path d="M16 18 C19 12 17 6 12 2 C15 7 17 12 14.5 17.5 Z" fill={edge} opacity={Math.min(1, redEdge)} />}
      <path d="M12 4 L12 19" stroke="#5a6b4a" strokeWidth="0.7" fill="none" />
    </svg>
  );
}

export function BasketSvg({ width = 64 }: { width?: number }) {
  return (
    <svg width={width} height={width * 0.72} viewBox="0 0 64 46">
      <path d="M6 14 Q32 4 58 14 L52 42 Q32 48 12 42 Z" fill="#c8a98a" stroke="#8a6f52" strokeWidth="1.2" />
      <path d="M10 20 L54 20 M11 27 L53 27 M13 34 L51 34" stroke="#8a6f52" strokeWidth="0.8" fill="none" />
      <path d="M20 14 Q32 2 44 14" fill="none" stroke="#8a6f52" strokeWidth="1.4" />
    </svg>
  );
}

export function WokSvg({ width = 200, heat = 0.5, leafColor = '#7a8a5a' }: { width?: number; heat?: number; leafColor?: string }) {
  const flameH = 8 + heat * 16;
  return (
    <svg width={width} height={width * 0.62} viewBox="0 0 200 124">
      <ellipse cx="100" cy="52" rx="82" ry="30" fill="#4a4642" stroke="#2e2a26" strokeWidth="1.5" />
      <ellipse cx="100" cy="48" rx="70" ry="22" fill={leafColor} opacity="0.9" />
      <rect x="70" y="80" width="60" height="18" rx="4" fill="#6b6259" />
      <path d={`M78 ${118 - flameH} Q86 ${100 - flameH} 94 ${118 - flameH} Q102 ${96 - flameH} 110 ${118 - flameH} Q118 ${100 - flameH} 126 ${118 - flameH} Z`} fill="#d86a30" opacity={0.4 + heat * 0.6} />
      {heat > 0.75 && <circle cx="100" cy={112 - flameH} r="3" fill="#f0a24b" />}
    </svg>
  );
}

export function SieveSvg({ width = 240, children }: { width?: number; children?: React.ReactNode }) {
  return (
    <svg width={width} height={width * 0.66} viewBox="0 0 240 158">
      <ellipse cx="120" cy="82" rx="108" ry="58" fill="#e3d3b4" stroke="#a98c62" strokeWidth="1.6" />
      <ellipse cx="120" cy="78" rx="96" ry="50" fill="#efe3c8" />
      {children}
    </svg>
  );
}

export function RoastPotSvg({ width = 220 }: { width?: number }) {
  return (
    <svg width={width} height={width * 0.6} viewBox="0 0 220 132">
      <path d="M30 40 L190 40 L172 108 L48 108 Z" fill="#c9b08c" stroke="#8a6f52" strokeWidth="1.5" />
      <rect x="52" y="20" width="116" height="14" rx="6" fill="#8a6f52" />
      <path d="M64 108 L58 124 M156 108 L162 124" stroke="#6b6259" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function TeaLeavesPile({ width = 120, color = '#5c4a34', curled = false, broken = false }: {
  width?: number; color?: string; curled?: boolean; broken?: boolean;
}) {
  return (
    <svg width={width} height={width * 0.5} viewBox="0 0 120 60">
      {broken ? (
        <g fill={color}>
          <rect x="20" y="34" width="14" height="4" rx="2" transform="rotate(12 27 36)" />
          <rect x="48" y="26" width="12" height="4" rx="2" transform="rotate(-18 54 28)" />
          <rect x="74" y="36" width="16" height="4" rx="2" transform="rotate(24 82 38)" />
          <rect x="40" y="44" width="10" height="3" rx="1.5" transform="rotate(-8 45 45)" />
        </g>
      ) : curled ? (
        <g fill={color} stroke="#2e2a26" strokeWidth="0.4">
          <path d="M24 40 q10 -14 20 -2 q-8 10 -20 2 Z" />
          <path d="M52 32 q12 -12 22 0 q-10 10 -22 0 Z" />
          <path d="M78 42 q10 -12 20 -2 q-8 10 -20 2 Z" />
          <path d="M40 48 q8 -10 16 -2 q-6 8 -16 2 Z" />
        </g>
      ) : (
        <g fill={color} stroke="#2e2a26" strokeWidth="0.4">
          <ellipse cx="34" cy="42" rx="16" ry="6" />
          <ellipse cx="62" cy="36" rx="18" ry="7" />
          <ellipse cx="88" cy="44" rx="14" ry="5" />
        </g>
      )}
    </svg>
  );
}

export function SunMoonIcon({ sun }: { sun: boolean }) {
  return sun ? (
    <svg width="26" height="26" viewBox="0 0 26 26">
      <circle cx="13" cy="13" r="6" fill="#d8a23c" />
      <g stroke="#d8a23c" strokeWidth="1.6" strokeLinecap="round">
        <path d="M13 2v3M13 21v3M2 13h3M21 13h3M5 5l2 2M19 19l2 2M21 5l-2 2M7 19l-2 2" />
      </g>
    </svg>
  ) : (
    <svg width="26" height="26" viewBox="0 0 26 26">
      <path d="M16 4 a8 8 0 1 0 6 12 a9 9 0 1 1 -6 -12 Z" fill="#8a97a8" />
    </svg>
  );
}

/** 盖碗（工夫茶冲泡）：盖 + 碗 + 托。支持泡茶状态：叶/汤/汽/揭盖 */
export function GaiwanSvg({ width = 150, fill = '#efe7d6', liquor, leaves = false, steam = false, lid = true }: {
  width?: number; fill?: string; liquor?: string; leaves?: boolean; steam?: boolean; lid?: boolean;
}) {
  return (
    <svg width={width} height={width * 0.86} viewBox="0 0 150 130">
      {/* 汽（揭盖闻香时浮现） */}
      {steam && (
        <g stroke="#cbbfa6" strokeWidth="2" fill="none" opacity="0.65" strokeLinecap="round">
          <path d="M62 50 q-5 -9 1 -16 q-5 -9 1 -15" />
          <path d="M88 50 q5 -9 -1 -16 q5 -9 -1 -15" />
        </g>
      )}
      {/* 托 */}
      <ellipse cx="75" cy="116" rx="52" ry="11" fill="#cbb79a" stroke="#8a6f52" strokeWidth="1.4" />
      {/* 碗 */}
      <path d="M30 70 Q75 60 120 70 L108 102 Q75 116 42 102 Z" fill={fill} stroke="#8a6f52" strokeWidth="1.6" />
      {/* 干茶 */}
      {leaves && (
        <g fill="#5c4a34" stroke="#2e2a26" strokeWidth="0.3">
          <ellipse cx="62" cy="92" rx="9" ry="3.4" transform="rotate(-12 62 92)" />
          <ellipse cx="82" cy="94" rx="10" ry="3.6" transform="rotate(10 82 94)" />
          <ellipse cx="72" cy="98" rx="8" ry="3" />
        </g>
      )}
      {/* 茶汤 */}
      {liquor && <path d="M38 78 Q75 70 112 78 L104 96 Q75 106 46 96 Z" fill={liquor} opacity="0.92" />}
      {/* 碗口 */}
      {!lid && <path d="M34 66 Q75 58 116 66" stroke="#8a6f52" strokeWidth="1.4" fill="none" />}
      {/* 盖 */}
      {lid && (
        <g>
          <ellipse cx="75" cy="64" rx="48" ry="13" fill="#f1e8d8" stroke="#8a6f52" strokeWidth="1.6" />
          <circle cx="75" cy="54" r="4" fill="#8a6f52" />
        </g>
      )}
    </svg>
  );
}

/** 水壶（烧水/注水）：boil=沸腾强度(0-1 气泡与汽)，pour=注水水流 */
export function KettleSvg({ width = 90, boil = 0, pour = false }: { width?: number; boil?: number; pour?: boolean }) {
  const bubble = (cx: number, cy: number, r: number, thr: number) =>
    boil > thr ? <circle cx={cx} cy={cy} r={r} fill="#e9eef0" opacity={0.7} /> : null;
  return (
    <svg width={width} height={width * 0.9} viewBox="0 0 90 80">
      <path d="M20 30 Q45 20 70 30 L66 58 Q45 66 24 58 Z" fill="#b9c2c8" stroke="#6b7480" strokeWidth="1.4" />
      <path d="M70 34 Q86 32 84 48" fill="none" stroke="#6b7480" strokeWidth="3" strokeLinecap="round" />
      <rect x="38" y="16" width="14" height="8" rx="3" fill="#6b7480" />
      {bubble(45, 48, 3, 0.2)} {bubble(56, 43, 2.4, 0.4)} {bubble(38, 46, 2, 0.55)} {bubble(61, 50, 2.6, 0.7)}
      {boil > 0.3 && (
        <g stroke="#cbbfa6" strokeWidth="1.6" fill="none" opacity="0.6" strokeLinecap="round">
          <path d="M40 16 q-3 -6 2 -10" /><path d="M52 16 q3 -6 -2 -10" />
        </g>
      )}
      {pour && <path d="M84 48 Q90 64 80 78" stroke="#9fc0d8" strokeWidth="2.6" fill="none" strokeLinecap="round" opacity="0.85" />}
    </svg>
  );
}

/** 公道杯（出汤承接）：liquor=已入杯的茶汤色 */
export function GongDaoSvg({ width = 92, liquor }: { width?: number; liquor?: string }) {
  return (
    <svg width={width} height={width * 0.86} viewBox="0 0 92 80">
      <path d="M24 24 L68 24 L60 64 Q46 72 32 64 Z" fill="#efe7d6" stroke="#8a6f52" strokeWidth="1.4" />
      <path d="M68 28 Q84 28 82 46" fill="none" stroke="#8a6f52" strokeWidth="3" strokeLinecap="round" />
      {liquor && <path d="M30 40 Q46 34 62 40 L56 60 Q46 66 36 60 Z" fill={liquor} opacity="0.9" />}
    </svg>
  );
}

/**
 * 一梢茶（采茶判断单位）。
 * 成熟度靠「芽叶关系 + 叶片大小/张开度」表达：
 * - tender 太嫩：芽大、叶小而卷、未展开
 * - good   中开面：芽叶匀称、叶片展开、大小适中
 * - old    偏老：芽退化、叶片大而张开下倾
 * 颜色仅为同色系深浅，不作为唯一答案。
 */
export function TeaShootSvg({ kind = 'good', size = 46 }: { kind?: 'tender' | 'good' | 'old'; size?: number }) {
  const c = kind === 'tender'
    ? {
        stem: 'M20 54 L20 22',
        bud: 'M20 22 Q16 13 20 5 Q24 13 20 22 Z',
        leaves: ['M20 40 Q11 38 9 30 Q15 30 20 36 Z', 'M20 40 Q29 38 31 30 Q25 30 20 36 Z'],
        color: '#c3d9a4', stroke: '#93ab74',
      }
    : kind === 'old'
    ? {
        stem: 'M20 54 L20 26',
        bud: 'M20 27 Q18 23 20 20 Q22 23 20 27 Z',
        leaves: ['M20 48 Q4 47 0 38 Q10 35 20 44 Z', 'M20 42 Q36 41 40 32 Q30 29 20 38 Z', 'M20 33 Q8 32 4 24 Q14 22 20 29 Z'],
        color: '#7e8b62', stroke: '#5c6b47',
      }
    : {
        stem: 'M20 54 L20 20',
        bud: 'M20 21 Q17 15 20 9 Q23 15 20 21 Z',
        leaves: ['M20 46 Q8 44 5 34 Q13 33 20 42 Z', 'M20 40 Q32 38 35 28 Q27 27 20 36 Z', 'M20 30 Q11 28 8 20 Q16 20 20 26 Z'],
        color: '#8fae6a', stroke: '#6b8550',
      };
  return (
    <svg width={size} height={size * 1.35} viewBox="0 0 40 56" role="img" aria-label="茶梢">
      <path d={c.stem} stroke="#6b7a4a" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      {c.leaves.map((d, i) => (
        <path key={i} d={d} fill={c.color} stroke={c.stroke} strokeWidth="0.7" />
      ))}
      <path d={c.bud} fill={c.color} stroke={c.stroke} strokeWidth="0.7" />
    </svg>
  );
}

