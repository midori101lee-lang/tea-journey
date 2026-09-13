import { useState } from 'react';
import { useGame } from '../store/gameStore';

/** 一次分享的内容载荷：三类节点（制茶 / 泡茶 / 茶席）共用同一张分享卡。 */
export interface SharePayload {
  /** 分享节点类型：对应防刷与奖励分类。 */
  kind: 'making' | 'brewing' | 'teaseat';
  /** 卡片标题（如「这一锅茶」「这一泡，周伯说…」「我的茶席小记」）。 */
  title: string;
  /** 卡片正文行（复用既有评价文字 / 结果数据，不新建评价系统）。 */
  lines: string[];
  /** 可选强调色（如茶区主色），仅用于卡片头部描边。 */
  accent?: string;
}

/**
 * 小红书分享卡（轻量弹层）：截图友好、复用现有视觉变量，不引入新 UI 库。
 *
 * 三种状态（务必分清，见验收报告 §三）：
 *  - 状态 A：用户点了「分享到小红书」但没真正发布 → 本组件不发放任何奖励（仅关闭）。
 *  - 状态 B：系统分享面板调起 / 文案已复制，但平台没有提供「成功发帖」回调 →
 *    当前环境就属于此类，不发钱、不伪造。
 *  - 状态 C：平台能可靠确认用户成功发布 → 才允许 grantShareReward 发放 +20。
 *    （当前 XHS 无 JSbridge / 发帖回调，状态 C 不可达，故 SHARE_PAYOUT_ENABLED=false。）
 *
 * 「我已发布」按钮的说明（验收报告 §五）：
 *  - 它只是【用户手动确认】，manual confirmation ≠ verified publish。
 *  - 当前 SHARE_PAYOUT_ENABLED=false，点它仅落当日日期、不发钱。
 *  - 若未来开启奖励，绝不能仅凭用户自点「我已发布」就发 20 茶钱——必须有平台级成功回调。
 * 分享为可选动作，不阻断任何主线流程。
 */
export default function ShareSheet({ payload, onClose }: { payload: SharePayload | null; onClose: () => void }) {
  const [shared, setShared] = useState(false);
  if (!payload) return null;

  const shareText = ['《茶游记》' + payload.title, ...payload.lines, '—— 来自《茶游记》小红书版'].join('\n');

  const doShare = async () => {
    // 小工具容器为离线环境：navigator.clipboard / execCommand 均被禁用，
    // 故不依赖复制文案；优先走系统分享面板，不可用时回落到手动「我已发布」路径。
    const nav = navigator as Navigator & { share?: (data: { title?: string; text?: string }) => Promise<void> };
    if (typeof nav.share === 'function') {
      try {
        await nav.share({ title: '茶游记', text: shareText });
        setShared(true);
        return;
      } catch {
        // 用户取消或不支持：保持手动「我已发布」路径
      }
    }
    setShared(true);
    useGame.getState().showToast('请在小红书手动发布，完成后点「我已发布」');
  };

  // 「我已发布」= 用户手动确认（manual confirmation ≠ verified publish）。
  // 此处直接调 grantShareReward：当前 SHARE_PAYOUT_ENABLED=false，仅落当日日期、不发钱。
  // 未来若开启奖励，必须把本调用源从「手动确认」换成「平台可靠发帖成功回调」，否则不可发钱。
  const recordShare = () => {
    const granted = useGame.getState().grantShareReward(payload.kind);
    if (granted) useGame.getState().showToast('分享成功，茶钱 +20 ✓');
    else useGame.getState().showToast('今日分享已记录（茶钱奖励待平台确认发帖后发放）');
    onClose();
  };

  return (
    <div className="share-mask" onClick={onClose}>
      <div className="share-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="share-card">
          <div className="share-card-head" style={{ borderColor: payload.accent ?? 'var(--ochre)' }}>
            茶游记 · {payload.title}
          </div>
          <div className="share-card-body">
            {payload.lines.map((l, i) => (
              <p key={i} className="share-line">{l}</p>
            ))}
          </div>
          <div className="share-card-foot">—— 来自《茶游记》小红书版</div>
        </div>

        <div className="share-actions">
          <button className="btn btn-primary" onClick={doShare}>分享到小红书</button>
          <button className="btn" onClick={recordShare}>我已发布</button>
        </div>
        <p className="hint" style={{ margin: '6px 0 0', fontSize: 12 }}>
          发布成功后点「我已发布」：每日首次分享 +20 茶钱（平台发帖确认接入后生效，当前仅记录不发放）
        </p>
        <button className="btn share-close" onClick={onClose}>关闭</button>
      </div>
    </div>
  );
}
