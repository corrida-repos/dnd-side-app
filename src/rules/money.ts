import type { Size } from '../state/types';
import type { Rarity } from './crafting';

export type Lifestyle = 'wretched' | 'squalid' | 'poor' | 'modest' | 'comfortable' | 'wealthy' | 'aristocratic';

/** Lifestyle expenses per day in GP (PHB). Everything but Wretched includes food and lodging. */
export const LIFESTYLE_GP: Record<Lifestyle, number> = {
  wretched: 0,
  squalid: 0.1,
  poor: 0.2,
  modest: 1,
  comfortable: 2,
  wealthy: 4,
  aristocratic: 10,
};

export const LIFESTYLE_LABEL: Record<Lifestyle, string> = {
  wretched: 'Wretched',
  squalid: 'Squalid',
  poor: 'Poor',
  modest: 'Modest',
  comfortable: 'Comfortable',
  wealthy: 'Wealthy',
  aristocratic: 'Aristocratic',
};

/** Hirelings: wage per day in GP. */
export const HIRELING_WAGE = { skilled: 2, untrained: 0.2 };

/** Formats GP with SP/CP for small amounts. */
export function fmtGp(gp: number): string {
  const neg = gp < 0;
  const v = Math.abs(gp);
  if (v >= 1 || v === 0) return `${neg ? '−' : ''}${+v.toFixed(2)} GP`;
  if (v >= 0.1) return `${neg ? '−' : ''}${+(v * 10).toFixed(1)} SP`;
  return `${neg ? '−' : ''}${Math.round(v * 100)} CP`;
}

export interface MountPreset {
  name: string;
  size: Size;
  speed: number;
  gp: number;
}

export const MOUNT_PRESETS: MountPreset[] = [
  { name: 'Riding Horse', size: 'Large', speed: 60, gp: 75 },
  { name: 'Draft Horse', size: 'Large', speed: 40, gp: 50 },
  { name: 'Warhorse', size: 'Large', speed: 60, gp: 400 },
  { name: 'Pony', size: 'Medium', speed: 40, gp: 30 },
  { name: 'Mule', size: 'Medium', speed: 40, gp: 8 },
  { name: 'Camel', size: 'Large', speed: 50, gp: 50 },
  { name: 'Mastiff', size: 'Medium', speed: 40, gp: 25 },
  { name: 'Elephant', size: 'Huge', speed: 40, gp: 200 },
];

/** Animal feed per day of a mount's needs. */
export const FEED_GP_PER_DAY = 0.05;

/** Typical magic item value by rarity (DMG). Selling usually fetches half. */
export const MAGIC_ITEM_VALUE: Record<Rarity, number> = {
  common: 100,
  uncommon: 400,
  rare: 4000,
  veryRare: 40000,
  legendary: 200000,
};
