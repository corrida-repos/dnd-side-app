/**
 * Payoffs for cooking (table rules, always on). The 2024 PHB lets Cook's Utensils "improve food's flavor" (Wisdom, DC 10)
 * but gives no reward; here a good meal is worth the hour.
 */

/** How long a hot meal's warmth and strength last, in minutes. */
export const MEAL_BUFF_MINUTES = 8 * 60;

/** Any hot meal warms: Advantage on saves against these (extreme cold, and a cold night). */
export const WARM_SAVES = ['cold', 'chill'] as const;
/** A tasty meal or feast also fortifies: Advantage on these as well (a forced march). */
export const HEARTY_SAVES = ['march'] as const;

/** Stress each eater loses from a tasty meal, and from a feast. */
export const MEAL_STRESS_RELIEF = 2;
export const FEAST_STRESS_RELIEF = 3;
/** Fear each eater loses from a feast. */
export const FEAST_FEAR_RELIEF = 1;

/** Temporary HP from a tasty meal: the cook's Proficiency Bonus. */
export const tastyTempHp = (pb: number): number => Math.max(1, pb);

/** A feast: a natural 20, or beating the cook's DC by this much. */
export const FEAST_MARGIN = 5;

export const isFeast = (natural: number, total: number, dc: number): boolean => natural === 20 || total >= dc + FEAST_MARGIN;

/** Temporary HP from a feast: the cook's level plus Wisdom modifier, and never less than a tasty meal's. Temporary HP don't stack. */
export const feastTempHp = (level: number, wisMod: number, pb: number): number => Math.max(tastyTempHp(pb), level + wisMod);

/** Smoking and drying meat into trail Rations over a lit fire. */
export const CURE_MINUTES = 4 * 60;
/** Wisdom (Survival), or Wisdom with Cook's Utensils, to cure a batch evenly. */
export const CURE_DC = 10;
/** Pounds of meat for one day of Rations (2 lb) on a success; drying loses the water. A failure scorches or under-dries half the batch. */
export const CURE_LB_PER_RATION = 3;
/** Most meat one person can smoke in a batch: racks over one fire. */
export const CURE_MAX_LB = 30;

/** Days of Rations a batch makes. */
export function curedRations(lb: number, ok: boolean): number {
  const n = Math.floor(Math.min(lb, CURE_MAX_LB) / CURE_LB_PER_RATION);
  return ok ? n : Math.floor(n / 2);
}
