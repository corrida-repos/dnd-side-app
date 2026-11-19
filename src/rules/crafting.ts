export type Rarity = 'common' | 'uncommon' | 'rare' | 'veryRare' | 'legendary';

export const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  veryRare: 'Very Rare',
  legendary: 'Legendary',
};

/** Magic item crafting time and cost by rarity (DMG). Consumables (potions, scrolls, ammunition) take half. */
export const MAGIC_ITEM_CRAFTING: Record<Rarity, { days: number; gp: number }> = {
  common: { days: 5, gp: 50 },
  uncommon: { days: 10, gp: 200 },
  rare: { days: 50, gp: 2000 },
  veryRare: { days: 125, gp: 20000 },
  legendary: { days: 250, gp: 100000 },
};

/** Scribing a Spell Scroll (PHB): time and cost by spell level. */
export const SCROLL_CRAFTING: { level: number; days: number; gp: number }[] = [
  { level: 0, days: 1, gp: 15 },
  { level: 1, days: 1, gp: 25 },
  { level: 2, days: 3, gp: 100 },
  { level: 3, days: 5, gp: 150 },
  { level: 4, days: 10, gp: 1000 },
  { level: 5, days: 25, gp: 1500 },
  { level: 6, days: 40, gp: 10000 },
  { level: 7, days: 50, gp: 12500 },
  { level: 8, days: 60, gp: 15000 },
  { level: 9, days: 120, gp: 50000 },
];

export const POTION_OF_HEALING = { days: 1, gp: 25, tool: "Herbalist's Kit" };

/** Crafting a nonmagical item (PHB): raw materials cost half the price; one 8-hour day per 10 GP of price. */
export function nonmagicalCrafting(priceGp: number): { days: number; gp: number } {
  return { days: Math.max(1, Math.ceil(priceGp / 10)), gp: Math.round((priceGp / 2) * 100) / 100 };
}

export function magicItemCrafting(rarity: Rarity, consumable: boolean): { days: number; gp: number } {
  const base = MAGIC_ITEM_CRAFTING[rarity];
  return consumable ? { days: Math.max(1, Math.ceil(base.days / 2)), gp: base.gp / 2 } : base;
}

/** Calendar days needed when several crafters with the required proficiency share the work. */
export const calendarDays = (workDays: number, crafters: number): number => Math.ceil(workDays / Math.max(1, crafters));

export type ProjectKind = 'nonmagical' | 'scroll' | 'potion' | 'magic' | 'activity';

export const PROJECT_KIND_LABEL: Record<ProjectKind, string> = {
  nonmagical: 'Craft a nonmagical item',
  scroll: 'Scribe a Spell Scroll',
  potion: 'Brew Potions of Healing',
  magic: 'Craft a magic item',
  activity: 'Other downtime activity',
};

export const ACTIVITY_IDEAS = [
  'Research',
  'Training (tool or language)',
  'Carousing',
  'Working a trade',
  'Religious service',
  'Recuperating',
  'Gathering rumors',
  'Building a stronghold',
];
