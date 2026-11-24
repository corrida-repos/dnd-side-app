import type { Size } from '../state/types';
import type { Creature } from './hunting';
import { POISONS, poisonItemName, type PoisonInfo } from './poisons';

/**
 * Worthy payoffs for mundane work: the things a careful hand turns up while doing camp chores.
 *
 * The 2024 DMG names four sample poisons that are harvested from a creature (Carrion Crawler Mucus, Purple Worm Poison,
 * Serpent Venom and Wyvern Poison). Everything else here is a table rule, always on: realistic work should pay realistically.
 */

/** 2024 DMG: sample poisons taken from a creature, and the creatures that give them. Snakes beyond the Giant Venomous Snake are a table rule. */
export const HARVESTED_POISONS: { match: RegExp; poison: string }[] = [
  { match: /wyvern/i, poison: 'Wyvern Poison' },
  { match: /purple worm/i, poison: 'Purple Worm Poison' },
  { match: /carrion crawler/i, poison: 'Carrion Crawler Mucus' },
  { match: /snake|serpent|viper|adder|cobra|asp\b/i, poison: 'Serpent Venom' },
];

/** The DMG poison a creature yields, if it's one of the named ones. */
export function harvestedPoison(creature: string): PoisonInfo | undefined {
  const hit = HARVESTED_POISONS.find((h) => h.match.test(creature));
  return hit ? POISONS.find((p) => p.name === hit.poison) : undefined;
}

export interface PoisonYield {
  name: string;
  valueGp: number;
  /** What the dose does, in a line. */
  note: string;
}

/**
 * What one harvested dose is. A named DMG poison keeps its price and effect. Other venom (table rule, with rewarding
 * chores always) works as a dose of Basic Poison (2024 PHB, 100 GP): coat a weapon for an extra 1d4 Poison damage.
 */
export function poisonYield(creature: string): PoisonYield {
  const from = creature.trim() || 'the creature';
  const p = harvestedPoison(from);
  if (p) return { name: poisonItemName(p), valueGp: p.gp, note: `${p.name} (2024 DMG, ${p.gp} GP a dose): ${p.effect}` };
  return { name: `${poisonItemName('Basic Poison')} (${from} venom)`, valueGp: 100, note: 'Raw venom that works as Basic Poison (table rule, 100 GP a dose): coat one weapon or three pieces of ammunition for an extra 1d4 Poison damage.' };
}

// ---------------------------------------------------------------- trophies from a kill

/** Table rule: value of the trophy parts of one creature by size, multiplied by its Challenge Rating (at least 1). */
export const TROPHY_BASE_GP: Partial<Record<Size, number>> = { Medium: 2, Large: 10, Huge: 50, Gargantuan: 200 };
const TROPHY_LB: Partial<Record<Size, number>> = { Medium: 2, Large: 5, Huge: 25, Gargantuan: 100 };
const TROPHY_PARTS: Record<string, string> = {
  beast: 'antlers, tusks and claws',
  monstrosity: 'horns, fangs and spines',
  dragon: 'teeth, horns and scales',
};

/** "1/4" → 0.25, "5" → 5; unknown → 0. */
export function crValue(cr: string | undefined): number {
  if (!cr) return 0;
  const [a, b] = cr.split('/').map(Number);
  const v = b ? a / b : a;
  return Number.isFinite(v) ? v : 0;
}

export interface Trophy {
  name: string;
  valueGp: number;
  weight: number;
  parts: string;
}

/** Table rule: a cleanly butchered Medium or bigger beast, monstrosity or dragon leaves parts worth selling or mounting. */
export function trophyFor(c: Creature): Trophy | null {
  const parts = TROPHY_PARTS[c.type.toLowerCase()];
  const base = TROPHY_BASE_GP[c.size];
  if (!parts || !base) return null;
  return { name: `Trophy (${c.name})`, valueGp: Math.round(base * Math.max(1, crValue(c.cr))), weight: TROPHY_LB[c.size] ?? 1, parts };
}

// ---------------------------------------------------------------- lucky finds

export type Chore = 'forage' | 'wood' | 'dig' | 'search';

export type FindReward =
  | { kind: 'coins'; dice: string; unit: 'cp' | 'sp' | 'gp' }
  | { kind: 'item'; name: string; valueGp: number; weight: number; hidden?: boolean }
  | { kind: 'material'; name: string; dice: string; unit: string; valueGp: number }
  | { kind: 'food'; dice: string; raw: boolean }
  | { kind: 'fuel'; dice: string };

export interface Find {
  /** What the character notices, told in the world. */
  text: string;
  reward: FindReward;
}

/** Table rule: a find comes on a natural 20, or a check that beats the DC by 5 or more. */
export const FIND_MARGIN = 5;
/** Table rule: digging has no check, so each job turns something up on a d20 roll of 19 or 20. */
export const DIG_FIND_ON = 19;

export const isExceptional = (natural: number, total: number, dc: number): boolean => natural === 20 || total >= dc + FIND_MARGIN;

const gem: FindReward = { kind: 'item', name: 'Rough gemstone', valueGp: 10, weight: 0, hidden: true };

export const CHORE_FINDS: Record<Chore, Find[]> = {
  forage: [
    { text: 'a stand of feverfew and woundwort, worth drying for an herbalist', reward: { kind: 'material', name: 'Healing herbs', dice: '1d4', unit: 'bundle', valueGp: 1 } },
    { text: 'a wild beehive in a split trunk, and comes away with honeycomb and only a sting or two', reward: { kind: 'food', dice: '1d4', raw: false } },
    { text: 'a clutch of eggs in a ground nest', reward: { kind: 'food', dice: '1', raw: true } },
    { text: 'a ring of rare mushrooms that cooks and alchemists pay well for', reward: { kind: 'item', name: 'Rare mushrooms', valueGp: 10, weight: 0.5 } },
    { text: 'a rotted pack under the bracken, with a few coins still in its pouch', reward: { kind: 'coins', dice: '2d6', unit: 'sp' } },
    { text: 'a bitter root that healers grind for poultices', reward: { kind: 'material', name: 'Medicinal root', dice: '1', unit: 'root', valueGp: 5 } },
    { text: 'a glint in a streambed: a pebble that might be worth something', reward: gem },
    { text: 'a patch of nuts and late berries, more than enough to share', reward: { kind: 'food', dice: '1d4+1', raw: false } },
  ],
  wood: [
    { text: 'a fallen pine full of resin knots that burn hot and long', reward: { kind: 'fuel', dice: '1d4' } },
    { text: 'wild honey in a hollow log', reward: { kind: 'food', dice: '1d4', raw: false } },
    { text: 'straight, seasoned hardwood that a woodworker would want', reward: { kind: 'material', name: 'Seasoned hardwood', dice: '1d4', unit: 'length', valueGp: 1 } },
    { text: 'a knotted burl on an old oak, prized by woodcarvers', reward: { kind: 'material', name: 'Burl wood', dice: '1', unit: 'burl', valueGp: 10 } },
    { text: 'a rusted lockbox jammed into a hollow tree, long forgotten', reward: { kind: 'coins', dice: '2d6', unit: 'gp' } },
    { text: "a magpie's nest with a tarnished ring woven into it", reward: { kind: 'item', name: 'Tarnished ring', valueGp: 25, weight: 0, hidden: true } },
    { text: "a bird's nest with eggs still warm", reward: { kind: 'food', dice: '1', raw: true } },
    { text: 'dry bracket fungus that makes fine tinder', reward: { kind: 'fuel', dice: '1' } },
  ],
  search: [
    { text: 'a purse wedged behind a loose stone, dropped by someone long gone', reward: { kind: 'coins', dice: '3d6', unit: 'sp' } },
    { text: 'a small cache under a flagstone, coins wrapped in oilcloth', reward: { kind: 'coins', dice: '2d6', unit: 'gp' } },
    { text: 'a ring caught in a crack in the floor', reward: { kind: 'item', name: 'Lost ring', valueGp: 25, weight: 0, hidden: true } },
    { text: 'a stone that glitters among the rubble', reward: gem },
    { text: 'a sealed flask someone hid and forgot: still good to drink', reward: { kind: 'item', name: 'Flask of fine brandy', valueGp: 10, weight: 1 } },
    { text: 'a bundle of unused arrows in a dry corner', reward: { kind: 'item', name: 'Arrows', valueGp: 0.05, weight: 0.05 } },
    { text: 'an old silver locket, the portrait inside faded', reward: { kind: 'item', name: 'Silver locket', valueGp: 25, weight: 0, hidden: true } },
    { text: 'a scatter of copper and silver in the dust', reward: { kind: 'coins', dice: '4d6', unit: 'sp' } },
  ],
  dig: [
    { text: 'a handful of old coins in the spoil, green with age', reward: { kind: 'coins', dice: '3d6', unit: 'sp' } },
    { text: 'a fossil shell in a split stone, the kind sages collect', reward: { kind: 'item', name: 'Fossil', valueGp: 5, weight: 1, hidden: true } },
    { text: 'a seam of good potter’s clay', reward: { kind: 'material', name: 'Potter’s clay', dice: '1d4', unit: 'lump', valueGp: 0.1 } },
    { text: 'nodules of flint that knap into sharp edges', reward: { kind: 'material', name: 'Flint', dice: '1d4', unit: 'nodule', valueGp: 0.1 } },
    { text: 'a clay jar someone buried long ago, with coins inside', reward: { kind: 'coins', dice: '2d6', unit: 'gp' } },
    { text: 'a stone that catches the light once the dirt is rubbed off', reward: gem },
    { text: 'a corroded bronze clasp from some older age', reward: { kind: 'item', name: 'Old bronze clasp', valueGp: 25, weight: 0, hidden: true } },
    { text: 'fat edible roots and grubs, not pretty but filling', reward: { kind: 'food', dice: '1', raw: true } },
  ],
};

export function rollFind(chore: Chore, rng: () => number): Find {
  const t = CHORE_FINDS[chore];
  return t[Math.min(t.length - 1, Math.floor(rng() * t.length))];
}

// ---------------------------------------------------------------- downtime that restores (table rules)

/** Relaxation: a week of true rest clears all Stress and Fear. Carousing and religious service ease them each workweek. */
export const CAROUSING_STRESS_PER_WEEK = 2;
export const SERVICE_FEAR_PER_WEEK = 1;
export const SERVICE_STRESS_PER_WEEK = 1;

// ---------------------------------------------------------------- pelts from traps and snares

/** Each small animal caught leaves a pelt (rabbit, squirrel, muskrat), worth 2 SP. */
export const SMALL_PELT = { name: 'Small pelt', valueGp: 0.2, weight: 0.5 };
/** One catch in six is a prized fur (fox, marten, mink), worth 2 GP. */
export const FINE_FUR = { name: 'Fine fur (fox or marten)', valueGp: 2, weight: 1 };
export const FINE_FUR_ODDS = 6;

// ---------------------------------------------------------------- hides

/** Raw hide value by size, in GP: trade goods, sold at full value or put toward leatherwork. */
export const HIDE_GP: Partial<Record<Size, number>> = { Medium: 5, Large: 15, Huge: 50, Gargantuan: 150 };

// ---------------------------------------------------------------- the night watch

/** A quiet watch: the watcher works a line or a snare at the camp's edge. Wisdom (Survival) at this DC brings in small game or fish. */
export const WATCH_CATCH_DC = 13;
export const WATCH_CATCH_DICE = '1d4';

// ---------------------------------------------------------------- gear upkeep

/** Freshly kept gear takes no wear and gives an edge for this long, in minutes. */
export const KEPT_GEAR_MINUTES = 24 * 60;
export const KEPT_GEAR_NOTE = 'Table rule: blades honed, strings waxed, straps oiled. +1 to the first weapon damage roll in each fight, and the gear takes no wear.';

// ---------------------------------------------------------------- reading the sky

/** Beating the DC by this much also reads tomorrow's weather. A success alone gives a vaguer hint. */
export const FORECAST_MARGIN = 5;

// ---------------------------------------------------------------- recovering ammunition

/** Searching after a fight: Wisdom (Perception or Survival). A success recovers three quarters, beating it by 5 nine in ten. Without a check, half (2024 PHB). */
export const AMMO_SEARCH_DC = 10;
export function ammoRecovered(spent: number, total: number | null): number {
  if (total == null || total < AMMO_SEARCH_DC) return Math.floor(spent / 2);
  return Math.floor(spent * (total >= AMMO_SEARCH_DC + 5 ? 0.9 : 0.75));
}

// ---------------------------------------------------------------- mending

/** A mend that beats the DC by this much reinforces the item: the next wear it would take is shrugged off. */
export const REINFORCE_MARGIN = 5;

// ---------------------------------------------------------------- foraging

/** Each full 5 points by which a forager beats the DC adds another 1d6 lb of food. */
export const FORAGE_BONUS_STEP = 5;
export const forageBonusDice = (total: number, dc: number): number => Math.max(0, Math.floor((total - dc) / FORAGE_BONUS_STEP));

// ---------------------------------------------------------------- performing for coin

/** An evening's performance at an inn or market square: Charisma (Performance), or Charisma with an instrument. */
export const PERFORM_MINUTES = 2 * 60;

export interface PerformTake {
  dice: string;
  unit: 'cp' | 'sp' | 'gp';
  /** A free meal from the house. */
  meal: boolean;
  /** A free room for the night. */
  room: boolean;
  /** Someone in the crowd wants to know the performer (an allied contact). */
  admirer: boolean;
  text: string;
}

/** Table rule: what an evening's performance brings in, by the check total. */
export function performTake(total: number): PerformTake {
  if (total < 10) return { dice: '2d6', unit: 'cp', meal: false, room: false, admirer: false, text: 'a thin crowd, some heckling and a few coppers' };
  if (total < 15) return { dice: '3d6', unit: 'sp', meal: true, room: false, admirer: false, text: 'a warm room, tapping feet, a hat of silver and a meal on the house' };
  if (total < 20) return { dice: '2d6', unit: 'gp', meal: true, room: true, admirer: false, text: 'a packed house that calls for more, a purse of gold, supper and a room for the night' };
  if (total < 25) return { dice: '4d6', unit: 'gp', meal: true, room: true, admirer: false, text: 'a night the tavern will talk about for weeks: gold tossed on stage, the best room and the best supper' };
  return { dice: '6d6', unit: 'gp', meal: true, room: true, admirer: true, text: 'a performance people will remember for years; someone of note seeks the performer out afterwards' };
}

// ---------------------------------------------------------------- maps and fair copies

/** A charted map of a route is worth this to guides, traders and caravan masters (table rule; trade goods, full value). */
export const ROUTE_MAP_GP = 25;
/** Copying a map you have: 1 hour, a sheet of Paper or Parchment, Intelligence with Cartographer's Tools at DC 10. */
export const COPY_MAP_MINUTES = 60;
export const COPY_MAP_DC = 10;
/** A fair copy of a Book (2024 PHB, 25 GP) takes 50 sheets and is worth a Book's price. */
export const BOOK_PAGES = 50;
export const BOOK_GP = 25;

// ---------------------------------------------------------------- crafting for sale

/** Table rule: a crafter sells their own new work as its maker, at full price, not as secondhand gear. */
export const CRAFTED_SELLS_FULL = true;

// ---------------------------------------------------------------- research (table rules on top of Xanathar's)

/** Research always turns up at least this much more lore than Xanathar's table gives. */
export const RESEARCH_EXTRA_LORE = 1;
/** A total this high also brings a lead: a sage, archivist or scholar who becomes an allied contact. */
export const RESEARCH_LEAD_AT = 16;
/** A total this high on research about an unidentified magic item the party holds identifies it. */
export const RESEARCH_IDENTIFY_AT = 15;

// ---------------------------------------------------------------- tracking, contacts, recuperating, laborers

/** Following a fresh trail leads to game: Advantage on the next foraging check. */
export const TRACK_GIVES_FORAGE_ADVANTAGE = true;
/** Catching up with a contact warms the bond by one step, at most once in this many days. */
export const CATCH_UP_WARMS_EVERY_DAYS = 30;
/** Recuperating successfully also lifts Exhaustion and eases Stress by these amounts. */
export const RECUPERATE_EXHAUSTION = 1;
export const RECUPERATE_STRESS = 2;
/** Each laborer at a wild camp gathers this much firewood (hours of fuel) before the Long Rest, and digs the fire pit. */
export const LABORER_FUEL_DICE = '1d6+2';

// ---------------------------------------------------------------- hirelings at work

/** A porter carries this much for the party, as their own load on the Storage tab. */
export const PORTER_LB = 150;
/** Each sailor aboard adds this to the helm's check against a storm, up to SAILOR_MAX. */
export const SAILOR_BONUS = 2;
export const SAILOR_MAX = 10;
