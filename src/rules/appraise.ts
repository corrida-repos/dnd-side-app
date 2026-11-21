import { GEM, APPRAISE_DC } from './shop';

/** What sort of valuable an item is, for working out who can appraise it. */
export type ValuableKind = 'gem' | 'jewelry' | 'art' | 'other';

export const JEWELRY = /\b(jewel(ry|lery)?|rings?|necklaces?|bracelets?|bangles?|brooch(es)?|circlets?|crowns?|tiaras?|pendants?|lockets?|earrings?|anklets?|torcs?|chains? of (gold|silver|platinum)|ingots?|bars? of (gold|silver|platinum)|(gold|silver|platinum|electrum) (bar|ingot|chain|cup|coin)s?)\b/i;
export const ART = /\b(art object|statuettes?|statues?|paintings?|portraits?|tapestr(y|ies)|idols?|chalices?|goblets?|carvings?|figurines?|masks?|vases?|urns?|busts?|icons?|reliefs?|rugs?|scrolls? of (art|calligraphy)|music box(es)?)\b/i;

export const valuableKind = (name: string): ValuableKind => (GEM.test(name) ? 'gem' : JEWELRY.test(name) ? 'jewelry' : ART.test(name) ? 'art' : 'other');

/** How someone tries to learn an item's value. */
export type AppraiseMethod = 'tools' | 'eye' | 'merchant' | 'dm';

export interface AppraiseSwitches {
  /** Table rule: Jeweler's Tools also cover jewelry and precious metals, and Intelligence (History) values art at DC 15. */
  appraiseCrafts: boolean;
  /** Table rule: anyone can try to judge a valuable's worth by eye, Intelligence (Investigation or History) at DC 20. */
  appraiseByEye: boolean;
}

/** Table rule: the DC for judging a valuable without the right tool or training. */
export const APPRAISE_EYE_DC = 20;

export interface AppraiseCheck {
  ok: boolean;
  dc: number;
  /** The check, e.g. "Intelligence check with Jeweler's Tools". */
  label: string;
  /** Whether the skill-and-tool Advantage rule can apply. */
  canAdvantage: boolean;
  /** Why it can't be done, when ok is false. */
  why?: string;
  tableRule: boolean;
}

/** Which check (and DC) a method calls for on this item, under the table's switches. */
export function appraiseCheck(name: string, method: 'tools' | 'eye', sw: AppraiseSwitches): AppraiseCheck {
  const kind = valuableKind(name);
  if (method === 'tools') {
    if (kind === 'gem') return { ok: true, dc: APPRAISE_DC, label: "Intelligence check with Jeweler's Tools", canAdvantage: true, tableRule: false };
    if (kind === 'jewelry' && sw.appraiseCrafts) return { ok: true, dc: APPRAISE_DC, label: "Intelligence check with Jeweler's Tools", canAdvantage: true, tableRule: true };
    return { ok: false, dc: APPRAISE_DC, label: "Jeweler's Tools", canAdvantage: false, tableRule: false, why: sw.appraiseCrafts ? "Jeweler's Tools judge gems, jewelry and precious metals" : "Jeweler's Tools discern a gem's value" };
  }
  if (kind === 'art' && sw.appraiseCrafts) return { ok: true, dc: APPRAISE_DC, label: 'Intelligence (History)', canAdvantage: true, tableRule: true };
  if (sw.appraiseByEye) return { ok: true, dc: APPRAISE_EYE_DC, label: 'Intelligence (Investigation or History), without tools', canAdvantage: false, tableRule: true };
  return { ok: false, dc: APPRAISE_EYE_DC, label: 'By eye', canAdvantage: false, tableRule: true, why: 'Judging value by eye is switched off (Settings)' };
}

/** DMG treasure values, gems and art objects, used to pick a misjudged estimate. */
export const GEM_TIERS = [10, 50, 100, 500, 1000, 5000];
export const ART_TIERS = [25, 250, 750, 2500, 7500];

/**
 * Optional table rule: an appraisal that fails by 5 or more gives a confident wrong value,
 * one treasure tier above or below the true one.
 */
export function misjudgedValue(trueGp: number, kind: ValuableKind, up: boolean): number {
  const tiers = kind === 'gem' || kind === 'jewelry' ? GEM_TIERS : ART_TIERS;
  const above = tiers.find((t) => t > trueGp);
  const below = [...tiers].reverse().find((t) => t < trueGp);
  return (up ? (above ?? below) : (below ?? above)) ?? trueGp;
}

/** Table rule: minutes a careful appraisal takes, when that switch is on. */
export const APPRAISE_MINUTES = 10;

/** Name test for Jeweler's Tools in an inventory. */
export const JEWELER_TOOLS = /jeweler'?s tools/i;
