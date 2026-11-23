/**
 * Lingering injuries. The 2024 books have none; this follows the optional Lingering Injuries rule of the
 * 2014 DMG (a d20 table), switchable as a table rule. An injury can come from dropping to 0 HP without dying,
 * a critical hit, or failing a death save by 5 or more (the DM decides which apply at the table).
 * Wording is the app's own.
 */
export type InjuryKind = 'eye' | 'arm' | 'leg' | 'limp' | 'internal' | 'ribs' | 'horribleScar' | 'festering' | 'minorScar';

/** How an injury heals. */
export type InjuryCure =
  /** Only Regenerate (or similar powerful magic) restores it. */
  | 'regenerate'
  /** Any magical healing ends it. */
  | 'magic'
  /** Magical healing, or ten days of rest. */
  | 'magicOrRest'
  /** Magical healing, or ten successful Medicine checks, one per day. */
  | 'magicOrMedicine'
  /** Heal or Regenerate. */
  | 'heal'
  /** Permanent, but harmless. */
  | 'none';

export interface InjuryInfo {
  label: string;
  /** d20 results that give it. */
  range: [number, number];
  effect: string;
  cure: InjuryCure;
  cureText: string;
}

export const INJURIES: Record<InjuryKind, InjuryInfo> = {
  eye: { label: 'Lost an eye', range: [1, 1], effect: 'Disadvantage on Wisdom (Perception) checks that rely on sight and on ranged attack rolls.', cure: 'regenerate', cureText: 'Regenerate restores it.' },
  arm: { label: 'Lost an arm or hand', range: [2, 2], effect: 'Can no longer hold anything with two hands, and only one object at a time.', cure: 'regenerate', cureText: 'Regenerate restores it.' },
  leg: { label: 'Lost a foot or leg', range: [3, 3], effect: 'Speed on foot halved; needs a cane or crutch, and falls Prone after the Dash action. Disadvantage on Dexterity checks made to balance.', cure: 'regenerate', cureText: 'Regenerate restores it; a peg leg or prosthetic removes the Speed penalty.' },
  limp: { label: 'Limp', range: [4, 4], effect: 'Speed on foot −5 ft. After the Dash action, a DC 10 Dexterity save or fall Prone.', cure: 'magic', cureText: 'Any magical healing ends it.' },
  internal: { label: 'Internal injury', range: [5, 7], effect: 'Whenever they try an action in combat, a DC 15 Constitution save or lose the action and can’t take Reactions until their next turn.', cure: 'magicOrRest', cureText: 'Magical healing, or ten days doing nothing more than resting.' },
  ribs: { label: 'Broken ribs', range: [8, 10], effect: 'As an internal injury, but the save is DC 10.', cure: 'magicOrRest', cureText: 'Magical healing, or ten days doing nothing more than resting.' },
  horribleScar: { label: 'Horrible scar', range: [11, 13], effect: 'Disfigured: Disadvantage on Charisma (Persuasion) checks and Advantage on Charisma (Intimidation) checks.', cure: 'heal', cureText: 'Heal or Regenerate removes it.' },
  festering: { label: 'Festering wound', range: [14, 16], effect: 'HP maximum drops by 1 every 24 hours the wound lasts; at 0 they die.', cure: 'magicOrMedicine', cureText: 'Magical healing, or ten successful DC 15 Wisdom (Medicine) checks, one a day.' },
  minorScar: { label: 'Minor scar', range: [17, 20], effect: 'No ill effect: a mark of the fight.', cure: 'none', cureText: 'Permanent unless removed by Heal or Regenerate.' },
};

/** Rest days or Medicine successes it takes to heal without magic. */
export const INJURY_REST_DAYS = 10;
export const INJURY_MEDICINE_SUCCESSES = 10;
export const FESTERING_MEDICINE_DC = 15;

/** The injury a d20 roll gives. */
export function injuryFor(roll: number): InjuryKind {
  const r = Math.min(20, Math.max(1, Math.round(roll)));
  return (Object.keys(INJURIES) as InjuryKind[]).find((k) => r >= INJURIES[k].range[0] && r <= INJURIES[k].range[1])!;
}

/** Does this healing end the injury? */
export function healsInjury(kind: InjuryKind, how: 'magic' | 'heal' | 'regenerate'): boolean {
  const cure = INJURIES[kind].cure;
  if (how === 'regenerate') return true;
  if (how === 'heal') return cure === 'magic' || cure === 'magicOrRest' || cure === 'magicOrMedicine' || cure === 'heal' || cure === 'none';
  return cure === 'magic' || cure === 'magicOrRest' || cure === 'magicOrMedicine';
}

/** Speed lost on foot (a lost leg halves Speed instead). */
export function injurySpeedPenalty(kinds: InjuryKind[]): number {
  return kinds.includes('limp') ? 5 : 0;
}

/** Spells that count as magical healing for injuries, and how strong they are. */
export const INJURY_SPELLS: Record<string, 'magic' | 'heal' | 'regenerate'> = {
  'Cure Wounds': 'magic',
  'Healing Word': 'magic',
  'Mass Cure Wounds': 'magic',
  'Mass Healing Word': 'magic',
  'Prayer of Healing': 'magic',
  Heal: 'heal',
  'Mass Heal': 'heal',
  Regenerate: 'regenerate',
};
