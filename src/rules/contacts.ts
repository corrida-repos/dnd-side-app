/**
 * Contacts and relationships. Attitudes (Friendly, Indifferent, Hostile) and the Influence action come from
 * the 2024 PHB and DMG. Bonds that fade when neglected, favors and the wait between favors are table rules.
 */
export type Attitude = 'hostile' | 'indifferent' | 'friendly';

export const ATTITUDE_LABEL: Record<Attitude, string> = { hostile: 'Hostile', indifferent: 'Indifferent', friendly: 'Friendly' };

/** Bond runs from −3 to +3: +1 or more is Friendly, −1 or less Hostile (table rule). */
export const BOND_MIN = -3;
export const BOND_MAX = 3;

export function attitudeOf(bond: number): Attitude {
  if (bond >= 1) return 'friendly';
  if (bond <= -1) return 'hostile';
  return 'indifferent';
}

export const clampBond = (b: number): number => Math.max(BOND_MIN, Math.min(BOND_MAX, b));

/** A Friendly contact who hears nothing from the party for this long cools by one step (table rule). */
export const NEGLECT_DAYS = 60;

/** After calling in a favor, the contact won't do another for this many days (table rule). */
export const FAVOR_COOLDOWN_DAYS = 30;

/**
 * Influence check DCs (2024 DMG: DC 10 for something easy for a Friendly creature, 15 or more for an Indifferent
 * one, 20 for a big ask). A Hostile contact won't help. A favor they owe makes it automatic.
 */
export function favorDC(attitude: Attitude, big: boolean): number | null {
  if (attitude === 'hostile') return null;
  const base = attitude === 'friendly' ? 10 : 15;
  return base + (big ? 5 : 0);
}

export const CONTACT_ROLES = ['Informant', 'Fence', 'Merchant', 'Noble', 'Priest', 'Sage', 'Guard captain', 'Crime boss', 'Innkeeper', 'Smith', 'Family', 'Old friend', 'Rival', 'Other'];

/** What a contact can help with, for the favor list. */
export const FAVORS = [
  'A rumor or piece of information',
  'An introduction to someone important',
  'A place to hide or stay',
  'A loan or a good price',
  'Looking the other way',
  'A risky task done on the party’s behalf',
];
