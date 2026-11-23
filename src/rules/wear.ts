/**
 * Wear and repair (table rule). The 2024 books only say that objects can be damaged and that Mending fixes
 * a break or tear; they don't wear gear down over time. Here hard travel, rain and salt water add wear to the
 * gear that suffers from them, and enough wear leaves an item damaged. Keeping gear up (an hour of cleaning,
 * oiling and patching) clears the wear before it does harm.
 */
import { ITEM_PRICES } from './itemPrices';
import { CLOTH } from './tools';

export type Material = 'metal' | 'leather' | 'cloth' | 'wood';

/** Wear points before an item is damaged. */
export const WEAR_LIMIT = 3;
/** Hours of travel that count as one day's wear. */
export const WEAR_HOURS = 8;
/** An hour of upkeep clears a character's wear (fits in a Short Rest). */
export const MAINTAIN_MINUTES = 60;

const METAL = /\b(chain|plate|splint|ring mail|scale|breastplate|half plate|helm|gauntlets?|sword|axe|dagger|mace|hammer|flail|morningstar|pick|rapier|scimitar|sickle|spear|trident|halberd|glaive|pike|lance|maul|shield|crowbar|pot|pitons?|lantern|caltrops)\b/i;
const LEATHER = /\b(leather|studded|hide|boots|backpack|pack|saddle|waterskin|pouch|belt|quiver|whip|sling)\b/i;
const WOOD = /bows?\b|\b(staff|quarterstaff|club|greatclub|javelin|arrows?|bolts?|torch|pole|ladder|crossbow)\b/i;

/** What an item is mostly made of, or null if it doesn't wear (coins, gems, potions, food). */
export function materialOf(name: string): Material | null {
  if (/potion|ration|coin|gem|scroll|vial|flask|oil|food|meat|water$/i.test(name)) return null;
  if (CLOTH.test(name)) return 'cloth';
  if (/studded leather|leather armor|hide armor/i.test(name)) return 'leather';
  if (METAL.test(name)) return 'metal';
  if (LEATHER.test(name)) return 'leather';
  if (WOOD.test(name)) return 'wood';
  return null;
}

export const REPAIR_TOOL: Record<Material, { label: string; match: RegExp }> = {
  metal: { label: "Smith's Tools", match: /smith'?s tools/i },
  leather: { label: "Leatherworker's Tools", match: /leatherworker'?s tools/i },
  cloth: { label: "Weaver's Tools", match: /weaver'?s tools/i },
  wood: { label: "Woodcarver's Tools", match: /woodcarver'?s tools/i },
};

/** Repairing with the right tool: an ability check with the tool, DC 10, 1 hour (table rule). */
export const REPAIR_DC = 10;
export const REPAIR_MINUTES = 60;

/** A smith or other artisan in a settlement repairs an item for a tenth of its price (at least 1 SP), the same day. */
export const REPAIR_SHARE = 0.1;
export const MIN_REPAIR_GP = 0.1;

export function priceOfName(name: string): number | null {
  const n = name.toLowerCase();
  const hit = ITEM_PRICES.find((p) => p.name.toLowerCase() === n) ?? ITEM_PRICES.find((p) => n.includes(p.name.toLowerCase()));
  return hit ? hit.gp : null;
}

export function repairCost(name: string, valueGp?: number): number {
  const price = valueGp ?? priceOfName(name) ?? 1;
  return Math.max(MIN_REPAIR_GP, Math.round(price * REPAIR_SHARE * 100) / 100);
}

export interface WearCause {
  label: string;
  materials: Material[];
  /** Only gear that is worn or wielded (armor, clothes, boots), not packed away. */
  wornOnly?: boolean;
}

/** What wears gear on a day of travel, given the conditions (table rule). */
export function wearCauses(o: { terrain: string; precip: string; atSea: boolean }): WearCause[] {
  const out: WearCause[] = [];
  if (['arctic', 'desert', 'mountain', 'swamp', 'underdark'].includes(o.terrain)) out.push({ label: `hard going (${o.terrain})`, materials: ['leather', 'cloth', 'metal'], wornOnly: true });
  if (o.precip === 'heavy' || o.terrain === 'swamp') out.push({ label: o.terrain === 'swamp' ? 'swamp damp' : 'heavy rain or snow', materials: ['metal', 'leather'] });
  if (o.atSea) out.push({ label: 'salt spray', materials: ['metal'] });
  return out;
}

/** Wear cue for the item list. */
export function wearLabel(wear: number): string {
  if (wear <= 0) return 'sound';
  if (wear === 1) return 'scuffed';
  if (wear === 2) return 'worn';
  return 'failing';
}

// ---- vehicles

/** Points of hull wear before a vessel is damaged (table rule). */
export const HULL_LIMIT = 3;
/** A damaged vessel makes half speed until repaired at a dock or shipyard (table rule). */
export const DAMAGED_HULL_SPEED = 0.5;
/** Dock repair: 1% of the vessel's price and a day's work per point of wear (table rule). */
export const HULL_REPAIR_SHARE = 0.01;

export function hullRepair(name: string, wear: number): { gp: number; days: number } {
  const price = priceOfName(name) ?? 1000;
  const pts = Math.max(1, wear);
  return { gp: Math.round(price * HULL_REPAIR_SHARE * pts * 100) / 100, days: pts };
}
