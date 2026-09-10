import type { Player, TeaStack, Grade } from '../types';
import { proficiencyLabel } from '../types';

// ─────────── 存储适配器（V0.3：localStorage + 版本迁移 + 隐私模式降级） ───────────

export interface SaveData {
  version: 3;
  player: Player;
}

const KEY = 'teaworld.save.v3';
const CURRENT_VERSION = 3;

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
    }
  } catch {
    useMemory = true; // 隐私模式：降级为内存，游戏照常能玩
  }
  const fresh: SaveData = { version: CURRENT_VERSION, player: defaultPlayer() };
  return fresh;
}

export function persist(player: Player): void {
  const data: SaveData = { version: CURRENT_VERSION, player };
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    useMemory = true;
  }
  memoryStore = data;
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
