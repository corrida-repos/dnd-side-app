import type { Size } from '../state/types';

export interface Creature {
  name: string;
  size: Size;
  /** Creature type, e.g. beast, monstrosity, dragon. */
  type: string;
  source?: string;
  /** Challenge Rating as written ("1/4", "5"), for random encounter tables. */
  cr?: string;
  /** 5etools environments (forest, underdark, any…), for random encounter tables. */
  env?: string[];
  /** E evil, G good, N neutral, U unaligned: sets a starting attitude. */
  align?: 'E' | 'G' | 'N' | 'U';
}

/** Built-in game animals, so hunting works without importing anything. */
export const GAME_ANIMALS: Creature[] = [
  { name: 'Rabbit or hare', size: 'Tiny', type: 'beast' },
  { name: 'Game bird (grouse, pheasant)', size: 'Tiny', type: 'beast' },
  { name: 'Fish', size: 'Tiny', type: 'beast' },
  { name: 'Squirrels (a few)', size: 'Tiny', type: 'beast' },
  { name: 'Large fish (salmon, pike)', size: 'Small', type: 'beast' },
  { name: 'Wild goat', size: 'Small', type: 'beast' },
  { name: 'Wild turkey or goose', size: 'Small', type: 'beast' },
  { name: 'Deer', size: 'Medium', type: 'beast' },
  { name: 'Boar', size: 'Medium', type: 'beast' },
  { name: 'Wolf', size: 'Medium', type: 'beast' },
  { name: 'Antelope', size: 'Medium', type: 'beast' },
  { name: 'Elk', size: 'Large', type: 'beast' },
  { name: 'Black or brown bear', size: 'Large', type: 'beast' },
  { name: 'Aurochs or wild ox', size: 'Large', type: 'beast' },
  { name: 'Giant boar', size: 'Large', type: 'beast' },
  { name: 'Mammoth', size: 'Huge', type: 'beast' },
  { name: 'Whale', size: 'Gargantuan', type: 'beast' },
];

/** Table rule: usable meat from one creature of each size, in pounds. */
export const MEAT_LB: Record<Size, number> = { Tiny: 1, Small: 10, Medium: 50, Large: 200, Huge: 1000, Gargantuan: 4000 };

/** Table rule: time to field-dress and butcher one creature, in minutes. */
export const BUTCHER_MINUTES: Record<Size, number> = { Tiny: 10, Small: 30, Medium: 60, Large: 120, Huge: 240, Gargantuan: 480 };

/** Creature types with no edible meat. */
export const INEDIBLE_TYPES = ['construct', 'elemental', 'ooze', 'undead'];
/** Creature types whose meat is risky: still raw food, but the DM may add extra effects. */
export const STRANGE_TYPES = ['aberration', 'celestial', 'fiend', 'fey', 'plant'];

/** Survival check (Wisdom) to butcher cleanly. A failure wastes half the meat. */
export const BUTCHER_DC = 10;

export const isEdible = (c: Creature): boolean => !INEDIBLE_TYPES.includes(c.type.toLowerCase());

/** Creatures of Medium size or bigger with these types leave a usable hide. */
export const yieldsHide = (c: Creature): boolean =>
  ['beast', 'monstrosity', 'dragon'].includes(c.type.toLowerCase()) && ['Medium', 'Large', 'Huge', 'Gargantuan'].includes(c.size);

const SIZE_CODES: Record<string, Size> = { T: 'Tiny', S: 'Small', M: 'Medium', L: 'Large', H: 'Huge', G: 'Gargantuan' };

/**
 * Reads 5etools-style bestiary JSON (`{ "monster": [...] }` or a plain array) that you supply yourself.
 * Keeps only the name, size, creature type, source, Challenge Rating, environments and alignment.
 */
export function parse5eToolsBestiary(json: unknown): Creature[] {
  const arr: unknown[] = Array.isArray(json)
    ? json
    : json && typeof json === 'object' && Array.isArray((json as { monster?: unknown }).monster)
      ? (json as { monster: unknown[] }).monster
      : [];
  const out: Creature[] = [];
  const seen = new Set<string>();
  for (const raw of arr) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    if (typeof r.name !== 'string') continue;
    const sizeCode = Array.isArray(r.size) ? r.size[0] : r.size;
    const size = typeof sizeCode === 'string' ? SIZE_CODES[sizeCode] : undefined;
    if (!size) continue;
    const t = r.type;
    const type = typeof t === 'string' ? t : t && typeof t === 'object' && typeof (t as { type?: unknown }).type === 'string' ? (t as { type: string }).type : 'unknown';
    const source = typeof r.source === 'string' ? r.source : undefined;
    const key = `${r.name}|${source ?? ''}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const crRaw = r.cr && typeof r.cr === 'object' ? (r.cr as { cr?: unknown }).cr : r.cr;
    const cr = typeof crRaw === 'string' ? crRaw : typeof crRaw === 'number' ? String(crRaw) : undefined;
    const env = Array.isArray(r.environment) ? r.environment.filter((e): e is string => typeof e === 'string') : undefined;
    const al = Array.isArray(r.alignment) ? r.alignment.filter((a): a is string => typeof a === 'string') : [];
    const align = al.includes('E') ? 'E' : al.includes('G') ? 'G' : al.includes('U') ? 'U' : al.length ? 'N' : undefined;
    out.push({ name: r.name, size, type: type.toLowerCase(), source, ...(cr ? { cr } : {}), ...(env?.length ? { env } : {}), ...(align ? { align } : {}) });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
