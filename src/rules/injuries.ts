/**
 * Lingering injuries: the optional rule of the 2014 DMG (a d20 table), behind a switch because the 2024 books
 * have none. An injury comes from taking a critical hit, dropping to 0 HP, or failing a death save by 5 or more.
 * Effects and cures follow the DMG, in the app's own words; nothing is added to them.
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
  eye: { label: 'Lost an eye', range: [1, 1], effect: 'Disadvantage on Wisdom (Perception) checks that rely on sight and on ranged attack rolls. With no eyes left, Blinded.', cure: 'regenerate', cureText: 'Regenerate restores it.' },
  arm: { label: 'Lost an arm or hand', range: [2, 2], effect: 'Can no longer hold anything with two hands, and only one object at a time.', cure: 'regenerate', cureText: 'Regenerate restores it.' },
  leg: { label: 'Lost a foot or leg', range: [3, 3], effect: 'Speed on foot halved, and needs a cane or crutch to move unless they have a peg leg or other prosthesis. Falls Prone after the Dash action. Disadvantage on Dexterity checks made to balance.', cure: 'regenerate', cureText: 'Regenerate restores it. A peg leg or other prosthesis means no cane or crutch is needed.' },
  limp: { label: 'Limp', range: [4, 4], effect: 'Speed on foot −5 ft. After the Dash action, a DC 10 Dexterity save or fall Prone.', cure: 'magic', cureText: 'Any magical healing ends it.' },
  internal: { label: 'Internal injury', range: [5, 7], effect: 'Whenever they try an action in combat, a DC 15 Constitution save; on a failure they lose the action and can’t take Reactions until the start of their next turn.', cure: 'magicOrRest', cureText: 'Magical healing, or ten days doing nothing more than resting.' },
  ribs: { label: 'Broken ribs', range: [8, 10], effect: 'As an internal injury, but the save is DC 10.', cure: 'magicOrRest', cureText: 'Magical healing, or ten days doing nothing more than resting.' },
  horribleScar: { label: 'Horrible scar', range: [11, 13], effect: 'Disfigured, and it can’t easily be concealed: Disadvantage on Charisma (Persuasion) checks and Advantage on Charisma (Intimidation) checks.', cure: 'heal', cureText: 'Magical healing of 6th level or higher (Heal, Regenerate) removes it.' },
  festering: { label: 'Festering wound', range: [14, 16], effect: 'HP maximum drops by 1 every 24 hours the wound persists; if it drops to 0, they die.', cure: 'magicOrMedicine', cureText: 'Magical healing, or someone tends the wound with a DC 15 Wisdom (Medicine) check once every 24 hours: ten successes heal it.' },
  minorScar: { label: 'Minor scar', range: [17, 20], effect: 'No adverse effect.', cure: 'none', cureText: 'Magical healing of 6th level or higher (Heal, Regenerate) removes it.' },
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
