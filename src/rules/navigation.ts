
/** Kept so older saves load: the terrain table now sets the navigation DC. */
export type NavTerrain = 'road' | 'easy' | 'moderate' | 'hard';

/** Table rule: heavy rain or snow, or travelling in darkness, makes navigating harder. */
export const POOR_VISIBILITY_DC = 5;

/** After getting lost, the navigator can try again after this many hours (1d6). */
export const LOST_RECHECK_DIE = 6;

/** Navigation DC: the terrain's, plus the poor-visibility table rule. Null when following a road, river or landmark. */
export function navigationDC(base: number | null, opts: { heavyPrecip: boolean; dark: boolean; poorVisibilityRule: boolean }): { dc: number | null; reasons: string[] } {
  if (base == null) return { dc: null, reasons: ['following a road, river or landmark'] };
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
