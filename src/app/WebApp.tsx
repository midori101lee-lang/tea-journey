import { useEffect, useRef, useState } from 'react';
import { useGame } from '../store/gameStore';
import NpcDialog from '../components/NpcDialog';
import { NpcStage } from '../components/NpcStage';
import BackButton from '../components/BackButton';
import OpeningScene from '../components/OpeningScene';
import MapView from '../features/world/MapView';
import TeaWorldView from '../features/world/TeaWorldView';
import TeaSelect from '../features/making/TeaSelect';
import MakingFlow from '../features/making/MakingFlow';
import ResultView from '../features/result/ResultView';
import BrewingFlow from '../features/brew/BrewingFlow';
import TeaStackPicker from '../features/brew/TeaStackPicker';
import JournalView from '../features/journal/JournalView';
import RegionJournalView from '../features/journal/RegionJournalView';
import ComicView from '../features/journal/ComicView';
import SouvenirView from '../features/journal/SouvenirView';
import MarketView from '../features/market/MarketView';
import EncounterLayer from '../features/encounter/EncounterLayer';
import { NpcWeatherAside } from '../components/Weather';

/** Web 版：武夷山第一日完整游历（茶馆→茶园→制茶→结果→泡茶→母树→线索→手账） */
export default function WebApp() {
  const { scene, activeEncounter, go, player, startMaking, finishBrewing, setFlag, lastResult, difficulty, drinkNotice, zhouBoAdvice } = useGame();
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  // 茶桌：用茶篓里已有的茶泡一壶（库存 → 泡茶入口）
  const [brewPickerOpen, setBrewPickerOpen] = useState(false);
  // 进入母树「那一刻」是否已持有明信片 → 用于判断本次对话是否「刚刚赠予」。
  // 必须放在顶层（hook 规则），且只在 scene 变化时记录，避免 addSouvenir 后误判。
  const hadPostcardOnEnter = useRef(false);
  useEffect(() => {
    setRevealed({});
    if (scene === 'mothertree') hadPostcardOnEnter.current = player.souvenirs.includes('postcard_mothertree');
  }, [scene]);

  const reveal = (k: string) => setRevealed((r) => ({ ...r, [k]: true }));

  if (scene === 'intro') {
    return (
      <div className="scene">
        <OpeningScene />
      </div>
    );
  }

  if (scene === 'teaworld') return <div className="scene"><TeaWorldView /></div>;

  if (scene === 'map') return <div className="scene"><MapView /></div>;

  if (scene === 'teahouse') {
    const lingguReady = !!player.flags.tea_made && !player.flags.heard_about_hangzhou;
    return (
      <div className="scene">
        <BackButton />
        {/* 偶遇激活时，主线 NPC（老陈 / 林姑娘）与对话由 NpcStage 统一隐藏 */}
        <NpcDialog key="teahouse-laochen" scene="teahouse" npcId="laochen" onDone={() => reveal('laochen')} />
        {revealed['laochen'] && lingguReady && (
          <NpcDialog key="teahouse-linggu" scene="teahouse" npcId="linggu" onDone={() => reveal('linggu')} />
        )}
        {/* 主线提示（茶馆）：偶遇激活时隐藏，结束随 NpcStage 恢复 */}
        {!activeEncounter && (revealed['linggu'] || (revealed['laochen'] && !lingguReady)) && (
          <div className="scene-foot">
            {player.flags.heard_about_hangzhou && <p className="hint">🧭 杭州的线索，记在茶游记里了。</p>}
          </div>
        )}
        {!activeEncounter && revealed['laochen'] && <NpcWeatherAside npcId="laochen" player={player} />}
        {/* 偶遇层：作为 .scene 子层，NPC 立绘相对场景定位，不跑到页面外 */}
        <EncounterLayer />
      </div>
    );
  }

  if (scene === 'garden') {
    return (
      <div className="scene">
        <BackButton />
        {/* 偶遇激活时，主线 NPC（阿秀）与对话由 NpcStage 统一隐藏 */}
        <NpcDialog key="garden-axiu" scene="garden" npcId="axiu" onDone={() => reveal('axiu')} />
        {/* 采茶按钮（阿秀主线交互）：偶遇激活时隐藏，结束自动恢复，不自动跳 making */}
        {revealed['axiu'] && !activeEncounter && (
          <TeaSelect onPick={(id) => startMaking(id)} />
        )}
        {!activeEncounter && revealed['axiu'] && <NpcWeatherAside npcId="axiu" player={player} />}
        <EncounterLayer />
      </div>
    );
  }

  if (scene === 'workshop') {
    return (
      <div className="scene">
        <BackButton />
        <NpcDialog key="workshop-yanbo" scene="workshop" npcId="yanbo" onDone={() => reveal('yanbo')} />
        {revealed['yanbo'] && (
          <div className="scene-foot">
            <p className="hint">这里先认认门——武夷岩茶的工序：倒青 → 做青 → 炒揉 → 焙火。真要亲手做，从茶园选茶那头进。</p>
            <button className="btn btn-primary" onClick={() => go('garden')}>去茶园选茶开做</button>
          </div>
        )}
      </div>
    );
  }

  if (scene === 'pick-tea') {
    return <div className="scene"><TeaSelect onPick={(id) => startMaking(id)} /></div>;
  }

  if (scene === 'making') {
    return (
      <div className="scene">
        <BackButton />
        <MakingFlow />
      </div>
    );
  }

  if (scene === 'result') return <div className="scene"><ResultView /></div>;

  if (scene === 'brew') {
    if (!lastResult) return <div className="scene"><p className="hint">还没有茶可泡。</p></div>;
    return (
      <div className="scene">
        <BackButton />
        <BrewingFlow result={lastResult} difficulty={difficulty} onDone={(o) => finishBrewing(o)} />
      </div>
    );
  }

  if (scene === 'teatable') {
    const advice = zhouBoAdvice;
    return (
      <div className="scene">
        <BackButton />
        {!activeEncounter && revealed['zhoubo'] && <NpcWeatherAside npcId="zhoubo" player={player} />}
        <NpcDialog key="teatable-zhoubo" scene="teatable" npcId="zhoubo" onDone={() => { setFlag('tea_made', 1); reveal('zhoubo'); }} />
        {revealed['zhoubo'] && advice && (
          <div className="scene-foot">
            <p className="hint">周伯：「{advice.comment}」</p>
            {advice.suggestion && <p className="hint">{advice.suggestion}</p>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {advice.action && (
                <button className="btn btn-primary" onClick={() => go(advice.action!.target)}>{advice.action!.label}</button>
              )}
              <button className="btn" onClick={() => go('journal')}>看茶游记</button>
            </div>
          </div>
        )}
        {drinkNotice && (
          <div className="scene-foot">
            <p className="hint">🍵 {drinkNotice}</p>
          </div>
        )}
        <div className="scene-foot">
          {!brewPickerOpen && (
            <button className="btn" onClick={() => setBrewPickerOpen(true)}>用茶篓里的茶泡一壶</button>
          )}
          {brewPickerOpen && <TeaStackPicker onClose={() => setBrewPickerOpen(false)} />}
        </div>
      </div>
    );
  }

  if (scene === 'mothertree') {
    // 进入本场景前的状态快照：若当时还没拿到明信片，说明本次对话刚赠予 → 显示「获得」反馈。
    const gotNow = !hadPostcardOnEnter.current && player.souvenirs.includes('postcard_mothertree');
    return (
      <div className="scene">
        <BackButton />
        <NpcDialog key="mothertree-yanbo" scene="mothertree" npcId="yanbo" onDone={() => reveal('mt')} />
        {revealed['mt'] && (
          <div className="scene-foot">
            {gotNow && (
              <div className="gift-banner">
                <div className="gift-icon">📮</div>
                <div className="gift-text">
                  <div className="gift-title">岩伯的赠礼</div>
                  <div className="gift-sub">大红袍母树明信片 ×1</div>
                </div>
                <button className="btn btn-primary" onClick={() => go('souvenir', { souvenirId: 'postcard_mothertree' })}>看看明信片</button>
                <button className="btn" onClick={() => go('journal')}>收进游记</button>
              </div>
            )}
            {!gotNow && player.souvenirs.includes('postcard_mothertree') && (
              <div className="gift-banner gift-banner-quiet">
                <div className="gift-icon">📮</div>
                <div className="gift-text">
                  <div className="gift-sub">大红袍母树明信片（已收藏）</div>
                </div>
                <button className="btn" onClick={() => go('souvenir', { souvenirId: 'postcard_mothertree' })}>再看一眼</button>
              </div>
            )}
            <button className="btn" onClick={() => go('journal')}>看茶游记</button>
          </div>
        )}
      </div>
    );
  }

  if (scene === 'market') return <div className="scene"><MarketView /><EncounterLayer /></div>;

  // 山路：玩家主动「去山路上逛逛」到达的真实可游玩场景；本身普通，价值是给一个「逛」的旅行行为。
  if (scene === 'mountain') {
    return (
      <div className="scene">
        <BackButton />
        <NpcStage sceneKey="mountain" showFigure={false}>
          {/* 偶遇激活时隐藏山路默认场景描述（不删除/不改动文案），结束自动恢复；
              避免两套文案与 NPC 对话叠在一起。BackButton 等 Global UI 保留。 */}
          {!activeEncounter && (
            <>
              <div className="dialog-meta">
                <span className="dialog-npc-inline">山路</span>
              </div>
              <p className="dialog-line">山路弯弯，云雾在脚边散开。你慢慢走着，不知道会遇见谁。</p>
              <div className="scene-foot">
                <button className="btn" onClick={() => go('map')}>回到地图</button>
              </div>
            </>
          )}
        </NpcStage>
        <EncounterLayer />
      </div>
    );
  }

  if (scene === 'comic') return <div className="scene"><ComicView /></div>;
  if (scene === 'journal') return <div className="scene"><JournalView /></div>;
  if (scene === 'region-journal') return <div className="scene"><RegionJournalView /></div>;
  if (scene === 'souvenir') return <SouvenirView />;

  return <div className="scene"><MapView /></div>;
}
