import { fireThreat, precipKind, type Weather } from './weather';

/**
 * Campfires. The 2024 Player's Handbook says lighting a fire with a Tinderbox takes 1 minute and asks for no check,
 * and neither book says how much a fire warms a camp, so the roll, the warmth limit and the cooking time here are
 * table rules, each switchable or adjustable in Settings.
 */

export type FireMethod = 'tinderbox' | 'friction' | 'alchemist' | 'magnifier' | 'spell';

export const FIRE_METHODS: Record<FireMethod, { label: string; minutes: number; dcMod: number; note: string }> = {
  tinderbox: { label: 'Tinderbox', minutes: 1, dcMod: 0, note: 'Flint, fire steel and oiled tinder: 1 minute per try (PHB).' },
  friction: { label: 'No tinderbox (bow drill or flint and knife)', minutes: 10, dcMod: 5, note: 'Without a Tinderbox: 10 minutes per try and DC +5 (table rule).' },
  alchemist: { label: "Alchemist's Supplies", minutes: 1, dcMod: 5, note: "Alchemist's Supplies: start a fire with an Intelligence check, DC 15 (2024 PHB); proficiency adds your Proficiency Bonus." },
  magnifier: { label: 'Magnifying Glass', minutes: 5, dcMod: 0, note: 'A Magnifying Glass lights a fire in light as bright as sunlight, with tinder, in about 5 minutes (2024 PHB).' },
  spell: { label: 'A spell', minutes: 0, dcMod: 0, note: 'Prestidigitation (a small campfire), Druidcraft or Fire Bolt lights it at once, with no roll.' },
};

/** Spells that light a campfire outright. Produce Flame ignites nothing, and Elementalism only lights candles, torches and lamps. */
export const FIRE_SPELLS = ['Prestidigitation', 'Druidcraft', 'Fire Bolt'];

/** Base DC for getting a campfire going with dry fuel (table rule). */
export const FIRE_LIGHT_DC = 10;

export interface FireLighting {
  /** False when the weather makes it impossible: strong wind or heavy rain on an open fire pit. */
  possible: boolean;
  dc: number;
  /** What raised the DC, or why it can't be lit. */
  why: string[];
}

/** How hard it is to light a campfire right now with a Tinderbox (add the method's modifier for other methods). */
export function fireLighting(w: Weather, tempNow: number, sheltered: boolean, indoors: boolean): FireLighting {
  const threat = fireThreat(w, tempNow);
  if (threat && !sheltered && !indoors) return { possible: false, dc: 0, why: [`the ${threat} puts out open flames: shelter the fire pit first`] };
  const why: string[] = [];
  let dc = FIRE_LIGHT_DC;
  if (!indoors && w.precip !== 'none') {
    dc += 5;
    why.push(`${precipKind(tempNow) === 'snow' ? 'snow' : 'rain'} has dampened the fuel (+5)`);
  }
  if (!indoors && (w.wind === 'strong' || w.precip === 'heavy')) {
    dc += 5;
    why.push(`${w.wind === 'strong' ? 'strong wind' : 'heavy rain'} even in a sheltered pit (+5)`);
  }
  return { possible: true, dc, why };
}

/** Table rule: a campfire keeps the camp safe from extreme cold down to this temperature (°F). */
export const DEFAULT_FIRE_COLD_LIMIT_F = -20;
/** A windbreak and roof hold the heat in, so a sheltered pit protects to a lower temperature. */
export const SHELTERED_FIRE_BONUS_F = 10;

/** The coldest temperature at which the fire still protects the camp. */
export const fireColdLimit = (limitF: number, sheltered: boolean): number => limitF - (sheltered ? SHELTERED_FIRE_BONUS_F : 0);

/** Does a burning campfire keep people beside it safe from the cold at this temperature? */
export const fireKeepsWarm = (tempF: number, limitF: number, sheltered: boolean): boolean => tempF > fireColdLimit(limitF, sheltered);

/** Table rule: cooking a batch of raw food over the fire. */
export const COOK_RAW_MINUTES = 60;
