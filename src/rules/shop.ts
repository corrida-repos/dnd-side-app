import { ITEM_PRICES } from './itemPrices';
import type { Settlement } from './services';

/** 2024 PHB "Selling Treasure": equipment fetches half its price; gems, jewelry, art and trade goods keep full value. */
export const FULL_VALUE = /\b(gem|gems|diamond|ruby|pearl|emerald|sapphire|opal|jade|jewel|jewelry|jewellery|amethyst|garnet|topaz|onyx|art object|statuette|painting|tapestry|idol|chalice|trade goods|ingot|bar of (gold|silver)|spices?|silk)\b/i;
export const saleRate = (name: string): number => (FULL_VALUE.test(name) ? 1 : 0.5);

export const priceOf = (name: string): number | undefined => {
  const n = name.toLowerCase().replace(/\s*\(.*\)$/, '').trim();
  return ITEM_PRICES.find((p) => p.name.toLowerCase() === n)?.gp ?? ITEM_PRICES.find((p) => p.name.toLowerCase() === name.toLowerCase())?.gp;
};

/**
 * Table rule: what a settlement stocks. The PHB lists prices but not availability.
 * Villages sell items up to 50 GP, towns up to 1,000 GP, cities anything; vehicles and ships need a town or city.
 */
export const STOCK_LIMIT: Record<Settlement, number> = { village: 50, town: 1000, city: Infinity };
export const inStock = (gp: number, here: Settlement): boolean => gp <= STOCK_LIMIT[here];

/** Table rule: the DMG says renown 3+ might bring a discount on adventuring gear; 10% is used here. */
export const RENOWN_DISCOUNT = 0.1;
