import type { ClimateId } from './weather';

export type NavTerrain = 'road' | 'easy' | 'moderate' | 'hard';

/** Wisdom (Survival) DC to avoid getting lost, by terrain (DMG). Following a road, river or coast needs no check. */
export const NAV_DC: Record<NavTerrain, number | null> = { road: null, easy: 5, moderate: 10, hard: 15 };

export const NAV_LABEL: Record<NavTerrain, string> = {
  road: 'Road, river, trail or coast (no check)',
  easy: 'Grassland, meadow or farmland (DC 5)',
  moderate: 'Arctic, desert, hills, or sea under clear skies (DC 10)',
  hard: 'Forest, jungle, swamp, mountains, or sea under clouds (DC 15)',
};

/** A sensible starting guess from the climate. */
export const NAV_FOR_CLIMATE: Record<ClimateId, NavTerrain> = {
  arctic: 'moderate',
  subarctic: 'hard',
  temperate: 'hard',
  coastal: 'easy',
  grassland: 'easy',
  highland: 'moderate',
  desert: 'moderate',
  tropical: 'hard',
  swamp: 'hard',
  underdark: 'hard',
};

/** Table rule: heavy rain or snow, or travelling in darkness, makes navigating harder. */
export const POOR_VISIBILITY_DC = 5;

/** After getting lost, the navigator can try again after this many hours (1d6). */
export const LOST_RECHECK_DIE = 6;

export function navigationDC(terrain: NavTerrain, opts: { heavyPrecip: boolean; dark: boolean; poorVisibilityRule: boolean }): { dc: number | null; reasons: string[] } {
  const base = NAV_DC[terrain];
  if (base == null) return { dc: null, reasons: ['following a road, river or coast'] };
  let dc = base;
  const reasons = [`terrain DC ${base}`];
  if (opts.poorVisibilityRule && opts.heavyPrecip) {
    dc += POOR_VISIBILITY_DC;
    reasons.push(`+${POOR_VISIBILITY_DC} heavy precipitation`);
  }
  if (opts.poorVisibilityRule && opts.dark) {
    dc += POOR_VISIBILITY_DC;
    reasons.push(`+${POOR_VISIBILITY_DC} darkness`);
  }
  return { dc, reasons };
}
