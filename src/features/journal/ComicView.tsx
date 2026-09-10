import { getComic } from '../../core/data/comics';
import { useGame } from '../../store/gameStore';
import BackButton from '../../components/BackButton';
import ComicArt from './ComicArt';

export default function ComicView() {
  const { sceneData, back } = useGame();
  const comic = getComic(sceneData.comicId ?? '');
  if (!comic) return <div className="scene"><div className="hint">没有可显示的漫画。</div></div>;

  return (
    <div className="scene">
      <BackButton />
      <div className="comic-view">
        <div className="hint">茶漫画 · {comic.kind === 'process' ? '制茶' : comic.kind === 'terroir' ? '茶山' : comic.kind === 'story' ? '旧闻' : '人物'}</div>
        <h2 className="h-serif" style={{ marginTop: 2 }}>{comic.title}</h2>
        <div className="comic-source">来源：{comic.source}</div>

        <div className="comic-panels">
          {comic.panels.map((p, i) => (
            <div className="comic-panel" key={i}>
              <div className="comic-frame">
                {p.art ? <ComicArt kind={p.art} /> : <div className="comic-blank" />}
                <span className="comic-no">{i + 1}</span>
              </div>
              <p className="comic-caption">{p.caption}</p>
            </div>
          ))}
        </div>

        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => back()}>回到茶游记</button>
      </div>
    </div>
  );
}
