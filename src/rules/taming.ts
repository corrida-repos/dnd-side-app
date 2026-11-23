import type { Size } from '../state/types';
import { SIZES } from './survival';

/**
 * Taming a wild Beast or Monstrosity to keep as a mount or companion.
 *
 * No D&D book has taming rules (checked against every 5etools book, rule, feat, species, class and
 * item file), so the process is a table rule built from the official pieces:
 * - 2024 PHB Influence action: Wisdom (Animal Handling) to gently coax a Beast or Monstrosity;
 *   DC 15 or the creature's Intelligence, whichever is higher; a failure means waiting 24 hours
 *   before urging it the same way again; an Unwilling creature refuses without a check.
 * - 2024 PHB attitudes: Advantage to influence a Friendly creature, Disadvantage for a Hostile one.
 * - 2024 PHB Charmed: the charmer has Advantage on checks to interact with it socially.
 * - 2024 PHB Speak with Animals: any of the Influence skill options can be used with Beasts.
 * - 2024 PHB Help, Guidance and Enhance Ability; 2024 DMG Bastion Stable and Menagerie.
 * - 2024 PHB mounted combat: a mount is at least one size larger than its rider and must be
 *   trained to accept a rider to be controlled; flying and swimming mounts need an Exotic Saddle.
 * - Monster Manual lore: griffons, hippogriffs, wyverns and hadrosauruses are trained from eggs
 *   or hatchlings; owlbears take "time, food, and luck".
 * - Tasha's Cauldron sidekicks: a friendly creature of CR 1/2 or lower can join as a sidekick.
 */

export type TameStage = 'wary' | 'bonding' | 'tamed';
export type TameTraining = 'mount' | 'commands';
export type Attitude = 'hostile' | 'indifferent' | 'friendly';

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
export function trustNeeded(cr: string, int: number, raised = false): number {
  const v = crValue(cr);
  const base = (v <= 0.25 ? 3 : v <= 1 ? 5 : v <= 3 ? 7 : v <= 5 ? 10 : 14) + (int >= 4 ? 2 : 0);
  return raised ? Math.ceil(base / 2) : base;
}

/** Table rule: training a tamed creature takes half as many successful sessions again, rounded up. */
export const trainingNeeded = (cr: string, int: number): number => Math.ceil(trustNeeded(cr, int) / 2);

/** Tasha's Cauldron: a sidekick's stat block must be CR 1/2 or lower. */
export const SIDEKICK_MAX_CR = 0.5;
export const canBeSidekick = (cr: string): boolean => crValue(cr) <= SIDEKICK_MAX_CR;

/** Table rule: three failed sessions in a row and it slips away. */
export const TAME_MAX_FAILS = 3;
/** Table rule: one session a day, lasting an hour. */
export const TAME_SESSION_MINUTES = 60;
/** 2024 PHB Influence: after a failed check, wait 24 hours before urging it the same way. */
export const TAME_RETRY_MINUTES = 24 * 60;
/** 2024 DMG Stable: a Beast that has spent 14 days there gives Advantage on Animal Handling checks with it. */
export const STABLE_DAYS = 14;

/** 2024 PHB: a mount must be at least one size larger than its rider. */
export function bigEnoughToRide(mount: Size, rider: Size): boolean {
  return SIZES.indexOf(mount) > SIZES.indexOf(rider);
}

/** Circumstances the table chooses for an approach or session. */
export interface TameAids {
  /** Its attitude toward the tamer (2024 PHB): Hostile gives Disadvantage, Friendly Advantage. */
  attitude: Attitude;
  /** What's asked is against its nature right now (2024 PHB Influence: Unwilling, no check, it refuses). */
  unwilling: boolean;
  /** Offering food it eats (table rule: Advantage). Sessions take food from the camp stores instead. */
  food: boolean;
  /** Charmed by the tamer: Animal Friendship, Charm Monster, Awaken (2024 PHB Charmed: Advantage). */
  charmed: boolean;
  /** Speak with Animals is active: Beasts only, and any Influence skill can be used (2024 PHB). */
  speaking: boolean;
  /** Hurt, cornered, guarding young or hunted by the party (table rule: Disadvantage). */
  threatened: boolean;
  /** A Beast kept 14+ days in a Bastion Stable (2024 DMG: Advantage on Animal Handling with it). */
  stable: boolean;
  /** Enhance Ability on the ability being used (2024 PHB: Advantage). */
  enhance: boolean;
  /** Guidance on the skill being used (2024 PHB: +1d4). */
  guidance: boolean;
  /** Someone proficient in the skill takes the Help action (2024 PHB: Advantage). */
  helped: boolean;
}

export const NO_AIDS: TameAids = { attitude: 'indifferent', unwilling: false, food: false, charmed: false, speaking: false, threatened: false, stable: false, enhance: false, guidance: false, helped: false };

export const AID_LABEL: Record<Exclude<keyof TameAids, 'attitude'>, string> = {
  unwilling: 'Unwilling: it refuses (2024 PHB)',
  food: 'offering food it eats (table rule: Advantage)',
  charmed: 'Charmed by the tamer (2024 PHB: Advantage)',
  speaking: 'Speak with Animals (Beasts: any Influence skill)',
  threatened: 'hurt, cornered, guarding young or hunted (table rule: Disadvantage)',
  stable: `kept ${STABLE_DAYS}+ days in a Bastion Stable (2024 DMG, Beasts: Advantage)`,
  enhance: 'Enhance Ability on that ability (2024 PHB: Advantage)',
  guidance: 'Guidance (2024 PHB: +1d4)',
  helped: 'a proficient helper takes the Help action (2024 PHB: Advantage)',
};

/** What the tamer brings: read from the character sheet. */
export interface TamerFacts {
  wisMod: number;
  chaMod: number | null;
  pb: number;
  exhaustion: number;
  animalHandling: boolean;
  persuasion: boolean;
  performance: boolean;
  feats: string[];
  species: string;
  level: number;
}

export interface CreatureFacts {
  type: string;
  int: number;
  movement: 'land' | 'fly' | 'swim';
}

export interface TameCheck {
  /** False when the creature refuses outright. */
  ok: boolean;
  why?: string;
  skill: string;
  bonus: number;
  /** Extra dice added to the roll, e.g. 1d4 from Guidance. */
  dice: number[];
  mode: 'normal' | 'advantage' | 'disadvantage';
  /** Each thing that changed the roll, for the log. */
  notes: string[];
}

const has = (list: string[], name: RegExp): boolean => list.some((f) => name.test(f));

/** The 2024 Influence check for taming, with every rule, feature and spell that applies. */
export function tameCheck(t: TamerFacts, c: CreatureFacts, a: TameAids): TameCheck {
  const beast = c.type.toLowerCase() === 'beast';
  const notes: string[] = [];
  if (a.unwilling) return { ok: false, why: 'it is Unwilling, so it refuses without a check (2024 PHB Influence)', skill: '', bonus: 0, dice: [], mode: 'normal', notes };
  // Skills: Animal Handling always; Charisma skills when the creature understands the tamer.
  const firbolg = beast && /firbolg/i.test(t.species);
  const seaElf = beast && c.movement === 'swim' && /sea elf/i.test(t.species);
  const talks = beast && a.speaking;
  const options: { skill: string; bonus: number; cha: boolean }[] = [{ skill: 'Wisdom (Animal Handling)', bonus: t.wisMod + (t.animalHandling ? t.pb : 0), cha: false }];
  if ((talks || firbolg || seaElf) && t.chaMod != null) {
    options.push({ skill: 'Charisma (Persuasion)', bonus: t.chaMod + (t.persuasion ? t.pb : 0), cha: true });
    options.push({ skill: 'Charisma (Performance)', bonus: t.chaMod + (t.performance ? t.pb : 0), cha: true });
  }
  // Mark of Handling (EFA): +1d4 to Animal Handling, 1d6 with Greater Mark of Handling.
  const markDie = has(t.feats, /^greater mark of handling/i) ? 6 : has(t.feats, /^mark of handling/i) ? 4 : 0;
  const score = (o: (typeof options)[number]) => o.bonus + (!o.cha && markDie ? (markDie + 1) / 2 : 0) + (o.cha && firbolg ? 4 : 0);
  const pick = options.reduce((best, o) => (score(o) > score(best) ? o : best));
  if (pick.cha) notes.push(talks ? 'Speak with Animals lets the tamer talk it round' : firbolg ? 'Speech of Beast and Leaf: Beasts understand a firbolg' : 'sea elves can speak to Beasts that swim');

  let adv = false;
  let dis = false;
  if (a.attitude === 'friendly') (adv = true), notes.push('it is Friendly (2024 PHB: Advantage)');
  if (a.attitude === 'hostile') (dis = true), notes.push('it is Hostile (2024 PHB: Disadvantage)');
  if (a.charmed) (adv = true), notes.push('Charmed (2024 PHB: Advantage)');
  if (a.food) (adv = true), notes.push('offering food');
  if (a.threatened) (dis = true), notes.push('it feels threatened');
  if (a.stable && beast && !pick.cha) (adv = true), notes.push('Bastion Stable (2024 DMG)');
  if (a.enhance) (adv = true), notes.push('Enhance Ability');
  if (a.helped) (adv = true), notes.push('Help action');
  if (beast && has(t.feats, /^enclave magic/i)) (adv = true), notes.push('Enclave Magic: Friend to Animals (FRHoF)');
  if (pick.cha && firbolg) (adv = true), notes.push('Speech of Beast and Leaf: Advantage on Charisma checks to influence Beasts');
  const dice: number[] = [];
  if (a.guidance) dice.push(4), notes.push('Guidance +1d4');
  if (!pick.cha && markDie) dice.push(markDie), notes.push(`Mark of Handling +1d${markDie} (EFA)`);
  const mode = adv && !dis ? 'advantage' : dis && !adv ? 'disadvantage' : 'normal';
  return { ok: true, skill: pick.skill, bonus: pick.bonus - 2 * t.exhaustion, dice, mode, notes };
}

/** Spells that charm a would-be pet, and who they work on. */
export function charmSpellsFor(c: CreatureFacts, t: Pick<TamerFacts, 'feats' | 'level'>): string[] {
  const beast = c.type.toLowerCase() === 'beast';
  // Mark of Handling (EFA): from level 3, Animal Friendship and Speak with Animals can target a Monstrosity with Int 3 or lower.
  const markReach = !beast && c.int <= 3 && t.level >= 3 && has(t.feats, /mark of handling/i);
  return [
    ...(beast || markReach ? ['Animal Friendship (Charmed 24 hours)'] : []),
    'Charm Monster (Charmed and Friendly 1 hour)',
    ...(beast && c.int <= 3 ? ['Awaken (Charmed 30 days, but it becomes Intelligence 10: persuade it instead)'] : []),
  ];
}

export type SessionResult = 'great' | 'success' | 'fail' | 'setback';

/** Table rule: a natural 20 counts twice; failing by 5 or more costs trust. */
export function sessionResult(natural: number, total: number, dc: number): SessionResult {
  if (natural === 20) return 'great';
  if (total >= dc) return 'success';
  return total <= dc - 5 ? 'setback' : 'fail';
}

/** Table rule: halfway to tamed, it counts as Friendly toward its tamer (so Advantage, 2024 PHB). */
export const sessionAttitude = (trust: number, needed: number, tamed: boolean): Attitude => (tamed || trust * 2 >= needed ? 'friendly' : 'indifferent');

/** Table rule: each whole day without a session while bonding costs 1 trust. */
export const missedDays = (lastDay: number | null, today: number): number => (lastDay == null ? 0 : Math.max(0, today - lastDay - 1));

/** What the characters notice as trust grows: in-world, without numbers. */
export function trustCue(name: string, trust: number, needed: number): string {
  const f = needed ? trust / needed : 0;
  if (f <= 0) return `The ${name} keeps its distance, ears back, watching every move.`;
  if (f < 0.34) return `The ${name} takes food from the ground once you step away, and stops flinching when you speak.`;
  if (f < 0.5) return `The ${name} lets you come within arm's reach.`;
  if (f < 1) return `The ${name} eats from your hand now, follows you about, and settles to rest where it can see you.`;
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
