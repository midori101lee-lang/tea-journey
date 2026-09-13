import type { ReactElement } from 'react';

/**
 * 茶漫画插画：全内联 SVG，手绘线稿 + 轻水彩 + 纸张纹理。
 * 画布固定 viewBox 0 0 100 70（不改现有尺寸）；不使用位图、不引外部资源。
 */

const INK = '#4a4034';   // 手绘线稿色（不用纯黑，更接近墨线）
const PAPER = '#f7f0e3'; // 纸底

/** 各分镜画面：key 与 comics.ts 中 panel.art 对应 */
const ART: Record<string, ReactElement> = {
  // 采下的青叶，还带青气
  'fresh-leaf': (
    <g>
      <ellipse cx="50" cy="48" rx="31" ry="12" fill="#e6d3ab" stroke={INK} strokeWidth="1.1" />
      <ellipse cx="50" cy="46" rx="27" ry="9.5" fill="#f1e5c8" opacity="0.8" />
      <path d="M34 46 q7 -8 15 -8 q-6 8 -15 8z" fill="#93b06d" stroke={INK} strokeWidth="0.9" />
      <path d="M44 48 q9 -7 17 -5 q-8 5 -17 5z" fill="#a8c47e" stroke={INK} strokeWidth="0.9" />
      <path d="M40 43 q6 -6 12 -6 q-5 6 -12 6z" fill="#7f9d5c" stroke={INK} strokeWidth="0.9" />
      <path d="M36 30 q4 -6 1 -12" stroke="#8fb37c" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.8" />
      <path d="M50 28 q4 -7 1 -13" stroke="#8fb37c" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.8" />
      <path d="M64 30 q3 -6 -1 -11" stroke="#8fb37c" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.8" />
    </g>
  ),

  // 摇青：叶缘被碰伤
  'leaf-edge-red': (
    <g>
      <ellipse cx="50" cy="40" rx="28" ry="11" fill="#e6d3ab" stroke={INK} strokeWidth="1.1" />
      <ellipse cx="50" cy="38" rx="24" ry="9" fill="#f1e5c8" opacity="0.75" />
      <path d="M62 22 l10 -8" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M16 24 q6 4 11 0 M73 26 q6 4 11 0" stroke={INK} strokeWidth="1" fill="none" opacity="0.45" strokeLinecap="round" />
      <path d="M34 42 q8 -12 18 -14 q10 2 14 12 q-8 8 -18 8 q-10 0 -14 -6z" fill="#8fae6a" stroke={INK} strokeWidth="1" />
      <path d="M52 28 q10 2 14 12 q-4 4 -8 5 q-2 -9 -6 -17z" fill="#b4553a" opacity="0.85" />
      <path d="M34 42 q10 -8 32 -13" stroke={INK} strokeWidth="0.8" fill="none" opacity="0.55" />
    </g>
  ),

  // 绿叶红镶边（特写）
  'red-edge-closeup': (
    <g>
      <path d="M50 8 C68 22 74 44 62 60 C55 68 45 68 38 60 C26 44 32 22 50 8 Z" fill="#93b06d" stroke={INK} strokeWidth="1.2" />
      <path d="M62 60 C74 44 68 22 50 8 C60 30 66 46 56 59 Z" fill="#b4553a" opacity="0.9" />
      <path d="M56 59 C66 46 60 30 50 8" stroke="#8e3f2a" strokeWidth="1.6" fill="none" opacity="0.85" strokeLinecap="round" />
      <path d="M50 14 L50 64" stroke={INK} strokeWidth="1" opacity="0.65" />
      <path d="M50 30 l8 -5 M50 40 l9 -5 M50 50 l8 -4" stroke={INK} strokeWidth="0.7" opacity="0.45" />
    </g>
  ),

  // 岩伯说：别照着数摇
  'shake-tray': (
    <g>
      <ellipse cx="50" cy="38" rx="30" ry="12" fill="#e6d3ab" stroke={INK} strokeWidth="1.2" />
      <ellipse cx="50" cy="36" rx="26" ry="9.5" fill="#f1e5c8" opacity="0.8" />
      <path d="M40 30 q6 -8 13 -9 q-5 9 -13 9z" fill="#93b06d" stroke={INK} strokeWidth="0.9" />
      <path d="M58 26 q5 -7 11 -7 q-4 7 -11 7z" fill="#a8c47e" stroke={INK} strokeWidth="0.9" />
      <path d="M30 24 q4 -6 9 -6 q-3 6 -9 6z" fill="#b4553a" opacity="0.8" stroke={INK} strokeWidth="0.8" />
      <path d="M14 34 q10 -10 20 -4 M86 34 q-10 -10 -20 -4" stroke={INK} strokeWidth="1" fill="none" opacity="0.45" strokeLinecap="round" />
    </g>
  ),

  // 丹霞红岩
  'red-rock': (
    <g>
      <path d="M0 34 q18 -14 34 -4 q14 -12 30 -2 q18 -10 36 2 L100 70 L0 70 Z" fill="#cfd8c0" opacity="0.55" />
      <path d="M8 62 L28 16 L44 62 Z" fill="#b8674b" stroke={INK} strokeWidth="1.1" />
      <path d="M46 62 L66 12 L88 62 Z" fill="#c87a58" stroke={INK} strokeWidth="1.1" />
      <path d="M18 42 L38 42 M20 52 L40 52 M58 34 L78 34 M56 48 L82 48" stroke="#8e4a33" strokeWidth="0.8" opacity="0.5" />
      <path d="M0 62 q50 -8 100 0 L100 70 L0 70 Z" fill="#9ab06a" />
      <path d="M12 62 l2 -6 M60 64 l2 -6 M84 62 l2 -6" stroke="#6f8a4a" strokeWidth="1" strokeLinecap="round" />
    </g>
  ),

  // 坑涧岩峰，日照与雾气
  'valley-mist': (
    <g>
      <path d="M6 62 L22 22 L34 62 Z" fill="#a9956f" stroke={INK} strokeWidth="1" />
      <path d="M30 62 L48 14 L64 62 Z" fill="#b8a37c" stroke={INK} strokeWidth="1.1" />
      <path d="M58 62 L76 26 L94 62 Z" fill="#a08c68" stroke={INK} strokeWidth="1" />
      <path d="M0 44 q16 -6 32 0 q14 -5 30 1 q16 -5 38 1" stroke="#ffffff" strokeWidth="4" fill="none" opacity="0.6" strokeLinecap="round" />
      <path d="M0 55 q20 -5 40 1 q16 -5 30 0 q14 -4 30 1" stroke="#ffffff" strokeWidth="3" fill="none" opacity="0.45" strokeLinecap="round" />
      <circle cx="82" cy="16" r="6" fill="#f0d79a" opacity="0.85" />
      <path d="M82 4 l0 -4 M82 32 l0 4 M70 16 l-4 0 M98 16 l4 0" stroke="#e0c078" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
    </g>
  ),

  // 老陈：山场就是茶的出身
  'shan-chang': (
    <g>
      <path d="M28 70 q0 -18 8 -24 q6 -5 14 -4 q8 -1 12 5 q7 6 6 23z" fill="#e3d3b4" stroke={INK} strokeWidth="1.1" />
      <circle cx="44" cy="36" r="8" fill="#f0dcc0" stroke={INK} strokeWidth="1.1" />
      <path d="M33 32 q11 -10 22 0z" fill="#c9b287" stroke={INK} strokeWidth="1" />
      <path d="M64 54 q0 8 8 8 q8 0 8 -8z" fill="#f2e8d4" stroke={INK} strokeWidth="1" />
      <path d="M64 54 l16 0" stroke={INK} strokeWidth="1" />
      <path d="M72 46 q2 -4 -1 -6 M78 48 q2 -4 -1 -6" stroke="#c9b79c" strokeWidth="0.9" fill="none" strokeLinecap="round" />
    </g>
  ),

  // 九龙窠崖壁上的老茶树
  'cliff-tree': (
    <g>
      <path d="M0 8 L34 8 L30 70 L0 70 Z" fill="#b8674b" stroke={INK} strokeWidth="1.1" />
      <path d="M62 8 L100 8 L100 70 L66 70 Z" fill="#a85e42" stroke={INK} strokeWidth="1.1" />
      <path d="M6 20 L28 20 M4 36 L26 36 M8 52 L28 52" stroke="#8e4a33" strokeWidth="0.9" opacity="0.5" />
      <path d="M70 24 L96 24 M72 44 L98 44" stroke="#8e4a33" strokeWidth="0.9" opacity="0.5" />
      <path d="M40 62 q0 -10 6 -14 q6 4 6 14z" fill="#6f8f4c" stroke={INK} strokeWidth="0.9" />
      <path d="M50 64 q0 -8 5 -11 q5 3 5 11z" fill="#7fa257" stroke={INK} strokeWidth="0.9" />
      <path d="M36 66 q4 -6 8 -6 q4 0 6 6z" fill="#5f7f3f" stroke={INK} strokeWidth="0.8" />
      <path d="M32 40 q6 -4 12 2" stroke="#7f9a5c" strokeWidth="1.2" fill="none" opacity="0.7" />
    </g>
  ),

  // 【传说】红袍披树
  'red-robe': (
    <g>
      <path d="M50 66 L50 40" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <path d="M50 44 q-10 -6 -14 -16 q12 0 14 12z" fill="#6f8f4c" stroke={INK} strokeWidth="0.9" />
      <path d="M50 46 q10 -6 14 -16 q-12 0 -14 12z" fill="#7fa257" stroke={INK} strokeWidth="0.9" />
      <path d="M36 34 q14 -12 28 0 q4 16 0 26 q-14 6 -28 0 q-4 -14 0 -26z" fill="#c0392b" opacity="0.72" stroke="#8e2b1f" strokeWidth="1" />
      <path d="M44 34 q6 -4 12 0" stroke="#e8b9ae" strokeWidth="1" fill="none" opacity="0.8" />
      <path d="M42 40 q2 14 0 20" stroke="#e8a89c" strokeWidth="1.2" fill="none" opacity="0.55" />
    </g>
  ),

  // 后来不再采摘
  'no-pick': (
    <g>
      <path d="M20 66 q0 -14 10 -18 q10 4 10 18z" fill="#6f8f4c" stroke={INK} strokeWidth="1" />
      <path d="M50 66 q0 -16 11 -20 q11 4 11 20z" fill="#7fa257" stroke={INK} strokeWidth="1" />
      <path d="M8 56 L92 56" stroke={INK} strokeWidth="1.6" />
      <path d="M8 62 L92 62" stroke={INK} strokeWidth="1.2" opacity="0.65" />
      <path d="M22 52 L22 66 M50 52 L50 66 M78 52 L78 66" stroke={INK} strokeWidth="1.4" />
      <rect x="60" y="30" width="26" height="14" rx="2" fill="#f2e8d4" stroke={INK} strokeWidth="1" />
      <path d="M64 37 L82 37" stroke={INK} strokeWidth="1.2" opacity="0.7" />
      <path d="M73 44 L73 52" stroke={INK} strokeWidth="1.2" />
    </g>
  ),

  // 老陈讲旧闻
  'laochen-talk': (
    <g>
      <path d="M30 70 q0 -20 10 -26 q8 -5 16 -3 q9 -2 14 6 q6 8 5 23z" fill="#e3d3b4" stroke={INK} strokeWidth="1.1" />
      <circle cx="46" cy="34" r="8.5" fill="#f0dcc0" stroke={INK} strokeWidth="1.1" />
      <path d="M35 30 q11 -10 22 0z" fill="#c9b287" stroke={INK} strokeWidth="1" />
      <path d="M64 30 q8 -2 14 2 M66 38 q10 -2 16 2 M68 46 q9 -2 14 2" stroke="#b3a68c" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.8" />
    </g>
  ),

  // 天没亮，背着竹篓上山
  'dawn-mountain': (
    <g>
      <rect width="100" height="42" fill="#dfe4e8" opacity="0.5" />
      <circle cx="84" cy="14" r="4" fill="#f2e6c0" stroke={INK} strokeWidth="0.7" />
      <path d="M0 46 q16 -16 30 -4 q12 -14 28 -2 q16 -12 42 0 L100 70 L0 70 Z" fill="#9aa8a0" opacity="0.8" stroke={INK} strokeWidth="1" />
      <path d="M18 70 q14 -14 34 -18 q16 -3 30 -10" stroke="#e0d6bc" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <circle cx="46" cy="42" r="4" fill="#f0dcc0" stroke={INK} strokeWidth="1" />
      <path d="M46 46 q0 8 -2 12 l4 0 q-2 -6 -2 -12z" fill="#7f8f76" stroke={INK} strokeWidth="0.9" />
      <path d="M42 48 q-8 2 -8 -6 q8 -2 8 6z" fill="#c9a469" stroke={INK} strokeWidth="1" />
      <path d="M46 58 l-3 8 M49 58 l3 8" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
    </g>
  ),

  // 开面采：要的是开面的叶子
  'open-leaf': (
    <g>
      <path d="M50 66 L50 20" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M50 26 q-12 -4 -16 -14 q14 -2 16 12z" fill="#a8c47e" stroke={INK} strokeWidth="1" />
      <path d="M50 38 q14 -4 18 -15 q-15 -2 -18 13z" fill="#93b06d" stroke={INK} strokeWidth="1" />
      <path d="M50 50 q-11 -3 -14 -12 q12 -2 14 11z" fill="#b6cd8b" stroke={INK} strokeWidth="1" />
      <path d="M50 20 q-3 -6 0 -9 q3 3 0 9z" fill="#cfe0a8" stroke={INK} strokeWidth="0.9" />
      <circle cx="74" cy="30" r="7" fill="none" stroke="#b4553a" strokeWidth="1" strokeDasharray="2 2" />
    </g>
  ),

  // 弯腰采茶的手
  'pick-hands': (
    <g>
      <path d="M0 58 q14 -10 26 -2 q12 -10 26 -2 q14 -8 26 -2 L100 70 L0 70 Z" fill="#7fa257" stroke={INK} strokeWidth="1" />
      <path d="M34 44 q10 -8 18 -2 q6 5 2 12 q-8 6 -16 2 q-6 -4 -4 -12z" fill="#f0dcc0" stroke={INK} strokeWidth="1.1" />
      <path d="M38 48 q8 -4 14 0 M38 53 q8 -4 14 0" stroke={INK} strokeWidth="0.8" opacity="0.55" />
      <path d="M56 40 q7 -6 12 -4 q-4 8 -12 4z" fill="#a8c47e" stroke={INK} strokeWidth="0.9" />
      <path d="M62 30 q6 -5 10 -3 q-3 7 -10 3z" fill="#93b06d" stroke={INK} strokeWidth="0.9" />
    </g>
  ),

  // 阿秀
  'axiu-talk': (
    <g>
      <path d="M28 70 q0 -18 9 -24 q7 -5 14 -4 q8 -1 12 6 q6 8 5 22z" fill="#dfc9a8" stroke={INK} strokeWidth="1.1" />
      <circle cx="44" cy="34" r="8" fill="#f0dcc0" stroke={INK} strokeWidth="1.1" />
      <path d="M33 30 q11 -9 22 0z" fill="#c2a877" stroke={INK} strokeWidth="1" />
      <path d="M56 52 q10 4 12 14 q-12 2 -16 -6z" fill="#c9a469" stroke={INK} strokeWidth="1" />
      <path d="M66 24 q8 -2 14 2 M68 32 q10 -2 14 2" stroke="#b3a68c" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.8" />
    </g>
  ),

  // ─────────── 杭州 · 九曲红梅 ───────────

  // 江南茶山 + 白墙黛瓦 + 湖
  'hz-tea-hills': (
    <g>
      <path d="M0 40 q16 -18 32 -6 q14 -16 30 -4 q18 -14 38 0 L100 70 L0 70 Z" fill="#c3d6bc" opacity="0.7" />
      <path d="M0 52 q20 -12 40 -2 q18 -10 34 0 q16 -8 26 0" stroke="#9dbb7f" strokeWidth="3" fill="none" opacity="0.8" strokeLinecap="round" />
      <path d="M0 60 q22 -10 44 -1 q20 -7 34 1" stroke="#8fae6a" strokeWidth="3" fill="none" opacity="0.75" strokeLinecap="round" />
      <rect x="12" y="36" width="22" height="12" fill="#f2efe6" stroke={INK} strokeWidth="1" />
      <path d="M8 36 q15 -7 30 0 L38 40 8 40 Z" fill="#6f747c" />
      <rect x="66" y="34" width="20" height="11" fill="#f2efe6" stroke={INK} strokeWidth="1" />
      <path d="M62 34 q14 -6 28 0 L90 38 62 38 Z" fill="#6f747c" />
      <path d="M0 62 q30 -4 60 0 q20 3 40 0 L100 70 L0 70 Z" fill="#cfe0dd" opacity="0.9" />
    </g>
  ),

  // 红茶工艺：叶片由绿转红（萎凋→揉捻→发酵→干燥）
  'hongcha-flow': (
    <g>
      <ellipse cx="50" cy="34" rx="44" ry="12" fill="#f1e5c8" opacity="0.7" />
      <path d="M22 34 L30 34 M41 34 L49 34 M60 34 L68 34 M79 34 L87 34" stroke={INK} strokeWidth="1" opacity="0.45" strokeLinecap="round" />
      <path d="M30 30 l4 4 -4 4 M49 30 l4 4 -4 4 M68 30 l4 4 -4 4 M87 30 l4 4 -4 4" stroke={INK} strokeWidth="0.9" fill="none" opacity="0.45" strokeLinecap="round" />
      <path d="M12 40 q-7 -12 0 -20 q7 8 0 20z" fill="#93b06d" stroke={INK} strokeWidth="0.9" />
      <path d="M31 40 q-7 -12 0 -20 q7 8 0 20z" fill="#a8a860" stroke={INK} strokeWidth="0.9" />
      <path d="M50 40 q-7 -12 0 -20 q7 8 0 20z" fill="#b98a45" stroke={INK} strokeWidth="0.9" />
      <path d="M69 40 q-7 -12 0 -20 q7 8 0 20z" fill="#b0603a" stroke={INK} strokeWidth="0.9" />
      <path d="M88 40 q-7 -12 0 -20 q7 8 0 20z" fill="#8f3a25" stroke={INK} strokeWidth="0.9" />
      <path d="M10 50 L90 50" stroke={INK} strokeWidth="0.9" opacity="0.3" />
      <path d="M10 56 q20 -4 40 -1 q18 -2 40 1" stroke="#9dbb7f" strokeWidth="2.2" fill="none" opacity="0.6" strokeLinecap="round" />
    </g>
  ),

  // 红亮茶汤（白瓷杯 + 热气）
  'red-liquor': (
    <g>
      <ellipse cx="50" cy="58" rx="26" ry="7" fill="#e6d3ab" stroke={INK} strokeWidth="1" />
      <path d="M28 34 Q50 28 72 34 L66 56 Q50 62 34 56 Z" fill="#f5edde" stroke={INK} strokeWidth="1.1" />
      <path d="M33 40 Q50 45 67 40 L64 55 Q50 60 36 55 Z" fill="#b24627" opacity="0.85" />
      <path d="M40 26 q4 -8 0 -14 M52 24 q4 -9 0 -15 M64 26 q4 -8 0 -14" stroke="#c9b79c" strokeWidth="1.2" fill="none" opacity="0.7" strokeLinecap="round" />
    </g>
  ),

  // 梅家坞：弯弯山溪 + 村舍 + 茶园
  'meijiawu-village': (
    <g>
      <path d="M0 44 q18 -14 36 -4 q16 -12 34 -2 q16 -10 30 0 L100 70 L0 70 Z" fill="#c3d6bc" opacity="0.65" />
      <rect x="30" y="34" width="24" height="13" fill="#f2efe6" stroke={INK} strokeWidth="1" />
      <path d="M26 34 q16 -8 32 0 L56 38 26 38 Z" fill="#6f747c" />
      <path d="M50 52 q-12 8 -6 18 M50 52 q12 6 8 18" stroke="#cfe0dd" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M0 56 q20 -6 40 -1 q18 -4 34 0" stroke="#9dbb7f" strokeWidth="2.6" fill="none" opacity="0.85" strokeLinecap="round" />
      <path d="M0 63 q22 -5 44 -1 q18 -3 34 1" stroke="#8fae6a" strokeWidth="2.6" fill="none" opacity="0.8" strokeLinecap="round" />
      <path d="M8 50 q3 -9 0 -14 M92 50 q3 -9 0 -14" stroke={INK} strokeWidth="1" fill="none" opacity="0.3" />
    </g>
  ),

  // ─────────── 杭州 · 龙井 × 玻璃杯（4 格） ───────────
  // 透明杯 + 扁平嫩绿龙井叶 + 舒展 + 清亮汤色；龙井取自然黄绿 / 嫩黄绿，不荧光绿。

  // 第1格：透明玻璃杯 + 杯旁几片干龙井（扁平、嫩黄绿）
  'glass-longjing-intro': (
    <g>
      <path d="M33 24 L37 58 Q50 62 63 58 L67 24 Z" fill="#eaf2f4" opacity="0.5" stroke={INK} strokeWidth="1.1" />
      <ellipse cx="50" cy="24" rx="17" ry="4" fill="#f3f8f9" opacity="0.6" stroke={INK} strokeWidth="1" />
      <path d="M40 30 q-2 14 -1 26" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round" />
      <path d="M70 52 q9 -3 13 -11 q-11 -1 -13 11z" fill="#aebd6f" stroke={INK} strokeWidth="0.9" />
      <path d="M74 58 q8 -2 12 -9 q-10 0 -12 9z" fill="#bccb7e" stroke={INK} strokeWidth="0.9" />
      <path d="M68 60 q7 -2 11 -8 q-9 0 -11 8z" fill="#9fb05f" stroke={INK} strokeWidth="0.9" />
    </g>
  ),

  // 第2格：热水一冲，叶子刚入水、开始舒展
  'glass-longjing-steep': (
    <g>
      <path d="M33 24 L37 58 Q50 62 63 58 L67 24 Z" fill="#eef4ee" opacity="0.55" stroke={INK} strokeWidth="1.1" />
      <path d="M35 40 Q50 44 65 40 L63 57 Q50 61 37 57 Z" fill="#dce9c8" opacity="0.5" />
      <ellipse cx="50" cy="24" rx="17" ry="4" fill="#f3f8f9" opacity="0.6" stroke={INK} strokeWidth="1" />
      <path d="M44 46 q8 -4 14 -1 q-6 5 -14 1z" fill="#aebd6f" stroke={INK} strokeWidth="0.9" />
      <path d="M50 50 q9 -3 15 0 q-7 5 -15 0z" fill="#bccb7e" stroke={INK} strokeWidth="0.9" />
      <path d="M40 52 q7 -2 12 1 q-5 4 -12 -1z" fill="#9fb05f" stroke={INK} strokeWidth="0.9" />
    </g>
  ),

  // 第3格：叶子在杯里舒展开（极简，呼应「看。」）
  'glass-longjing-watch': (
    <g>
      <path d="M33 24 L37 58 Q50 62 63 58 L67 24 Z" fill="#eaf2f4" opacity="0.5" stroke={INK} strokeWidth="1.1" />
      <ellipse cx="50" cy="24" rx="17" ry="4" fill="#f3f8f9" opacity="0.6" stroke={INK} strokeWidth="1" />
      <path d="M38 52 q6 -10 12 -10 q6 0 12 10 q-12 4 -24 0z" fill="#aebd6f" stroke={INK} strokeWidth="0.9" />
      <path d="M42 50 q4 -6 8 -6 q4 0 8 6" stroke={INK} strokeWidth="0.7" fill="none" opacity="0.5" />
      <path d="M40 55 q10 -3 20 0" stroke="#9fb05f" strokeWidth="0.9" fill="none" opacity="0.7" />
    </g>
  ),

  // 第4格：清亮嫩黄绿茶汤里，叶子舒展开
  'glass-longjing-enjoy': (
    <g>
      <path d="M33 24 L37 58 Q50 62 63 58 L67 24 Z" fill="#eaf2f4" opacity="0.45" stroke={INK} strokeWidth="1.1" />
      <path d="M34.5 38 Q50 42 65.5 38 L63 57 Q50 61 37 57 Z" fill="#e2e8b0" opacity="0.7" />
      <ellipse cx="50" cy="24" rx="17" ry="4" fill="#f3f8f9" opacity="0.6" stroke={INK} strokeWidth="1" />
      <path d="M40 50 q7 -7 14 -6 q6 1 11 9 q-12 4 -25 -3z" fill="#b6c87e" stroke={INK} strokeWidth="0.9" />
      <path d="M44 48 q3 -5 7 -5 q4 0 7 5" stroke={INK} strokeWidth="0.7" fill="none" opacity="0.5" />
      <path d="M39 54 q12 -3 22 0" stroke="#9fb05f" strokeWidth="0.9" fill="none" opacity="0.6" />
      <path d="M58 36 q6 -2 9 -7 q-8 0 -9 7z" fill="#aebd6f" stroke={INK} strokeWidth="0.8" />
    </g>
  ),

  // ─────────── 乌牛早 vs 西湖龙井（6 格左右对比，牛姐彩蛋） ───────────
  // 两边都是扁形绿茶：乌牛早=短肥齐、更翠（#7fa757 系）；龙井=扁挺秀、嫩黄绿（#a8ae58 系）。
  // 不用一绿一黄的夸张区分，重在「像而易辨」。

  // 第1格：两份干茶并排摆，乍一看真像——顶一个大问号
  'wuniuzao-vs-intro': (
    <g>
      <ellipse cx="27" cy="50" rx="21" ry="9" fill="#eee3c8" stroke={INK} strokeWidth="1" />
      <ellipse cx="73" cy="50" rx="21" ry="9" fill="#eee3c8" stroke={INK} strokeWidth="1" />
      <path d="M50 12 v34" stroke={INK} strokeWidth="0.7" strokeDasharray="2.5 2.5" opacity="0.4" />
      {/* 左：乌牛早——短、肥、齐 */}
      <path d="M16 48 q6 -7 13 -7 q-5 8 -13 7z" fill="#7fa757" stroke={INK} strokeWidth="0.9" />
      <path d="M24 51 q6 -8 14 -7 q-6 9 -14 7z" fill="#8db264" stroke={INK} strokeWidth="0.9" />
      <path d="M19 54 q5 -6 12 -6 q-5 7 -12 6z" fill="#6f9c4d" stroke={INK} strokeWidth="0.9" />
      <path d="M30 46 q3 -4 6 -4 q-2 5 -6 4z" fill="#8db264" stroke={INK} strokeWidth="0.8" />
      {/* 右：龙井——扁、挺、秀 */}
      <path d="M60 47 q10 -5 21 -3 q-9 6 -21 3z" fill="#a8ae58" stroke={INK} strokeWidth="0.9" />
      <path d="M63 52 q11 -4 22 -1 q-10 5 -22 1z" fill="#b3b76a" stroke={INK} strokeWidth="0.9" />
      <path d="M62 56 q10 -3 20 0 q-9 4 -20 0z" fill="#9aa050" stroke={INK} strokeWidth="0.9" />
      <text x="50" y="14" textAnchor="middle" fontSize="13" fill={INK}>？</text>
      <text x="27" y="65" textAnchor="middle" fontSize="4.6" fill={INK}>乌牛早</text>
      <text x="73" y="65" textAnchor="middle" fontSize="4.6" fill={INK}>龙井</text>
    </g>
  ),

  // 第2格：形状对比——左短肥齐、芽锋显；右修长挺秀
  'wuniuzao-vs-shape': (
    <g>
      <path d="M50 8 v54" stroke={INK} strokeWidth="0.7" strokeDasharray="2.5 2.5" opacity="0.4" />
      {/* 左：短、肥、齐（胖乎乎的短条，芽头饱满） */}
      <path d="M14 40 q2 -12 10 -14 q8 2 10 14 q-10 5 -20 0z" fill="#7fa757" stroke={INK} strokeWidth="1" />
      <path d="M24 26 q2 -3 4 0" stroke={INK} strokeWidth="0.8" fill="none" opacity="0.7" />
      <path d="M36 46 q2 -11 9 -13 q8 2 9 13 q-9 5 -18 0z" fill="#8db264" stroke={INK} strokeWidth="1" />
      <path d="M45 33 q2 -3 4 0" stroke={INK} strokeWidth="0.8" fill="none" opacity="0.7" />
      <path d="M12 56 q2 -10 9 -12 q8 2 9 12 q-9 4 -18 0z" fill="#6f9c4d" stroke={INK} strokeWidth="1" />
      <text x="27" y="66" textAnchor="middle" fontSize="5" fill={INK}>短 · 肥 · 齐</text>
      {/* 右：扁、挺、秀（修长的平直条） */}
      <path d="M60 36 q14 -6 28 -2 q-13 7 -28 2z" fill="#a8ae58" stroke={INK} strokeWidth="1" />
      <path d="M62 46 q14 -5 27 -1 q-12 6 -27 1z" fill="#b3b76a" stroke={INK} strokeWidth="1" />
      <path d="M61 55 q13 -4 26 -1 q-12 5 -26 1z" fill="#9aa050" stroke={INK} strokeWidth="1" />
      <text x="74" y="66" textAnchor="middle" fontSize="5" fill={INK}>扁 · 挺 · 秀</text>
    </g>
  ),

  // 第3格：颜色对比——左翠绿光润、右嫩绿带黄；都自然，不荧光
  'wuniuzao-vs-color': (
    <g>
      <path d="M50 10 v50" stroke={INK} strokeWidth="0.7" strokeDasharray="2.5 2.5" opacity="0.4" />
      <rect x="12" y="20" width="30" height="26" rx="3" fill="#7fa757" stroke={INK} strokeWidth="1" />
      <rect x="15" y="23" width="24" height="12" rx="2" fill="#8db264" opacity="0.85" />
      <path d="M18 40 q7 -5 16 -4 q-7 6 -16 4z" fill="#6f9c4d" stroke={INK} strokeWidth="0.8" />
      <text x="27" y="56" textAnchor="middle" fontSize="5" fill={INK}>翠绿光润</text>
      <rect x="58" y="20" width="30" height="26" rx="3" fill="#a8ae58" stroke={INK} strokeWidth="1" />
      <rect x="61" y="23" width="24" height="12" rx="2" fill="#bcbc72" opacity="0.85" />
      <path d="M64 40 q7 -5 16 -4 q-7 6 -16 4z" fill="#b3a95e" stroke={INK} strokeWidth="0.8" />
      <text x="73" y="56" textAnchor="middle" fontSize="5" fill={INK}>嫩绿带黄</text>
      <text x="50" y="66" textAnchor="middle" fontSize="4.2" fill={INK} opacity="0.75">—— 颜色不能单独定输赢 ——</text>
    </g>
  ),

  // 第4格：闻香——左清鲜一缕；右多一缕，还带炒豆、板栗似的炒制香
  'wuniuzao-vs-aroma': (
    <g>
      <path d="M50 10 v50" stroke={INK} strokeWidth="0.7" strokeDasharray="2.5 2.5" opacity="0.4" />
      {/* 左杯 + 一缕香 */}
      <path d="M18 38 L20 52 Q27 55 34 52 L36 38 Z" fill="#f6f1e6" stroke={INK} strokeWidth="1" />
      <path d="M27 34 q-3 -5 0 -9 q3 -4 0 -8" stroke="#9db37f" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.85" />
      <text x="27" y="62" textAnchor="middle" fontSize="4.6" fill={INK}>清鲜直接</text>
      {/* 右杯 + 两缕香 + 一颗小板栗 */}
      <path d="M64 38 L66 52 Q73 55 80 52 L82 38 Z" fill="#f6f1e6" stroke={INK} strokeWidth="1" />
      <path d="M70 34 q-3 -5 0 -9 q3 -4 0 -8" stroke="#9db37f" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.85" />
      <path d="M78 34 q3 -5 0 -9 q-3 -4 0 -8" stroke="#9db37f" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.85" />
      <ellipse cx="86" cy="44" rx="4" ry="3.2" fill="#c9a06a" stroke={INK} strokeWidth="0.8" />
      <path d="M86 41 v6" stroke={INK} strokeWidth="0.6" opacity="0.5" />
      <text x="73" y="62" textAnchor="middle" fontSize="4.6" fill={INK}>豆香 · 板栗</text>
      <text x="50" y="68" textAnchor="middle" fontSize="4.2" fill={INK} opacity="0.75">—— 光闻一下可不够 ——</text>
    </g>
  ),

  // 第5格：滋味——两杯汤色同属嫩绿/黄绿系，只差一点点（像而不一样）
  'wuniuzao-vs-taste': (
    <g>
      <path d="M50 10 v50" stroke={INK} strokeWidth="0.7" strokeDasharray="2.5 2.5" opacity="0.4" />
      <path d="M16 28 L18.5 50 Q27 54 35.5 50 L38 28 Z" fill="#eef4ee" opacity="0.6" stroke={INK} strokeWidth="1" />
      <path d="M17.5 34 Q27 37 36.5 34 L34.8 49 Q27 52.5 19.2 49 Z" fill="#d9e79f" />
      <ellipse cx="27" cy="28" rx="11" ry="2.6" fill="#f3f8f9" opacity="0.6" stroke={INK} strokeWidth="0.9" />
      <text x="27" y="62" textAnchor="middle" fontSize="4.6" fill={INK}>鲜爽甘醇</text>
      <path d="M62 28 L64.5 50 Q73 54 81.5 50 L84 28 Z" fill="#eef4ee" opacity="0.6" stroke={INK} strokeWidth="1" />
      <path d="M63.5 34 Q73 37 82.5 34 L80.8 49 Q73 52.5 65.2 49 Z" fill="#e6e9ac" />
      <ellipse cx="73" cy="28" rx="11" ry="2.6" fill="#f3f8f9" opacity="0.6" stroke={INK} strokeWidth="0.9" />
      <text x="73" y="62" textAnchor="middle" fontSize="4.6" fill={INK}>鲜醇甘爽</text>
      <text x="50" y="68" textAnchor="middle" fontSize="4.2" fill={INK} opacity="0.75">—— 入口之后，才知道真正的滋味 ——</text>
    </g>
  ),

  // 第6格：总结——两片立起的叶子，中间一个大 ≠
  'wuniuzao-vs-final': (
    <g>
      {/* 左：乌牛早叶（矮壮、翠绿） */}
      <path d="M27 58 q-9 -4 -9 -16 q0 -12 9 -18 q9 6 9 18 q0 12 -9 16z" fill="#7fa757" stroke={INK} strokeWidth="1.1" />
      <path d="M27 52 v-22 M27 44 q-4 -3 -6 -6 M27 40 q4 -3 6 -6" stroke={INK} strokeWidth="0.7" fill="none" opacity="0.55" />
      <text x="27" y="66" textAnchor="middle" fontSize="5" fill={INK}>乌牛早</text>
      {/* 右：龙井叶（修长、嫩黄绿） */}
      <path d="M73 60 q-7 -5 -7 -19 q0 -14 7 -22 q7 8 7 22 q0 14 -7 19z" fill="#a8ae58" stroke={INK} strokeWidth="1.1" />
      <path d="M73 54 v-28 M73 44 q-3.5 -3 -5 -7 M73 38 q3.5 -3 5 -7" stroke={INK} strokeWidth="0.7" fill="none" opacity="0.55" />
      <text x="73" y="68" textAnchor="middle" fontSize="5" fill={INK}>西湖龙井</text>
      {/* 中：≠ */}
      <path d="M44 34 h12 M44 41 h12" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M45 44 l10 -13" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
    </g>
  ),
};

export default function ComicArt({ kind }: { kind: string }) {
  const art = ART[kind];
  // defs 的 id 用 kind 做前缀，避免同页多格 SVG 的 id 冲突
  const paperId = `paper-${kind}`;

  return (
    <svg viewBox="0 0 100 70" width="100%" height="100%" className="comic-svg" role="img">
      <defs>
        <filter id={paperId} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" result="noise" />
          <feColorMatrix in="noise" type="saturate" values="0" result="mono" />
          <feComponentTransfer in="mono" result="grain">
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feComposite in="grain" in2="SourceGraphic" operator="in" />
        </filter>
      </defs>

      <rect width="100" height="70" fill={PAPER} />
      {art ?? <path d="M20 50 q30 -30 60 0" stroke={INK} strokeWidth="1" fill="none" opacity="0.3" />}
      {/* 纸张纹理叠加：极低透明度，只做质感，不抢画面 */}
      <rect width="100" height="70" fill="#8a7a5c" opacity="0.16" filter={`url(#${paperId})`} />
      {/* 手绘外框 */}
      <rect x="1" y="1" width="98" height="68" fill="none" stroke={INK} strokeWidth="0.8" opacity="0.25" />
    </svg>
  );
}
