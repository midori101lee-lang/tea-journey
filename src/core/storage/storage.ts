import type { Player, TeaStack, Grade } from '../types';
import { proficiencyLabel } from '../types';

// ─────────── 存储适配器（V0.3：localStorage + 版本迁移 + 隐私模式降级） ───────────

export interface SaveData {
  version: 3;
  player: Player;
}

const KEY = 'teaworld.save.v3';
const BACKUP_KEY = 'teaworld.save.v3.backup';
const ARCHIVE_KEY = 'teaworld.save.v3.archive';
const CURRENT_VERSION = 3;

// localStorage 操作的统一安全封装：隐私模式下静默降级为内存，不抛错
function readRaw(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writeRaw(key: string, val: string): boolean {
  try { localStorage.setItem(key, val); return true; } catch { useMemory = true; return false; }
}
function removeRaw(key: string): void {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

export function defaultPlayer(): Player {
  return {
    name: '茶客',
    coins: 20,
    proficiency: 0,
    proficiencyByRegion: {},
    totalMade: 0,
    day: 1,
    mountainVisitsToday: 0,
    inventory: [],
    flags: {},
    comicSeen: [],
    clues: [],
    metNpcs: [],
    souvenirs: [],
    madeTeas: {},
    teaWareInventory: [],
    currentRegion: 'wuyishan',
    regionDays: { wuyishan: 1 },
  };
}

// 内存兜底（隐私模式）
let memoryStore: SaveData | null = null;
let useMemory = false;

function safeParse(raw: string): SaveData | null {
  try {
    const data = JSON.parse(raw) as SaveData;
    if (typeof data.version !== 'number') return null;
    return migrate(data);
  } catch {
    return null;
  }
}

/** 版本迁移：旧档逐级升级，不丢用户数据 */
function migrate(data: SaveData): SaveData {
  let d = data;
  if (d.version < 3) {
    // v1/v2（TeaWorld 图鉴结构）→ v3：把旧 collection 转为空库存，保留硬币与进度
    const legacy = d as unknown as { player?: Record<string, unknown> };
    d = {
      version: 3,
      player: { ...defaultPlayer(), ...(legacy.player as Partial<Player>) },
    };
    d.player.inventory = d.player.inventory ?? [];
    d.version = 3;
  }
  // 回填较新版本才新增的字段（如 madeTeas），避免旧档缺字段导致读取/运算报错
  d.player = { ...defaultPlayer(), ...d.player };

  // 旧档的「逐类 shareRewards」已简化为单日 shareRewardDate；丢弃旧结构，避免脏字段残留
  delete (d.player as unknown as Record<string, unknown>).shareRewards;

  // 多茶区旅行天数（V0.4 新增）：旧档只有全局 day，迁移时把它的天数作为武夷山天数，
  // 并把当前所在茶区归为武夷山，保证老玩家「第几天」不丢、不回退到 1。
  d.player.currentRegion = d.player.currentRegion || 'wuyishan';
  d.player.regionDays = { ...d.player.regionDays, wuyishan: d.player.day || 1 };

  // 熟练度按茶区拆分后的旧档迁移：
  // 旧档只有全局 proficiency（当时全部进度都在武夷山）→ 迁移为 proficiencyByRegion.wuyishan。
  // 只迁一次（byRegion 已有内容就不再动），保证老玩家更新后进度不丢、不重复累加。
  const byRegion = d.player.proficiencyByRegion ?? {};
  if (Object.keys(byRegion).length === 0) {
    const legacy = d.player.proficiency ?? 0;
    d.player.proficiencyByRegion = legacy > 0 ? { wuyishan: legacy } : {};
  }
  return d;
}

export function loadSave(): SaveData {
  if (useMemory && memoryStore) return memoryStore;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = safeParse(raw);
      if (data) return data;
      // 存档损坏：隔离到 .corrupt，避免下次又解析失败陷入循环（不立即白屏，回退新档）
      try { localStorage.setItem(KEY + '.corrupt', raw); localStorage.removeItem(KEY); } catch { /* ignore */ }
    }
  } catch {
    useMemory = true; // 隐私模式：降级为内存，游戏照常能玩
  }
  const fresh: SaveData = { version: CURRENT_VERSION, player: defaultPlayer() };
  return fresh;
}

export function persist(player: Player): void {
  const data: SaveData = { version: CURRENT_VERSION, player };
  // 写入前：若已有有效存档，先复制为 backup（防一次错误写入直接破坏存档）
  const existing = readRaw(KEY);
  if (existing) {
    try {
      if (safeParse(existing)) writeRaw(BACKUP_KEY, existing);
    } catch { /* ignore */ }
  }
  writeRaw(KEY, JSON.stringify(data));
  memoryStore = data;
}

// ─────────── 存档查询 / 清空 / 备份 ───────────

/** 是否存在有效存档（含隐私模式内存兜底）。用于启动页判断是否显示「继续旅程」。 */
export function hasSave(): boolean {
  if (useMemory && memoryStore) return true;
  const raw = readRaw(KEY);
  return raw ? safeParse(raw) !== null : false;
}

/** 启动前检查存档健康度：none=无存档，ok=正常，corrupt=存在但解析失败（已自动隔离）。 */
export function inspectSave(): 'none' | 'ok' | 'corrupt' {
  if (useMemory && memoryStore) return 'ok';
  const raw = readRaw(KEY);
  if (!raw) return 'none';
  return safeParse(raw) ? 'ok' : 'corrupt';
}

/** 重新开始前把当前存档另存到 archive，作为一次保险（不覆盖新存档）。 */
export function archiveCurrentSave(): void {
  const raw = readRaw(KEY);
  if (raw) writeRaw(ARCHIVE_KEY, raw);
}

/** 仅清除当前生效存档与上一版 backup（保留 archive 供回滚参考）。 */
export function wipeActiveSave(): void {
  removeRaw(KEY);
  removeRaw(BACKUP_KEY);
}

/** 彻底清空所有存档（含 archive / backup），一般用于硬重置。 */
export function clearSave(): void {
  removeRaw(KEY);
  removeRaw(BACKUP_KEY);
  removeRaw(ARCHIVE_KEY);
}

// ─────────── 胔包逻辑 ───────────

export function addToBasket(player: Player, teaId: string, grade: Grade, value: number, roastLevel: string): Player {
  const key = `${teaId}:${grade}:${roastLevel}`;
  const inventory = [...player.inventory];
  const idx = inventory.findIndex((s) => `${s.teaId}:${s.grade}:${s.roastLevel}` === key);
  if (idx >= 0) {
    inventory[idx] = { ...inventory[idx], count: inventory[idx].count + 1 };
  } else {
    const stack: TeaStack = {
      id: key,
      teaId,
      grade,
      count: 1,
      unitValue: value,
      roastLevel,
      firstMadeAt: new Date().toISOString(),
    };
    inventory.push(stack);
  }
  return { ...player, inventory };
}

export function sellStack(player: Player, stackId: string): Player {
  const stack = player.inventory.find((s) => s.id === stackId);
  if (!stack) return player;
  return {
    ...player,
    coins: player.coins + stack.unitValue * stack.count,
    inventory: player.inventory.filter((s) => s.id !== stackId),
  };
}

export function proficiencyOf(player: Player): string {
  return proficiencyLabel(player.proficiency);
}
