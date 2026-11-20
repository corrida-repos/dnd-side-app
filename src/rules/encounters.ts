import type { Size } from '../state/types';
import type { TerrainType } from './terrain';
import { TERRAIN } from './terrain';
import { SRD_CREATURES } from './encounterData';
import { die, rollExpr, type Rng } from './dice';

// ---------------------------------------------------------------- danger and when to roll

export type Danger = 'safe' | 'low' | 'moderate' | 'high' | 'deadly';
export const DANGERS: Danger[] = ['safe', 'low', 'moderate', 'high', 'deadly'];

/** 2024 DMG encounter difficulties, plus anything over the High budget. */
export type Difficulty = 'trivial' | 'low' | 'moderate' | 'high' | 'beyond';
export const DIFFICULTY_LABEL: Record<Difficulty, string> = { trivial: 'Trivial', low: 'Low', moderate: 'Moderate', high: 'High', beyond: 'Beyond High' };

export interface DangerInfo {
  label: string;
  examples: string;
  /** Overland (travel, camp and rest): hours between checks. */
  everyHours: number;
  /** Dungeon or ruin: 10-minute exploration turns between checks. */
  everyTurns: number;
  /** An encounter happens on a d20 total of this or higher. */
  on: number;
  /** The difficulty the table's group sizes are built for. */
  builtFor: Exclude<Difficulty, 'trivial'>;
  /** Share of the d100 table given to non-hostile meetings and signs. */
  peaceful: number;
}

/**
 * Table rule. The 2024 DMG says to roll on a random encounter table but leaves how often to the DM;
 * this follows the classic d20 check (an encounter on 18 or higher) and scales it with the danger
 * of the place.
 */
export const DANGER: Record<Danger, DangerInfo> = {
  safe: { label: 'Safe', examples: 'patrolled roads, farmland, inside town walls', everyHours: 12, everyTurns: 6, on: 20, builtFor: 'low', peaceful: 0.6 },
  low: { label: 'Low', examples: 'borderlands, quiet forests, well-travelled trade routes', everyHours: 8, everyTurns: 6, on: 19, builtFor: 'low', peaceful: 0.4 },
  moderate: { label: 'Moderate', examples: 'untamed wilderness, abandoned ruins, the Underdark’s edges', everyHours: 4, everyTurns: 3, on: 18, builtFor: 'moderate', peaceful: 0.25 },
  high: { label: 'High', examples: 'monster hunting grounds, war zones, deep caverns', everyHours: 2, everyTurns: 2, on: 18, builtFor: 'high', peaceful: 0.12 },
  deadly: { label: 'Deadly', examples: 'a dragon’s domain, a demon-haunted waste, an infested dungeon', everyHours: 1, everyTurns: 1, on: 18, builtFor: 'beyond', peaceful: 0.05 },
};

/** Lowest natural d20 that finds an encounter with this modifier. A natural 20 always does. */
export const naturalNeeded = (on: number, mod: number): number => Math.max(2, Math.min(20, on - mod));

/** The chance that a single check finds an encounter, given a net modifier to the d20. */
export function checkChance(on: number, mod: number): number {
  return (21 - naturalNeeded(on, mod)) / 20;
}

/** Expected encounters per 24 hours (overland) at a danger level and modifier. */
export const encountersPerDay = (d: Danger, mod = 0): number => (24 / DANGER[d].everyHours) * checkChance(DANGER[d].on, mod);

export interface CheckConditions {
  activity: 'travel' | 'camp' | 'rest' | 'explore';
  night: boolean;
  /** A campfire or other light burning while it's dark. */
  lightAtNight: boolean;
  pace?: 'slow' | 'normal' | 'fast';
  goodRoad: boolean;
  /** Heavy rain or snow, a blizzard or strong wind. */
  foulWeather: boolean;
  /** Behind walls or in a cave mouth, or a magical shelter. */
  sheltered: boolean;
  underground: boolean;
  /** Pack animals, wagons or more than 6 travellers. */
  bigGroup: boolean;
}

export interface CheckMod {
  label: string;
  value: number;
  why: string;
}

/** Table rule: conditions that make an encounter more (+) or less (−) likely on the d20 check. */
export function checkModifiers(c: CheckConditions): CheckMod[] {
  const out: CheckMod[] = [];
  if (c.night && !c.underground) out.push({ label: 'Night', value: 1, why: 'predators and worse hunt after dark' });
  if (c.lightAtNight && (c.night || c.underground) && c.activity !== 'travel') out.push({ label: 'Light in the dark', value: 1, why: 'a fire or lantern can be seen from far off' });
  if (c.activity === 'travel' && c.pace === 'fast') out.push({ label: 'Fast pace', value: 1, why: 'a hurrying party is noisy and careless' });
  if (c.activity === 'travel' && c.pace === 'slow') out.push({ label: 'Slow pace', value: -1, why: 'moving carefully, the party can travel stealthily' });
  if (c.activity === 'travel' && c.goodRoad) out.push({ label: 'Good road', value: -1, why: 'roads are patrolled and cleared' });
  if (c.foulWeather && !c.underground) out.push({ label: 'Foul weather', value: -1, why: 'most creatures shelter from storms' });
  if (c.sheltered && c.activity !== 'travel') out.push({ label: 'Sheltered camp', value: -1, why: 'walls or rock hide the camp' });
  if (c.bigGroup) out.push({ label: 'Large group', value: 1, why: 'wagons, animals or a crowd are hard to hide' });
  return out;
}

// ---------------------------------------------------------------- creatures

export interface EncounterCreature {
  name: string;
  cr: string;
  size: Size;
  type: string;
  align: 'E' | 'G' | 'N' | 'U';
  /** 5etools environments: terrains, plus 'any' and 'underwater'. */
  env: string[];
  source?: string;
}

const SIZE: Record<string, Size> = { T: 'Tiny', S: 'Small', M: 'Medium', L: 'Large', H: 'Huge', G: 'Gargantuan' };

export const SRD_POOL: EncounterCreature[] = SRD_CREATURES.map(([name, cr, size, type, align, env]) => ({ name, cr, size: SIZE[size] ?? 'Medium', type, align, env: env.split(' '), source: 'SRD 5.2' }));

/** Experience points by Challenge Rating. */
export const CR_XP: Record<string, number> = {
  '0': 10, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800, '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900,
  '11': 7200, '12': 8400, '13': 10000, '14': 11500, '15': 13000, '16': 15000, '17': 18000, '18': 20000, '19': 22000, '20': 25000, '21': 33000,
  '22': 41000, '23': 50000, '24': 62000, '25': 75000, '26': 90000, '27': 105000, '28': 120000, '29': 135000, '30': 155000,
};
export const xpFor = (cr: string): number => CR_XP[cr] ?? 0;

/** 2024 DMG: XP Budget per Character (Low, Moderate, High) by party level. */
export const XP_BUDGET: [number, number, number][] = [
  [50, 75, 100], [100, 150, 200], [150, 225, 400], [250, 375, 500], [500, 750, 1100], [600, 1000, 1400], [750, 1300, 1700], [1000, 1700, 2100],
  [1300, 2000, 2600], [1600, 2300, 3100], [1900, 2900, 4100], [2200, 3700, 4700], [2600, 4200, 5400], [2900, 4900, 6200], [3300, 5400, 7800],
  [3800, 6100, 9800], [4500, 7200, 11700], [5000, 8700, 14200], [5500, 10700, 17200], [6400, 13200, 22000],
];

export interface Party {
  level: number;
  size: number;
}

export function budget(p: Party, d: Exclude<Difficulty, 'trivial'>): number {
  const row = XP_BUDGET[Math.max(1, Math.min(20, Math.round(p.level))) - 1];
  const n = Math.max(1, p.size);
  if (d === 'beyond') return Math.round(row[2] * 1.5) * n;
  return row[d === 'low' ? 0 : d === 'moderate' ? 1 : 2] * n;
}

export function difficultyOf(xp: number, p: Party): Difficulty {
  if (xp > budget(p, 'high')) return 'beyond';
  if (xp > budget(p, 'moderate')) return 'high';
  if (xp > budget(p, 'low')) return 'moderate';
  if (xp >= budget(p, 'low') * 0.5) return 'low';
  return 'trivial';
}

/** Which creature environments live in each terrain. */
const TERRAIN_ENV: Record<TerrainType, string[]> = {
  arctic: ['arctic'], coastal: ['coastal'], desert: ['desert'], forest: ['forest'], grassland: ['grassland'], hill: ['hill'], mountain: ['mountain'],
  swamp: ['swamp'], underdark: ['underdark'], urban: ['urban'], waterborne: ['coastal', 'underwater'],
};

/** How strongly a creature belongs in a terrain: 3 native, 1 found anywhere (people on the road), 0 not at all. */
export function habitat(c: EncounterCreature, t: TerrainType): number {
  if (c.env.some((e) => TERRAIN_ENV[t].includes(e))) return 3;
  if (c.env.includes('any')) {
    // "Any" covers travellers and townsfolk outdoors; golems, liches and the like belong in dungeons.
    if (/^Pirate/.test(c.name)) return t === 'waterborne' || t === 'coastal' || t === 'urban' ? 1 : 0;
    if (c.type === 'humanoid') return t === 'urban' ? 3 : 1;
    return t === 'underdark' || t === 'urban' ? 1 : 0;
  }
  return 0;
}

const COUNT_EXPRS: Record<number, string[]> = {
  1: ['1'], 2: ['1d3', '1d2'], 3: ['1d3+1', '1d4', '1d3'], 4: ['1d4+2', '1d6+1', '1d3+1'], 5: ['2d4', '1d4+2'], 6: ['1d6+3', '1d4+2'],
  7: ['2d6', '1d6+3'], 8: ['2d6+1', '2d6'], 9: ['2d8', '2d6+1'], 10: ['3d6', '2d8'], 11: ['2d10', '3d6'], 12: ['3d6+2', '3d6'],
};

/** Highest number a count expression can roll. */
export function maxOf(expr: string): number {
  const m = expr.match(/^(?:(\d+)d(\d+))?([+-]\d+)?$|^(\d+)$/);
  if (!m) return 1;
  if (m[4]) return Number(m[4]);
  return (m[1] ? Number(m[1]) * Number(m[2]) : 0) + (m[3] ? Number(m[3]) : 0);
}

/** A dice expression whose average is close to n (never rolling above `cap`), so group sizes vary from roll to roll. */
export function countExpr(n: number, cap = 12): string {
  const k = Math.max(1, Math.min(12, Math.round(n)));
  // Packs (a cap of 12) can roll a few over; smaller bands never go over their cap.
  return COUNT_EXPRS[k].find((e) => cap >= 12 || maxOf(e) <= cap) ?? (k === 1 ? '1' : `1d${Math.min(k, cap)}`);
}

// ---------------------------------------------------------------- the table

export interface TableRow {
  from: number;
  to: number;
  kind: 'creature' | 'peaceful';
  text: string;
  creature?: EncounterCreature;
  count?: string;
  /** Average group XP and the difficulty that comes out to. */
  xp?: number;
  difficulty?: Difficulty;
}

export interface EncounterTable {
  terrain: TerrainType;
  danger: Danger;
  party: Party;
  die: 100;
  rows: TableRow[];
}

/** Non-hostile meetings and discoveries, written for this app. */
const PEACEFUL: Record<TerrainType, string[]> = {
  arctic: ['A lone trapper hauling a sled of pelts, glad of company', 'An ice-locked campsite, long abandoned, with a few frozen supplies', 'A herd of caribou crossing the snowfield'],
  coastal: ['Fisherfolk mending nets, happy to trade news for coin', 'Wreckage washed ashore: planks, rope and a sealed cask', 'Smugglers who pretend to be fishing and want no trouble'],
  desert: ['A caravan resting at a well, wary but willing to trade', 'Sun-bleached bones of a great beast half buried in sand', 'A nomad scout who watches the party from a dune, then rides off'],
  forest: ['Woodcutters or charcoal burners at work', 'A hunter’s shrine hung with antlers and feathers', 'A deer and fawn that bolt at the first sound'],
  grassland: ['Herders moving cattle to new pasture', 'Pilgrims walking to a distant shrine', 'A burned-out wagon, picked clean, with tracks leading away'],
  hill: ['A shepherd and dogs on the slope above', 'An old cairn marking a forgotten grave', 'Prospectors who claim the next hill as theirs'],
  mountain: ['A goat-herder’s hut with smoke from the chimney', 'A rockslide blocks the trail ahead', 'Climbers roped together, heading for the summit'],
  swamp: ['An old woman poling a flat-bottomed boat, selling eel and herbs', 'A sunken shrine, its idol green with moss', 'Will-o’-the-wisp lights far off over the water (just marsh gas this time)'],
  underdark: ['A deep gnome patrol that watches and does not approach', 'Glowing fungus fields humming with harmless insects', 'An abandoned mining camp with rusted tools'],
  urban: ['A street festival or procession blocks the way', 'A pickpocket brushes past (DC 15 Perception to notice)', 'A town crier announcing a bounty'],
  waterborne: ['A merchant ship that hails for news', 'A pod of dolphins racing the bow', 'Floating wreckage and a survivor clinging to a spar'],
};

/** Spawned parts and familiars that never wander on their own. */
const NEVER_WANDERS = ['Troll Limb'];

/** Table rule: the most of one creature that roam together, so dragons and giants don't come in packs. */
export function maxGroup(c: EncounterCreature): number {
  if (c.type === 'dragon') return /Wyrmling/.test(c.name) ? 2 : 1;
  if (c.size === 'Gargantuan') return 1;
  if (c.size === 'Huge' || xpFor(c.cr) >= CR_XP['10']) return 2;
  // Veterans, spellcasters and stronger creatures travel in small bands.
  if (xpFor(c.cr) >= CR_XP['6']) return 2;
  if (/^Swarm/.test(c.name) || c.size === 'Large' || xpFor(c.cr) >= CR_XP['3']) return 4;
  if (['beast', 'humanoid', 'undead'].includes(c.type)) return 12;
  return 6;
}

const SIGNS: Record<string, string> = {
  beast: 'tracks, droppings or a half-eaten kill',
  monstrosity: 'deep claw marks, scattered bones and a rank smell',
  humanoid: 'a cold campfire, boot prints and discarded rubbish',
  undead: 'a disturbed grave, a cold spot and silent birds',
  dragon: 'scorched or melted ground and huge clawed prints',
  giant: 'enormous footprints and trees snapped off at head height',
  fiend: 'blackened, smoking footprints and a smell of sulphur',
  fey: 'a ring of mushrooms and flowers blooming out of season',
  aberration: 'strange slime, warped plants and a lingering headache',
  ooze: 'a glistening trail and stones etched smooth',
  plant: 'trampled undergrowth that has started growing back the wrong way',
  elemental: 'scorched, frozen or fused stone where no fire or frost should be',
  construct: 'deep, perfectly regular footprints',
  celestial: 'a feather of pure white and an unexplained sense of peace',
};
export const signsFor = (type: string): string => SIGNS[type.toLowerCase()] ?? 'strange marks and an eerie silence';

/** Builds a d100 random encounter table for a terrain, danger level and party, from the creatures given. */
export function buildTable(pool: EncounterCreature[], terrain: TerrainType, danger: Danger, party: Party, maxCreatures = 10): EncounterTable {
  const info = DANGER[danger];
  const target = budget(party, info.builtFor);
  const scored = pool
    .map((c) => {
      const h = habitat(c, terrain);
      const xp = xpFor(c.cr);
      if (!h || !xp || NEVER_WANDERS.includes(c.name)) return null;
      const n = Math.min(maxGroup(c), Math.floor(target / xp));
      // The group has to be a real threat at this danger level: at least about half the budget.
      if (n < 1 || n * xp < target * 0.5) return null;
      const score = h / (1 + Math.abs(Math.log2((n * xp) / target)) + (n > 6 ? 0.5 : 0));
      return { c, xp, n, h, score };
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
    .sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name));

  // Spread the picks over Challenge Ratings and creature types: take the best of each CR in turn.
  const buckets = new Map<string, typeof scored>();
  for (const s of scored) buckets.set(s.c.cr, [...(buckets.get(s.c.cr) ?? []), s]);
  const picked: typeof scored = [];
  const byType: Record<string, number> = {};
  for (let round = 0; picked.length < maxCreatures && round < 12; round++) {
    let took = false;
    for (const list of buckets.values()) {
      if (picked.length >= maxCreatures) break;
      const i = list.findIndex((s) => (byType[s.c.type] ?? 0) < 3);
      if (i < 0) continue;
      const [s] = list.splice(i, 1);
      byType[s.c.type] = (byType[s.c.type] ?? 0) + 1;
      picked.push(s);
      took = true;
    }
    if (!took) break;
  }
  picked.sort((a, b) => a.xp - b.xp || a.c.name.localeCompare(b.c.name));

  const peacefulTexts = PEACEFUL[terrain];
  // Signs of the most fitting creature foreshadow it.
  const signsOf = picked.length ? [...picked].sort((a, b) => b.score - a.score)[0].c : null;
  const entries: { weight: number; row: Omit<TableRow, 'from' | 'to'> }[] = [];
  const peacefulShare = picked.length ? info.peaceful : 1;
  const peaceRows = [...peacefulTexts.map((t) => ({ kind: 'peaceful' as const, text: t })), ...(signsOf ? [{ kind: 'peaceful' as const, text: `Signs of ${plural(signsOf.name)}: ${signsFor(signsOf.type)}. They are near.` }] : [])];
  for (const r of peaceRows) entries.push({ weight: peacefulShare / peaceRows.length, row: r });
  // Native creatures turn up three times as often as travellers passing through.
  const totalWeight = picked.reduce((a, s) => a + s.h, 0) || 1;
  for (const s of picked) {
    const count = countExpr(s.n, maxGroup(s.c));
    const avg = avgOf(count);
    const xp = Math.round(avg * s.xp);
    entries.push({
      weight: ((1 - peacefulShare) * s.h) / totalWeight,
      row: { kind: 'creature', text: `${count} ${count === '1' ? s.c.name : plural(s.c.name)}`, creature: s.c, count, xp, difficulty: difficultyOf(xp, party) },
    });
  }
  // Creatures first (weakest to strongest), then the quiet results at the top of the die.
  entries.sort((a, b) => (a.row.kind === b.row.kind ? 0 : a.row.kind === 'creature' ? -1 : 1));
  const sizes = apportion(entries.map((e) => e.weight), 100);
  let at = 1;
  const rows: TableRow[] = [];
  entries.forEach((e, i) => {
    if (!sizes[i]) return;
    rows.push({ ...e.row, from: at, to: at + sizes[i] - 1 });
    at += sizes[i];
  });
  return { terrain, danger, party, die: 100, rows };
}

/** Splits `total` into whole parts proportional to the weights (largest remainder), each at least 1. */
export function apportion(weights: number[], total: number): number[] {
  if (!weights.length) return [];
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map((w) => (w / sum) * total);
  const out = raw.map((r) => Math.max(1, Math.floor(r)));
  let left = total - out.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => ({ i, rem: r - Math.floor(r) })).sort((a, b) => b.rem - a.rem);
  for (let k = 0; left > 0; k++) {
    out[order[k % order.length].i] += 1;
    left--;
  }
  for (let k = 0; left < 0; k++) {
    const i = out.indexOf(Math.max(...out));
    out[i] -= 1;
    left++;
  }
  return out;
}

export function avgOf(expr: string): number {
  const m = expr.match(/^(?:(\d+)d(\d+))?([+-]\d+)?$|^(\d+)$/);
  if (!m) return 1;
  if (m[4]) return Number(m[4]);
  return (m[1] ? (Number(m[1]) * (Number(m[2]) + 1)) / 2 : 0) + (m[3] ? Number(m[3]) : 0);
}

/** "Wolf" → "Wolves", "Giant Spider" → "Giant Spiders". Simple English rules; good enough for monster names. */
export function plural(name: string): string {
  if (/ of /i.test(name)) {
    const [head, ...tail] = name.split(/ of /i);
    return `${plural(head)} of ${tail.join(' of ')}`;
  }
  if (/Infantry$/.test(name)) return name;
  if (/(man|Man)$/.test(name)) return name.replace(/an$/, 'en');
  if (/(Wolf|Elf|Dwarf)$/.test(name)) return name.replace(/f$/, 'ves');
  if (/(Mouse)$/.test(name)) return name.replace(/ouse$/, 'ice');
  if (/(Fish|Sheep|Deer|Elk|Merfolk|Lizardfolk|Kuo-toa|Drow|Sahuagin|Goliath|Aarakocra)$/.test(name)) return name;
  if (/(s|x|z|ch|sh)$/.test(name)) return `${name}es`;
  if (/[^aeiou]y$/.test(name)) return `${name.slice(0, -1)}ies`;
  return `${name}s`;
}

// ---------------------------------------------------------------- rolling an encounter

export type Attitude = 'Hostile' | 'Indifferent' | 'Friendly';

/** Table rule: starting attitude from alignment, rolled on a d20 so even evil creatures can parley. */
export function rollAttitude(c: EncounterCreature, rng: Rng): { roll: number; attitude: Attitude } {
  const r = die(20, rng);
  const [hostileUpTo, friendlyFrom] = c.align === 'E' ? [15, 21] : c.align === 'G' ? [3, 13] : c.align === 'U' ? [10, 20] : [7, 18];
  return { roll: r, attitude: r <= hostileUpTo ? 'Hostile' : r >= friendlyFrom ? 'Friendly' : 'Indifferent' };
}

/** What the characters notice first, by creature type. Written for this app. */
const FIRST_SIGN: Record<string, { day: string; night: string }> = {
  aberration: { day: 'notices a wrongness in the air and a faint droning at the edge of thought', night: 'feels a pressure behind the eyes, as if something in the dark is thinking at them' },
  beast: { day: 'notices birds falling silent and fresh tracks crossing the path', night: 'hears something large moving just beyond the light, and catches the musk of an animal' },
  celestial: { day: 'notices a soft golden light where no sun should fall', night: 'notices a gentle radiance growing in the dark, and an unexpected calm' },
  construct: { day: 'hears grinding, rhythmic footsteps that never change pace', night: 'hears a metallic, measured tread approaching in the darkness' },
  dragon: { day: 'notices a vast shadow sweep across the ground and the smell of something burnt or acrid', night: 'feels a hot wind, and hears enormous wings beat somewhere above' },
  elemental: { day: 'notices the earth, air, fire or water around them stirring against nature', night: 'notices the dark lit by a flicker that is not fire, and the ground trembling' },
  fey: { day: 'hears distant laughter and music that seems to come from everywhere', night: 'notices tiny lights dancing at the edge of vision, and the smell of flowers out of season' },
  fiend: { day: 'notices a whiff of brimstone and the air turning hot and close', night: 'notices a sulphurous stink and red eyes gleaming in the dark' },
  giant: { day: 'feels heavy footfalls shaking the ground and hears rocks clattering downhill', night: 'feels the ground thud in a slow rhythm, each step closer' },
  humanoid: { day: 'hears voices, the clink of gear and the scuff of boots', night: 'notices a shielded lantern, low voices and someone trying to move quietly' },
  monstrosity: { day: 'hears an unnatural screech and notices claw marks gouged into the ground', night: 'hears a sound no natural animal makes, very close' },
  ooze: { day: 'notices an acrid smell and a glistening trail across the ground', night: 'hears a wet, slithering sound sliding over stone' },
  plant: { day: 'notices the vegetation shiver though there is no wind', night: 'hears leaves rustling and vines creaking, though the air is still' },
  undead: { day: 'feels a sudden chill and notices the smell of grave-earth', night: 'feels the warmth drain from the air as shambling shapes appear' },
};

export function firstSign(type: string, night: boolean): string {
  const s = FIRST_SIGN[type.toLowerCase()] ?? FIRST_SIGN.monstrosity;
  return night ? s.night : s.day;
}

export interface EncounterResult {
  roll: number;
  row: TableRow;
  /** Number of creatures actually rolled, total XP and difficulty. */
  count?: number;
  xp?: number;
  difficulty?: Difficulty;
  attitude?: { roll: number; attitude: Attitude };
  distanceFt: number;
  distanceExpr: string;
}

/** Rolls a d100 on a table, then the group size, starting attitude and distance (DMG Travel Terrain). */
export function rollOnTable(t: EncounterTable, rng: Rng, underwaterVisibilityFt?: number): EncounterResult | null {
  if (!t.rows.length) return null;
  const roll = die(100, rng);
  const row = t.rows.find((r) => roll >= r.from && roll <= r.to) ?? t.rows[t.rows.length - 1];
  const distanceExpr = TERRAIN[t.terrain].encounterDistance;
  const m = distanceExpr.match(/^(\d+d\d+) × 10/);
  const distanceFt = underwaterVisibilityFt ?? (m ? (rollExpr(m[1], rng) ?? 1) * 10 : 60);
  if (row.kind === 'peaceful' || !row.creature || !row.count) return { roll, row, distanceFt, distanceExpr };
  const count = Math.max(1, rollExpr(row.count, rng) ?? 1);
  const xp = count * xpFor(row.creature.cr);
  return { roll, row, count, xp, difficulty: difficultyOf(xp, t.party), attitude: rollAttitude(row.creature, rng), distanceFt, distanceExpr };
}
