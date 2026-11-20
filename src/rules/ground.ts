import type { Weather } from './weather';

/**
 * Table rule: snow and mud that build up over days. The 2024 DMG says deep snow or mud may be Difficult
 * Terrain but leaves the details to the DM.
 */
export const DEEP_SNOW_IN = 12;

/** Inches of new snow from a day's weather (heavy 6 in., light 2 in.) when it's cold enough to snow. */
export function snowfallInches(w: Weather): number {
  if (w.precip === 'none' || w.low > 32) return 0;
  return w.precip === 'heavy' ? 6 : 2;
}

/** Inches that melt in a day: about an inch for every 4°F the high is above freezing, faster in rain. */
export function meltInches(w: Weather): number {
  const warm = Math.max(0, (w.high - 32) / 4);
  const rain = w.precip !== 'none' && w.low > 32 ? (w.precip === 'heavy' ? 4 : 2) : 0;
  return Math.round(warm + rain);
}

/** Days of mud: heavy rain makes 2, light rain 1; a dry day dries one (two if it's hot). */
export function mudAfter(prevDays: number, w: Weather): number {
  if (w.precip !== 'none' && w.low > 32) return Math.max(prevDays, w.precip === 'heavy' ? 2 : 1);
  return Math.max(0, prevDays - (w.high >= 80 ? 2 : 1));
}

export interface Ground {
  snowIn: number;
  mudDays: number;
}

/** Why the ground slows travel, or null. Good roads shrug off mud but not deep snow. */
export function groundDifficulty(g: Ground | undefined, goodRoad: boolean): string | null {
  if (!g) return null;
  if (g.snowIn >= DEEP_SNOW_IN) return `${g.snowIn} inches of snow`;
  if (g.mudDays >= 2 && !goodRoad) return 'deep mud';
  return null;
}

export interface ObstaclePreset {
  name: string;
  check: string;
  dc: number;
  group: boolean;
  consequence: 'delay' | 'exhaustion' | 'damage' | 'condition';
  /** Hours of delay, Exhaustion dice, damage dice, or the condition and its duration in minutes (0: until removed by magic). */
  amount: string;
  condition?: string;
  minutes?: number;
  note: string;
}

/** Obstacles from the 2024 DMG "Journey Stage Challenges" examples, with DCs and consequences chosen as table rules. */
export const OBSTACLES: ObstaclePreset[] = [
  { name: 'Cliff or steep climb', check: 'Strength (Athletics)', dc: 15, group: true, consequence: 'delay', amount: '4', note: 'Failing means backtracking to find another way up.' },
  { name: 'Blizzard', check: 'Wisdom (Survival)', dc: 15, group: false, consequence: 'exhaustion', amount: '1d4', note: 'DMG example: marching through a blizzard instead of sheltering costs 1d4 Exhaustion levels.' },
  { name: 'Forest fire', check: 'Wisdom (Survival)', dc: 15, group: false, consequence: 'damage', amount: '4d10', note: 'Fire damage to each traveler who goes through rather than around (improvised damage, dangerous).' },
  { name: 'Fetid swamp', check: 'Constitution saving throw', dc: 12, group: true, consequence: 'condition', amount: '', condition: 'Poisoned', minutes: 0, note: 'DMG example: wading through imposes Poisoned until removed by magic.' },
  { name: 'Waterfall or rapids', check: 'Strength (Athletics)', dc: 15, group: true, consequence: 'damage', amount: '2d10', note: 'Bludgeoning damage from being swept over the falls (improvised damage, setback).' },
  { name: 'Flooded river', check: 'Strength (Athletics)', dc: 12, group: true, consequence: 'delay', amount: '24', note: 'Failing means a day spent finding a ford or waiting for the water to drop.' },
  { name: 'Rockslide or washed-out road', check: 'Intelligence (Investigation)', dc: 12, group: false, consequence: 'delay', amount: '8', note: 'Failing means hours clearing the way or detouring.' },
  { name: 'Sandstorm', check: 'Wisdom (Survival)', dc: 15, group: false, consequence: 'exhaustion', amount: '1', note: 'Pushing on through choking sand.' },
];
