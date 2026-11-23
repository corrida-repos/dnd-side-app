/**
 * Payoffs for cooking (table rules, always on). The 2024 PHB lets Cook's Utensils "improve food's flavor" (Wisdom, DC 10)
 * but gives no reward; here a good meal is worth the hour.
 */

/** A tasty hot meal (the cook's check succeeds): each eater loses this much Stress. */
export const MEAL_STRESS_RELIEF = 1;

/** A feast: a natural 20, or beating the cook's DC by this much. */
export const FEAST_MARGIN = 5;

export const isFeast = (natural: number, total: number, dc: number): boolean => natural === 20 || total >= dc + FEAST_MARGIN;

/** Temporary HP from a feast: the cook's Wisdom modifier plus Proficiency Bonus, at least 1. Doesn't stack with other Temporary HP. */
export const feastTempHp = (wisMod: number, pb: number): number => Math.max(1, wisMod + pb);

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
