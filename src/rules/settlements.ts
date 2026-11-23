/**
 * Settlements (2024 DMG, chapter 3): size, the Settlement Tables (Defining Traits, Claims to Fame, Current Calamities,
 * Local Leaders, Tavern Names, Random Shops) and Common Names for the people who run things.
 *
 * Table rule: which buildings a village, town or city has, and what each one lets the party do in this tracker.
 * The DMG only lists shop types; the rest (inns, temples, stables, docks, the watch and so on) are the places the
 * 2024 PHB and DMG rules assume exist when they say "in a settlement".
 */
import { die, type Rng } from './dice';
import type { Settlement } from './services';

/** 2024 DMG Settlements by Size. */
export const SETTLEMENT_SIZE: Record<Settlement, { label: string; population: string; maxGp: number }> = {
  village: { label: 'Village', population: 'up to 500', maxGp: 20 },
  town: { label: 'Town', population: '501–5,000', maxGp: 2000 },
  city: { label: 'City', population: '5,001 and more', maxGp: 200000 },
};

/** 2024 DMG Defining Traits (d20). */
export const DEFINING_TRAITS: [number, string][] = [
  [2, 'Fortified outer wall'],
  [4, 'Lots of gardens, parks, and greenery'],
  [6, 'Lots of mud, filth, and litter'],
  [8, 'Sprawling cemetery'],
  [10, 'Lingering fog'],
  [12, 'Noise and smoke from smithies and forges'],
  [13, 'Canals and bridges'],
  [14, 'Cliffs on one or more sides'],
  [16, 'Clean streets and well-maintained buildings'],
  [18, 'Ancient ruins within the settlement'],
  [20, 'Impressive structure (such as a keep, temple, circle of standing stones, or ziggurat)'],
];

/** 2024 DMG Claims to Fame (d20). */
export const CLAIMS_TO_FAME = [
  'Delicious food', 'Rude people', 'Friendly folk', 'Artists or writers', 'Great hero/savior', 'Flowers', 'Seasonal festival', 'Hauntings', 'Spellcasters', 'Decadence',
  'Piety', 'Gambling', 'Godlessness', 'Education', 'Wines', 'High fashion', 'Political intrigue', 'Powerful guilds', 'Patriotism', 'Ancient ruins',
];

/** 2024 DMG Current Calamities (d12). */
export const CALAMITIES = [
  'Monsters infest the settlement.',
  'A key figure died; murder is suspected.',
  'War brews between rival guilds or gangs.',
  'A plague or famine sparks riots.',
  'Monsters attack anyone who approaches or leaves the settlement.',
  'Trade disputes cause economic hardship.',
  'A natural disaster threatens the settlement.',
  'A prophecy of doom has residents on edge.',
  'Locals are being drafted to fight in a war.',
  'Political or religious strife threatens violence.',
  'The settlement is under siege.',
  'Scandal threatens powerful local families.',
];

/** 2024 DMG Local Leaders (d12). */
export const LEADERS = [
  'Respected, fair, and just leader or council',
  'Feared tyrant',
  'Coward manipulated by others',
  'Illegitimate leader causing civil unrest',
  'Powerful monster',
  'Mysterious, anonymous conspirators',
  'Contested leadership (with open fighting)',
  'Acrimonious council unable to make decisions',
  'Doltish lout',
  'Dying leader (with disputed succession)',
  'Iron-willed and respected leader or council',
  'Religious leader or council',
];

/** 2024 DMG Tavern Names (d20 + d20). */
export const TAVERN_FIRST = ['The Golden', 'The Silver', 'The Beardless', 'The Laughing', 'The Dancing', 'The Gilded', 'The Stumbling', 'The Wolf and', 'The Fallen', 'The Leering', 'The Drunken', 'The Wine and', 'The Roaring', 'The Frowning', 'The Barrel and', 'The Thirsty', 'The Wandering', 'The Barking', 'The Happy', 'The Witch and'];
export const TAVERN_SECOND = ['Lyre', 'Dolphin', 'Dwarf', 'Pegasus', 'Hut', 'Rose', 'Stag', 'Duck', 'Lamb', 'Demon', 'Goat', 'Spirit', 'Horde', 'Jester', 'Bucket', 'Crow', 'Satyr', 'Dog', 'Spider', 'Dragon'];

/** 2024 DMG Common Names (d12 given name, d12 surname). */
export const GIVEN_NAMES = ['Adrik', 'Alvyn', 'Aurora', 'Eldeth', 'Eldon', 'Farris', 'Kathra', 'Kellen', 'Lily', 'Nissa', 'Xinli', 'Zorra'];
export const SURNAMES = ['Brightsun', 'Dundragon', 'Frostbeard', 'Garrick', 'Goodbarrel', 'Greycastle', 'Ironfist', 'Jaerin', 'Merryweather', 'Redthorn', 'Stormriver', 'Wren'];

export type BuildingGroup = 'Food and lodging' | 'Faith and healing' | 'Shops' | 'Crafts' | 'Money' | 'Travel' | 'Learning and magic' | 'Law and government' | 'Entertainment' | 'Underworld';

/** Something sold only by a particular kind of shop, outside the PHB equipment list (costly components, potions). */
export interface Special {
  name: string;
  gp: number;
  note?: string;
}

/** An item from the PHB equipment list, as the shop sees it. */
export interface ShopItem {
  name: string;
  group: string;
  gp: number;
}

export interface BuildingType {
  id: string;
  label: string;
  group: BuildingGroup;
  /** How many by size: a whole number or range is a count; a fraction below 1 is the chance of having one. */
  per: Record<Settlement, number | [number, number]>;
  /** Only by a coast, lake or river. */
  water?: boolean;
  /** On the 2024 DMG Random Shops table. */
  dmgShop?: boolean;
  /** PHB equipment this place sells. */
  sells?: (i: ShopItem) => boolean;
  /** Extra things it sells, priced as listed; still limited by the settlement's most expensive item unless `beyondLimit`. */
  specials?: Special[];
  /** 2024 DMG: "a village that happens to have an alchemist, an herbalist, or a potion brewer might have potions for sale". */
  beyondLimit?: boolean;
  /** What the party can do here, in this tracker. */
  does: string;
  /** The tab where that happens. */
  tab?: string;
  /** How it's named: after its keeper (default), or as a public place named for its district. */
  naming?: 'place' | 'gate' | 'guild';
}

const named = (...names: string[]) => {
  const set = new Set(names.map((n) => n.toLowerCase()));
  return (i: ShopItem) => set.has(i.name.toLowerCase());
};
const anyOf =
  (...fns: ((i: ShopItem) => boolean)[]) =>
  (i: ShopItem) =>
    fns.some((f) => f(i));
const inGroup =
  (...groups: string[]) =>
  (i: ShopItem) =>
    groups.includes(i.group);
const SIMPLE_WEAPONS = named('Club', 'Dagger', 'Greatclub', 'Handaxe', 'Javelin', 'Light Hammer', 'Mace', 'Quarterstaff', 'Sickle', 'Spear', 'Dart', 'Sling', 'Shortbow', 'Light Crossbow');
const BOWS = named('Shortbow', 'Longbow', 'Light Crossbow', 'Heavy Crossbow', 'Hand Crossbow', 'Blowgun', 'Quiver', 'Crossbow Bolt Case', 'Arrows (20)', 'Arrow', 'Bolts (20)', 'Bolt', 'Needles (50)', 'Needle');
const FIREARMS = named('Pistol', 'Musket', 'Firearm Bullets (10)', 'Firearm Bullet');
const MUSIC = named('Bagpipes', 'Drum', 'Dulcimer', 'Flute', 'Horn', 'Lute', 'Lyre', 'Pan Flute', 'Shawm', 'Viol');
const GAMES = named('Dice Set', 'Dragonchess Set', 'Playing Cards', 'Three-Dragon Ante Set');
const FOOD = inGroup('Food');
const PACKS = named("Burglar's Pack", "Diplomat's Pack", "Dungeoneer's Pack", "Entertainer's Pack", "Explorer's Pack", "Priest's Pack", "Scholar's Pack");
const BASICS = named('Backpack', 'Bedroll', 'Blanket', 'Bucket', 'Candle', 'Flask', 'Jug', 'Pouch', 'Rations', 'Rope', 'Sack', 'Tinderbox', 'Torch', 'Waterskin', 'Oil', 'Lamp', 'Basket', 'Iron Pot', 'Pole', 'Shovel', 'Crowbar', 'Hammer', 'Iron Spikes', 'Iron Spike', 'String', 'Tent', 'Ladder', 'Barrel', 'Chest', "Traveler's Clothes", 'Signal Whistle', 'Hunting Trap', 'Bell', 'Grappling Hook', 'Chain', 'Net');

/**
 * Every kind of building a settlement can have that does something in this tracker.
 * Counts are a table rule; the DMG gives population ranges but no building counts.
 */
export const BUILDINGS: BuildingType[] = [
  // Food and lodging
  {
    id: 'inn', label: 'Inn', group: 'Food and lodging', per: { village: 1, town: [2, 3], city: [3, 5] },
    sells: anyOf(FOOD, named('Rations')),
    does: 'Rooms and meals by lifestyle (Inn Stay and Meal prices), stabling out back, ale and news. Carousing, hiring help and posting letters with a passing traveler start here.',
    tab: 'money',
  },
  {
    id: 'tavern', label: 'Tavern', group: 'Food and lodging', per: { village: 0.3, town: [1, 2], city: [2, 4] },
    sells: FOOD,
    does: 'Drink, meals and gossip but no rooms. Carousing (Downtime), hiring unskilled hirelings, and finding contacts.',
    tab: 'downtime',
  },
  { id: 'grocer', label: 'Grocer', group: 'Food and lodging', dmgShop: true, per: { village: 0, town: [1, 2], city: [1, 3] }, sells: anyOf(FOOD, named('Rations', 'Sack', 'Basket', 'Jug')), does: 'Rations and provisions to restock the camp stores before a journey.', tab: 'camp' },
  { id: 'baker', label: 'Baker', group: 'Food and lodging', dmgShop: true, per: { village: 0.6, town: 1, city: [1, 3] }, sells: named('Bread (loaf)', 'Rations'), does: 'Bread and hardtack rations for the road.', tab: 'camp' },
  { id: 'delicatessen', label: 'Delicatessen', group: 'Food and lodging', dmgShop: true, per: { village: 0, town: 0.4, city: [1, 2] }, sells: named('Cheese (wedge)', 'Fine Wine (bottle)', 'Common Wine (bottle)', 'Rations'), does: 'Cheese, cured meats and fine wine: rations that keep, and gifts for contacts.', tab: 'camp' },
  // Faith and healing
  {
    id: 'shrine', label: 'Shrine', group: 'Faith and healing', per: { village: 1, town: [1, 3], city: [2, 4] },
    sells: named('Holy Water', 'Amulet', 'Emblem', 'Reliquary', 'Sprig of Mistletoe', "Priest's Pack"),
    specials: [{ name: 'Incense', gp: 10, note: 'Find Familiar' }],
    does: 'Spellcasting services up to level 2 (2024 PHB), Religious Service downtime, holy symbols, tithes.',
    tab: 'money',
  },
  {
    id: 'temple', label: 'Temple', group: 'Faith and healing', per: { village: 0, town: 1, city: [2, 4] },
    sells: named('Holy Water', 'Amulet', 'Emblem', 'Reliquary', 'Sprig of Mistletoe', "Priest's Pack", 'Robe'),
    specials: [
      { name: 'Incense', gp: 10, note: 'Find Familiar' },
      { name: 'Incense (25 GP)', gp: 25, note: 'Divination' },
      { name: 'Marked Sticks (25 GP)', gp: 25, note: 'Augury' },
      { name: 'Incense (250 GP)', gp: 250, note: 'Legend Lore' },
    ],
    does: 'Spellcasting services by settlement size: Lesser Restoration, Remove Curse, Revivify and Raise Dead for contagions, curses and the dead. Religious Service downtime, tithes and sanctuary from the watch.',
    tab: 'money',
  },
  {
    id: 'cathedral', naming: 'place', label: 'Cathedral', group: 'Faith and healing', per: { village: 0, town: 0, city: 1 },
    specials: [{ name: 'Incense (1,000 GP)', gp: 1000, note: 'Hallow' }],
    does: 'High clergy: spells of levels 6 to 9 (Heal, Resurrection, True Resurrection) for those who can pay (2024 PHB: cities only).',
    tab: 'money',
  },
  {
    id: 'healer', label: 'Healer', group: 'Faith and healing', per: { village: 0.5, town: 1, city: [2, 3] },
    sells: named("Healer's Kit", 'Antitoxin', 'Herbalism Kit'),
    does: 'Tends lingering injuries and festering wounds (Medicine), sees the Sick through recuperating, sells Healer’s Kits.',
    tab: 'effects',
  },
  {
    id: 'apothecary', label: 'Apothecary', group: 'Faith and healing', dmgShop: true, beyondLimit: true, per: { village: 0.3, town: 1, city: [2, 3] },
    sells: named('Antitoxin', "Healer's Kit", 'Herbalism Kit', 'Vial', 'Glass Bottle', 'Perfume', 'Basic Poison'),
    specials: [{ name: 'Potion of Healing', gp: 50 }],
    does: 'Potions of Healing and Antitoxin, even in a village (2024 DMG). Poisons under the counter.',
    tab: 'money',
  },
  {
    id: 'herbalist', label: 'Herbalist', group: 'Faith and healing', beyondLimit: true, per: { village: 0.4, town: 0.6, city: 1 },
    sells: named('Herbalism Kit', 'Antitoxin', "Healer's Kit", 'Sprig of Mistletoe'),
    specials: [{ name: 'Potion of Healing', gp: 50 }],
    does: 'Herbs, Herbalism Kits and the odd Potion of Healing (2024 DMG). Buys harvested herbs and poisons.',
    tab: 'money',
  },
  { id: 'undertaker', label: 'Undertaker', group: 'Faith and healing', dmgShop: true, per: { village: 0, town: 1, city: [1, 3] }, sells: named('Chest'), does: 'Burials and grave plots, and keeps a body fresh for a resurrection (the clock on Raise Dead keeps running).', tab: 'world' },
  // Shops
  {
    id: 'general', label: 'General store', group: 'Shops', per: { village: 1, town: [1, 2], city: [2, 4] },
    sells: anyOf(BASICS, PACKS, named('Rations', 'Hunting Trap', 'Manacles', 'Mirror', 'Ball Bearings', 'Caltrops', 'Block and Tackle', 'Hooded Lantern', 'Bullseye Lantern', 'Lock', 'Quiver', 'Map or Scroll Case', 'Dice Set', 'Playing Cards', "Cook's Utensils")),
    does: 'Adventuring gear and packs, food and light: the everyday shopping list.',
    tab: 'money',
  },
  { id: 'market', naming: 'place', label: 'Market square', group: 'Shops', per: { village: 0, town: 1, city: [2, 3] }, sells: anyOf(FOOD, named('Rations', 'Basket', 'Sack', 'Mule', 'Pony', 'Draft Horse', 'Mastiff')), does: 'Food, livestock and trade goods; the Storehouse trades here, and market dues are paid here.', tab: 'money' },
  { id: 'pawnshop', label: 'Pawnshop', group: 'Shops', dmgShop: true, per: { village: 0, town: 0.6, city: [1, 2] }, sells: anyOf(BASICS, MUSIC, GAMES, SIMPLE_WEAPONS), does: 'Buys anything at half price, no questions about where it came from; secondhand gear.', tab: 'money' },
  { id: 'chandler', label: 'Chandler', group: 'Shops', dmgShop: true, per: { village: 0.3, town: 1, city: [1, 3] }, sells: named('Candle', 'Lamp', 'Oil', 'Torch', 'Hooded Lantern', 'Bullseye Lantern', 'Tinderbox', 'Rope', 'Soap'), specials: [{ name: 'Incense', gp: 10, note: 'Find Familiar' }], does: 'Candles, lamp oil, lanterns and torches: light that burns down on the Effects tab.', tab: 'effects' },
  { id: 'ropemaker', label: 'Ropemaker', group: 'Shops', dmgShop: true, per: { village: 0, town: 0.5, city: 1 }, sells: named('Rope', 'Net', 'String', 'Block and Tackle', 'Grappling Hook', "Climber's Kit"), does: 'Rope, nets and climbing gear.', tab: 'money' },
  { id: 'potter', label: 'Potter', group: 'Shops', dmgShop: true, per: { village: 0.3, town: 0.6, city: 1 }, sells: named('Jug', 'Flask', 'Iron Pot', "Potter's Tools", 'Vial'), does: 'Jugs, flasks and pots for water and cooking.', tab: 'money' },
  { id: 'tailor', label: 'Tailor', group: 'Shops', dmgShop: true, per: { village: 0, town: 1, city: [1, 2] }, sells: named('Fine Clothes', "Traveler's Clothes", 'Costume', 'Robe', 'Blanket', 'Bedroll', 'Pouch', "Weaver's Tools"), does: 'Fine clothes for court, costumes for a disguise, warm cloaks and blankets for cold nights.', tab: 'money' },
  { id: 'weaver', label: 'Weaver', group: 'Shops', dmgShop: true, per: { village: 0.4, town: 0.6, city: 1 }, sells: named('Blanket', 'Bedroll', 'Tent', 'Sack', 'Basket', "Weaver's Tools", 'String'), does: 'Blankets, bedrolls and tents: cover for cold nights and shelter from the weather.', tab: 'camp' },
  { id: 'jeweler', label: 'Jeweler', group: 'Shops', dmgShop: true, per: { village: 0, town: 0.6, city: [1, 2] },
    sells: named("Jeweler's Tools", 'Mirror', 'Perfume'),
    specials: [
      { name: 'Pearl (100 GP)', gp: 100, note: 'Identify' },
      { name: 'Jade dust (10 GP)', gp: 10, note: 'Magic Mouth' },
      { name: 'Gold dust (25 GP)', gp: 25, note: 'Arcane Lock' },
      { name: 'Diamond dust (25 GP)', gp: 25, note: 'Nondetection' },
      { name: 'Diamond (50 GP)', gp: 50, note: 'Chromatic Orb' },
      { name: 'Ruby dust (50 GP)', gp: 50, note: 'Continual Flame' },
      { name: 'Pair of platinum rings (100 GP)', gp: 100, note: 'Warding Bond' },
      { name: 'Diamond dust (100 GP)', gp: 100, note: 'Stoneskin, Greater Restoration' },
      { name: 'Diamond dust (200 GP)', gp: 200, note: 'Glyph of Warding' },
      { name: 'Diamond (300 GP)', gp: 300, note: 'Revivify' },
      { name: 'Diamond (500 GP)', gp: 500, note: 'Raise Dead' },
      { name: 'Diamond (1,000 GP)', gp: 1000, note: 'Resurrection, Clone' },
      { name: 'Jacinth (1,000 GP)', gp: 1000, note: 'Astral Projection' },
      { name: 'Ruby dust (1,000 GP)', gp: 1000, note: 'Forbiddance' },
      { name: 'Powdered ruby (1,500 GP)', gp: 1500, note: 'Simulacrum' },
    ],
    does: 'Appraises gems and art, buys them at full value, and sells the costly components spells consume.',
    tab: 'money',
  },
  { id: 'bookstore', label: 'Bookstore', group: 'Shops', dmgShop: true, per: { village: 0, town: 0.4, city: [1, 2] }, sells: named('Book', 'Paper', 'Parchment', 'Ink', 'Ink Pen', 'Map or Scroll Case', "Scholar's Pack", 'Magnifying Glass'), specials: [{ name: 'Spellbook (blank)', gp: 50 }], does: 'Books, paper and ink for spellbooks, scrolls and research.', tab: 'morning' },
  { id: 'mapmaker', label: 'Mapmaker', group: 'Shops', dmgShop: true, per: { village: 0, town: 0.4, city: 1 }, sells: named('Map', 'Map or Scroll Case', "Cartographer's Tools", "Navigator's Tools", 'Spyglass'), does: 'Maps of the region (a map helps on the navigation check of a journey stage) and navigation tools.', tab: 'travel' },
  { id: 'scribe', label: 'Scribe', group: 'Shops', dmgShop: true, per: { village: 0, town: 1, city: [1, 3] }, sells: named('Paper', 'Parchment', 'Ink', 'Ink Pen', "Calligrapher's Supplies", 'Map or Scroll Case'), does: 'Writes and reads letters for the unlettered, copies documents; paper and ink for Spell Scrolls.', tab: 'world' },
  { id: 'magic', label: 'Curio and magic shop', group: 'Learning and magic', per: { village: 0, town: 0.2, city: 1 }, sells: inGroup('Focus'), specials: [{ name: 'Rare chalks and inks (50 GP)', gp: 50, note: 'Teleportation Circle' }, { name: 'Mushroom powder (25 GP)', gp: 25, note: 'True Seeing' }, { name: 'Component Pouch', gp: 25 }], does: 'Spellcasting foci and components. Buying and selling magic items is a downtime deal: start it on the Downtime tab.', tab: 'downtime' },
  // Crafts
  {
    id: 'smithy', label: 'Smithy', group: 'Crafts', dmgShop: true, per: { village: 0.7, town: [1, 2], city: [2, 4] },
    sells: anyOf(SIMPLE_WEAPONS, named('Iron Pot', 'Iron Spikes', 'Iron Spike', 'Chain', 'Manacles', 'Shovel', 'Crowbar', 'Hammer', 'Lock', 'Ball Bearings', 'Caltrops', "Smith's Tools", 'Battleaxe', 'Warhammer', 'Shield', 'Sling Bullets (20)')),
    does: 'Repairs damaged gear for a tenth of its price, shoes horses, sells tools and simple weapons; rent the forge to craft.',
    tab: 'gear',
  },
  { id: 'armorer', label: 'Armorer', group: 'Crafts', dmgShop: true, per: { village: 0, town: 0.7, city: [1, 2] }, sells: inGroup('Armor'), does: 'All armor and shields, fitting, and armor repairs.', tab: 'money' },
  { id: 'weaponsmith', label: 'Weaponsmith', group: 'Crafts', per: { village: 0, town: 0.7, city: [1, 3] }, sells: anyOf(inGroup('Weapons'), named('Sling Bullets (20)')), does: 'Martial and simple weapons, and weapon repairs.', tab: 'money' },
  { id: 'bowyer', label: 'Bowyer and fletcher', group: 'Crafts', per: { village: 0.4, town: 1, city: [1, 2] }, sells: BOWS, does: 'Bows, crossbows and ammunition (ammunition tracking on the Gear tab).', tab: 'gear' },
  { id: 'gunsmith', label: 'Gunsmith', group: 'Crafts', per: { village: 0, town: 0, city: 0.2 }, sells: FIREARMS, does: 'Firearms and bullets, where the DM allows them (2024 DMG).', tab: 'money' },
  { id: 'leatherworker', label: 'Leatherworker and tanner', group: 'Crafts', per: { village: 0.4, town: 1, city: [1, 2] }, sells: named('Leather Armor', 'Studded Leather Armor', 'Hide Armor', 'Backpack', 'Waterskin', 'Pouch', 'Quiver', 'Riding Saddle', 'Military Saddle', 'Exotic Saddle', 'Whip', 'Sling', "Leatherworker's Tools", "Cobbler's Tools"), does: 'Leather armor, saddles, waterskins and packs; buys hides from hunting.', tab: 'money' },
  { id: 'carpenter', label: 'Carpenter', group: 'Crafts', dmgShop: true, per: { village: 0.6, town: 1, city: [2, 3] }, sells: named('Pole', 'Ladder', 'Chest', 'Barrel', 'Bucket', 'Wooden Staff', 'Quarterstaff', 'Club', "Carpenter's Tools", "Woodcarver's Tools", 'Portable Ram'), does: 'Wooden goods and repairs; builders for a Bastion.', tab: 'bastions' },
  { id: 'mason', label: 'Mason', group: 'Crafts', dmgShop: true, per: { village: 0, town: 0.6, city: [1, 2] }, sells: named("Mason's Tools"), does: 'Stoneworkers: Bastion construction and enlarging, and fortifications.', tab: 'bastions' },
  { id: 'cartwright', label: 'Cartwright', group: 'Crafts', per: { village: 0, town: 1, city: [1, 2] }, sells: named('Cart', 'Wagon', 'Carriage', 'Chariot', 'Sled'), does: 'Carts, wagons and carriages (vehicles on the Storage tab), and wheel repairs.', tab: 'storage' },
  { id: 'tinker', label: 'Tinker', group: 'Crafts', per: { village: 0.3, town: 0.6, city: 1 }, sells: named("Tinker's Tools", 'Lock', 'Manacles', 'Bell', 'Signal Whistle', 'Magnifying Glass', 'Ball Bearings', 'Hooded Lantern', 'Bullseye Lantern', "Glassblower's Tools", 'Mirror'), does: 'Locks, mechanisms and small repairs.', tab: 'gear' },
  { id: 'musician', label: 'Instrument maker', group: 'Crafts', per: { village: 0, town: 0.4, city: 1 }, sells: anyOf(MUSIC, GAMES, named("Entertainer's Pack", "Painter's Supplies")), does: 'Musical instruments and gaming sets.', tab: 'money' },
  { id: 'brewer', label: 'Brewery', group: 'Crafts', per: { village: 0.3, town: 0.6, city: [1, 2] }, sells: named('Ale (mug)', 'Common Wine (bottle)', "Brewer's Supplies", 'Barrel'), does: 'Ale and spirits by the barrel; a business to invest in.', tab: 'downtime' },
  { id: 'alchemist', label: 'Alchemist', group: 'Crafts', beyondLimit: true, per: { village: 0, town: 0.5, city: [1, 2] }, sells: named('Acid', "Alchemist's Fire", 'Antitoxin', 'Oil', 'Vial', 'Glass Bottle', "Alchemist's Supplies", "Poisoner's Kit", 'Perfume'), specials: [{ name: 'Potion of Healing', gp: 50 }], does: 'Acid, Alchemist’s Fire, Antitoxin and potions (2024 DMG); mixes and identifies potions.', tab: 'money' },
  // Money
  { id: 'moneylender', label: 'Moneylender', group: 'Money', dmgShop: true, per: { village: 0, town: 1, city: [1, 2] }, does: 'Loans at interest (Debts) and changing coins between denominations.', tab: 'money' },
  { id: 'bank', naming: 'place', label: 'Bank and vault', group: 'Money', per: { village: 0, town: 0.3, city: 1 }, does: 'A vault to store coin and valuables (Storage tab) and letters of credit between cities.', tab: 'storage' },
  { id: 'guildhall', naming: 'guild', label: 'Guildhall', group: 'Money', per: { village: 0, town: 1, city: [2, 3] }, does: 'Skilled hirelings, training in a tool or language (Downtime), guild dues, and starting or running a business.', tab: 'downtime' },
  // Travel
  { id: 'stable', label: 'Stable and livery', group: 'Travel', per: { village: 0.6, town: 1, city: [2, 3] }, sells: anyOf(inGroup('Mounts', 'Tack')), does: 'Mounts and tack for sale, stabling and feed for 5 SP and 5 CP a day.', tab: 'money' },
  { id: 'coaching', naming: 'place', label: 'Coaching house', group: 'Travel', per: { village: 0, town: 1, city: [1, 2] }, does: 'Coach rides between towns (3 CP a mile) and around the city (1 CP a mile).', tab: 'money' },
  { id: 'docks', naming: 'place', label: 'Docks', group: 'Travel', water: true, per: { village: 1, town: 1, city: [1, 2] }, sells: named('Rowboat', 'Keelboat', "Navigator's Tools", 'Rope', 'Net'), does: 'Ship’s passage (1 SP a mile), hull repairs, rowboats and keelboats.', tab: 'storage' },
  { id: 'shipwright', label: 'Shipwright', group: 'Travel', water: true, per: { village: 0, town: 0.4, city: 1 }, sells: named('Rowboat', 'Keelboat', 'Longship', 'Sailing Ship', 'Galley', 'Warship'), does: 'Builds and sells ships, and repairs hulls.', tab: 'storage' },
  { id: 'courier', naming: 'place', label: 'Courier post', group: 'Travel', per: { village: 0, town: 1, city: [1, 2] }, does: 'Hired messengers (2 CP a mile) and letters with replies; news arrives here first.', tab: 'world' },
  { id: 'gate', naming: 'gate', label: 'Town gate', group: 'Travel', per: { village: 0, town: 1, city: [2, 4] }, does: 'Gate tolls (1 CP), and the guards who might recognise a wanted face.', tab: 'money' },
  // Learning and magic
  { id: 'library', naming: 'place', label: 'Library', group: 'Learning and magic', per: { village: 0, town: 0.4, city: 1 }, does: 'Research downtime: lore about a topic, as a Bastion Library would give.', tab: 'downtime' },
  { id: 'academy', naming: 'place', label: 'Wizard’s academy', group: 'Learning and magic', per: { village: 0, town: 0, city: 0.6 }, specials: [{ name: 'Spellbook (blank)', gp: 50 }], does: 'Arcane spellcasting for hire (Identify, Sending, Remove Curse), identifying items, and wizards who trade spells to copy.', tab: 'morning' },
  // Law and government
  { id: 'hall', naming: 'place', label: 'Town hall', group: 'Law and government', per: { village: 0.5, town: 1, city: 1 }, does: 'Taxes and dues, land grants, titles and rights (Marks of Prestige), and the local leader’s court.', tab: 'world' },
  { id: 'watch', naming: 'place', label: 'Watch house and jail', group: 'Law and government', per: { village: 0, town: 1, city: [2, 3] }, does: 'The law: heat and bounties, fines, bribes, surrender and jail time (Notoriety).', tab: 'world' },
  { id: 'barracks', naming: 'place', label: 'Barracks', group: 'Law and government', per: { village: 0, town: 0.4, city: 1 }, does: 'Soldiers for hire as hirelings or Bastion Defenders, and a garrison against monsters.', tab: 'bastions' },
  // Entertainment
  { id: 'gambling', naming: 'place', label: 'Gambling hall', group: 'Entertainment', per: { village: 0, town: 0.6, city: [1, 3] }, sells: GAMES, does: 'Gambling downtime: win or lose gold, make a rival or two.', tab: 'downtime' },
  { id: 'arena', naming: 'place', label: 'Fighting pit', group: 'Entertainment', per: { village: 0, town: 0.4, city: 1 }, does: 'Pit Fighting downtime for prize money.', tab: 'downtime' },
  { id: 'theater', naming: 'place', label: 'Theater', group: 'Entertainment', per: { village: 0, town: 0.3, city: [1, 2] }, sells: named('Costume', 'Disguise Kit', "Entertainer's Pack", "Painter's Supplies"), does: 'Performing for pay (Working downtime) and costumes and Disguise Kits.', tab: 'downtime' },
  // Underworld
  { id: 'fence', label: 'Fence', group: 'Underworld', per: { village: 0, town: 0.5, city: 1 }, sells: named("Thieves' Tools", 'Forgery Kit', 'Disguise Kit', 'Basic Poison', "Poisoner's Kit", "Burglar's Pack", 'Caltrops', 'Ball Bearings'), does: 'Crime downtime, stolen goods sold without questions, poisons and Thieves’ Tools.', tab: 'downtime' },
  { id: 'thieves', naming: 'place', label: 'Thieves’ guild hideout', group: 'Underworld', per: { village: 0, town: 0.3, city: 1 }, does: 'Crime downtime with backing, and a contact who knows the streets.', tab: 'downtime' },
];

export const buildingType = (id: string): BuildingType | undefined => BUILDINGS.find((b) => b.id === id);

export interface TownBuilding {
  id: string;
  type: string;
  name: string;
  keeper: string;
}

export interface Town {
  name: string;
  size: Settlement;
  water: boolean;
  trait: string;
  fame: string;
  leader: string;
  calamity: string | null;
  buildings: TownBuilding[];
}

const pick = <T,>(list: T[], rng: Rng): T => list[die(list.length, rng) - 1];

export const rollTrait = (rng: Rng): string => {
  const r = die(20, rng);
  return DEFINING_TRAITS.find(([upTo]) => r <= upTo)![1];
};
export const rollFame = (rng: Rng): string => pick(CLAIMS_TO_FAME, rng);
export const rollLeader = (rng: Rng): string => pick(LEADERS, rng);
export const rollCalamity = (rng: Rng): string => pick(CALAMITIES, rng);
export const rollTavernName = (rng: Rng): string => {
  const first = pick(TAVERN_FIRST, rng);
  return `${first} ${pick(TAVERN_SECOND, rng)}`;
};
export const rollPersonName = (rng: Rng): string => `${pick(GIVEN_NAMES, rng)} ${pick(SURNAMES, rng)}`;

/** How many of one kind a settlement of this size gets. */
export function countFor(b: BuildingType, size: Settlement, water: boolean, rng: Rng): number {
  if (b.water && !water) return 0;
  const p = b.per[size];
  if (Array.isArray(p)) return p[0] + Math.floor(rng() * (p[1] - p[0] + 1));
  if (p >= 1) return p;
  return rng() < p ? 1 : 0;
}

const FAITHS = ['Dawn', 'Harvest', 'Forge', 'Sea', 'Moon', 'Hearth', 'Storm', 'Vigil', 'Open Hand', 'Silver Star', 'Green Field', 'Last Light'];
const DISTRICTS = ['Old Town', 'High Street', 'Temple Row', 'Market Ward', 'Riverside', 'North Ward', 'South Ward', 'Crafters’ Lane', 'Hilltop', 'the Narrows', 'the Warrens', 'Lantern Street'];
const GATES = ['North Gate', 'South Gate', 'East Gate', 'West Gate', 'King’s Gate', 'River Gate', 'Old Gate', 'Market Gate'];
const GUILDS = ['Merchants', 'Smiths', 'Masons', 'Weavers', 'Brewers', 'Scribes', 'Carpenters', 'Tanners', 'Jewelers', 'Shipwrights', 'Alchemists', 'Mapmakers'];

/**
 * Name for one building: taverns from the DMG Tavern Names table, temples for a domain, public places by their
 * label (with a district once there are several), and shops after the person who runs them.
 */
export function nameFor(b: BuildingType, keeper: string, rng: Rng, taken: Set<string>): string {
  const [given, surname] = [keeper.split(' ')[0], keeper.split(' ').slice(-1)[0]];
  const label = b.label.charAt(0).toLowerCase() + b.label.slice(1);
  const options = (): string[] => {
    if (b.id === 'inn' || b.id === 'tavern') return [rollTavernName(rng)];
    if (b.id === 'shrine' || b.id === 'temple') return [`${b.label} of the ${pick(FAITHS, rng)}`];
    if (b.naming === 'gate') return [pick(GATES, rng)];
    if (b.naming === 'guild') return [`Guildhall of the ${pick(GUILDS, rng)}`];
    if (b.naming === 'place') return [b.label, `${b.label}, ${pick(DISTRICTS, rng)}`];
    return [`${surname}’s ${label}`, `${given}’s ${label}`];
  };
  for (let tries = 0; tries < 16; tries++) for (const n of options()) if (!taken.has(n)) return n;
  for (const d of DISTRICTS) if (!taken.has(`${b.label}, ${d}`)) return `${b.label}, ${d}`;
  return `${b.label} ${taken.size + 1}`;
}

let seq = 0;
const bid = () => `b${Date.now().toString(36)}${(seq++).toString(36)}`;

/** One new building of a kind, named and with a keeper. */
export function newBuilding(type: string, rng: Rng, taken: Set<string>): TownBuilding {
  const b = buildingType(type)!;
  const keeper = rollPersonName(rng);
  const name = nameFor(b, keeper, rng, taken);
  taken.add(name);
  return { id: bid(), type, name, keeper };
}

/**
 * Rolls up a settlement with the 2024 DMG Settlement Tables and fills it with buildings (table rule counts).
 * A calamity is rolled 1 time in 3 (table rule: most places are getting on with life).
 */
export function generateTown(name: string, size: Settlement, water: boolean, rng: Rng): Town {
  const taken = new Set<string>();
  const buildings: TownBuilding[] = [];
  for (const b of BUILDINGS) {
    const n = countFor(b, size, water, rng);
    for (let i = 0; i < n; i++) buildings.push(newBuilding(b.id, rng, taken));
  }
  // The DMG Random Shops table: one more shop of a rolled kind in a town, two in a city.
  const extra = size === 'city' ? 2 : size === 'town' ? 1 : 0;
  const dmgShops = BUILDINGS.filter((b) => b.dmgShop);
  for (let i = 0; i < extra; i++) buildings.push(newBuilding(pick(dmgShops, rng).id, rng, taken));
  return {
    name,
    size,
    water,
    trait: rollTrait(rng),
    fame: rollFame(rng),
    leader: rollLeader(rng),
    calamity: rng() < 1 / 3 ? rollCalamity(rng) : null,
    buildings: sortBuildings(buildings),
  };
}

const GROUP_ORDER: BuildingGroup[] = ['Food and lodging', 'Faith and healing', 'Shops', 'Crafts', 'Money', 'Travel', 'Learning and magic', 'Law and government', 'Entertainment', 'Underworld'];

export function sortBuildings(list: TownBuilding[]): TownBuilding[] {
  const idx = (t: string) => BUILDINGS.findIndex((b) => b.id === t);
  const g = (t: string) => GROUP_ORDER.indexOf(buildingType(t)?.group ?? 'Shops');
  return [...list].sort((a, b) => g(a.type) - g(b.type) || idx(a.type) - idx(b.type) || a.name.localeCompare(b.name));
}

export const groupsOf = (town: Town): { group: BuildingGroup; buildings: TownBuilding[] }[] =>
  GROUP_ORDER.map((group) => ({ group, buildings: town.buildings.filter((b) => buildingType(b.type)?.group === group) })).filter((x) => x.buildings.length > 0);

export const hasBuilding = (town: Town, ...types: string[]): boolean => town.buildings.some((b) => types.includes(b.type));

/** The buildings in town that sell a PHB item. */
export const sellersOf = (town: Town, item: ShopItem): TownBuilding[] => town.buildings.filter((b) => buildingType(b.type)?.sells?.(item));

/**
 * Whether the town has an item for sale: some building sells it, and it costs no more than the settlement's
 * most expensive item (2024 DMG Settlements by Size).
 */
export function townSells(town: Town, item: ShopItem): { ok: boolean; why?: string; at: TownBuilding[] } {
  const at = sellersOf(town, item);
  if (!at.length) return { ok: false, why: 'No shop here sells it.', at };
  const max = SETTLEMENT_SIZE[town.size].maxGp;
  if (item.gp > max) return { ok: false, why: `Too costly for a ${town.size} (2024 DMG: up to ${max.toLocaleString()} GP).`, at };
  return { ok: true, at };
}

/** The specials each building in town sells, priced, and whether the settlement's limit allows them. */
export function townSpecials(town: Town): { building: TownBuilding; item: Special; ok: boolean }[] {
  const max = SETTLEMENT_SIZE[town.size].maxGp;
  const seen = new Set<string>();
  const out: { building: TownBuilding; item: Special; ok: boolean }[] = [];
  for (const b of town.buildings) {
    const t = buildingType(b.type);
    for (const item of t?.specials ?? []) {
      const key = item.name;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ building: b, item, ok: item.gp <= max || !!t?.beyondLimit });
    }
  }
  return out.sort((a, b) => a.item.gp - b.item.gp || a.item.name.localeCompare(b.item.name));
}

/** What the players notice arriving in a settlement. */
export function arrivalLine(town: Town): string {
  const parts = [`${SETTLEMENT_SIZE[town.size].label} of ${town.name}: ${town.trait.toLowerCase()}.`, `It's known for ${town.fame.toLowerCase()}.`];
  if (town.calamity) parts.push(`The talk in the streets: ${town.calamity.charAt(0).toLowerCase()}${town.calamity.slice(1)}`);
  return parts.join(' ');
}
