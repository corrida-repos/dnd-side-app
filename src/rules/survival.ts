import type { ArmorKind, Character, Size, Abundance, Pace } from '../state/types';

export const SIZES: Size[] = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'];

/** Food needed per day, in pounds (Malnutrition rule). */
export const FOOD_LB_PER_DAY: Record<Size, number> = { Tiny: 0.25, Small: 1, Medium: 1, Large: 4, Huge: 16, Gargantuan: 64 };
/** Water needed per day, in gallons (Dehydration rule). */
export const WATER_GAL_PER_DAY: Record<Size, number> = { Tiny: 0.25, Small: 1, Medium: 1, Large: 4, Huge: 16, Gargantuan: 64 };

export const PINTS_PER_GALLON = 8;
export const WATERSKIN_PINTS = 4;

export const proficiencyBonus = (level: number): number => Math.ceil(Math.max(1, Math.min(20, level)) / 4) + 1;

export const foodNeedLb = (c: Character): number => FOOD_LB_PER_DAY[c.size];

export function waterNeedPints(c: Character, hotDay: boolean, doubleInHeat: boolean): number {
  return WATER_GAL_PER_DAY[c.size] * PINTS_PER_GALLON * (hotDay && doubleInHeat ? 2 : 1);
}

export function exhaustionSummary(level: number): string {
  if (level <= 0) return 'None';
  if (level >= 6) return 'Dead';
  return `−${2 * level} to D20 Tests, Speed −${5 * level} ft`;
}

export const FORAGE_DC: Record<Abundance, number> = { abundant: 10, limited: 15, scarce: 20 };
export const ABUNDANCE_LABEL: Record<Abundance, string> = {
  abundant: 'Plenty of food and water sources',
  limited: 'Limited food and water sources',
  scarce: 'Very little food or water, if any',
};

export const PACES: Record<Pace, { mph: number; perDay: number; note: string }> = {
  fast: { mph: 4, perDay: 30, note: 'Disadvantage on Wisdom (Perception or Survival) checks' },
  normal: { mph: 3, perDay: 24, note: 'Disadvantage on Dexterity (Stealth) checks' },
  slow: { mph: 2, perDay: 18, note: 'Advantage on Wisdom (Perception or Survival) checks' },
};

export const fmtLb = (n: number): string => `${+n.toFixed(2)} lb`;
export function fmtWater(pints: number): string {
  const gal = pints / PINTS_PER_GALLON;
  if (pints < PINTS_PER_GALLON) return `${+pints.toFixed(1)} pt`;
  return `${+gal.toFixed(2)} gal`;
}

/** Donning and doffing armor, in minutes (PHB). A shield takes the Utilize action to don or doff. */
export const ARMOR_TIMES: Record<Exclude<ArmorKind, 'none'>, { don: number; doff: number }> = {
  light: { don: 1, doff: 1 },
  medium: { don: 5, doff: 1 },
  heavy: { don: 10, doff: 5 },
};

export const ARMOR_LABEL: Record<ArmorKind, string> = { none: 'No armor', light: 'Light armor', medium: 'Medium armor', heavy: 'Heavy armor' };

export const wearsBulkyArmor = (c: Character): boolean => c.armorWorn && (c.armorKind === 'medium' || c.armorKind === 'heavy');

/** Medium or Heavy armor, or heavy clothing, gives Disadvantage on extreme heat saves. */
export const heatDisadvantage = (c: Character): boolean => c.heavyGarb || wearsBulkyArmor(c);

export function armorTime(c: Character, action: 'don' | 'doff'): number {
  if (c.armorKind === 'none') return 0;
  return ARMOR_TIMES[c.armorKind][action];
}

export const PURIFY_SPELL = 'Purify Food and Drink';
/** Table rule: eating or drinking unpurified wild supplies. */
export const TAINTED_DC = 10;
export const TAINTED_POISON_MINUTES = 60;
/** Table rule: boiling a batch of water over a campfire. */
export const BOIL_MINUTES = 30;
