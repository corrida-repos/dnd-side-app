/**
 * Dangers of Squalid and Wretched living in a settlement (table rules, under the "Lifestyle risks in town" switch).
 * The 2024 PHB says lifestyles have no built-in consequences, but describes Squalid living as a vermin-infested
 * boarding house amid violence, disease and thieves, and Wretched living as having no home at all. The 2024 DMG names
 * rats as Sewer Plague carriers, tainted water as the source of Sight Rot and cheap tainted elixirs as a source of
 * Cackle Fever. Renown 3+ with a faction means shelter in need, which spares the Wretched all of this.
 */

/** Weekly chances, as "1 in N", rolled separately for each danger. */
export const WEEKLY_ODDS = {
  squalid: { theft: 6, spoiledFood: 6, ratBite: 6, vermin: 6, cackle: 12, shakedown: 6, fire: 100 },
  wretched: { theft: 6, roughedUp: 6, ratBite: 4, vermin: 6, cackle: 12, watch: 6, brokenNight: 3 },
} as const;

/** Spoiled cheap food: a raw-food save (Con DC 10) or Sick. */
export const SPOILED_FOOD_DC = 10;
/** A rat bite: 1 Piercing damage, and it counts toward Sewer Plague like a bout of water-borne illness. */
export const RAT_BITE_DAMAGE = 1;
/** Buying a potion while living Squalid or Wretched: a 1 in this many chance it's tainted (Cackle Fever, DC 10). */
export const TAINTED_POTION_ODDS = 6;
/** Gang shakedown: pay this much protection, or take the beating. */
export const SHAKEDOWN_GP = '1d6';
export const SHAKEDOWN_DAMAGE = '1d6';
/** A shakedown that turns into a beating makes an enemy on a 1 in this many. */
export const SHAKEDOWN_RIVAL_ODDS = 4;
/** Town watch: a fine, or a few days in jail. */
export const WATCH_FINE = '1d4';
export const WATCH_JAIL_DAYS = '1d3';
/** Tenement fire: 2d6 Fire damage, and a 1 in 2 chance of losing something left in the room. */
export const FIRE_DAMAGE = '2d6';
/** Days of Squalid or Wretched living in town before respectable folk start to shun the character. */
export const SHUNNED_AFTER_DAYS = 30;
/** Weekly Stress from sleeping on the street. */
export const WRETCHED_STRESS = 1;
/** Xanathar's: the Relaxation downtime activity needs at least a Modest lifestyle. */
export const RELAXATION_NEEDS = ['modest', 'comfortable', 'wealthy', 'aristocratic'];

export const isLowLife = (lifestyle: string): boolean => lifestyle === 'squalid' || lifestyle === 'wretched';
