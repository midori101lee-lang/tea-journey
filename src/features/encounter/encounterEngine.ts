import type { EncounterScene, Player } from '../../core/types';
import { ENCOUNTERS } from '../../core/data/encounters';

/** 支持偶遇的场景列表（与 SCENES 注册表对应）。 */
export const ENCOUNTER_SCENES: EncounterScene[] = ['garden', 'teahouse', 'market', 'mountain'];

/**
 * 各场景偶遇概率（初始游戏调优参数，集中在配置层，方便试玩调整）。
 * 这些数字只是「游戏参数」，不是现实世界概率，请勿写入产品文档作为真实设定。
 * 不散落到组件里——所有调优只动这一处。
 */
export const SCENE_ENCOUNTER_CHANCE: Record<EncounterScene, number> = {
  mountain: 0.7,   // 山路：玩家主动「去逛逛」，相遇机会最高
  market: 0.5,    // 茶集市：人流大，容易碰上老贾 / 林姑娘
  garden: 0.5,    // 茶园：林姑娘 / 三轮车可能在此
  teahouse: 0.4,  // 茶馆：已有老陈主线对话，偶遇概率略低，避免喧宾夺主
};

export interface RolledEncounter {
  npcId: string;
  eventId: string;
  /** 当时所在的场景 key（用于把 NPC 摆在该场景里说话）。 */
  sceneArt: EncounterScene;
}

function pickWeighted<T>(items: T[], w: (t: T) => number): T | null {
  const pool = items.filter((it) => w(it) > 0);
  const total = pool.reduce((s, it) => s + w(it), 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (const it of pool) {
    r -= w(it);
    if (r <= 0) return it;
  }
  return pool[pool.length - 1];
}

/**
 * 偶遇引擎：纯函数，无副作用。
 * 流程：场景概率闸门（不每次都出现）→ 按场景筛 NPC(加权抽) → 按场景筛事件(加权抽)。
 * 进入场景 ≠ 必然触发；具体谁、说哪件事都由 Math.random 决定，玩家无法预判。
 */
export function rollEncounter(scene: EncounterScene, player: Player): RolledEncounter | null {
  // 概率闸门：本场景这一次不出现偶遇
  if (Math.random() > SCENE_ENCOUNTER_CHANCE[scene]) return null;

  // 按「当前场景」筛出可能在此出现的 NPC，按其场景倾向权重抽一个
  const npc = pickWeighted(ENCOUNTERS, (n) => n.scenes[scene] ?? 0);
  if (!npc) return null;

  // 在该 NPC 的「同场景事件池」里加权抽一个事件（requires 守卫不满足则排除，如一次性剧情已触发过）
  const ev = pickWeighted(
    npc.events,
    (e) => (e.scenes.includes(scene) && (!e.requires || e.requires(player)) ? e.weight : 0),
  );
  if (!ev) return null;

  return { npcId: npc.id, eventId: ev.id, sceneArt: scene };
}
