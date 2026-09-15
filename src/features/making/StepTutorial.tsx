/**
 * 制茶操作教程（轻量新手引导）：短手势动画 + 一句提示，第一次学会后不再打扰。
 *
 * 设计约定（2026-09-14 定稿）：
 *   - 【教程教操作，不教答案】只演示「怎么做」（摇、按、点、看），不指向任何具体答案
 *     （不说「肉桂选中火」「收青停在 55」）；做得好不好交给玩家自己尝试。
 *   - 【按操作类型共享】seen 标记记在 op（操作键）上，不按茶种记：
 *     学过岩茶焙火（tap-lock），烘干/杀青不再提示同类操作；萎凋与发酵同为「观察」类（observe）。
 *   - 【不打断】浮层 pointer-events:none（只有「知道了」可点），不阻塞任何操作；
 *     手势动画循环 2 次后自动淡出（CSS forwards），提示文字保留到完成/跳过。
 *   - 【不泄答案、不改判定】纯 UI 层：不碰评分/参数/消耗；标记只在「完成环节」或「主动跳过」时写入，
 *     中途退出不标记（下次仍会提示）。
 *   - 采茶不接本系统：已有阿秀/阿青的 NPC 分步教学（picking_taught / picking_taught_bud），避免重复打扰。
 *
 * 视觉：手绘风幽灵手指（圆点 + 淡墨光环），keyframes 全部在 base.css（tut- 前缀），无动画库。
 */

/** 手势动画形态（与实际交互一一对应，不做万能「点这里」）。 */
export type TutAnim = 'toggle' | 'circle' | 'tap' | 'press' | 'beat' | 'glow';

export interface TutCfg {
  /** 操作键：seen 标记的粒度（跨茶种共享同类操作）。 */
  op: string;
  hint: string;
  anim: TutAnim;
  /** 手势演示点在环节卡片内的位置（%，卡片 = position:relative 的包裹层）。 */
  left: number;
  top: number;
}

/**
 * 各环节教程配置（key = 配方 StepId；采茶 picking 不配置 = 无教程）。
 * op 相同的环节共享「已学会」状态：roasting/drying/fixation 都是「看准指示点一下」（tap-lock），
 * withering/fermentation 都是「观察判断」（observe）——学过一次即静默。
 */
export const STEP_TUTORIALS: Record<string, TutCfg> = {
  daoqing: {
    op: 'toggle', anim: 'toggle', left: 50, top: 33,
    hint: '先晒一晒，再晾一晾——叶子软了就好。',
  },
  zuoqing: {
    op: 'circle', anim: 'circle', left: 50, top: 34,
    hint: '按住筛子，轻轻画圈摇一摇。',
  },
  'chao-rou': {
    op: 'chaorou', anim: 'circle', left: 50, top: 30,
    hint: '按住把火看住；趁热了，画圈轻轻揉。',
  },
  roasting: {
    op: 'tap-lock', anim: 'tap', left: 50, top: 56,
    hint: '指针来回走，看准了点一下，稳稳落火。',
  },
  drying: {
    op: 'tap-lock', anim: 'tap', left: 50, top: 58,
    hint: '火候一下一下稳着来——看准再点。',
  },
  fixation: {
    op: 'tap-lock', anim: 'tap', left: 50, top: 60,
    hint: '锅温一路往上走，进到合适那段就下铲——手要快。',
  },
  rolling: {
    op: 'press', anim: 'press', left: 44, top: 56,
    hint: '按住，把力揉进去；看准了，松手。',
  },
  withering: {
    op: 'observe', anim: 'glow', left: 50, top: 36,
    hint: '别急，等叶子软下来，再收青。',
  },
  fermentation: {
    op: 'observe', anim: 'glow', left: 50, top: 34,
    hint: '多看看、多闻闻——热气起来了就翻一翻。',
  },
  shaping: {
    op: 'beat', anim: 'beat', left: 50, top: 57,
    hint: '跟着节拍，环收拢时按下对应的手法。',
  },
};

interface Props {
  /** 当前环节 id（配方 StepId）。 */
  step: string;
  seen: boolean;
  onSkip: () => void;
}

/**
 * 教程浮层：绝对定位铺满环节卡片（inset 0），自身 pointer-events:none 不挡操作；
 * 手势演示点悬浮在配置位置，循环 2 次后淡成浅影；右下角一枚小「知道了」。
 */
export default function StepTutorial({ step, seen, onSkip }: Props) {
  const cfg = STEP_TUTORIALS[step];
  if (!cfg || seen) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none' }} aria-hidden>
      {/* 手势演示（循环 2 次后淡成浅影，不再烦人） */}
      <div className={`tut-demo tut-${cfg.anim}`} style={{ left: `${cfg.left}%`, top: `${cfg.top}%` }}>
        {cfg.anim === 'circle' && (
          <div className="tut-orbit">
            <div className="tut-finger" />
          </div>
        )}
        {cfg.anim === 'toggle' && (
          <>
            <div className="tut-finger tut-toggle-a" />
            <div className="tut-finger tut-toggle-b" />
          </>
        )}
        {cfg.anim === 'tap' && (
          <>
            <div className="tut-track" />
            <div className="tut-finger tut-tap-move" />
            <div className="tut-ripple" />
          </>
        )}
        {cfg.anim === 'press' && (
          <div className="tut-finger tut-press-dot" />
        )}
        {cfg.anim === 'beat' && (
          <div className="tut-ring" />
        )}
        {cfg.anim === 'glow' && (
          <div className="tut-glow" />
        )}
      </div>

      {/* 提示一句 + 跳过：放在卡片顶部（标题/工序为非交互信息，不挡底部主操作按钮） */}
      <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8, maxWidth: '96%' }}>
        <span
          className="hint"
          style={{
            background: 'rgba(252,247,235,0.95)', border: '1px solid rgba(200,162,75,0.45)',
            borderRadius: 999, padding: '3px 12px', fontSize: 12.5, whiteSpace: 'nowrap',
          }}
        >{cfg.hint}</span>
        <button
          className="btn"
          style={{ pointerEvents: 'auto', fontSize: 12, padding: '2px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}
          onClick={onSkip}
        >知道了</button>
      </div>
    </div>
  );
}
