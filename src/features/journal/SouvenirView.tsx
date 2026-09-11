import { useState } from 'react';
import { useGame } from '../../store/gameStore';
import { getSouvenir } from '../../core/data/souvenirs';
import { getRegion } from '../../core/data/regions';
import BackButton from '../../components/BackButton';
import { CoupletScroll } from '../../components/CoupletScroll';

/**
 * 收藏中的茶联：默认卷起，点击展开成左右对联、再点收起（与赠礼时的开合一致）。
 * 独立小组件是为了让 open 状态属于茶联自己（SouvenirView 顶层有早退分支，hooks 不能放那里）。
 */
function CoupletRemember({ upper, lower, title }: { upper: string; lower: string; title: string }) {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((v) => !v);
  return (
    <div
      className="cs-gift-stage"
      role="button"
      tabIndex={0}
      aria-expanded={open}
      onClick={toggle}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}
    >
      <CoupletScroll upperSrc={upper} lowerSrc={lower} open={open} alt={title} />
      <p className="hint" style={{ textAlign: 'center', margin: '10px 0 0', opacity: 0.7 }}>
        {open ? '再点一下，把茶联卷起来' : '点一点卷轴，展开这副茶联'}
      </p>
    </div>
  );
}

/**
 * 旅行纪念物查看。几种形态走同一套「收藏」结构，但呈现不同：
 *  - postcard：像一张真实明信片（正面实景照片 + 落款，背面说明 + 赠予者留言）。
 *  - note（诗笺）：一张文字小笺（逐行诗句 + 出处 + 收藏描述），无照片。
 *  - couplet（茶联）：中式卷轴对联（上联 + 下联两个独立图片资源，同一收藏品），可开合。
 * 都不引入评分 / 百科 / 收集系统——它只是「我去过这里，带回来的一点东西」。
 */
export default function SouvenirView() {
  const { sceneData, back } = useGame();
  const s = getSouvenir(sceneData.souvenirId ?? '');
  if (!s) return <div className="scene"><div className="hint">没有可显示的纪念物。</div></div>;

  const regionName = getRegion(s.regionId ?? 'wuyishan').name;

  if (s.kind === 'couplet') {
    return (
      <div className="scene">
        <BackButton />
        <div className="souvenir-view">
          <div className="hint">旅行纪念 · {regionName}</div>
          <h2 className="h-serif" style={{ margin: '2px 0 12px' }}>{s.title}</h2>

          <div className="couplet-view">
            <CoupletRemember upper={s.photo ?? ''} lower={s.photo2 ?? ''} title={s.title} />
            <div className="couplet-side">
              {s.motto && <div className="couplet-motto">{s.motto}</div>}
              {s.backText && <p className="hint" style={{ margin: '6px 0 0' }}>{s.backText}</p>}
              {s.giverName && <div className="hint" style={{ marginTop: 8 }}>—— {s.giverName}</div>}
              <div className="hint" style={{ marginTop: 10, opacity: 0.7 }}>📍 {s.place}</div>
            </div>
          </div>

          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => back()}>收进茶游记</button>
        </div>
      </div>
    );
  }

  if (s.kind === 'note') {
    return (
      <div className="scene">
        <BackButton />
        <div className="souvenir-view">
          <div className="hint">旅行纪念 · {regionName}</div>
          <h2 className="h-serif" style={{ margin: '2px 0 12px' }}>{s.title}</h2>

          <div className="poem-note">
            <div className="poem-note-head">诗 笺</div>
            <div className="poem-lines">
              {(s.lines ?? []).map((l, i) => <div className="poem-line" key={i}>{l}</div>)}
            </div>
            {s.attribution && <div className="poem-attr">—— {s.attribution}</div>}
            {s.motto && <div className="poem-motto">{s.motto}</div>}
            {s.backText && <div className="poem-desc">{s.backText}</div>}
            <div className="poem-place">{s.place}</div>
          </div>

          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => back()}>收进茶游记</button>
        </div>
      </div>
    );
  }

  const photo = s.photo ? import.meta.env.BASE_URL + s.photo : '';

  return (
    <div className="scene">
      <BackButton />
      <div className="souvenir-view">
        <div className="hint">旅行纪念 · {regionName}</div>
        <h2 className="h-serif" style={{ margin: '2px 0 12px' }}>{s.title}</h2>

        <div className="postcard">
          <div className="postcard-front">
            {photo && (
              <img
                className="postcard-photo"
                src={photo}
                alt={s.caption ?? s.title}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
            {s.caption && <div className="postcard-caption">{s.caption}</div>}
            <div className="postcard-place">📍 {s.place}</div>
          </div>
          <div className="postcard-back">
            <div className="postcard-back-head">{s.title}</div>
            <p className="postcard-back-text">{s.backText}</p>
            {s.yanboNote && (
              <div className="postcard-note">
                <div className="postcard-note-label">{s.giverName ?? '岩伯'}的留言</div>
                <p>「{s.yanboNote}」</p>
              </div>
            )}
            {s.source && <div className="hint" style={{ marginTop: 8 }}>照片：{s.source}</div>}
          </div>
        </div>

        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => back()}>收进茶游记</button>
      </div>
    </div>
  );
}
