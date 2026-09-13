import { useState } from 'react';
import { getTea, STEP_META } from '../../core/data/teas';
import { regionLocationScene } from '../../core/data/regions';
import { GRADE_LABEL, proficiencyLabel } from '../../core/types';
import { useGame } from '../../store/gameStore';
import type { Scene } from '../../store/gameStore';
import { IS_XHS } from '../../core/platform';
import ShareSheet from '../../components/ShareSheet';
import type { SharePayload } from '../../components/ShareSheet';
import { TeaLeavesPile } from '../../components/art/Art';

/** 龙井（绿茶）结果页的轻量「整理 / 装袋」环节：炒制完成后给一个收尾的小互动，
 *  让玩家感到「这包茶终于可以带走 / 出售 / 喝掉了」。不新增茶叶属性、不改动库存逻辑，
 *  只是结果页上的一段展示型交互（茶早已在 finishMaking 时入篓）。 */
type PackStep = 'idle' | 'tidied' | 'bagged';

export default function ResultView() {
  const { lastResult, player, go, startMaking, startBrewFromStack } = useGame();
  const [packStep, setPackStep] = useState<PackStep>('idle');
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);
  if (!lastResult) return null;
  const tea = getTea(lastResult.teaId);
  const isFail = lastResult.grade === 'fail';
  // 仅西湖龙井（绿茶）走这条轻量收尾；其余茶类沿用原有结果页，不受影响。
  const isLongjing = lastResult.teaId === 'longjing';
  // 「带去茶桌泡一杯」直接定位刚入篓的那一 stack 进入泡茶：与茶篓选茶共用同一条入口，
  // 从而正确记录 brewingStackId，泡完结算时只扣这一包（自制/购买/赠送统一逻辑）。
  const madeStackId = `${lastResult.teaId}:${lastResult.grade}:${lastResult.roastLevel}`;
  const madeStack = player.inventory.find((s) => s.id === madeStackId);
  // 回本茶区的茶园（武夷山 / 杭州各自绑定本地场景），换一种茶。
  const gardenScene = regionLocationScene(tea.regionId, 'garden') as Scene;
  // 过程标签：岩茶说「火功」，红茶说「发酵」，绿茶说「杀青」（龙井最关键的一步），其余说「工艺」。
  const processLabel = tea.category === 'yancha' ? '火功'
    : tea.category === 'hongcha' ? '发酵'
      : tea.category === 'green' ? '杀青'
        : '工艺';

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="hint">今日制茶结果</div>
      <h2 className="h-serif" style={{ margin: '6px 0 2px' }}>{tea.fullName}</h2>

      <div style={{ background: 'var(--paper-2)', border: '1px solid var(--ochre)', borderRadius: 12, padding: 20, marginTop: 12 }}>
        <div className="hint" style={{ letterSpacing: '0.2em' }}>品质等级</div>
        <div className="h-serif" style={{ fontSize: 30, letterSpacing: '0.3em', color: isFail ? 'var(--rock)' : 'var(--seal)' }}>
          {GRADE_LABEL[lastResult.grade]}
        </div>
        <div style={{ textAlign: 'center', margin: '12px 0' }}>
          <TeaLeavesPile width={150} color={lastResult.visuals.dryColor} curled={lastResult.visuals.shape === 'curled'} broken={lastResult.visuals.shape === 'broken'} />
        </div>

        <div className="hint" style={{ textAlign: 'left', marginTop: 6 }}>这一锅怎么样</div>
        <p className="note">{lastResult.comment}</p>

        {lastResult.highlight && (
          <>
            <div className="hint" style={{ textAlign: 'left', marginTop: 6 }}>这次最值得注意</div>
            <div
              className="note"
              style={{ color: lastResult.faultReason ? 'var(--cliff)' : 'var(--bamboo)', marginTop: 2 }}
            >
              {lastResult.highlight}
            </div>
          </>
        )}

        {/* 逐工序小记：让玩家看懂「我这锅茶是怎么做出来的」（自然语言，无数值面板） */}
        {lastResult.stepNotes && lastResult.stepNotes.length > 0 && (
          <>
            <div className="hint" style={{ textAlign: 'left', marginTop: 10 }}>这锅茶 · 工序小记</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 0', textAlign: 'left' }}>
              {lastResult.stepNotes.map((n) => (
                <li key={n.step} className="note" style={{ margin: '2px 0', color: 'var(--ink-2)' }}>
                  <span style={{ color: 'var(--ink-3)' }}>{STEP_META[n.step]?.gameName ?? n.step}：</span>{n.text}
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="h-serif" style={{ marginTop: 12 }}>可售：{lastResult.value} 茶钱</div>
        <div className="hint">{processLabel}：{lastResult.roastLevel}（本次过程的结果标签，不表示现实品质高低）</div>
        <div className="hint" style={{ marginTop: 8 }}>🎒 已收入茶篓</div>
      </div>

      {/* 龙井专属的轻量收尾：整理茶叶 → 装入茶袋 → 成品信息。纯展示交互，不阻挡后续操作。 */}
      {isLongjing && (
        <div style={{ marginTop: 14, background: 'var(--paper-2)', border: '1px dashed var(--ochre)', borderRadius: 12, padding: 16 }}>
          <div className="hint" style={{ letterSpacing: '0.2em' }}>亲手做的茶，收一收</div>
          {packStep === 'idle' && (
            <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={() => setPackStep('tidied')}>整理茶叶</button>
          )}
          {packStep === 'tidied' && (
            <>
              <p className="note" style={{ marginTop: 8 }}>你把茶叶在掌心里摊开，理去碎末，拢成一束。</p>
              <button className="btn btn-primary" onClick={() => setPackStep('bagged')}>装入茶袋</button>
            </>
          )}
          {packStep === 'bagged' && (
            <>
              <p className="note" style={{ marginTop: 8 }}>这包龙井，终于可以带走、出售、喝掉了。</p>
              <div style={{ marginTop: 10, textAlign: 'left' }}>
                <div className="h-serif" style={{ marginBottom: 4 }}>【西湖龙井】</div>
                <div className="note" style={{ color: 'var(--ink-2)' }}>色泽：嫩绿</div>
                <div className="note" style={{ color: 'var(--ink-2)' }}>香气：清鲜</div>
                <div className="note" style={{ color: 'var(--ink-2)' }}>形态：扁平挺秀</div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="hint" style={{ marginTop: 10 }}>
        制茶熟练度：{proficiencyLabel(player.proficiency)}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* 只有确实定位到「刚入篓的这一包」时才给泡茶入口——不再有「不带 stackId 直接进泡茶」的路径，
            从而保证「泡完必扣这一包」，不会出现泡了不消耗。 */}
        {madeStack && (
          <button className="btn btn-primary" onClick={() => startBrewFromStack(madeStack)}>带去茶桌泡一杯</button>
        )}
        <button className="btn" onClick={() => startMaking(tea.id)}>再做一锅</button>
        <button className="btn" onClick={() => go('journal')}>看看茶游记</button>
        <button className="btn" onClick={() => go('map')}>🗺️ 回茶地图</button>
      </div>
      {/* 小红书分享入口（仅 XHS）：分享制茶结果，可选、不阻断主线。 */}
      {IS_XHS && (
        <button className="btn" style={{ marginTop: 10 }} onClick={() => setSharePayload({
          kind: 'making',
          title: '这一锅茶',
          lines: [
            `${tea.fullName} · ${GRADE_LABEL[lastResult.grade]}`,
            lastResult.comment,
            `${processLabel}：${lastResult.roastLevel}`,
            `今日制茶熟练度：${proficiencyLabel(player.proficiency)}`,
          ],
        })}>分享制茶结果</button>
      )}
      <button className="btn" style={{ marginTop: 10, border: 'none', background: 'none', boxShadow: 'none' }} onClick={() => go(gardenScene)}>
        回到茶园 / 换一种茶
      </button>
      <ShareSheet payload={sharePayload} onClose={() => setSharePayload(null)} />
    </div>
  );
}
