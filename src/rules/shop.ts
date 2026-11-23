import { ITEM_PRICES } from './itemPrices';
import type { Settlement } from './services';

/** 2024 PHB "Selling Treasure": equipment fetches half its price; gems, jewelry, art and trade goods keep full value. Table rule: pelts, furs, hides, trophies, Rations, foraged goods and route maps count as trade goods. */
export const FULL_VALUE = /\b(gem|gems|diamond|ruby|pearl|emerald|sapphire|opal|jade|jewel|jewelry|jewellery|amethyst|garnet|topaz|onyx|jacinth|gemstones?|art object|statuette|painting|tapestry|idol|chalice|trade goods|ingot|bar of (gold|silver)|spices?|silk|pelts?|furs?|hides?|trophy|trophies|rations|honeycomb|mushrooms|herbs|fossils?|map of)\b/i;
export const saleRate = (name: string): number => (FULL_VALUE.test(name) ? 1 : 0.5);

/** Gemstones, whose value Jeweler's Tools can discern (2024 PHB). */
export const GEM = /\b(gem|gems|gemstones?|diamonds?|rub(y|ies)|pearls?|emeralds?|sapphires?|opals?|jade|amethysts?|garnets?|topaz|onyx|jacinths?|jewels?)\b/i;
/** 2024 PHB Jeweler's Tools: Discern a gem's value, Intelligence DC 15. */
export const APPRAISE_DC = 15;

interface Valued {
  name: string;
  valueGp?: number;
  valueHidden?: boolean;
  valueBelieved?: number;
  damaged?: boolean;
}

/**
 * The party doesn't know what one is worth: the DM hid its value, or it's a gem,
 * piece of jewelry or art object with no value recorded and no PHB price.
 */
export const valueUnknown = (i: Valued): boolean => (!!i.valueHidden && i.valueBelieved == null) || (!i.valueHidden && i.valueGp == null && FULL_VALUE.test(i.name) && priceOf(i.name) == null);

/** A misjudged appraisal: the party believes a wrong value (the true one is still hidden). */
export const misjudged = (i: Valued): boolean => !!i.valueHidden && i.valueBelieved != null;

/** Value of one as the party believes it; undefined while it's unknown. */
export const knownValue = (i: Valued): number | undefined => (misjudged(i) ? i.valueBelieved : valueUnknown(i) ? undefined : i.valueGp);

/** The true value isn't out in the open: unknown, or misjudged. */
export const valueSecret = (i: Valued): boolean => valueUnknown(i) || misjudged(i);

/** Two inventory lines can share a stack: same name, and no unknown value gets mixed with a different one. */
export const sameStack = (a: Valued, b: Valued): boolean =>
  a.name.toLowerCase() === b.name.toLowerCase() &&
  !!a.damaged === !!b.damaged &&
  valueSecret(a) === valueSecret(b) &&
  (valueSecret(a) ? (a.valueGp ?? null) === (b.valueGp ?? null) && (a.valueBelieved ?? null) === (b.valueBelieved ?? null) : a.valueGp == null || b.valueGp == null || a.valueGp === b.valueGp);

export const priceOf = (name: string): number | undefined => {
  const n = name.toLowerCase().replace(/\s*\(.*\)$/, '').trim();
  return ITEM_PRICES.find((p) => p.name.toLowerCase() === n)?.gp ?? ITEM_PRICES.find((p) => p.name.toLowerCase() === name.toLowerCase())?.gp;
};

/**
 * 2024 DMG Settlements by Size: the most expensive item a settlement is likely to have for sale.
 * Villages up to 20 GP, towns up to 2,000 GP, cities up to 200,000 GP.
 */
export const STOCK_LIMIT: Record<Settlement, number> = { village: 20, town: 2000, city: 200000 };
export const inStock = (gp: number, here: Settlement): boolean => gp <= STOCK_LIMIT[here];

/** Table rule: the DMG says renown 3+ might bring a discount on adventuring gear; 10% is used here. */
export const RENOWN_DISCOUNT = 0.1;
