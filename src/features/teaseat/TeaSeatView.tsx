import { useState } from 'react';
import { useGame } from '../../store/gameStore';
import BackButton from '../../components/BackButton';
import { NpcPortrait } from '../../components/art/NpcPortrait';
import { getTea } from '../../core/data/teas';
import { getTeaWare } from '../../core/data/teaWares';
import { getNpc } from '../../core/data/npcs';
import { teaVisual } from '../../core/data/teaVisuals';
import { currentWeatherId, WEATHER_CONFIG } from '../../core/data/weather';
import type { TeaStack } from '../../core/types';
import TeaSeatTable from './TeaSeatTable';
import { IS_XHS } from '../../core/platform';
import ShareSheet from '../../components/ShareSheet';
import type { SharePayload } from '../../components/ShareSheet';
import {
  canEnterTeaSeat, isTeaSeatFirstVisit, rollTeaSeatNpc, teaSeatChatLine, teaSeatGiftChance,
  rollTeaSeatGift, TEA_SEAT_BY_REGION, LINGGU_WUYI_INVITE_LINES, LINGGU_WUYI_DECLINE_LINES,
} from '../../core/data/teaseat';

const GRADE_LABEL: Record<string, string> = { fail: '失败', normal: '普通', good: '良好', fine: '上品' };

const REGION_TEXT: Record<'hangzhou' | 'wuyishan', { setupIntro: string; leave: string; noWare: string }> = {
  hangzhou: {
    setupIntro: '湖边的一方石台，一只蒲团。把带来的茶具摆上，坐下来喝一杯。',
    leave: '收拾茶席，回杭州',
    noWare: '还没有自己的茶具。等你有了一件趁手的茶具，再来布置这一方茶席。',
  },
  wuyishan: {
    setupIntro: '茶亭后头的一方空地，一只蒲团。把茶具摆上，坐下来喝一杯。',
    leave: '收拾茶席，回武夷山',
    noWare: '这方茶席还没对你开放。先回杭州喝一阵，等林姑娘邀你回来再说。',
  },
};

/**
 * 我的茶席（9:16 竖屏分层场景；杭州/武夷山共用同一套组件与状态机，仅地区配置不同）。
 *
 * 分层（自下而上）：
 *   L1 背景图（茶席环境：杭州=湖景石台；武夷山=茶亭九曲溪——不画桌、不画茶具）
 *   L2 NPC（NPC_SEAT：坐在茶桌「后面」，下半身被桌面遮挡）
 *   L3 茶桌（TeaSeatTable 前景组件：低矮横向东方木桌，两茶区共用）
 *   L4 茶具/茶叶/配件（三槽位动态叠加：MAIN_TEAWARE_SLOT / TEA_LEAF_SLOT / ACCESSORY_SLOT）
 *   L5 玩家侧（PLAYER_SEAT＝蒲团；玩家自己的杯摆在蒲团上）
 *   L6 对话/按钮 UI
 *
 * 玩法（完全复用）：布置 → 入席 →（首次固定地区引路人 / 之后概率偶遇）→
 * 邀请同饮（闲聊 + 概率回礼）。不消耗库存、不加好感度/任务。
 * 杭州专属剧情：坐过一次后，林姑娘会来邀请回武夷山（可「再等等」，之后再来找；接受→回武夷山→老陈寒暄→解锁武夷山茶席）。
 */
export default function TeaSeatView({ regionId }: { regionId: 'hangzhou' | 'wuyishan' }) {
  const { player, go, setFlags, addGiftTea, showToast, enterRegion, drinkTea } = useGame();
  const cfg = TEA_SEAT_BY_REGION[regionId];
  const text = REGION_TEXT[regionId];

  const [phase, setPhase] = useState<'setup' | 'seated' | 'ended'>('setup');
  const [stack, setStack] = useState<TeaStack | null>(null);   // 选中茶叶（不消耗）
  const [wareId, setWareId] = useState<string | null>(null);   // 选中主茶具
  const [teaDecided, setTeaDecided] = useState(false);         // 「先不摆茶」也算决定过
  const [wareDecided, setWareDecided] = useState(false);
  const [guestNpc, setGuestNpc] = useState<string | null>(null);
  const [lines, setLines] = useState<string[]>([]);
  const [inviteMode, setInviteMode] = useState(false);         // 林姑娘的「回武夷山」邀请（杭州专属）
  const [pickingTeaFor, setPickingTeaFor] = useState<false | 'setup' | 'invite'>(false);
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);

  if (!canEnterTeaSeat(player, regionId)) {
    return (
      <div className="scene">
        <BackButton />
        <p className="hint">{text.noWare}</p>
      </div>
    );
  }

  // 茶席分享内容：复用当前茶席状态（地区 / 选的茶 / 同饮 NPC），不新建评价系统。仅 XHS 调用。
  const teaseatSharePayload = (): SharePayload | null => {
    const regionName = regionId === 'hangzhou' ? '杭州' : '武夷山';
    const lines: string[] = [`在${regionName}的一方茶席坐下`];
    if (stack) lines.push(`${getTea(stack.teaId).fullName}（${GRADE_LABEL[stack.grade]}）`);
    lines.push(guestNpc ? `和${getNpc(guestNpc).name}一起喝了这壶茶` : '今天没什么人来，自己慢慢喝了一杯');
    return { kind: 'teaseat', title: '我的茶席小记', lines };
  };

  const weather = WEATHER_CONFIG[currentWeatherId(player)];
  const weatherText = `今天${weather.name}——${weather.shortDescription}`;
  const ware = wareId ? getTeaWare(wareId) : undefined;
  const firstVisit = isTeaSeatFirstVisit(player, regionId);
  const ownedWares = player.teaWareInventory.map(getTeaWare).filter((w) => !!w);
  // 杭州专属：阿青的绿豆糕常驻配件槽；武夷山配件槽=素色小杯。
  const hasCake = regionId === 'hangzhou' && !!player.flags['received_lvdocake'];
  // 林姑娘的邀请（杭州专属）：坐过一次、武夷山茶席还没解锁 → 每次入席她都会再来提一嘴（可再等等，不锁内容）。
  const wuyiInvitePending =
    regionId === 'hangzhou' &&
    !!player.flags['teaseat_first_done'] &&
    !player.flags['wuyishan_teaseat_unlocked'];

  // ── 入席：首次固定地区引路人；杭州在合适时点触发林姑娘邀请；其余按概率偶遇 ──
  function enterSeat() {
    if (firstVisit) {
      setGuestNpc(cfg.firstNpc);
      setLines(cfg.firstLines);
      if (regionId === 'hangzhou') {
        setFlags({ teaseat_first_done: 1, received_lvdocake: 1 });
        showToast('🥮 阿青送的绿豆糕，摆上了茶席');
      } else {
        setFlags({ [cfg.firstDoneFlag]: 1 });
      }
    } else if (wuyiInvitePending) {
      setGuestNpc('linggu');
      setInviteMode(true);
      setLines(LINGGU_WUYI_INVITE_LINES);
    } else {
      const npc = rollTeaSeatNpc(cfg);
      setGuestNpc(npc);
      if (npc) {
        const pool = cfg.greetings[npc];
        setLines([`「${pool[Math.floor(Math.random() * pool.length)]}」`]);
      } else if (stack) {
        // 没人来 = 自己喝：一次实饮，扣 1 包（此处只扣这一次；等待/布置不扣）
        drinkTea(stack.id);
      }
    }
    setPhase('seated');
  }

  // ── 邀请一起喝茶：闲聊 + 概率回礼（品质越好概率越高，永不 100%）──
  function shareWith(served: TeaStack) {
    const npc = guestNpc!;
    const tea = getTea(served.teaId);
    // 与 NPC 同饮 = 一次实饮，扣 1 包（只在真正开喝的这一刻扣）
    drinkTea(served.id);
    const out: string[] = [`${getNpc(npc).name} 和你分这一壶 ${tea.name}（${GRADE_LABEL[served.grade]}）。`];
    out.push(`「${teaSeatChatLine(cfg, npc, tea.category, served.teaId)}」`);
    if (Math.random() < teaSeatGiftChance(served.grade)) {
      const giftId = rollTeaSeatGift(served.teaId, tea.regionId);
      addGiftTea(giftId, 'good', 1, 'teaseat_return');
      out.push(`（临走时，${getNpc(npc).name} 往你茶篓里放了一小包茶——算是这份茶席的回礼。）`);
      showToast(`🍵 回礼：${getTea(giftId).name} ×1 已放入茶篓`);
    } else {
      out.push(`（聊得挺高兴。${getNpc(npc).name} 摆摆手走了——下回再来。）`);
    }
    setLines(out);
    setPhase('ended');
  }

  function invite() {
    if (!stack) { setPickingTeaFor('invite'); return; }
    shareWith(stack);
  }

  // ── 林姑娘邀请的两个回应 ──
  function declineTravel() {
    setInviteMode(false);
    setLines(LINGGU_WUYI_DECLINE_LINES);
    setPhase('ended'); // 不落任何 flag：之后入席她会再来找（不锁杭州内容）
  }

  function acceptTravel() {
    setFlags({ linggu_wuyi_accepted: 1 });
    setInviteMode(false);
    setLines([
      '「好嘞，那就这么说定了。」',
      '（你收起茶席，跟林姑娘一道上了路。武夷山的山，还是记忆里的样子。）',
    ]);
    setPhase('ended');
  }

  // ── 打个招呼，自己喝茶 ──
  function greetOnly() {
    const npc = guestNpc!;
    // 自饮 = 一次实饮，扣 1 包
    if (stack) drinkTea(stack.id);
    const pool = cfg.greetings[npc];
    setLines([`「${pool[Math.floor(Math.random() * pool.length)]}」`, `（你打了个招呼，自己慢慢喝。${weatherText}）`]);
    setPhase('ended');
  }

  function pickTea(s: TeaStack) {
    setStack(s);
    setPickingTeaFor(false);
    setTeaDecided(true);
    // 邀请中途补选：选完直接开喝（显式传入，避免读到旧闭包里的 stack）
    if (pickingTeaFor === 'invite') shareWith(s);
  }

  return (
    <div className="scene">
      <BackButton />

      {/* ── 舞台：9:16，背景完整不裁切（容器比例=图片比例 941:1672≈9:16；两茶区背景同构图） ── */}
      <div className="teaseat-stage">
        {/* L1 环境背景（按茶区切换：杭州湖景 / 武夷山茶亭溪山） */}
        <img className="teaseat-bg" src={`${import.meta.env.BASE_URL}${cfg.bg}`} alt="" />

        {/* L2 NPC（NPC_SEAT：坐在茶桌后面，z1 < 桌 z2，下半身自然被桌面遮住） */}
        {guestNpc && (
          <div className="teaseat-npc" style={{ left: '50%', bottom: '29.5%', width: '26%' }}>
            <NpcPortrait id={guestNpc} />
          </div>
        )}

        {/* L3 茶桌（前景组件，遮 NPC 下半身；两茶区共用） */}
        <TeaSeatTable />

        {/* L4 茶具 / 茶叶 / 配件（三槽位，全部动态叠加在桌面上；尺寸收敛到「摆在桌上」的透视感） */}
        {stack && (
          <div className="teaseat-item" style={{ left: '31%', top: '71%', width: '12%' }} title={getTea(stack.teaId).name}>
            <TeaLeafPile color={teaVisual(stack.teaId).leafColor} />
          </div>
        )}
        {ware && (
          <div className="teaseat-item" style={{ left: '50%', top: '70.5%', width: '12%' }} title={ware.name}>
            <img src={`${import.meta.env.BASE_URL}${ware.asset}`} alt={ware.name} />
          </div>
        )}
        {/* ACCESSORY_SLOT：杭州=绿豆糕（阿青赠后常驻）或素杯；武夷山=素色小杯 */}
        <div className="teaseat-item" style={{ left: '69%', top: '71%', width: '11%' }}>
          {hasCake
            ? <img src={`${import.meta.env.BASE_URL}assets/snacks/lvdocake.webp`} alt="绿豆糕" />
            : <SmallCupSvg />}
        </div>

        {/* L5 玩家侧（PLAYER_SEAT＝蒲团；选了茶后，自己的杯摆在蒲团上） */}
        {phase !== 'setup' && stack && (
          <div className="teaseat-item" style={{ left: '50%', top: '89.5%', width: '9%', zIndex: 4 }} title="你的座位">
            <PlayerCupSvg color={teaVisual(stack.teaId).liquorLight} />
          </div>
        )}

        {/* L6 对话浮层：入席后叠加在舞台内（与 NpcDialog 的 .dialog-overlay 同一机制），
            文字永远落在背景区域内，不再跑到舞台下方 */}
        {phase !== 'setup' && (
          <div className="teaseat-dialog">
            {guestNpc && (
              <div className="dialog-meta">
                <span className="dialog-npc-inline">{getNpc(guestNpc).name}</span>
                <span className="dialog-role-inline">{getNpc(guestNpc).role}</span>
              </div>
            )}
            {lines.map((l, i) => (
              <p className="dialog-line" key={i}>{l}</p>
            ))}

            {phase === 'seated' && !guestNpc && (
              <p className="hint">今天没什么人来。你自己慢慢喝了一杯——{weatherText}</p>
            )}

            {phase === 'seated' && guestNpc && !inviteMode && (
              <div className="dialog-choices">
                <button className="btn btn-primary" onClick={invite}>
                  {stack ? '邀请一起喝茶' : '邀请一起喝茶（先挑一泡茶）'}
                </button>
                <button className="btn" onClick={greetOnly}>打个招呼，自己喝茶</button>
              </div>
            )}

            {/* 林姑娘的邀请：再等等（可再来找，不锁内容）/ 好啊一起回去 */}
            {phase === 'seated' && inviteMode && (
              <div className="dialog-choices">
                <button className="btn" onClick={declineTravel}>再等等</button>
                <button className="btn btn-primary" onClick={acceptTravel}>好啊，一起回去</button>
              </div>
            )}

            {pickingTeaFor === 'invite' && (
              <div className="dialog-choices">
                <p className="hint" style={{ marginBottom: 2 }}>请谁喝什么？挑一泡：</p>
                {player.inventory.map((s) => (
                  <button key={s.id} className="btn" onClick={() => pickTea(s)}>
                    {getTea(s.teaId).name}（{GRADE_LABEL[s.grade] ?? s.grade}）
                  </button>
                ))}
                <button className="btn" onClick={() => setPickingTeaFor(false)}>先不请了</button>
              </div>
            )}

            {phase === 'ended' && inviteMode && (
              <div className="dialog-choices">
                {/* 接受后的轻量过渡：显式一步「上路」，不做旅行动画 */}
                <button className="btn btn-primary" onClick={() => enterRegion('wuyishan', 'teahouse')}>跟林姑娘回武夷山</button>
                <button className="btn" onClick={() => go('map')}>先收拾茶席</button>
              </div>
            )}

            {phase === 'ended' && !inviteMode && (
              <>
                {/* 小红书分享入口（仅 XHS）：分享茶席小记，可选、不阻断主线。 */}
                {IS_XHS && teaseatSharePayload() && (
                  <button className="btn" onClick={() => setSharePayload(teaseatSharePayload())}>分享茶席</button>
                )}
                <button className="btn btn-primary" onClick={() => go('map')}>{text.leave}</button>
              </>
            )}
          </div>
        )}
        </div>
        <ShareSheet payload={sharePayload} onClose={() => setSharePayload(null)} />
      {/* ── 布置表单（非对话，留在舞台下方） ── */}
      {phase === 'setup' && (
        <div className="scene-foot">
          <p className="hint">{text.setupIntro}</p>

          {pickingTeaFor !== 'invite' && !teaDecided && (
            <>
              <p className="hint" style={{ marginBottom: 2 }}>选一泡今天的茶（也可以先不摆）：</p>
              <div className="dialog-choices">
                {player.inventory.length === 0 && <p className="hint">茶篓还是空的——先去制茶或集市逛逛。</p>}
                {player.inventory.map((s) => (
                  <button key={s.id} className="btn" onClick={() => { pickTea(s); setTeaDecided(true); }}>
                    {getTea(s.teaId).name}（{GRADE_LABEL[s.grade] ?? s.grade}）
                  </button>
                ))}
                <button className="btn" onClick={() => setTeaDecided(true)}>先不摆茶</button>
              </div>
            </>
          )}

          {!wareDecided && pickingTeaFor !== 'invite' && (
            <>
              <p className="hint" style={{ marginBottom: 2 }}>摆上主茶具（也可以先空着）：</p>
              <div className="dialog-choices">
                {ownedWares.map((w) => (
                  <button key={w!.id} className="btn" onClick={() => { setWareId(w!.id); setWareDecided(true); }}>
                    {w!.name}
                  </button>
                ))}
                <button className="btn" onClick={() => setWareDecided(true)}>先不用茶具</button>
              </div>
            </>
          )}

          {teaDecided && wareDecided && (
            <button className="btn btn-primary" onClick={enterSeat}>🪑 入席坐下</button>
          )}
        </div>
      )}
    </div>
  );
}

/** 茶叶堆（TEA_LEAF_SLOT）：按茶种叶色动态着色的小茶堆。 */
function TeaLeafPile({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 60 34" width="100%" aria-hidden>
      <ellipse cx="30" cy="26" rx="26" ry="6.5" fill={color} stroke="#5a4a34" strokeWidth="1" opacity="0.92" />
      <ellipse cx="30" cy="22" rx="20" ry="5" fill={color} stroke="#5a4a34" strokeWidth="0.8" opacity="0.75" />
      <path d="M20 20 q8 -7 18 -6 q-7 7 -18 6z" fill={color} stroke="#5a4a34" strokeWidth="0.8" />
      <path d="M32 17 q7 -5 14 -4 q-5 6 -14 4z" fill={color} stroke="#5a4a34" strokeWidth="0.7" opacity="0.85" />
    </svg>
  );
}

/** 默认小茶杯（ACCESSORY_SLOT 的素色摆设）。 */
function SmallCupSvg() {
  return (
    <svg viewBox="0 0 60 34" width="100%" aria-hidden>
      <path d="M14 12 L17 26 Q30 31 43 26 L46 12 Z" fill="#f3ede0" stroke="#6b513a" strokeWidth="1.2" />
      <ellipse cx="30" cy="12" rx="16" ry="3.6" fill="#faf6ec" stroke="#6b513a" strokeWidth="1.1" />
      <ellipse cx="30" cy="12" rx="12" ry="2.4" fill="#e8e4c4" opacity="0.9" />
    </svg>
  );
}

/** 玩家自己的杯（PLAYER_SEAT 蒲团上）：带茶汤色。 */
function PlayerCupSvg({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 40 30" width="100%" aria-hidden>
      <path d="M8 8 L10.5 22 Q20 26.5 29.5 22 L32 8 Z" fill="#f3ede0" stroke="#6b513a" strokeWidth="1.1" />
      <ellipse cx="20" cy="8" rx="12" ry="3" fill="#faf6ec" stroke="#6b513a" strokeWidth="1" />
      <ellipse cx="20" cy="8.6" rx="9" ry="2" fill={color} opacity="0.95" />
      <path d="M14 3 q1.5 -2.4 0 -4.5 M26 3 q-1.5 -2.4 0 -4.5" stroke="#cfd8c2" strokeWidth="1" fill="none" opacity="0.7" strokeLinecap="round" />
    </svg>
  );
}
