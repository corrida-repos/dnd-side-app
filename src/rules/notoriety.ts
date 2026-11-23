/**
 * Notoriety with the law (table rule). The 2024 books leave crime and punishment to the DM. Here each
 * settlement or region keeps a heat score for the party: crimes raise it, time and bribes lower it, and while
 * the party is there the watch may recognise them, depending on how hot things are.
 */
export type HeatLevel = 'clear' | 'suspected' | 'wanted' | 'hunted';

export const HEAT_LEVELS: { level: HeatLevel; min: number; label: string; text: string }[] = [
  { level: 'clear', min: 0, label: 'Clear', text: 'Nobody is looking for them.' },
  { level: 'suspected', min: 1, label: 'Suspected', text: 'The watch knows their faces and keeps an eye on them.' },
  { level: 'wanted', min: 3, label: 'Wanted', text: 'Posters are up and the watch will arrest them on sight.' },
  { level: 'hunted', min: 6, label: 'Hunted', text: 'A price is on their heads: bounty hunters are looking too.' },
];

export function heatLevel(heat: number): (typeof HEAT_LEVELS)[number] {
  return [...HEAT_LEVELS].reverse().find((h) => heat >= h.min)!;
}

export type CrimeSeverity = 'minor' | 'serious' | 'grave';

export const CRIMES: Record<CrimeSeverity, { label: string; heat: number; bountyGp: number; examples: string }> = {
  minor: { label: 'Minor', heat: 1, bountyGp: 10, examples: 'pickpocketing, brawling, trespass, a small bribe gone wrong' },
  serious: { label: 'Serious', heat: 3, bountyGp: 50, examples: 'burglary, assaulting a guard, smuggling, fraud' },
  grave: { label: 'Grave', heat: 6, bountyGp: 500, examples: 'murder, treason, arson, freeing prisoners' },
};

/** Heat falls by this much each week with no new trouble, or twice as fast while the party is elsewhere. */
export const HEAT_DECAY_PER_WEEK = 1;

/** Bribing officials: this many GP per point of current heat removes one point (table rule). */
export const BRIBE_GP_PER_HEAT = 25;

/** Each day in the place, the chance (out of 20) the watch recognises them, by level. */
export const RECOGNISE_ON: Record<HeatLevel, number> = { clear: 0, suspected: 2, wanted: 5, hunted: 8 };

/** A disguise (Disguise Kit, Disguise Self, Alter Self) makes the watch roll twice and take the better for the party. */
export const DISGUISE_NOTE = 'Disguised (a Disguise Kit, Disguise Self or Alter Self): the recognition roll is made twice and the better result for the party counts.';

/** What being recognised leads to, by level. */
export const RECOGNISED: Record<Exclude<HeatLevel, 'clear'>, string> = {
  suspected: 'A watch patrol stops and questions them for an hour; no arrest, but word gets around (+1 heat if they get rough).',
  wanted: 'The watch tries to arrest them: surrender (jail for the bounty’s worth of days, or pay the bounty as a fine), talk their way out, or run (+1 heat).',
  hunted: 'Bounty hunters close in: a hostile encounter, set up on their terms.',
};

/** Jail for a wanted character who surrenders: a day per 10 GP of bounty, at least 1 (table rule). */
export const jailDaysFor = (bountyGp: number): number => Math.max(1, Math.round(bountyGp / 10));

export function samePlace(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase() && a.trim() !== '';
}
