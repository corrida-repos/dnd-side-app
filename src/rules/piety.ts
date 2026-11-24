import type { Character } from '../state/types';

/**
 * Piety (table rule, behind the `piety` switch). The 2024 PHB and DMG leave a character's standing with their god
 * to roleplay: Clerics and Paladins draw on divine power, the Acolyte background starts in a temple's service,
 * and the DMG's renown (chapter 3) measures standing with a group. This table rule measures standing with a god
 * the same way, using renown's 1 / 3 / 10 / 25 / 50 steps (the DMG Level-Based Renown table).
 *
 * Piety rises when a character advances their god's ideals and falls when they work against them. Below 0 the god
 * has turned away until the character atones. Boons at each rank are suggestions for the DM; nothing here changes
 * class features, which work as the 2024 PHB says whatever the score.
 */

export type PietyRankId = 'estranged' | 'faithful' | 'devoted' | 'favored' | 'exalted' | 'chosen';

export interface PietyRank {
  id: PietyRankId;
  min: number;
  label: string;
  /** What the god's servants and the faithful do for them. */
  boon: string;
  /** What the character notices when they reach this rank (said to the player). */
  feel: string;
}

export const PIETY_RANKS: PietyRank[] = [
  {
    id: 'estranged',
    min: -Infinity,
    label: 'Estranged',
    boon: 'The god has turned away. Priests of the faith refuse their services, and the DM may rule that Divine Intervention and similar pleas go unanswered until the character atones.',
    feel: 'Prayers fall into silence. Holy places feel cold, the symbol at their throat is only metal, and the faithful look at them a moment too long.',
  },
  {
    id: 'faithful',
    min: 0,
    label: 'Faithful',
    boon: 'An ordinary believer: welcome at the god’s shrines and temples, with no special claim on them.',
    feel: 'Prayer is a familiar comfort, nothing more and nothing less.',
  },
  {
    id: 'devoted',
    min: 3,
    label: 'Devoted',
    boon: 'Known to the faith: the god’s temples and shrines give a night’s shelter and simple meals when asked, and their priests treat the character as one of their own.',
    feel: 'When they pray there is a warmth behind the words, like a hand on the shoulder. Strangers of the faith greet them as kin.',
  },
  {
    id: 'favored',
    min: 10,
    label: 'Favored',
    boon: 'The god’s priests cast spells for them at cost (only the components are paid) and offer counsel. Once between Long Rests the DM may let a dream, omen or sign answer a question about the god’s will.',
    feel: 'Small signs follow them: a bird of the god’s colour on the windowsill, a candle that will not gutter, a dream that lingers after waking.',
  },
  {
    id: 'exalted',
    min: 25,
    label: 'Exalted',
    boon: 'A champion of the faith: temples shelter them from secular law, lend acolytes or temple guards for a holy task, and open sealed archives. The DM may grant a Blessing (2024 DMG Supernatural Gifts).',
    feel: 'The god’s presence is never far. Their voice carries in holy places, and the devout bow without knowing why.',
  },
  {
    id: 'chosen',
    min: 50,
    label: 'Chosen',
    boon: 'The god’s chosen: the faith will spend what it has on their cause, and the DM may let the god act directly once, as a guaranteed Divine Intervention or a Charm (2024 DMG Supernatural Gifts).',
    feel: 'They are certain, past doubt, that the god watches through their eyes. Their shadow sometimes falls the wrong way, toward the nearest altar.',
  },
];

export function pietyRank(score: number): PietyRank {
  return [...PIETY_RANKS].reverse().find((r) => score >= r.min)!;
}

/** Deeds and their weight, after the DMG's renown awards. */
export type DeedKind = 'small' | 'deed' | 'great' | 'momentous' | 'lapse' | 'sin' | 'grave';

export const DEEDS: Record<DeedKind, { label: string; delta: number; examples: string }> = {
  small: { label: 'Small devotion', delta: 1, examples: 'honouring a holy day properly, guarding a shrine, converting a doubter' },
  deed: { label: 'A real service', delta: 2, examples: 'a task the temple set, defeating a servant of a rival god, raising a shrine' },
  great: { label: 'A great deed', delta: 3, examples: 'recovering a holy relic, saving a temple, a quest the god set in a vision' },
  momentous: { label: 'A momentous deed', delta: 4, examples: 'something sung of for generations in the god’s name' },
  lapse: { label: 'Neglect or a lapse', delta: -1, examples: 'skipping rites, mocking the faith, a small betrayal of the god’s ideals' },
  sin: { label: 'Acting against the god', delta: -2, examples: 'aiding the god’s enemies, desecrating a shrine, breaking a vow' },
  grave: { label: 'A grave sin', delta: -5, examples: 'betraying the faith outright, murdering a priest, serving a rival god' },
};

/** Religious Service downtime: each week spent in the god's temple adds this much (table rule). */
export const SERVICE_PIETY_PER_WEEK = 1;
/** Religious Service can raise piety this high and no higher; beyond it takes deeds. */
export const SERVICE_PIETY_CAP = 10;

/** A costly offering: at least this many GP per character level, and only once each this many days. */
export const OFFERING_GP_PER_LEVEL = 25;
export const OFFERING_EVERY_DAYS = 30;
/** Offerings can raise piety this high and no higher. */
export const OFFERING_PIETY_CAP = 3;

export const offeringGp = (level: number): number => OFFERING_GP_PER_LEVEL * Math.max(1, level);

/** With nothing done for the god for this many days, piety drifts down by 1 (never below 0). */
export const NEGLECT_DAYS = 60;

/** A missed tithe costs this much piety. */
export const MISSED_TITHE_PIETY = 1;

/** Atoning (a penance or quest the DM sets) brings an estranged character back to this score. */
export const ATONED_PIETY = 0;

// ---------------------------------------------------------------- who serves a god

const DIVINE_SUBCLASS = /divine soul|celestial|fiend/i;
const DIVINE_FEAT = /magic initiate \(cleric\)|blessed warrior|divinely favored/i;
const DIVINE_FEATURE = /acolyte|divine|channel divinity|blessed strikes|lay on hands/i;

export type DivineTie = 'cleric' | 'paladin' | 'patron' | 'acolyte' | 'other';

/** Why a character answers to a god, when the sheet says so. */
export function divineTie(c: Pick<Character, 'className' | 'subclass' | 'feats' | 'features' | 'notes'>): DivineTie | null {
  if (c.className === 'Cleric') return 'cleric';
  if (c.className === 'Paladin') return 'paladin';
  if ((c.className === 'Warlock' || c.className === 'Sorcerer') && DIVINE_SUBCLASS.test(c.subclass ?? '')) return 'patron';
  if ([...(c.features ?? []), c.notes ?? ''].some((f) => /acolyte/i.test(f))) return 'acolyte';
  if ((c.feats ?? []).some((f) => DIVINE_FEAT.test(f)) || (c.features ?? []).some((f) => DIVINE_FEATURE.test(f))) return 'other';
  return null;
}

export const TIE_LABEL: Record<DivineTie, string> = {
  cleric: 'Cleric',
  paladin: 'Paladin',
  patron: 'Otherworldly or divine patron',
  acolyte: 'Acolyte background',
  other: 'Divine magic (feat or feature)',
};

/** What estrangement means for each kind of servant (DM guidance; class features still work as written). */
export const TIE_STAKES: Record<DivineTie, string> = {
  cleric: 'A Cleric’s spells and Channel Divinity work as the PHB says, but an estranged Cleric’s temple may strip their rank, and the DM may rule that Divine Intervention fails until they atone.',
  paladin: 'A Paladin’s power comes from their oath, not a god, but a Paladin who serves a god and works against it is likely breaking that oath too: the DM may call for atonement or a new oath.',
  patron: 'A patron is not a god and may not care, but a celestial or fiendish patron notices: favours slow, and the DM may send an emissary to ask why.',
  acolyte: 'An acolyte lives by the temple’s goodwill: estranged, they lose its shelter and its contacts until they make amends.',
  other: 'Divine gifts keep working, but the faithful who taught them turn cold.',
};

/** Table rule: where a new devotion starts. Clerics, Paladins and acolytes are already known to the faith. */
export function startingPiety(tie: DivineTie | null): number {
  return tie === 'cleric' || tie === 'paladin' || tie === 'acolyte' ? 3 : 0;
}

/** How a Religious Service week or a costly offering adds piety, given the caps. */
export function cappedGain(score: number, gain: number, cap: number): number {
  return Math.max(0, Math.min(gain, cap - score));
}
