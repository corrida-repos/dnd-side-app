import type { Size } from '../state/types';
import { SIZES } from './survival';

/**
 * Taming a wild Beast or Monstrosity to keep as a mount or companion.
 *
 * The 2024 books have no taming rules, so most of this is a table rule built on the 2024 PHB:
 * - Influence action: Wisdom (Animal Handling) to coax a Beast or Monstrosity; the DC is 15 or the
 *   creature's Intelligence score, whichever is higher.
 * - Charmed: the charmer has Advantage on ability checks to interact socially with the creature
 *   (so Animal Friendship helps).
 * - Mounted combat: a willing creature at least one size larger than the rider, with the right
 *   anatomy, can be a mount; you can control it only if it is trained to accept a rider.
 *   Otherwise it is an independent mount that acts on its own.
 * - Flying and swimming mounts need an Exotic Saddle.
 */

export type TameStage = 'wary' | 'bonding' | 'tamed';
export type TameTraining = 'mount' | 'commands';

/** 2024 PHB Influence action: DC 15 or the creature's Intelligence, whichever is higher. */
export const influenceDC = (int: number): number => Math.max(15, int);

/** Table rule: creatures smarter than this understand bargains; use Persuasion or Intimidation instead. */
export const TAME_MAX_INT = 5;
/** Table rule: creature types that can be tamed. */
export const TAMEABLE_TYPES = ['beast', 'monstrosity'];

export function canTame(type: string, int: number): { ok: true } | { ok: false; why: string } {
  if (!TAMEABLE_TYPES.includes(type.toLowerCase())) return { ok: false, why: `only Beasts and Monstrosities can be tamed (this is a ${type})` };
  if (int > TAME_MAX_INT) return { ok: false, why: `with Intelligence ${int} it understands bargains: win it over with Persuasion, gifts or a deal instead (table rule: taming is for Intelligence ${TAME_MAX_INT} or lower)` };
  return { ok: true };
}

/** Parses a Challenge Rating as written ("1/4", "2") to a number. */
export function crValue(cr: string): number {
  const t = cr.trim();
  if (t.includes('/')) {
    const [a, b] = t.split('/').map(Number);
    return b ? a / b : 0;
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

/** Table rule: tougher creatures resist a stranger's hand. Added to the Influence DC. */
export function crDCBonus(cr: string): number {
  const v = crValue(cr);
  return v >= 5 ? 5 : v >= 2 ? 2 : 0;
}

/** The DC for every taming and training check with this creature. */
export const tameDC = (int: number, cr: string): number => influenceDC(int) + crDCBonus(cr);

/** Table rule: successful daily sessions needed to tame, by Challenge Rating; clever creatures (Int 4+) need 2 more. */
export function trustNeeded(cr: string, int: number): number {
  const v = crValue(cr);
  const base = v <= 0.25 ? 3 : v <= 1 ? 5 : v <= 3 ? 7 : v <= 5 ? 10 : 14;
  return base + (int >= 4 ? 2 : 0);
}

/** Table rule: training a tamed creature takes half as many successful sessions again, rounded up. */
export const trainingNeeded = (cr: string, int: number): number => Math.ceil(trustNeeded(cr, int) / 2);

/** Table rule: three failed sessions in a row and it slips away. */
export const TAME_MAX_FAILS = 3;
/** Table rule: one session a day, lasting an hour. */
export const TAME_SESSION_MINUTES = 60;
/** Table rule: waiting before trying to approach again after a failed approach. */
export const TAME_RETRY_MINUTES = 24 * 60;

/** 2024 PHB: a mount must be at least one size larger than its rider. */
export function bigEnoughToRide(mount: Size, rider: Size): boolean {
  return SIZES.indexOf(mount) > SIZES.indexOf(rider);
}

export interface ApproachFactors {
  /** Offering food it eats (table rule: Advantage). */
  food: boolean;
  /** The tamer is Charmed-friends with it, e.g. Animal Friendship (2024 PHB Charmed: Advantage). */
  charmed: boolean;
  /** Speak with Animals is active (table rule: Advantage, Beasts only). */
  speaking: boolean;
  /** It is hurt, cornered, guarding young, or has been hunted by the party (table rule: Disadvantage). */
  threatened: boolean;
}

export const FACTOR_LABEL: Record<keyof ApproachFactors, string> = {
  food: 'offering food it eats',
  charmed: 'it is Charmed by the tamer',
  speaking: 'Speak with Animals',
  threatened: 'it is hurt, cornered, guarding young or was hunted',
};

/** Advantage and Disadvantage for an approach or session; they cancel as usual. */
export function approachMode(f: ApproachFactors): { adv: boolean; dis: boolean } {
  return { adv: f.food || f.charmed || f.speaking, dis: f.threatened };
}

export type SessionResult = 'great' | 'success' | 'fail' | 'setback';

/** Table rule: a natural 20 counts twice; failing by 5 or more costs trust. */
export function sessionResult(natural: number, total: number, dc: number): SessionResult {
  if (natural === 20) return 'great';
  if (total >= dc) return 'success';
  return total <= dc - 5 ? 'setback' : 'fail';
}

/** Table rule: each whole day without a session while bonding costs 1 trust. */
export const missedDays = (lastDay: number | null, today: number): number => (lastDay == null ? 0 : Math.max(0, today - lastDay - 1));

/** What the characters notice as trust grows: in-world, without numbers. */
export function trustCue(name: string, trust: number, needed: number): string {
  const f = needed ? trust / needed : 0;
  if (f <= 0) return `The ${name} keeps its distance, ears back, watching every move.`;
  if (f < 0.34) return `The ${name} takes food from the ground once you step away, and stops flinching when you speak.`;
  if (f < 0.67) return `The ${name} lets you come within arm's reach and follows you a little way when you leave.`;
  if (f < 1) return `The ${name} eats from your hand now, and settles to rest where it can see you.`;
  return `The ${name} greets you as one of its own.`;
}

export const TRAINING_LABEL: Record<TameTraining, string> = {
  mount: 'to accept a rider',
  commands: 'to follow simple commands',
};

/** How a tamed creature behaves, for the screen. */
export const TAMED_RULES = [
  'Tamed: it is Friendly to the tamer and the party, travels with you, and eats and drinks like any mount.',
  'Untrained, it acts on its own turn in combat and follows its nature: it defends the tamer, and flees when badly hurt (table rule).',
  'It can be ridden only as an independent mount (2024 PHB) until it is trained to accept a rider; then it can be a controlled mount.',
  'Trained to follow simple commands (come, stay, guard, attack, fetch), it obeys the tamer without a check (table rule); anyone else needs a Wisdom (Animal Handling) check.',
];
