import type { AbilityKey } from './gear';

/**
 * Table rule: learning armor training or weapon proficiency in downtime.
 *
 * The 2024 PHB has no downtime route to these: they come from a class, a species, multiclassing, or a feat
 * (Lightly Armored, Moderately Armored, Heavily Armored, Martial Weapon Training). This rule stretches Xanathar's
 * training (ten workweeks at 25 GP a week, shortened by an ability modifier) to arms, with the feats' order as
 * prerequisites: Light before Medium before Heavy. The body learns, not the head, so Strength or Dexterity
 * shortens it instead of Intelligence. Training never grants Weapon Mastery: that stays a class feature.
 */
export type ArmsKind = 'Light armor' | 'Medium armor' | 'Heavy armor' | 'Shields' | 'Simple weapons' | 'One martial weapon' | 'Martial weapons';

export interface ArmsCourse {
  /** Workweeks before the ability modifier. */
  weeks: number;
  /** Abilities whose best modifier shortens it. */
  abilities: AbilityKey[];
  /** Training that must already be held. */
  needs?: ArmsKind;
  /** The line the rules text uses for what is learned. */
  grants: string;
}

export const ARMS_COURSES: Record<ArmsKind, ArmsCourse> = {
  'Light armor': { weeks: 10, abilities: ['dex'], grants: 'Light armor training' },
  'Medium armor': { weeks: 10, abilities: ['str', 'dex'], needs: 'Light armor', grants: 'Medium armor training' },
  'Heavy armor': { weeks: 10, abilities: ['str'], needs: 'Medium armor', grants: 'Heavy armor training' },
  Shields: { weeks: 5, abilities: ['str'], grants: 'Shield training' },
  'Simple weapons': { weeks: 10, abilities: ['str', 'dex'], grants: 'proficiency with Simple weapons' },
  'One martial weapon': { weeks: 10, abilities: ['str', 'dex'], grants: 'proficiency with one Martial weapon' },
  'Martial weapons': { weeks: 20, abilities: ['str', 'dex'], needs: 'Simple weapons', grants: 'proficiency with all Martial weapons' },
};

export const ARMS_KINDS = Object.keys(ARMS_COURSES) as ArmsKind[];
export const ARMS_WEEK_GP = 25;
export const ARMS_WEEK_DAYS = 5;

/** What one character already holds: a list like ["Light armor", "Martial weapons", "Longsword"]. */
export type ArmsList = string[] | undefined;

const has = (list: ArmsList, k: string) => (list ?? []).some((x) => x.toLowerCase() === k.toLowerCase());

/** Whether a character already holds this training (all Martial weapons covers any one; Heavy implies Medium implies Light). */
export function holdsArms(list: ArmsList, kind: ArmsKind, weapon?: string): boolean {
  if (has(list, kind)) return kind !== 'One martial weapon';
  if (kind === 'Light armor') return holdsArms(list, 'Medium armor');
  if (kind === 'Medium armor') return holdsArms(list, 'Heavy armor');
  if (kind === 'Simple weapons') return holdsArms(list, 'Martial weapons');
  if (kind === 'One martial weapon') return has(list, 'Martial weapons') || (!!weapon && has(list, weapon));
  return false;
}

/** Can this character start the course? Gives the reason when not. */
export function canTrainArms(list: ArmsList, kind: ArmsKind, weapon?: string): { ok: boolean; reason?: string } {
  if (holdsArms(list, kind, weapon)) return { ok: false, reason: `already has ${kind === 'One martial weapon' ? `proficiency with ${weapon || 'that weapon'}` : ARMS_COURSES[kind].grants}` };
  const need = ARMS_COURSES[kind].needs;
  if (need && !holdsArms(list, need)) return { ok: false, reason: `needs ${ARMS_COURSES[need].grants} first` };
  if (kind === 'One martial weapon' && !weapon?.trim()) return { ok: false, reason: 'name the weapon' };
  return { ok: true };
}

const mod = (score: number | undefined) => (score === undefined ? 0 : Math.floor((score - 10) / 2));

/** Best modifier among the course's abilities. */
export function armsModifier(kind: ArmsKind, scores: Partial<Record<AbilityKey, number>>): number {
  return Math.max(...ARMS_COURSES[kind].abilities.map((a) => mod(scores[a])));
}

/** Workweeks needed: the base less the modifier, never under half the base. */
export function armsWeeks(kind: ArmsKind, modifier: number): number {
  const base = ARMS_COURSES[kind].weeks;
  return Math.max(Math.ceil(base / 2), base - Math.round(modifier));
}

export function armsCost(weeks: number): number {
  return weeks * ARMS_WEEK_GP;
}

/** The entry recorded on the character when the course ends. */
export const armsEntry = (kind: ArmsKind, weapon?: string): string => (kind === 'One martial weapon' ? (weapon ?? '').trim() : kind);

/** What the character notices once it has sunk in: for the player, in the world's words. */
export function armsCue(kind: ArmsKind, weapon?: string): string {
  switch (kind) {
    case 'Light armor':
      return 'the leather no longer pinches at the shoulders; they forget they are wearing it until they take it off';
    case 'Medium armor':
      return 'the weight of the mail rides on the hips now, not the neck, and they can run, crouch and climb a ladder in it without thinking';
    case 'Heavy armor':
      return 'plate that once felt like a coffin moves with them; they can pull every strap tight alone in the dark and still breathe at a run';
    case 'Shields':
      return 'the shield comes up before they decide to raise it, and a blow on its face no longer jars the elbow';
    case 'Simple weapons':
      return 'spear, mace and crossbow sit right in the hand; they know where each one wants to go';
    case 'One martial weapon':
      return `${weapon?.trim() || 'the weapon'} feels like part of the arm; the drills come back without counting`;
    case 'Martial weapons':
      return 'any blade or polearm in the rack makes sense the moment they lift it: its balance, its reach, how it wants to be swung';
  }
}

/** Reads armor and weapon proficiencies out of proficiency names (D&D Beyond's "Light Armor", "Martial Weapons", "Longsword"). */
export function armsFromProficiencies(names: string[], weaponNames: string[]): string[] {
  const out = new Set<string>();
  const weapons = new Map(weaponNames.map((w) => [w.toLowerCase(), w]));
  for (const raw of names) {
    const n = raw.trim().toLowerCase();
    if (/^light armou?r$/.test(n)) out.add('Light armor');
    else if (/^medium armou?r$/.test(n)) out.add('Medium armor');
    else if (/^heavy armou?r$/.test(n)) out.add('Heavy armor');
    else if (/^shields?$/.test(n)) out.add('Shields');
    else if (n === 'simple weapons') out.add('Simple weapons');
    else if (n === 'martial weapons') out.add('Martial weapons');
    else if (weapons.has(n)) out.add(weapons.get(n)!);
  }
  return [...out];
}
