import { useGame } from '../../store/gameStore';
import { getSouvenir } from '../../core/data/souvenirs';
import BackButton from '../../components/BackButton';

/**
 * 旅行纪念物查看：像一张真实明信片，而不是知识卡弹窗。
 * 正面 = 真实实景照片 + 落款；背面 = 少量说明文字 + 岩伯留言。
 * 不引入评分 / 百科 / 收集系统——它只是「我去过这里，带回来的一点东西」。
 */
export default function SouvenirView() {
  const { sceneData, back } = useGame();
  const s = getSouvenir(sceneData.souvenirId ?? '');
  if (!s) return <div className="scene"><div className="hint">没有可显示的纪念物。</div></div>;

  const photo = import.meta.env.BASE_URL + s.photo;

  return (
    <div className="scene">
      <BackButton />
      <div className="souvenir-view">
        <div className="hint">旅行纪念 · 武夷山</div>
        <h2 className="h-serif" style={{ margin: '2px 0 12px' }}>{s.title}</h2>

        <div className="postcard">
          <div className="postcard-front">
            <img
              className="postcard-photo"
              src={photo}
              alt={s.caption}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="postcard-caption">{s.caption}</div>
            <div className="postcard-place">📍 {s.place}</div>
          </div>
          <div className="postcard-back">
            <div className="postcard-back-head">{s.title}</div>
            <p className="postcard-back-text">{s.backText}</p>
            {s.yanboNote && (
              <div className="postcard-note">
                <div className="postcard-note-label">岩伯的留言</div>
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
