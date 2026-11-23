import type { Lifestyle } from './money';
import { die, type Rng } from './dice';

/**
 * Marks of Prestige (2024 DMG, chapter 3, pages 80–81): rewards beyond treasure.
 *
 * The DMG gives real numbers for two of them: Fortifications (maintenance per day) and Training
 * (30 days with a trainer for a skill, a tool or a language). Parcels of Land, Special Rights and Titles
 * are described but have no mechanics, so the ones here are table rules behind the `prestigeRules` switch:
 * the grantor's trust, which obligations wear down and which reaches 0 when the mark is taken back.
 */
export type MarkKind = 'fortification' | 'land' | 'rights' | 'title';

export const MARK_LABEL: Record<MarkKind, string> = {
  fortification: 'Fortification',
  land: 'Parcel of land',
  rights: 'Special rights',
  title: 'Title',
};

// ---------------------------------------------------------------- fortifications (DMG)

export type FortType = 'outpost' | 'keep' | 'castle';

/** DMG Maintenance Costs table. */
export const FORT_UPKEEP: Record<FortType, { label: string; gpPerDay: number }> = {
  outpost: { label: 'Fortified outpost or watchtower', gpPerDay: 50 },
  keep: { label: 'Keep or small castle', gpPerDay: 100 },
  castle: { label: 'Large castle or fortress', gpPerDay: 400 },
};

/** Table rule: this many days with the upkeep unpaid (holders in debt) costs 1 trust. */
export const FORT_NEGLECT_DAYS = 30;

// ---------------------------------------------------------------- the grantor's trust (table rule)

/** The grantor's trust in the holder, from 3 (full) down to 0, when the mark is taken back. */
export const TRUST_MAX = 3;
export const TRUST_LABEL = ['Revoked', 'Doubted', 'Watched', 'Trusted'] as const;

/** Land and titles are checked once every 30 days from the day they were granted. */
export const MARK_MONTH = 30;

export const monthDue = (grantedDay: number, dayIndex: number): boolean => dayIndex > grantedDay && (dayIndex - grantedDay) % MARK_MONTH === 0;

// ---------------------------------------------------------------- parcels of land (table rule)

export type LandKind = 'wild' | 'farmland' | 'village';

export interface LandInfo {
  label: string;
  /** Income each month: count × d sides × mult GP (none for wild land). */
  income: [number, number, number] | null;
  note: string;
}

export const LAND: Record<LandKind, LandInfo> = {
  wild: { label: 'Wild land (forest, moor, hills)', income: null, note: 'No rents. Room to build: a Bastion or business here pays nothing for the land.' },
  farmland: { label: 'Farmland with a few tenant families', income: [2, 6, 5], note: 'Rents and a share of the harvest: 2d6 × 5 GP a month.' },
  village: { label: 'A village or settlement', income: [2, 6, 15], note: 'Rents, tolls and market dues: 2d6 × 15 GP a month. The villagers look to the holder for protection.' },
};

/** Table rule: on a 1 on a d6 at each monthly check, trouble comes to the land. */
export const LAND_TROUBLE_DIE = 6;

export const LAND_TROUBLES: string[] = [
  'Bandits have been robbing travellers on the land’s roads, and the people want them gone.',
  'Wolves (or worse) have been taking livestock, and tracks lead into the hills.',
  'A neighbouring holder claims the boundary stones were moved and threatens to take the matter to the ruler.',
  'Blight or a bad season has ruined the crops; the tenants beg for help to get through the winter.',
  'Poachers are stripping the woods of game, and the gamekeeper has gone missing.',
  'Strange lights and noises at an old ruin on the land frighten everyone into staying indoors after dark.',
];

export function rollLandIncome(kind: LandKind, rng: Rng): number {
  const inc = LAND[kind].income;
  if (!inc) return 0;
  let total = 0;
  for (let i = 0; i < inc[0]; i++) total += die(inc[1], rng);
  return total * inc[2];
}

export function rollLandTrouble(rng: Rng): string | null {
  if (die(LAND_TROUBLE_DIE, rng) !== 1) return null;
  return LAND_TROUBLES[die(LAND_TROUBLES.length, rng) - 1];
}

// ---------------------------------------------------------------- special rights

export type RightKind = 'lodging' | 'soldiers' | 'marque' | 'rites' | 'envoy' | 'other';

export const RIGHTS: Record<RightKind, { label: string; effect: string }> = {
  lodging: {
    label: 'Free room and board in a community',
    effect: 'In that settlement, downtime lifestyle and inn rooms and meals cost nothing up to Comfortable; above that, only the difference is paid (table rule cap).',
  },
  soldiers: {
    label: 'Sworn service of local soldiers',
    effect: 'The soldiers join as guards on the Party tab and draw no wages from the party. They leave when the right ends.',
  },
  marque: {
    label: 'Right to attack pirates or enemies of the crown',
    effect: 'Plunder taken from the crown’s enemies is lawful. Declare a prize: the crown takes 10% and the rest is shared among the holders (table rule share).',
  },
  rites: { label: 'Right to lead rites or ceremonies in a community', effect: 'No fixed rule: a recognised place in the community’s religious life.' },
  envoy: { label: 'Right to negotiate on the ruler’s behalf', effect: 'No fixed rule: the holders speak for the ruler, and what they agree binds the crown.' },
  other: { label: 'Other right', effect: 'Whatever the document says.' },
};

/** Table rule: free room and board covers lifestyles up to this one. */
export const LODGING_CAP: Lifestyle = 'comfortable';
/** Table rule: the crown's share of a lawful prize. */
export const PRIZE_CROWN_SHARE = 0.1;

/** Does a community named in a document match where the party is? */
export function sameCommunity(community: string, placeName: string): boolean {
  const a = community.trim().toLowerCase();
  const b = placeName.trim().toLowerCase();
  return !!a && !!b && (a === b || b.includes(a) || a.includes(b));
}

// ---------------------------------------------------------------- titles (table rule)

export type TitleRank = 'knight' | 'lord' | 'count' | 'duke' | 'fey';

export const TITLE_RANK: Record<TitleRank, { label: string; example: string; lifestyle: Lifestyle | null }> = {
  knight: { label: 'Knight or dame', example: 'Sir Aldric of the Silver Road', lifestyle: 'comfortable' },
  lord: { label: 'Lord, lady or baron', example: 'Baroness of Greywater', lifestyle: 'wealthy' },
  count: { label: 'Earl, count or countess', example: 'Earl of Stormriver', lifestyle: 'wealthy' },
  duke: { label: 'Duke or duchess', example: 'Duchess of Dun Fjord', lifestyle: 'aristocratic' },
  fey: { label: 'Whimsical archfey title', example: 'Grand Duke of Giggles', lifestyle: null },
};

const LIFESTYLE_ORDER: Lifestyle[] = ['wretched', 'squalid', 'poor', 'modest', 'comfortable', 'wealthy', 'aristocratic'];

export const lifestyleBelow = (have: Lifestyle, need: Lifestyle): boolean => LIFESTYLE_ORDER.indexOf(have) < LIFESTYLE_ORDER.indexOf(need);
export const lowerLifestyle = (a: Lifestyle, b: Lifestyle): Lifestyle => (lifestyleBelow(a, b) ? a : b);

// ---------------------------------------------------------------- training (DMG)

export type TrainingKind = 'skill' | 'tool' | 'language';
export const SPECIAL_TRAINING_DAYS = 30;
export const TRAINING_KIND_LABEL: Record<TrainingKind, string> = { skill: 'Skill proficiency', tool: 'Tool proficiency', language: 'Language' };

// ---------------------------------------------------------------- faction renown

/** DMG Level-Based Renown table: the renown a character's level stands for. */
export const LEVEL_RENOWN: [number, number][] = [
  [17, 50],
  [11, 25],
  [5, 10],
  [3, 3],
  [1, 1],
];

export function levelRenown(level: number): number {
  return LEVEL_RENOWN.find(([lvl]) => level >= lvl)?.[1] ?? 0;
}

/**
 * Table rule (optional, off by default): the renown a faction's members expect before it grants a title or a fortification.
 * The DMG suggests tying ranks and titles to renown thresholds but leaves the numbers to the DM.
 */
export const TITLE_RENOWN_MIN: Record<TitleRank, number> = { knight: 10, lord: 25, count: 25, duke: 50, fey: 0 };
export const FORT_RENOWN_MIN = 25;

export function renownMinimum(kind: MarkKind, rank?: TitleRank): number {
  if (kind === 'title') return TITLE_RENOWN_MIN[rank ?? 'knight'];
  if (kind === 'fortification') return FORT_RENOWN_MIN;
  return 0;
}
