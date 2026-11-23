/** Copying a spell into a Wizard's spellbook: 2 hours and 50 GP per spell level (PHB). */
export const SPELLBOOK_COPY = { hoursPerLevel: 2, gpPerLevel: 50 };
/** Replacing a lost spellbook: 1 hour and 10 GP per level for each spell you have prepared. */
export const SPELLBOOK_REPLACE = { hoursPerLevel: 1, gpPerLevel: 10 };

/** Spells that become permanent when cast in the same place every day for a stretch of days. */
export const RITUAL_PRESETS: { spell: string; days: number }[] = [
  { spell: 'Teleportation Circle', days: 365 },
  { spell: 'Guards and Wards', days: 365 },
  { spell: "Mordenkainen's Private Sanctum", days: 365 },
  { spell: 'Forbiddance', days: 30 },
];

/** How long after death each spell can still bring someone back, in minutes. */
export const RESURRECTION_SPELLS: { spell: string; limit: number; note: string }[] = [
  { spell: 'Revivify', limit: 1, note: 'Within 1 minute of death.' },
  { spell: 'Raise Dead', limit: 10 * 24 * 60, note: 'Dead no longer than 10 days.' },
  { spell: 'Reincarnate', limit: 10 * 24 * 60, note: 'Dead no longer than 10 days. A new body.' },
  { spell: 'Resurrection', limit: 100 * 365 * 24 * 60, note: 'Dead no longer than 100 years.' },
  { spell: 'True Resurrection', limit: 200 * 365 * 24 * 60, note: 'Dead no longer than 200 years.' },
];

/** Divinations that get unreliable when cast more than once before a Long Rest: 25% cumulative per extra casting. */
export const DIVINATION_SPELLS = ['Augury', 'Divination', 'Commune'];
export const divinationFailChance = (castsSoFar: number): number => Math.min(100, Math.max(0, castsSoFar) * 25);

/** Selûne's cycle in days. */
export const MOON_CYCLE = 30.4375;
const PHASES = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];

export function moonPhase(dayIndex: number, offset: number): { name: string; daysToFull: number; fraction: number } {
  const age = (((dayIndex + offset) % MOON_CYCLE) + MOON_CYCLE) % MOON_CYCLE;
  const fraction = age / MOON_CYCLE;
  const name = PHASES[Math.round(fraction * 8) % 8];
  const fullAt = MOON_CYCLE / 2;
  const daysToFull = Math.round((fullAt - age + MOON_CYCLE) % MOON_CYCLE);
  return { name, daysToFull, fraction };
}

/** Downtime activities. Times, costs and checks are suggestions to agree with your DM. */
export const ACTIVITY_PRESETS: { name: string; days: number; gp: number; check: string }[] = [
  { name: 'Carousing', days: 5, gp: 10, check: 'Charisma (Persuasion). 10 GP a week in lower-class company, 50 middle, 250 upper' },
  { name: 'Crime', days: 5, gp: 25, check: "Dexterity (Stealth), Dexterity with Thieves' Tools, and Intelligence (Investigation), Wisdom (Perception) or Charisma (Deception). 25 GP to gather information" },
  { name: 'Gambling', days: 5, gp: 10, check: 'Wisdom (Insight), Charisma (Deception) and Charisma (Intimidation)' },
  { name: 'Pit fighting', days: 5, gp: 0, check: 'Strength (Athletics), Dexterity (Acrobatics) and a Constitution check plus a roll of the largest Hit Die, each against 5 + 2d10' },
  { name: 'Relaxation', days: 5, gp: 0, check: 'No check' },
  { name: 'Religious service', days: 5, gp: 0, check: 'Intelligence (Religion) or Charisma (Persuasion)' },
  { name: 'Research', days: 5, gp: 50, check: 'An Intelligence check, +1 for every 50 GP spent beyond the first 50 (max +6), Advantage with a well-stocked library or sages. At least 50 GP' },
  { name: 'Training (tool or language)', days: 50, gp: 250, check: 'No check. Ten workweeks, minus the Intelligence modifier, at 25 GP a week' },
  { name: 'Special training (DMG reward)', days: 30, gp: 0, check: 'No check. A rare trainer offered as a reward (2024 DMG, Marks of Prestige): 30 days with the trainer for proficiency in a skill or a tool, or a language' },
  { name: 'Working a trade', days: 5, gp: 0, check: 'Strength (Athletics), Dexterity (Acrobatics), Intelligence with a set of tools, Charisma (Performance) or Charisma with a musical instrument' },
  { name: "Change subclass (Tasha's)", days: 6, gp: 300, check: "No check. Twice the new class level in days and 100 GP per level (Tasha's); returning to an old subclass takes half the time and costs nothing. A skill or fighting style can be swapped when you reach a level with an Ability Score Improvement." },
];
