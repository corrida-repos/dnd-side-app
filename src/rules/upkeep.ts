import type { CasterClass, ClassName } from '../state/types';

export const abilityMod = (score: number): number => Math.floor((score - 10) / 2);

/** Hit Point Die by class (PHB). */
export const HIT_DIE: Record<ClassName, number> = {
  Barbarian: 12,
  Fighter: 10,
  Paladin: 10,
  Ranger: 10,
  Bard: 8,
  Cleric: 8,
  Druid: 8,
  Monk: 8,
  Rogue: 8,
  Warlock: 8,
  Sorcerer: 6,
  Wizard: 6,
  Other: 8,
};

export const MAX_ATTUNED = 3;
/** Attunement ends if the item spends this long more than 100 feet from you. */
export const ATTUNE_AWAY_MINUTES = 24 * 60;
export const IDENTIFY_MINUTES = 1;
export const RITUAL_EXTRA_MINUTES = 10;

export type Recharge = 'short' | 'shortOne' | 'long' | 'dawn' | 'manual';
export const RECHARGE_LABEL: Record<Recharge, string> = {
  short: 'All back on a Short or Long Rest',
  shortOne: 'One back on a Short Rest, all on a Long Rest',
  long: 'All back on a Long Rest',
  dawn: 'All back at dawn',
  manual: 'Only by hand',
};

export interface ResourcePreset {
  name: string;
  recharge: Recharge;
  cls?: ClassName;
  note?: string;
}

/** Common limited-use features. Set the maximum from your character sheet. */
export const RESOURCE_PRESETS: ResourcePreset[] = [
  { name: 'Rage', recharge: 'shortOne', cls: 'Barbarian' },
  { name: 'Bardic Inspiration', recharge: 'long', cls: 'Bard', note: 'From level 5 (Font of Inspiration) it comes back on a Short Rest too.' },
  { name: 'Channel Divinity', recharge: 'shortOne', cls: 'Cleric' },
  { name: 'Wild Shape', recharge: 'shortOne', cls: 'Druid' },
  { name: 'Second Wind', recharge: 'shortOne', cls: 'Fighter' },
  { name: 'Action Surge', recharge: 'short', cls: 'Fighter' },
  { name: 'Focus Points', recharge: 'short', cls: 'Monk' },
  { name: 'Lay on Hands (HP pool)', recharge: 'long', cls: 'Paladin' },
  { name: 'Channel Divinity', recharge: 'shortOne', cls: 'Paladin' },
  { name: 'Sorcery Points', recharge: 'long', cls: 'Sorcerer' },
  { name: 'Magical Cunning', recharge: 'long', cls: 'Warlock' },
  { name: 'Arcane Recovery', recharge: 'long', cls: 'Wizard', note: 'Once per day, used after a Short Rest.' },
  { name: 'Luck Points (Lucky)', recharge: 'long' },
  { name: 'Heroic Inspiration', recharge: 'manual' },
];

/** Spell slots for a full caster by class level (index 0 = level 1); each entry lists slots per spell level. */
const FULL: number[][] = [
  [2],
  [3],
  [4, 2],
  [4, 3],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
];

export interface SlotRow {
  spellLevel: number;
  count: number;
  recharge: Recharge;
}

/** Spell slots for a class at a level: full casters, half casters (Paladin, Ranger) and Warlock Pact Magic. */
export function spellSlotsFor(cls: CasterClass, level: number): SlotRow[] {
  const lvl = Math.max(1, Math.min(20, level));
  if (cls === 'Warlock') {
    const count = lvl >= 17 ? 4 : lvl >= 11 ? 3 : lvl >= 2 ? 2 : 1;
    const slotLevel = Math.min(5, Math.ceil(lvl / 2));
    return [{ spellLevel: slotLevel, count, recharge: 'short' }];
  }
  const row = cls === 'Paladin' || cls === 'Ranger' ? FULL[Math.ceil(lvl / 2) - 1] : FULL[lvl - 1];
  return row.map((count, i) => ({ spellLevel: i + 1, count, recharge: 'long' as Recharge }));
}

/** Night watch: a Long Rest is split into 2-hour watches. */
export const WATCH_HOURS = 2;
