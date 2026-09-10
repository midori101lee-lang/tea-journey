/**
 * NPC 透明人物层（V0.2 场景化重构）。
 * 视觉方向：东方手绘绘本感、淡彩水墨、低饱和、自然人物姿态。
 * 身份靠姿态 / 手持道具 / 服饰体现，环境由场景 SVG 承担，因此本组件透明、只画人物与手持物。
 * 由 NpcStage 按 focus 位置叠加到对应场景之上。
 */

import { useState } from 'react';
import { NPCS } from '../../core/data/npcs';

const SKIN = '#ecd9c4';
const SKIN_SHADE = '#dcc4ab';
const HAIR = '#4b4138';
const GREY = '#b7b0a4';

/** 手持茶篓（阿秀） */
function Basket({ x, y, w = 34 }: { x: number; y: number; w?: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <path d={`M2 ${w * 0.3} Q${w / 2} 0 ${w - 2} ${w * 0.3} L${w - 8} ${w * 0.9} Q${w / 2} ${w} 8 ${w * 0.9} Z`} fill="#c8a98a" stroke="#8a6f52" strokeWidth="1.2" />
      <path d={`M6 ${w * 0.45} L${w - 6} ${w * 0.45} M7 ${w * 0.62} L${w - 7} ${w * 0.62} M9 ${w * 0.78} L${w - 9} ${w * 0.78}`} stroke="#8a6f52" strokeWidth="0.8" fill="none" />
      <path d={`M${w * 0.28} ${w * 0.3} Q${w / 2} -${w * 0.25} ${w * 0.72} ${w * 0.3}`} fill="none" stroke="#8a6f52" strokeWidth="1.4" />
      <g fill="#8fae6a" stroke="#5a6b4a" strokeWidth="0.6">
        <ellipse cx={w * 0.4} cy={w * 0.18} rx="6" ry="3" transform={`rotate(-20 ${w * 0.4} ${w * 0.18})`} />
        <ellipse cx={w * 0.6} cy={w * 0.14} rx="6" ry="3" transform={`rotate(16 ${w * 0.6} ${w * 0.14})`} />
        <ellipse cx={w * 0.5} cy={w * 0.26} rx="5" ry="2.6" />
      </g>
    </g>
  );
}

function Figure({ id }: { id: string }) {
  switch (id) {
    case 'laochen':
      return (
        <g>
          {/* 身体 3/4（围裙） */}
          <path d="M44 184 L52 132 Q76 114 100 134 L104 184 Z" fill="#9c8466" />
          <path d="M58 130 Q74 122 90 132 L88 184 L60 184 Z" fill="#cab99f" opacity="0.9" />
          <rect x="66" y="118" width="13" height="16" rx="4" fill={SKIN} />
          <ellipse cx="72" cy="86" rx="25" ry="29" fill={SKIN} />
          <path d="M46 86 Q44 60 72 58 Q100 60 98 86 Q94 70 72 68 Q50 70 46 86 Z" fill={GREY} />
          <path d="M46 84 Q44 94 50 98 Q52 86 49 82 Z" fill={GREY} />
          <path d="M98 84 Q100 94 94 98 Q92 86 95 82 Z" fill={GREY} />
          <path d="M57 82 q7 -3 13 0" stroke={HAIR} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M74 82 q7 -3 13 0" stroke={HAIR} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M58 89 q6 -3 12 0" stroke={HAIR} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M74 89 q6 -3 12 0" stroke={HAIR} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M72 90 l-2 9 4 0" stroke={SKIN_SHADE} strokeWidth="1.2" fill="none" />
          <path d="M64 98 q8 5 16 0" stroke={GREY} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M60 104 Q72 118 84 104 Q72 112 60 104 Z" fill={GREY} opacity="0.5" />
          <path d="M64 100 q8 4 16 0" stroke="#9c5b46" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          {/* 手持茶壶 */}
          <g transform="translate(98,150)">
            <path d="M0 6 Q14 -2 28 6 L24 22 Q14 28 4 22 Z" fill="#b9a283" stroke="#8a6f52" strokeWidth="1.2" />
            <path d="M28 9 Q36 8 34 16" fill="none" stroke="#8a6f52" strokeWidth="2" strokeLinecap="round" />
            <rect x="11" y="0" width="8" height="4" rx="2" fill="#8a6f52" />
          </g>
        </g>
      );
    case 'axiu':
      return (
        <g>
          {/* 身体 侧身（绿衣，微侧） */}
          <path d="M40 184 L48 134 Q70 118 92 136 L96 184 Z" fill="#8fae6a" />
          <path d="M52 132 Q70 124 86 134 L84 184 L56 184 Z" fill="#a7c184" />
          <rect x="62" y="120" width="12" height="15" rx="4" fill={SKIN} />
          <ellipse cx="68" cy="98" rx="23" ry="27" fill={SKIN} />
          <path d="M44 96 Q42 72 68 70 Q94 72 92 96 Q88 82 68 80 Q48 82 44 96 Z" fill={HAIR} />
          <circle cx="68" cy="67" r="8" fill={HAIR} />
          <path d="M52 94 q5 -3 10 0" stroke={HAIR} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M74 94 q5 -3 10 0" stroke={HAIR} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M54 100 q5 -3 10 0" stroke={HAIR} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M72 100 q5 -3 10 0" stroke={HAIR} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <ellipse cx="55" cy="110" rx="5" ry="3" fill="#e6a98f" opacity="0.35" />
          <ellipse cx="81" cy="110" rx="5" ry="3" fill="#e6a98f" opacity="0.35" />
          <path d="M61 114 q7 5 14 0" stroke="#9c5b46" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          {/* 手持茶篓（身前） */}
          <Basket x={30} y={134} w={36} />
        </g>
      );
    case 'yanbo':
      return (
        <g>
          {/* 身体（挽袖，土褐） */}
          <path d="M42 184 L50 132 Q74 114 98 134 L102 184 Z" fill="#a98c62" />
          <path d="M56 130 Q74 122 90 132 L88 158 L58 158 Z" fill="#c0a37a" />
          <rect x="64" y="118" width="13" height="16" rx="4" fill={SKIN} />
          <ellipse cx="70" cy="88" rx="24" ry="27" fill={SKIN} />
          <path d="M45 80 Q72 70 99 80 L100 88 Q72 79 44 88 Z" fill="#c9b08c" />
          <path d="M96 82 q8 2 6 12 q-6 -2 -6 -10 Z" fill="#b89a6f" />
          <path d="M47 84 Q45 96 50 100 Q52 88 49 82 Z" fill={GREY} />
          <path d="M95 84 Q97 96 92 100 Q90 88 93 82 Z" fill={GREY} />
          <path d="M54 84 l12 4" stroke={HAIR} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M86 84 l-12 4" stroke={HAIR} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M55 91 q6 -2 11 0" stroke={HAIR} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M73 91 q6 -2 11 0" stroke={HAIR} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M63 103 q7 1 14 0" stroke="#9c5b46" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* 手持茶箕（身前左） */}
          <g transform="translate(34,150)">
            <path d="M0 6 Q16 -2 32 6 L28 20 Q16 24 4 20 Z" fill="#cbb083" stroke="#8a6f52" strokeWidth="1.2" />
            <g fill="#6f7a4a"><ellipse cx="10" cy="9" rx="4" ry="2" /><ellipse cx="18" cy="11" rx="4" ry="2" /><ellipse cx="22" cy="8" rx="3.5" ry="1.8" /></g>
          </g>
        </g>
      );
    case 'zhoubo':
      return (
        <g>
          {/* 身体（青灰衫，松弛坐姿感） */}
          <path d="M42 170 L50 124 Q74 108 98 126 L102 170 Z" fill="#8a9aa0" />
          <path d="M56 122 Q74 114 90 124 L88 170 L58 170 Z" fill="#a6b3b7" />
          <rect x="64" y="110" width="13" height="16" rx="4" fill={SKIN} />
          <ellipse cx="70" cy="82" rx="24" ry="28" fill={SKIN} />
          <path d="M45 82 Q43 58 70 56 Q97 58 95 82 Q91 68 70 66 Q49 68 45 82 Z" fill={GREY} />
          <path d="M55 80 q7 -3 13 0" stroke={HAIR} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M74 80 q7 -3 13 0" stroke={HAIR} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M56 87 q6 -3 12 0" stroke={HAIR} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M74 87 q6 -3 12 0" stroke={HAIR} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* 长须 */}
          <path d="M64 94 q-3 14 -1 24" stroke={GREY} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M76 94 q3 14 1 24" stroke={GREY} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M64 96 q8 3 16 -1" stroke="#9c5b46" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          {/* 手持盖碗 */}
          <g transform="translate(96,138)">
            <ellipse cx="14" cy="20" rx="16" ry="4" fill="#cbb79a" stroke="#8a6f52" strokeWidth="1" />
            <path d="M4 12 Q14 8 24 12 L21 22 Q14 26 7 22 Z" fill="#efe7d6" stroke="#8a6f52" strokeWidth="1.1" />
            <ellipse cx="14" cy="10" rx="13" ry="4" fill="#f1e8d8" stroke="#8a6f52" strokeWidth="1.1" />
          </g>
        </g>
      );
    case 'linggu':
      return (
        <g>
          {/* 身体（紫灰，斜挎包） */}
          <path d="M42 184 L50 132 Q74 116 98 134 L102 184 Z" fill="#b3a3c4" />
          <path d="M30 138 L80 178" stroke="#b98f6a" strokeWidth="6" fill="none" opacity="0.85" />
          <path d="M56 130 Q74 122 90 132 L88 184 L58 184 Z" fill="#c7b9d4" />
          <rect x="64" y="118" width="12" height="15" rx="4" fill={SKIN} />
          <ellipse cx="70" cy="96" rx="23" ry="27" fill={SKIN} />
          <path d="M46 94 Q44 72 70 70 Q96 72 94 94 Q90 80 70 78 Q50 80 46 94 Z" fill={HAIR} />
          <path d="M92 88 Q106 94 100 120 Q94 102 88 92 Z" fill={HAIR} />
          <path d="M54 92 q5 -3 10 0" stroke={HAIR} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M76 92 q5 -3 10 0" stroke={HAIR} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <circle cx="62" cy="100" r="2.4" fill={HAIR} />
          <circle cx="78" cy="100" r="2.4" fill={HAIR} />
          <ellipse cx="55" cy="110" rx="4" ry="2.4" fill="#e6a98f" opacity="0.3" />
          <ellipse cx="83" cy="110" rx="4" ry="2.4" fill="#e6a98f" opacity="0.3" />
          <path d="M63 112 q7 4 14 0" stroke="#9c5b46" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
      );
    default:
      return (
        <g>
          <path d="M44 184 L52 132 Q76 114 100 134 L104 184 Z" fill="#9c8466" />
          <rect x="64" y="118" width="13" height="16" rx="4" fill={SKIN} />
          <ellipse cx="72" cy="86" rx="25" ry="29" fill={SKIN} />
          <path d="M46 86 Q44 60 72 58 Q100 60 98 86 Q94 70 72 68 Q50 70 46 86 Z" fill={GREY} />
          <path d="M57 82 q7 -3 13 0" stroke={HAIR} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M74 82 q7 -3 13 0" stroke={HAIR} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M58 89 q6 -3 12 0" stroke={HAIR} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M74 89 q6 -3 12 0" stroke={HAIR} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M64 100 q8 4 16 0" stroke="#9c5b46" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
      );
  }
}

/** 透明背景的 NPC 人物层，供 NpcStage 叠加到场景之上。
 *  若该 NPC 配置了位图立绘（portrait），渲染透明 WebP；否则回退内联 SVG。
 *  portraitScale 仅收敛该 NPC 自身显示尺寸（不影响场景 figure 槽与其它 NPC）。
 *  scale（可选）用于茶集市摊位卡片等独立上下文：直接对整张立绘做等比缩放，
 *  与 portraitScale 独立，避免场景缩放与摊位缩放互相干扰。 */
export function NpcPortrait({ id, scale }: { id: string; scale?: number }) {
  const npc = NPCS.find((n) => n.id === id);
  const portrait = npc?.portrait;
  const portraitScale = scale == null ? (npc?.portraitScale ?? 1) : 1;
  const [failed, setFailed] = useState(false);
  const wrap: React.CSSProperties | undefined =
    scale != null
      ? { width: '100%', maxHeight: '100%', transform: `scale(${scale})`, transformOrigin: 'bottom center' as const }
      : portraitScale === 1
        ? undefined
        : { width: `${portraitScale * 100}%`, margin: '0 auto' };
  if (portrait && !failed) {
    const src = `${import.meta.env.BASE_URL}${portrait}`;
    return (
      <div style={wrap}>
        <img
          className="npc-portrait-img"
          src={src}
          alt={id}
          style={{ display: 'block', width: '100%', height: 'auto' }}
          onLoad={(e) => e.currentTarget.classList.add('is-loaded')}
          onError={() => setFailed(true)}
        />
      </div>
    );
  }
  return (
    <div style={wrap}>
      <svg viewBox="0 0 140 190" width="100%" height="auto" role="img" aria-label={id} style={{ display: 'block' }}>
        {/* 地面投影（轻微遮罩，让人物像「站/坐在场景里」） */}
        <ellipse cx="70" cy="184" rx="42" ry="6" fill="#000" opacity="0.10" />
        <Figure id={id} />
      </svg>
    </div>
  );
}
