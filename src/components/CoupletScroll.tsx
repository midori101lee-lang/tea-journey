import { useEffect, useState } from 'react';

/**
 * 中式卷轴对联（杭州茶联礼物）。
 * - 上联 / 下联是**两个独立 PNG**（120×420 原始资源，等比缩放，不合并、不改字）。
 * - 卷起状态：两根小木轴并排（一份精致的茶礼）；展开：各自向外展开成左右对联。
 * - 展开动画：纸张从木轴后「抽出」（宽度过渡 + 轻微回弹 easing），约 850ms，无复杂动画。
 * - 装饰只用 CSS/SVG（木质轴杆、轴头、系绳、纸边），不遮挡联面文字。
 * - 竖屏适配：高度用 clamp(52vh) 兜底，两幅共用同一高度 → 缩放比例恒一致。
 */
export function CoupletScroll({
  upperSrc,
  lowerSrc,
  open,
  alt = '茶联',
}: {
  upperSrc: string;
  lowerSrc: string;
  /** 展开状态（受控：赠礼流程由外层点击驱动；收藏页直接传 true）。 */
  open: boolean;
  alt?: string;
}) {
  const [showPaper, setShowPaper] = useState(open);
  // 收起时先让纸宽度归零再卸载内容，避免闪动；展开时立即挂载触发过渡。
  useEffect(() => {
    if (open) { setShowPaper(true); return; }
    const t = window.setTimeout(() => setShowPaper(false), 900);
    return () => window.clearTimeout(t);
  }, [open]);

  return (
    <div className="cs-pair" aria-label={alt}>
      {/* 左：木轴在外侧 + 上联（纸从轴后向内抽出） */}
      <ScrollStrip src={upperSrc} side="left" open={open} showPaper={showPaper} alt={`${alt} · 上联`} />
      {/* 右：下联 + 木轴在外侧（镜像） */}
      <ScrollStrip src={lowerSrc} side="right" open={open} showPaper={showPaper} alt={`${alt} · 下联`} />
    </div>
  );
}

function ScrollStrip({ src, side, open, showPaper, alt }: {
  src: string; side: 'left' | 'right'; open: boolean; showPaper: boolean; alt: string;
}) {
  const isLeft = side === 'left';
  return (
    <div className={`cs-item cs-${side}`}>
      {isLeft && <Roller open={open} />}
      {/* 展开容器：宽度 0 ↔ 全宽，纸张锚定在木轴一侧，看起来像从轴里展开 */}
      <div className="cs-reveal" data-open={open ? '1' : '0'}>
        {showPaper && (
          <img
            className="cs-paper"
            src={`${import.meta.env.BASE_URL}${src}`}
            alt={alt}
            draggable={false}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
          />
        )}
      </div>
      {!isLeft && <Roller open={open} />}
    </div>
  );
}

/** 竖向木轴：上下轴头 + 轴杆 + 一根系绳。纯装饰，不进入联面区域。 */
function Roller({ open }: { open: boolean }) {
  return (
    <div className={`cs-roller${open ? ' is-open' : ''}`} aria-hidden>
      <span className="cs-cap" />
      <span className="cs-shaft">
        <span className="cs-cord" />
      </span>
      <span className="cs-cap" />
    </div>
  );
}
