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

export const POTION_OF_HEALING = { days: 1, gp: 25, tool: 'Herbalism Kit' };

/** Crafting a nonmagical item (PHB): raw materials cost half the price, rounded down; one 8-hour day per 10 GP of price. */
export function nonmagicalCrafting(priceGp: number): { days: number; gp: number } {
  return { days: Math.max(1, Math.ceil(priceGp / 10)), gp: priceGp >= 2 ? Math.floor(priceGp / 2) : Math.round((priceGp / 2) * 100) / 100 };
}

export function magicItemCrafting(rarity: Rarity, consumable: boolean): { days: number; gp: number } {
  const base = MAGIC_ITEM_CRAFTING[rarity];
  return consumable ? { days: Math.max(1, Math.ceil(base.days / 2)), gp: base.gp / 2 } : base;
}

/** Calendar days needed when several crafters with the required proficiency share the work. */
export const calendarDays = (workDays: number, crafters: number, extraHelpers = true): number => Math.ceil(workDays / Math.max(1, extraHelpers ? crafters : Math.min(2, crafters)));

/** Table rule: writing is a one-person job. A scroll or a spellbook page has one hand on the pen, so helpers don't speed it up. */
export const SOLO_KINDS: ProjectKind[] = ['scroll', 'spellcopy'];
export const isSoloWork = (kind: ProjectKind): boolean => SOLO_KINDS.includes(kind);

export type ProjectKind = 'nonmagical' | 'scroll' | 'potion' | 'magic' | 'activity' | 'buyMagic' | 'sellMagic' | 'spellcopy';

export const PROJECT_KIND_LABEL: Record<ProjectKind, string> = {
  nonmagical: 'Craft a nonmagical item',
  scroll: 'Scribe a Spell Scroll',
  potion: 'Brew Potions of Healing',
  magic: 'Craft a magic item',
  activity: 'Other downtime activity',
  buyMagic: 'Buy a magic item',
  sellMagic: 'Sell a magic item',
  spellcopy: 'Copy a spell into a spellbook',
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

/** An item a tool can craft (2024 PHB tool Craft entries), with its price. Craft time comes from nonmagicalCrafting(). */
export interface GearItem {
  name: string;
  gp: number;
  /** Any one of these tools will do (e.g. a Holy Symbol from Jeweler's Tools or Painter's Supplies). */
  tools: string[];
  group: 'Armor' | 'Weapons' | 'Ammunition' | 'Gear' | 'Focus';
  /** The book doesn't name a tool; this one is the table default. */
  dmAssigned?: boolean;
}

export const ALCH = "Alchemist's Supplies";
export const BREW = "Brewer's Supplies";
export const CALL = "Calligrapher's Supplies";
export const CARP = "Carpenter's Tools";
export const CART = "Cartographer's Tools";
export const COBB = "Cobbler's Tools";
export const COOK = "Cook's Utensils";
export const DISG = 'Disguise Kit';
export const GLASS = "Glassblower's Tools";
export const HERB = 'Herbalism Kit';
export const JEW = "Jeweler's Tools";
export const LEATH = "Leatherworker's Tools";
export const MASON = "Mason's Tools";
export const PAINT = "Painter's Supplies";
export const POIS = "Poisoner's Kit";
export const POT = "Potter's Tools";
export const SMITH = "Smith's Tools";
export const TINK = "Tinker's Tools";
export const WEAV = "Weaver's Tools";
export const WOOD = "Woodcarver's Tools";

/** The tool (or tools) as one label, e.g. "Jeweler's Tools or Painter's Supplies". */
export const toolLabel = (g: GearItem): string => g.tools.join(' or ') + (g.dmAssigned ? ' (DM’s choice; no tool is named in the 2024 PHB)' : '');

/** Everything the 2024 PHB tools can craft. */
export const GEAR_CATALOG: GearItem[] = [
  { name: 'Shield', gp: 10, tools: [SMITH, WOOD], group: 'Armor', dmAssigned: true },
  { name: 'Breastplate', gp: 400, tools: [SMITH], group: 'Armor' },
  { name: 'Chain Mail', gp: 75, tools: [SMITH], group: 'Armor' },
  { name: 'Chain Shirt', gp: 50, tools: [SMITH], group: 'Armor' },
  { name: 'Half Plate Armor', gp: 750, tools: [SMITH], group: 'Armor' },
  { name: 'Hide Armor', gp: 10, tools: [LEATH], group: 'Armor' },
  { name: 'Leather Armor', gp: 10, tools: [LEATH], group: 'Armor' },
  { name: 'Padded Armor', gp: 5, tools: [WEAV], group: 'Armor' },
  { name: 'Plate Armor', gp: 1500, tools: [SMITH], group: 'Armor' },
  { name: 'Ring Mail', gp: 30, tools: [SMITH], group: 'Armor' },
  { name: 'Scale Mail', gp: 50, tools: [SMITH], group: 'Armor' },
  { name: 'Splint Armor', gp: 200, tools: [SMITH], group: 'Armor' },
  { name: 'Studded Leather Armor', gp: 45, tools: [LEATH], group: 'Armor' },
  { name: 'Battleaxe', gp: 10, tools: [SMITH], group: 'Weapons' },
  { name: 'Blowgun', gp: 10, tools: [WOOD], group: 'Weapons' },
  { name: 'Club', gp: 0.1, tools: [CARP, WOOD], group: 'Weapons' },
  { name: 'Dagger', gp: 2, tools: [SMITH], group: 'Weapons' },
  { name: 'Dart', gp: 0.05, tools: [WOOD], group: 'Weapons' },
  { name: 'Flail', gp: 10, tools: [SMITH], group: 'Weapons' },
  { name: 'Glaive', gp: 20, tools: [SMITH], group: 'Weapons' },
  { name: 'Greataxe', gp: 30, tools: [SMITH], group: 'Weapons' },
  { name: 'Greatclub', gp: 0.2, tools: [CARP, WOOD], group: 'Weapons' },
  { name: 'Greatsword', gp: 50, tools: [SMITH], group: 'Weapons' },
  { name: 'Halberd', gp: 20, tools: [SMITH], group: 'Weapons' },
  { name: 'Hand Crossbow', gp: 75, tools: [WOOD], group: 'Weapons' },
  { name: 'Handaxe', gp: 5, tools: [SMITH], group: 'Weapons' },
  { name: 'Heavy Crossbow', gp: 50, tools: [WOOD], group: 'Weapons' },
  { name: 'Javelin', gp: 0.5, tools: [SMITH], group: 'Weapons' },
  { name: 'Lance', gp: 10, tools: [SMITH], group: 'Weapons' },
  { name: 'Light Crossbow', gp: 25, tools: [WOOD], group: 'Weapons' },
  { name: 'Light Hammer', gp: 2, tools: [SMITH], group: 'Weapons' },
  { name: 'Longbow', gp: 50, tools: [WOOD], group: 'Weapons' },
  { name: 'Longsword', gp: 15, tools: [SMITH], group: 'Weapons' },
  { name: 'Mace', gp: 5, tools: [SMITH], group: 'Weapons' },
  { name: 'Maul', gp: 10, tools: [SMITH], group: 'Weapons' },
  { name: 'Morningstar', gp: 15, tools: [SMITH], group: 'Weapons' },
  { name: 'Musket', gp: 500, tools: [TINK], group: 'Weapons' },
  { name: 'Pike', gp: 5, tools: [SMITH], group: 'Weapons' },
  { name: 'Pistol', gp: 250, tools: [TINK], group: 'Weapons' },
  { name: 'Quarterstaff', gp: 0.2, tools: [CARP, WOOD], group: 'Weapons' },
  { name: 'Rapier', gp: 25, tools: [SMITH], group: 'Weapons' },
  { name: 'Scimitar', gp: 25, tools: [SMITH], group: 'Weapons' },
  { name: 'Shortbow', gp: 25, tools: [WOOD], group: 'Weapons' },
  { name: 'Shortsword', gp: 10, tools: [SMITH], group: 'Weapons' },
  { name: 'Sickle', gp: 1, tools: [SMITH], group: 'Weapons' },
  { name: 'Sling', gp: 0.1, tools: [LEATH], group: 'Weapons' },
  { name: 'Spear', gp: 1, tools: [SMITH], group: 'Weapons' },
  { name: 'Trident', gp: 5, tools: [SMITH], group: 'Weapons' },
  { name: 'War Pick', gp: 5, tools: [SMITH], group: 'Weapons' },
  { name: 'Warhammer', gp: 15, tools: [SMITH], group: 'Weapons' },
  { name: 'Whip', gp: 2, tools: [LEATH], group: 'Weapons' },
  { name: 'Arrows (20)', gp: 1, tools: [WOOD], group: 'Ammunition' },
  { name: 'Bolts (20)', gp: 1, tools: [WOOD], group: 'Ammunition' },
  { name: 'Firearm Bullets (10)', gp: 3, tools: [SMITH], group: 'Ammunition' },
  { name: 'Needles (50)', gp: 1, tools: [WOOD], group: 'Ammunition' },
  { name: 'Sling Bullets (20)', gp: 0.04, tools: [SMITH], group: 'Ammunition' },
  { name: 'Acid', gp: 25, tools: [ALCH], group: 'Gear' },
  { name: "Alchemist's Fire", gp: 50, tools: [ALCH], group: 'Gear' },
  { name: 'Antitoxin', gp: 50, tools: [BREW, HERB], group: 'Gear' },
  { name: 'Backpack', gp: 2, tools: [LEATH], group: 'Gear' },
  { name: 'Ball Bearings', gp: 1, tools: [SMITH], group: 'Gear' },
  { name: 'Barrel', gp: 2, tools: [CARP], group: 'Gear' },
  { name: 'Basic Poison', gp: 100, tools: [POIS], group: 'Gear' },
  { name: 'Basket', gp: 0.4, tools: [WEAV], group: 'Gear' },
  { name: 'Bedroll', gp: 1, tools: [WEAV], group: 'Gear' },
  { name: 'Bell', gp: 1, tools: [TINK], group: 'Gear' },
  { name: 'Blanket', gp: 0.5, tools: [WEAV], group: 'Gear' },
  { name: 'Block and Tackle', gp: 1, tools: [MASON], group: 'Gear' },
  { name: 'Bucket', gp: 0.05, tools: [SMITH], group: 'Gear' },
  { name: 'Bullseye Lantern', gp: 10, tools: [TINK], group: 'Gear' },
  { name: 'Caltrops', gp: 1, tools: [SMITH], group: 'Gear' },
  { name: 'Candle', gp: 0.01, tools: [HERB], group: 'Gear' },
  { name: 'Chain', gp: 5, tools: [SMITH], group: 'Gear' },
  { name: 'Chest', gp: 5, tools: [CARP], group: 'Gear' },
  { name: "Climber's Kit", gp: 25, tools: [COBB], group: 'Gear' },
  { name: 'Component Pouch', gp: 25, tools: [ALCH], group: 'Gear' },
  { name: 'Costume', gp: 5, tools: [DISG], group: 'Gear' },
  { name: 'Crossbow Bolt Case', gp: 1, tools: [LEATH], group: 'Gear' },
  { name: 'Crowbar', gp: 2, tools: [SMITH], group: 'Gear' },
  { name: 'Fine Clothes', gp: 15, tools: [WEAV], group: 'Gear' },
  { name: 'Flask', gp: 0.02, tools: [TINK], group: 'Gear' },
  { name: 'Glass Bottle', gp: 2, tools: [GLASS], group: 'Gear' },
  { name: 'Grappling Hook', gp: 2, tools: [SMITH], group: 'Gear' },
  { name: "Healer's Kit", gp: 5, tools: [HERB], group: 'Gear' },
  { name: 'Hooded Lantern', gp: 5, tools: [TINK], group: 'Gear' },
  { name: 'Hunting Trap', gp: 5, tools: [TINK], group: 'Gear' },
  { name: 'Ink', gp: 10, tools: [CALL], group: 'Gear' },
  { name: 'Ink Pen', gp: 0.02, tools: [WOOD], group: 'Gear' },
  { name: 'Iron Pot', gp: 2, tools: [SMITH], group: 'Gear' },
  { name: 'Iron Spikes', gp: 1, tools: [SMITH], group: 'Gear' },
  { name: 'Jug', gp: 0.02, tools: [POT], group: 'Gear' },
  { name: 'Ladder', gp: 0.1, tools: [CARP], group: 'Gear' },
  { name: 'Lamp', gp: 0.5, tools: [POT], group: 'Gear' },
  { name: 'Lock', gp: 10, tools: [TINK], group: 'Gear' },
  { name: 'Magnifying Glass', gp: 100, tools: [GLASS], group: 'Gear' },
  { name: 'Manacles', gp: 2, tools: [TINK], group: 'Gear' },
  { name: 'Map', gp: 1, tools: [CART], group: 'Gear' },
  { name: 'Map or Scroll Case', gp: 1, tools: [LEATH], group: 'Gear' },
  { name: 'Mirror', gp: 5, tools: [TINK], group: 'Gear' },
  { name: 'Net', gp: 1, tools: [WEAV], group: 'Gear' },
  { name: 'Oil', gp: 0.1, tools: [ALCH], group: 'Gear' },
  { name: 'Paper', gp: 0.2, tools: [ALCH], group: 'Gear' },
  { name: 'Parchment', gp: 0.1, tools: [LEATH], group: 'Gear' },
  { name: 'Perfume', gp: 5, tools: [ALCH], group: 'Gear' },
  { name: 'Pole', gp: 0.05, tools: [CARP], group: 'Gear' },
  { name: 'Portable Ram', gp: 4, tools: [CARP], group: 'Gear' },
  { name: 'Pouch', gp: 0.5, tools: [LEATH], group: 'Gear' },
  { name: 'Quiver', gp: 1, tools: [LEATH], group: 'Gear' },
  { name: 'Rations', gp: 0.5, tools: [COOK], group: 'Gear' },
  { name: 'Robe', gp: 1, tools: [WEAV], group: 'Gear' },
  { name: 'Rope', gp: 1, tools: [WEAV], group: 'Gear' },
  { name: 'Sack', gp: 0.01, tools: [WEAV], group: 'Gear' },
  { name: 'Shovel', gp: 2, tools: [TINK], group: 'Gear' },
  { name: 'Signal Whistle', gp: 0.05, tools: [TINK], group: 'Gear' },
  { name: 'Spyglass', gp: 1000, tools: [GLASS], group: 'Gear' },
  { name: 'String', gp: 0.1, tools: [WEAV], group: 'Gear' },
  { name: 'Tent', gp: 2, tools: [WEAV], group: 'Gear' },
  { name: 'Tinderbox', gp: 0.5, tools: [TINK], group: 'Gear' },
  { name: 'Torch', gp: 0.01, tools: [CARP], group: 'Gear' },
  { name: "Traveler's Clothes", gp: 2, tools: [WEAV], group: 'Gear' },
  { name: 'Vial', gp: 1, tools: [GLASS], group: 'Gear' },
  { name: 'Waterskin', gp: 0.2, tools: [LEATH], group: 'Gear' },
  { name: 'Amulet', gp: 5, tools: [JEW, PAINT], group: 'Focus' },
  { name: 'Crystal', gp: 10, tools: [JEW, WOOD], group: 'Focus' },
  { name: 'Emblem', gp: 5, tools: [JEW, PAINT], group: 'Focus' },
  { name: 'Orb', gp: 20, tools: [JEW, WOOD], group: 'Focus' },
  { name: 'Reliquary', gp: 5, tools: [JEW, PAINT], group: 'Focus' },
  { name: 'Rod', gp: 10, tools: [JEW, WOOD], group: 'Focus' },
  { name: 'Sprig of Mistletoe', gp: 1, tools: [PAINT, WOOD], group: 'Focus' },
  { name: 'Staff', gp: 5, tools: [JEW, WOOD], group: 'Focus' },
  { name: 'Wand', gp: 10, tools: [JEW, WOOD], group: 'Focus' },
  { name: 'Wooden Staff', gp: 5, tools: [PAINT, WOOD], group: 'Focus' },
  { name: 'Yew Wand', gp: 10, tools: [PAINT, WOOD], group: 'Focus' },
];

export const gearByName = (name: string): GearItem | undefined => GEAR_CATALOG.find((g) => g.name.toLowerCase() === name.trim().toLowerCase());

/** What a given tool can craft. */
export const craftableWith = (tool: string): GearItem[] => GEAR_CATALOG.filter((g) => g.tools.some((t) => t.toLowerCase() === tool.toLowerCase()));

/**
 * Table rule: a batch of cheap items counts as one item worth their total price, so a day's work at 10 GP of progress
 * makes, for example, 20 days of Rations. Read strictly, the 2024 PHB rounds each item up to a whole day.
 */
export function batchCrafting(priceGp: number, qty: number, batch: boolean): { days: number; gp: number } {
  const n = Math.max(1, Math.round(qty));
  if (batch) return nonmagicalCrafting(priceGp * n);
  const one = nonmagicalCrafting(priceGp);
  return { days: one.days * n, gp: Math.round(one.gp * n * 100) / 100 };
}
