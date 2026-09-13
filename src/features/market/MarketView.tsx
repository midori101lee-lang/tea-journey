import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../store/gameStore';
import NpcDialog from '../../components/NpcDialog';
import BackButton from '../../components/BackButton';
import { NpcStage } from '../../components/NpcStage';
import { NpcPortrait } from '../../components/art/NpcPortrait';
import { getTea } from '../../core/data/teas';
import { getNpc } from '../../core/data/npcs';
import { GRADE_LABEL, type Grade, type TeaStack } from '../../core/types';
import { RARITY_LABEL, type TeaWare } from '../../core/data/teaWares';
import { evaluateMarket, suggestedPrice, todayMarket, marketCustomers, type MarketEval, type MarketCustomer } from './marketEval';
import { generateStalls, lookAtTea, askSeller, ASK_QUESTIONS, type Stall, type StallTea } from './marketStalls';
import { buildTeaFeedback, type FeedbackLine } from '../../core/data/marketFeedback';

/** 熟客回访触发概率：每次进茶集市对「待回访」判定一次；未触发保留，触发播完即清除。 */
const VISIT_CHANCE = 0.3;

/** 主线里认识的人 = 熟人（来摊上会多捧场一点，封顶，不无限）。 */
const KNOWN = new Set(['laochen', 'axiu', 'yanbo', 'zhoubo', 'linggu']);

interface ResultLine {
  name: string;
  tea: string;
  grade: string;
  price: number;
  bought: boolean;
  willing?: number;
  qty?: number;
  kind: 'known' | 'old' | 'regular' | 'passer';
}

type Mode = 'home' | 'sell' | 'browse' | 'stall';

/**
 * 茶集市 V0.3：在现有「玩家摆摊(V0.2)」之上，新增「逛别人的摊 / 买茶」。
 *  - 小满仍是集市搭档：菜单分【摆我的茶】与【逛逛别人的摊】。
 *  - 逛摊：停留在茶集市场景内，NPC 以立绘形式出现在场景里（摊位），点开看茶、买茶。
 *  - 买茶：复用现有 coins / inventory（addCoins / addTea 同源），不新建第二套货币或库存。
 *  - 摊主(主动点买) 与 普通偶遇NPC(随机聊) 身份区分、共用立绘，不混系统。
 */
export default function MarketView() {
  const { player, sell, setFlag, buyTea, buyTeaWare, activeEncounter, consumeTeaFeedback } = useGame();
  const [talked, setTalked] = useState(false);
  const [mode, setMode] = useState<Mode>('home');
  // 熟客回访（轻量剧情反馈）：进茶集市时对「待回访」判定一次概率；抽中则在本面板播放，播完清除。
  const [visitLines, setVisitLines] = useState<FeedbackLine[] | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [results, setResults] = useState<ResultLine[] | null>(null);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [activeStall, setActiveStall] = useState<Stall | null>(null);
  const [bought, setBought] = useState<{ name: string; grade: Grade; price: number } | null>(null);
  const [pendingBuy, setPendingBuy] = useState<StallTea | null>(null);
  const [boughtWare, setBoughtWare] = useState<TeaWare | null>(null);
  const [pendingBuyWare, setPendingBuyWare] = useState<TeaWare | null>(null);
  // V0.4：摊位内子视图 —— list(默认) / look(看看茶) / ask(问问老板)
  const [view, setView] = useState<'list' | 'look' | 'ask'>('list');
  const [activeTea, setActiveTea] = useState<StallTea | null>(null);
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  // 茶集市卖茶选择：stackId -> 出售份数（0/缺省=不卖）。支持单卖与勾选批量卖。
  const [sellQty, setSellQty] = useState<Record<string, number>>({});
  // 轻量记忆：玩家之前从这位摊主买过茶（仅 flag，不建成好感/信誉数值）。
  const boughtBefore = (s: Stall) => !!player.flags['bought_from_' + s.npcId];

  // 任务⑧：在武夷山茶集市买下「景区王霸茶」后，偶遇结束回到市场时，让小满当场起疑并建议找周伯。
  // 仅触发一次（wangba_xiaoman_done 落盘后不再重播）；派生条件 xiaoman_wangba_suspect 已限定武夷山茶区。
  const prevEnc = useRef(activeEncounter);
  useEffect(() => {
    const wasActive = prevEnc.current;
    prevEnc.current = activeEncounter;
    if (wasActive && !activeEncounter) {
      const p = useGame.getState().player;
      if (p.flags['bought_wangba'] && !p.flags['wangba_xiaoman_done']) {
        setTalked(false); // 重新挂载小满对话 → conditional xiaoman_wangba_suspect 触发
      }
    }
  }, [activeEncounter]);

  // 熟客回访：每次挂载（= 进入茶集市）对「待回访」判定一次概率；抽中则生成对白，播完由玩家清除。
  // 没抽中什么都不显示，待回访保留到下次；同一份反馈最多播一次。
  useEffect(() => {
    const fb = useGame.getState().player.teaFeedback;
    if (fb && Math.random() < VISIT_CHANCE) setVisitLines(buildTeaFeedback(fb));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!talked) {
    return <NpcDialog key="market-xiaoman" scene="market" npcId="xiaoman" onDone={() => setTalked(true)} />;
  }

  // ───── 卖茶（沿用 V0.2） ─────
  // 旅途赠礼（老陈送的武夷山茶礼等）不进普通出售列表：仍可正常泡饮，但保留「我的旅途」身份、不折成茶钱。
  const stacks = player.inventory.filter((s) => s.source !== 'gift');
  const giftCount = player.inventory.filter((s) => s.source === 'gift').reduce((n, s) => n + s.count, 0);
  const market = todayMarket(player.day);
  const priceOf = (s: TeaStack) => prices[s.id] ?? suggestedPrice(s);
  const setPrice = (id: string, delta: number) => {
    const base = player.inventory.find((s) => s.id === id);
    if (!base) return;
    setPrices((p) => ({ ...p, [id]: Math.max(1, Math.min(999, (p[id] ?? suggestedPrice(base)) + delta)) }));
  };
  const useSuggested = (id: string) => {
    const base = player.inventory.find((s) => s.id === id);
    if (!base) return;
    setPrices((p) => ({ ...p, [id]: suggestedPrice(base) }));
  };
  // 勾选/取消：勾选默认卖 1 份（步进器可加到整包）。
  const toggleSell = (id: string) => {
    setSellQty((q) => {
      if ((q[id] ?? 0) > 0) { const n = { ...q }; delete n[id]; return n; }
      return { ...q, [id]: 1 };
    });
  };
  const stepQty = (id: string, max: number, delta: number) => {
    setSellQty((q) => {
      const cur = q[id] ?? 0;
      if (cur <= 0) return q;
      return { ...q, [id]: Math.max(1, Math.min(max, cur + delta)) };
    });
  };
  const openStall = () => {
    const selected = stacks.filter((s) => (sellQty[s.id] ?? 0) > 0);
    if (selected.length === 0) { setResults([]); return; }
    const customers = marketCustomers(player, player.day, selected);
    const log: ResultLine[] = [];
    selected.forEach((stack) => {
      const c = customers.find((x) => x.stackId === stack.id);
      if (!c) return; // 今天没轮到这位顾客（每日顾客数有限，与原逻辑一致）
      const price = priceOf(stack);
      const qty = Math.min(sellQty[stack.id] ?? stack.count, stack.count); // 防御：不超过手上份数
      const bought = price <= c.willing;
      const kind: ResultLine['kind'] =
        player.flags['stall_regular_' + c.npcId]
          ? 'old'
          : KNOWN.has(c.npcId) && player.metNpcs.includes(c.npcId)
            ? 'known'
            : c.isRegular
              ? 'regular'
              : 'passer';
      if (bought) {
        sell(c.stackId, price, qty);
        if (kind !== 'passer') setFlag('stall_regular_' + c.npcId, 1);
        log.push({ name: c.name, tea: getTea(c.teaId).name, grade: stack.grade, price: price * qty, qty, bought: true, kind });
      } else {
        log.push({ name: c.name, tea: getTea(c.teaId).name, grade: stack.grade, price, bought: false, willing: c.willing, kind });
      }
    });
    setSellQty({}); // 收摊后清空选择，避免与卖出后的新库存错位
    setResults(log);
  };
  // 已选摘要：款数 + 预计可得茶钱（定价×份数）。
  const sellSummary = stacks.reduce(
    (acc, s) => {
      const q = sellQty[s.id] ?? 0;
      if (q > 0) { acc.count += 1; acc.coins += priceOf(s) * q; }
      return acc;
    },
    { count: 0, coins: 0 },
  );
  const tagOf = (ev: MarketEval): { cls: string; text: string } => {
    if (ev.advice === 'raise') return { cls: 'adv-raise', text: `小满：「${ev.adviceLine}」` };
    if (ev.advice === 'avoid') return { cls: 'adv-avoid', text: `小满：「${ev.adviceLine}」` };
    return { cls: 'adv-normal', text: `小满：「${ev.adviceLine}」` };
  };

  // ───── 逛摊 / 买茶（V0.3） ─────
  const enterBrowse = () => {
    // 传入 flags：未解锁茶区的茶不实际摆出，仅出现「尚未解锁」预告位（跨区流通核心规则）。
    setStalls(generateStalls(player.day, player.currentRegion, player.flags));
    setActiveStall(null);
    setBought(null);
    setPendingBuy(null);
    setBoughtWare(null);
    setPendingBuyWare(null);
    setMode('browse');
  };
  const enterStall = (s: Stall) => {
    setActiveStall(s);
    setBought(null);
    setPendingBuy(null);
    setBoughtWare(null);
    setPendingBuyWare(null);
    setView('list');
    setActiveTea(null);
    setAskAnswer(null);
    setMode('stall');
  };
  const confirmBuy = (t: StallTea) => {
    const ok = buyTea(t.teaId, t.grade, t.price, activeStall?.npcId, t.bargain);
    setPendingBuy(null);
    if (ok) {
      setBought({ name: getTea(t.teaId).name, grade: t.grade, price: t.price });
      if (activeStall) setFlag('bought_from_' + activeStall.npcId, 1); // 轻量记忆：下次来这摊换熟客招呼
    }
  };
  const confirmBuyWare = (w: TeaWare) => {
    const ok = buyTeaWare(w.id);
    setPendingBuyWare(null);
    if (ok) setBoughtWare(w);
  };

  return (
    <div className="scene">
      <BackButton />
      <NpcStage sceneKey="market" npcId="xiaoman" showFigure={mode === 'home' || mode === 'sell'}>
        {!activeEncounter && mode === 'home' && (visitLines ? (
          <div className="market-home">
            {/* 熟客回访：失败茶抱怨 / 上品茶好评（按茶种+失败原因生成）。播完清除待回访状态。 */}
            <div className="dialog-meta">
              <span className="dialog-npc-inline">熟客回访</span>
            </div>
            <div className="dialog-bubble-wrap">
              {visitLines.map((l, i) => (
                <div className="dialog-bubble dialog-bubble--npc" key={i}>
                  <p className="dialog-line">{l.speaker}：「{l.text}」</p>
                </div>
              ))}
            </div>
            <div className="dialog-choices">
              <button className="btn btn-primary" onClick={() => { consumeTeaFeedback(); setVisitLines(null); }}>继续</button>
            </div>
          </div>
        ) : (
          <div className="market-home">
            <p className="dialog-line">小满：「今天人不少。你是来卖茶，还是想去别人摊上看看？」</p>
            <div className="dialog-choices">
              <button className="btn btn-primary" onClick={() => setMode('sell')}>摆我的茶</button>
              <button className="btn" onClick={enterBrowse}>逛逛别人的摊</button>
            </div>
            <div className="scene-foot">
              <span className="hint">当前茶钱：{player.coins} 文　·　第 {player.day} 天</span>
            </div>
          </div>
        ))}

        {!activeEncounter && mode === 'sell' && (
          <>
            <div className="market-quote">
              <div className="market-quote-head">📊 今日行情 · 第 {player.day} 天</div>
              <div className="market-quote-title">{market.headline}</div>
              <div className="hint">{market.note}</div>
            </div>
            {giftCount > 0 && (
              <p className="hint">🎒 茶篓里还有 {giftCount} 份从茶山带回的茶礼——那个不卖，留着自己喝。</p>
            )}
            {stacks.length === 0 ? (
              <p className="hint">背包里还没有自己做的茶。先去采茶、做一锅吧。</p>
            ) : !results ? (
                <div className="market-trade">
                  {stacks.map((s) => {
                  const ev = evaluateMarket(s);
                  const tag = tagOf(ev);
                  const teaName = getTea(s.teaId).name;
                  const price = priceOf(s);
                  const picked = (sellQty[s.id] ?? 0) > 0;
                  return (
                    <div className="trade-card" key={s.id}>
                      <label className="trade-pick">
                        <input type="checkbox" checked={picked} onChange={() => toggleSell(s.id)} />
                        <span className="trade-head">{teaName} · {GRADE_LABEL[s.grade]} ×{s.count}（{s.roastLevel}火）</span>
                      </label>
                      <div className={`price-advice ${tag.cls}`}>
                        <p className="dialog-line">{tag.text}</p>
                        <div className="price-row">
                          <span className="hint">你的定价</span>
                          <button className="price-step" onClick={() => setPrice(s.id, -2)} aria-label="降价">−</button>
                          <span className="price-now">{price} 文</span>
                          <button className="price-step" onClick={() => setPrice(s.id, 2)} aria-label="涨价">＋</button>
                          <button className="btn btn-ghost price-sug" onClick={() => useSuggested(s.id)}>听小满的</button>
                        </div>
                        {picked && (
                          <div className="sell-qty">
                            <span className="hint">出售数量</span>
                            <button className="price-step" onClick={() => stepQty(s.id, s.count, -1)} disabled={sellQty[s.id] <= 1} aria-label="减少">−</button>
                            <span className="price-now">{sellQty[s.id]} / {s.count}</span>
                            <button className="price-step" onClick={() => stepQty(s.id, s.count, 1)} disabled={sellQty[s.id] >= s.count} aria-label="增加">＋</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {sellSummary.count > 0 && (
                  <p className="hint sell-summary">已选 {sellSummary.count} 款 · 预计可卖 {sellSummary.coins} 文</p>
                )}
                <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={openStall} disabled={sellSummary.count === 0}>🔔 开门迎客</button>
              </div>
            ) : (
              <div className="market-result">
                <div className="market-quote-head">🍵 今天的生意</div>
                {results.length === 0 && <p className="hint">今天没人来摊上。改天再来吧。</p>}
                {results.map((r, i) => (
                  <p className="dialog-line" key={i}>
                    {r.kind === 'known' && '（熟人）'}
                    {r.kind === 'old' && '（老主顾）'}
                    {r.kind === 'regular' && '（回头客）'}
                    {r.name}
                    {r.bought
                      ? ` 买了你的 ${r.tea}（${GRADE_LABEL[r.grade as keyof typeof GRADE_LABEL] ?? r.grade}）${r.qty && r.qty > 1 ? ` ×${r.qty}` : ''}，付了 ${r.price} 文。`
                      : ` 觉得 ${r.price} 文有点贵，摇摇头走了。（他最多出 ${r.willing} 文）`}
                  </p>
                ))}
                <div className="dialog-choices" style={{ marginTop: 8 }}>
                  <button className="btn" onClick={() => setResults(null)}>收摊，再想想定价</button>
                  <button className="btn btn-primary" onClick={() => { setResults(null); setMode('home'); }}>回到茶集市</button>
                </div>
              </div>
            )}
          </>
        )}

        {!activeEncounter && mode === 'browse' && (
          <div className="market-browse">
            <p className="dialog-line">点开摊位，看看今天别人摆了什么。</p>
            <div className="stall-row">
              {stalls.map((s) => (
                <button className="stall-card" key={s.npcId} onClick={() => enterStall(s)}>
                  <div className="stall-portrait"><NpcPortrait id={s.npcId} scale={getNpc(s.npcId).stallScale ?? 0.72} /></div>
                  <div className="stall-name">{s.name}</div>
                  <div className="stall-tag">摊</div>
                </button>
              ))}
            </div>
            <div className="dialog-choices">
              <button className="btn" onClick={() => setMode('home')}>回小满那儿</button>
            </div>
            <div className="scene-foot"><span className="hint">当前茶钱：{player.coins} 文</span></div>
          </div>
        )}

        {!activeEncounter && mode === 'stall' && activeStall && (
          <div className="stall-detail">
            <div className="dialog-meta">
              <span className="dialog-npc-inline">{activeStall.name}</span>
              <span className="dialog-role-inline">{activeStall.role}</span>
            </div>
            {boughtBefore(activeStall) ? (
              <p className="dialog-line">「哟，又来了。」{activeStall.name}抬眼看了你一下，「上次拿的那包，喝着还行吧？」</p>
            ) : (
              <p className="dialog-line">{activeStall.greeting}</p>
            )}
            <p className="hint">🪙 茶钱：{player.coins} 文</p>

            {pendingBuy ? (
              <div className="buy-confirm">
                <div className="buy-row"><span>🪙 茶钱</span><span>{player.coins} 文</span></div>
                <div className="buy-row"><span>这包茶</span><span>{pendingBuy.price} 文</span></div>
                <div className="buy-row buy-remain"><span>买下后剩余</span><span>{player.coins - pendingBuy.price} 文</span></div>
                <div className="dialog-choices">
                  <button className="btn btn-primary" onClick={() => confirmBuy(pendingBuy)}>买下</button>
                  <button className="btn" onClick={() => setPendingBuy(null)}>先不买</button>
                </div>
              </div>
            ) : pendingBuyWare ? (
              <div className="buy-confirm">
                <div className="buy-row"><span>🪙 茶钱</span><span>{player.coins} 文</span></div>
                <div className="buy-row"><span>这件茶具</span><span>{pendingBuyWare.price} 文</span></div>
                <div className="buy-row buy-remain"><span>买下后剩余</span><span>{player.coins - pendingBuyWare.price} 文</span></div>
                <div className="dialog-choices">
                  <button className="btn btn-primary" onClick={() => confirmBuyWare(pendingBuyWare)}>买下</button>
                  <button className="btn" onClick={() => setPendingBuyWare(null)}>先不买</button>
                </div>
              </div>
            ) : view === 'look' && activeTea ? (
              <div className="tea-detail">
                <div className="tea-detail-head">{getTea(activeTea.teaId).name} · {GRADE_LABEL[activeTea.grade]}</div>
                <p className="dialog-line">（你凑近看了看）</p>
                <p className="note">{lookAtTea(activeTea.teaId, activeTea.grade)}</p>
                <p className="dialog-line">{activeStall.name}：「{activeTea.desc}」</p>
                {activeTea.note && <p className="note stall-tea-note">{activeTea.note}</p>}
                <div className="dialog-choices">
                  <button className="btn" onClick={() => { setView('list'); setActiveTea(null); }}>返回</button>
                </div>
              </div>
            ) : view === 'ask' && activeTea ? (
              <div className="ask-panel">
                <div className="tea-detail-head">{getTea(activeTea.teaId).name} · {GRADE_LABEL[activeTea.grade]}</div>
                {askAnswer ? (
                  <>
                    <p className="dialog-line">{activeStall.name}：「{askAnswer}」</p>
                    <div className="dialog-choices">
                      <button className="btn" onClick={() => setAskAnswer(null)}>再问点别的</button>
                      <button className="btn" onClick={() => { setView('list'); setActiveTea(null); setAskAnswer(null); }}>不问了</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="hint">你想问：</p>
                    {ASK_QUESTIONS.map((q) => (
                      <button className="btn ask-q" key={q.key} onClick={() => setAskAnswer(askSeller(activeStall.npcId, q.key, player.currentRegion))}>{q.label}</button>
                    ))}
                    <button className="btn" onClick={() => { setView('list'); setActiveTea(null); }}>算了</button>
                  </>
                )}
              </div>
            ) : (
              <>
                {activeStall.lockedHint && (
                  <div className="stall-tea stall-tea--locked">
                    <div className="stall-tea-head">{activeStall.lockedHint.title}</div>
                    <div className="stall-tea-desc">{activeStall.lockedHint.desc}</div>
                  </div>
                )}
                {activeStall.teas.map((t) => {
                  const afford = player.coins >= t.price;
                  return (
                    <div className="stall-tea" key={t.teaId + t.grade}>
                      <div className="stall-tea-head">{getTea(t.teaId).name} · {GRADE_LABEL[t.grade]}</div>
                      <div className="stall-tea-desc">“{t.desc}”</div>
                      {t.note && <div className="stall-tea-note">{t.note}</div>}
                      <div className="stall-tea-actions">
                        <button className="btn btn-ghost" onClick={() => { setActiveTea(t); setView('look'); }}>看看</button>
                        <button className="btn btn-ghost" onClick={() => { setActiveTea(t); setAskAnswer(null); setView('ask'); }}>问问</button>
                        <button className="btn btn-primary" disabled={!afford} onClick={() => setPendingBuy(t)}>买下来 · {t.price}文</button>
                      </div>
                      {!afford && <p className="hint warn">还差 {t.price - player.coins} 文，先不买这包。</p>}
                    </div>
                  );
                })}
                {bought && (
                  <div className="tea-gain">
                    <span className="tea-gain-icon">🍵</span>
                    <span className="tea-gain-text">+1 {bought.name}（{GRADE_LABEL[bought.grade]}）</span>
                    <div className="tea-gain-sub">已放入茶篓 · 来自{activeStall.name}的摊</div>
                  </div>
                )}

                {/* 茶具：与茶混摆，复用买茶 UI 的确认面板样式；已拥有不再扣钱 */}
                {activeStall.wares.length > 0 && (
                  <div className="stall-wares">
                    <div className="stall-section-label">🫖 茶具</div>
                    {activeStall.wares.map((w) => {
                      const owned = player.teaWareInventory.includes(w.id);
                      const afford = player.coins >= w.price;
                      return (
                        <div className={`stall-ware${owned ? ' owned' : ''}`} key={w.id}>
                          <div className="stall-tea-head">
                            {w.name}
                            <span className={`ware-rarity ware-${w.rarity}`}>{RARITY_LABEL[w.rarity]}</span>
                          </div>
                          <div className="stall-tea-desc">“{w.description}”</div>
                          {owned ? (
                            <div className="stall-tea-buy"><span className="hint">✓ 已拥有 · 已收入茶具收藏</span></div>
                          ) : (
                            <div className="stall-tea-buy">
                              <span className="hint">🪙 {w.price} 文</span>
                              <button className="btn btn-primary" disabled={!afford} onClick={() => setPendingBuyWare(w)}>买下来</button>
                            </div>
                          )}
                          {!owned && !afford && <p className="hint warn">还差 {w.price - player.coins} 文，先不买这件。</p>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {boughtWare && (
                  <div className="tea-gain">
                    <span className="tea-gain-icon">🫖</span>
                    <span className="tea-gain-text">+1 {boughtWare.name}</span>
                    <div className="tea-gain-sub">已收入茶具收藏</div>
                  </div>
                )}
              </>
            )}

            <div className="dialog-choices">
              <button className="btn" onClick={() => { setActiveStall(null); setMode('browse'); setBought(null); setPendingBuy(null); setView('list'); setActiveTea(null); setAskAnswer(null); }}>再逛逛</button>
            </div>
          </div>
        )}
      </NpcStage>
    </div>
  );
}
