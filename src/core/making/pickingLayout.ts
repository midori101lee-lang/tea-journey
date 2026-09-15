/**
 * 采茶茶梢的空间分布（纯函数，无 React/DOM，便于模拟校验）。
 *
 * 目标：**固定构图约束下的自然随机**。
 *  - 有边界的随机：茶梢只长在 SPAWN 区（左侧这片茶垄），避开竹篮与采茶人，
 *    绝不出界、不上 UI、不互相叠死（拒绝采样 + 最小间距）。
 *  - 位置 × 叶态解耦：叶态由「洗牌后分配」，不再和位置绑定——玩家只能看叶相判断，
 *    背位置不再有用（旧版 x=(i*37)%74 恰好只有两列，等于明牌）。
 *  - 每局一次：完全由 seed 决定；同一局内重渲染不改变（PickingStep 用 useState 把 seed 钉住），
 *    下一局重新生成 → 布局换新。
 *
 * 难度不变：每局各叶态的数量配比与旧版逐字一致
 *（开面采 good 7 / tender 3 / old 2；嫩芽采 bud1 5 / bud2 4 / old 3）。
 */

export type ShootKind = 'good' | 'tender' | 'old' | 'bud1' | 'bud2';
export type PickMode = 'open-face' | 'bud';

export interface Shoot {
  id: number;
  kind: ShootKind;
  /** 茶梢盒左上角（舞台宽度 %）。 */
  x: number;
  /** 茶梢盒左上角（舞台高度 %）。 */
  y: number;
  /** 轻微旋转（度）。 */
  rot: number;
  /** 轻微缩放。 */
  scale: number;
}

/** 茶梢盒占舞台的比例（≈ 44×59.4px / 舞台 390×560）。 */
export const SHOOT_BOX = { w: 11.1, h: 10.4 };

/** 有效生成区（茶梢盒左上角，舞台 %）：采茶这片茶垄，四周留白。 */
export const SPAWN = { x0: 4, x1: 55, y0: 21, y1: 72 };

/** 禁止与茶梢盒相交的区域：竹篮（居中下方，含计数牌）/ 采茶人（右侧站立）。 */
export const BLOCKED = [
  { x0: 33, x1: 67, y0: 76, y1: 100 },
  { x0: 67, x1: 100, y0: 22, y1: 70 },
];

/** 两棵之间的最小间距（按茶梢盒归一化）：0.9 ≈ 横向差 10% 或纵向差 9.4% 即可——允许成小簇，不叠死。 */
export const MIN_SEP = 0.9;

/** 确定性随机（mulberry32）：同一 seed 永远得到同一布局。 */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 叶态配比：与旧版完全一致（三类茶青的数量不变，难度不变），只是分配到随机位置。 */
export function kindBag(mode: PickMode, count: number): ShootKind[] {
  const n = Math.max(1, Math.round(count));
  const bag: ShootKind[] = [];
  if (mode === 'bud') {
    const old = Math.round((n * 3) / 12);
    const bud2 = Math.round((n * 4) / 12);
    for (let i = 0; i < old; i++) bag.push('old');
    for (let i = 0; i < bud2; i++) bag.push('bud2');
    while (bag.length < n) bag.push('bud1');
  } else {
    const tender = Math.round((n * 3) / 12);
    const old = Math.round((n * 2) / 12);
    for (let i = 0; i < tender; i++) bag.push('tender');
    for (let i = 0; i < old; i++) bag.push('old');
    while (bag.length < n) bag.push('good');
  }
  return bag.slice(0, n);
}

function inSpawn(x: number, y: number): boolean {
  return x >= SPAWN.x0 && x <= SPAWN.x1 && y >= SPAWN.y0 && y <= SPAWN.y1;
}

/** 茶梢盒是否与竹篮 / 采茶人相交。 */
function hitsBlocked(x: number, y: number): boolean {
  const x2 = x + SHOOT_BOX.w;
  const y2 = y + SHOOT_BOX.h;
  return BLOCKED.some((b) => x < b.x1 && x2 > b.x0 && y < b.y1 && y2 > b.y0);
}

/** 按茶梢盒归一化的间距（各向异性，避免横向/纵向尺度不同导致的误判）。 */
function tooClose(a: { x: number; y: number }, b: { x: number; y: number }, sep: number): boolean {
  const dx = (a.x - b.x) / SHOOT_BOX.w;
  const dy = (a.y - b.y) / SHOOT_BOX.h;
  return dx * dx + dy * dy < sep * sep;
}

/**
 * 生成一局的茶梢布局。同一 seed 完全确定性；用不同 seed 可快速预览不同布局（见 PickingStep 的 ?pickseed= 调试口）。
 */
export function buildPickingLayout(opts: { seed: number; count: number; mode: PickMode }): Shoot[] {
  const { count, mode } = opts;
  const rng = mulberry32((opts.seed >>> 0) || 1);
  const n = Math.max(1, Math.round(count));

  // 1) 采点：拒绝采样——有界的随机 + 最小间距。放不下就逐步放宽间距，保证一定放满 n 个。
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    let placed = false;
    let sep = MIN_SEP;
    for (let attempt = 0; attempt < 240 && !placed; attempt++) {
      if (attempt > 0 && attempt % 30 === 0) sep = Math.max(0.5, sep - 0.06);
      const x = SPAWN.x0 + rng() * (SPAWN.x1 - SPAWN.x0);
      const y = SPAWN.y0 + rng() * (SPAWN.y1 - SPAWN.y0);
      if (!inSpawn(x, y) || hitsBlocked(x, y)) continue;
      if (pts.some((p) => tooClose(p, { x, y }, sep))) continue;
      pts.push({ x, y });
      placed = true;
    }
    if (!placed) {
      // 兜底（正常配比不会走到）：在有效区内取最“空”的一个候选点，保证数量与区域约束成立。
      let best = { x: SPAWN.x0, y: SPAWN.y0 };
      let bestD = -1;
      for (let k = 0; k < 80; k++) {
        const x = SPAWN.x0 + rng() * (SPAWN.x1 - SPAWN.x0);
        const y = SPAWN.y0 + rng() * (SPAWN.y1 - SPAWN.y0);
        if (!inSpawn(x, y) || hitsBlocked(x, y)) continue;
        const d = pts.length ? Math.min(...pts.map((p) => Math.hypot((p.x - x) / SHOOT_BOX.w, (p.y - y) / SHOOT_BOX.h))) : 9;
        if (d > bestD) { bestD = d; best = { x, y }; }
      }
      pts.push(best);
    }
  }

  // 2) 叶态：洗牌后逐个分配 → 位置与叶态彻底解耦（背位置不再有用）。
  const bag = kindBag(mode, n);
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = bag[i]; bag[i] = bag[j]; bag[j] = t;
  }

  // 3) 轻微旋转 / 缩放（自然生长感，克制）
  return pts.map((p, i) => ({
    id: i,
    kind: bag[i],
    x: Math.round(p.x * 100) / 100,
    y: Math.round(p.y * 100) / 100,
    rot: Math.round((rng() * 16 - 8) * 10) / 10,
    scale: Math.round((0.96 + rng() * 0.08) * 1000) / 1000,
  }));
}
