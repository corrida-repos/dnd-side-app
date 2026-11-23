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

export type Chore = 'forage' | 'wood' | 'dig';

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
