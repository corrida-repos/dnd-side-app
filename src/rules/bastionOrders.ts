import type { FacilitySize, Order } from './bastion';

/**
 * Order options for every 2024 DMG special facility (chapter 8), and the Bastion event details.
 * Where the DMG leaves something to the DM, the choice made here is marked "Table rule".
 */

export type PlanInput = 'none' | 'item' | 'magic' | 'text' | 'choice' | 'gp' | 'number' | 'people';

export interface FacilityOption {
  id: string;
  order: Order;
  label: string;
  /** Owner level needed. */
  minLevel?: number;
  /** What the player fills in. */
  input: PlanInput;
  inputLabel?: string;
  choices?: string[];
  note: string;
}

const o = (id: string, order: Order, label: string, input: PlanInput, note: string, extra: Partial<FacilityOption> = {}): FacilityOption => ({ id, order, label, input, note, ...extra });

export const RARITIES_CRAFTABLE = ['Common', 'Uncommon', 'Common consumable', 'Uncommon consumable'];
export const GARDEN_TYPES = ['Decorative', 'Food', 'Herb', 'Poison'] as const;
export type GardenType = (typeof GARDEN_TYPES)[number];
export const GARDEN_PRODUCTS: Record<GardenType, { id: string; label: string; items: { name: string; qty: number; valueGp?: number }[] }[]> = {
  Decorative: [
    { id: 'bouquets', label: 'Ten floral bouquets (5 GP each)', items: [{ name: 'Floral bouquet', qty: 10, valueGp: 5 }] },
    { id: 'perfume', label: 'Ten vials of Perfume', items: [{ name: 'Perfume', qty: 10, valueGp: 5 }] },
    { id: 'candles', label: 'Ten Candles', items: [{ name: 'Candle', qty: 10, valueGp: 0.01 }] },
  ],
  Food: [{ id: 'rations', label: "100 days' worth of Rations", items: [{ name: 'Rations (1 day)', qty: 100, valueGp: 0.5 }] }],
  Herb: [
    { id: 'kits', label: "Ten Healer's Kits", items: [{ name: "Healer's Kit", qty: 10, valueGp: 5 }] },
    { id: 'potion', label: 'One Potion of Healing', items: [{ name: 'Potion of Healing', qty: 1, valueGp: 50 }] },
  ],
  Poison: [
    { id: 'antitoxin', label: 'Two vials of Antitoxin', items: [{ name: 'Antitoxin', qty: 2, valueGp: 50 }] },
    { id: 'basic', label: 'One vial of Basic Poison', items: [{ name: 'Poison: Basic Poison', qty: 1, valueGp: 100 }] },
  ],
};

export const MENAGERIE_CREATURES: { name: string; size: 'Small' | 'Medium' | 'Large'; gp: number }[] = [
  { name: 'Ape', size: 'Medium', gp: 500 },
  { name: 'Black Bear', size: 'Medium', gp: 500 },
  { name: 'Brown Bear', size: 'Large', gp: 1000 },
  { name: 'Constrictor Snake', size: 'Large', gp: 250 },
  { name: 'Crocodile', size: 'Large', gp: 500 },
  { name: 'Dire Wolf', size: 'Large', gp: 1000 },
  { name: 'Giant Vulture', size: 'Large', gp: 1000 },
  { name: 'Hyena', size: 'Medium', gp: 50 },
  { name: 'Jackal', size: 'Small', gp: 50 },
  { name: 'Lion', size: 'Large', gp: 1000 },
  { name: 'Owlbear', size: 'Large', gp: 3500 },
  { name: 'Panther', size: 'Medium', gp: 250 },
  { name: 'Tiger', size: 'Large', gp: 1000 },
];
/** Table rule: a Vast Menagerie holds four Large creatures; a Medium one takes half that room and a Small one a quarter. */
export const MENAGERIE_ROOM = 4;
export const CREATURE_ROOM = { Small: 0.25, Medium: 0.5, Large: 1 };

export const GUILDS = ["Adventurers' Guild", "Bakers' Guild", "Brewers' Guild", "Masons' Guild", "Shipbuilders' Guild", "Thieves' Guild"];
export const SHIPS: { name: string; gp: number; mph: number }[] = [
  { name: 'Rowboat', gp: 50, mph: 1.5 },
  { name: 'Keelboat', gp: 3000, mph: 1 },
  { name: 'Longship', gp: 10000, mph: 3 },
  { name: 'Sailing Ship', gp: 10000, mph: 2 },
  { name: 'Warship', gp: 25000, mph: 2.5 },
  { name: 'Galley', gp: 30000, mph: 4 },
  { name: 'Airship', gp: 40000, mph: 8 },
];
export const TRAINERS: { name: string; benefit: string }[] = [
  { name: 'Battle Expert', benefit: 'When you take damage from an Unarmed Strike or a weapon, a Reaction reduces it by 1d4.' },
  { name: 'Skills Expert', benefit: 'Proficiency in Acrobatics, Athletics, Performance, Sleight of Hand or Stealth (your choice).' },
  { name: 'Tools Expert', benefit: 'Proficiency with one tool of your choice.' },
  { name: 'Unarmed Combat Expert', benefit: 'Unarmed Strikes that hit deal an extra 1d4 Bludgeoning damage.' },
  { name: 'Weapon Expert', benefit: 'Proficiency with one kind of weapon, or its mastery property if already proficient.' },
];
export const PUB_SPECIALS = ["Bigby's Burden (enlarge, 24 h)", 'Kiss of the Spider Queen (Spider Climb, 24 h)', 'Moonlight Serenade (Darkvision 60 ft, 24 h)', 'Positive Reinforcement (Necrotic Resistance, 24 h)', 'Sterner Stuff (auto-succeed vs Frightened, 24 h)'];

/** Barrack room for Bastion Defenders by size. Table rule for Roomy: the DMG gives 25 for Vast; 12 for Roomy keeps the same density. */
export const BARRACK_ROOM: Partial<Record<FacilitySize, number>> = { roomy: 12, vast: 25 };

export const FACILITY_OPTIONS: Record<string, FacilityOption[]> = {
  'Arcane Study': [
    o('focus', 'Craft', 'Craft: Arcane Focus', 'none', '7 days, no cost. Waits in the Bastion until claimed.'),
    o('book', 'Craft', 'Craft: Book', 'none', 'A blank book. 7 days, 10 GP.'),
    o('magic', 'Craft', 'Craft: Magic Item (Arcana)', 'magic', 'Common or Uncommon item from the Arcana tables, with the DMG magic item crafting time and cost.', { minLevel: 9 }),
  ],
  Armory: [o('stock', 'Trade', 'Trade: Stock Armory', 'none', '100 GP plus 100 GP per Bastion Defender (halved with a Smithy). While stocked, defender-loss rolls use d8s instead of d6s; one event uses the stock up.')],
  Barrack: [o('recruit', 'Recruit', 'Recruit: Bastion Defenders', 'none', 'Up to four Bastion Defenders, free, while the Barrack has room (12 Roomy, table rule; 25 Vast).')],
  Demiplane: [o('resilience', 'Empower', 'Empower: Arcane Resilience', 'none', 'For 7 days, a Long Rest in the Demiplane grants Temporary Hit Points equal to five times your level.')],
  'Gaming Hall': [o('gamble', 'Trade', 'Trade: Gambling Hall', 'none', 'Runs for 7 days, then d100 for your share: 1d6, 2d6, 4d6 or 10d6 × 10 GP.')],
  Garden: [o('harvest', 'Harvest', 'Harvest: Garden Growth', 'none', 'Each garden yields its harvest after 7 days (set the garden types and products below).')],
  Greenhouse: [
    o('herbs', 'Harvest', 'Harvest: Healing Herbs', 'none', 'A Potion of Greater Healing. 7 days, no cost.'),
    o('poison', 'Harvest', 'Harvest: Poison', 'choice', 'One dose. 7 days, no cost.', { choices: ["Assassin's Blood", 'Malice', 'Pale Tincture', 'Truth Serum'], inputLabel: 'Poison' }),
  ],
  Guildhall: [o('assignment', 'Recruit', 'Recruit: Guild Assignment', 'text', 'The guild set below carries out its assignment.', { inputLabel: 'Details (target, wall squares, ship)' })],
  Laboratory: [
    o('alchemy', 'Craft', "Craft: Alchemist's Supplies", 'item', "Anything made with Alchemist's Supplies, by the PHB crafting rules (half price in materials, 10 GP of progress per workday)."),
    o('poison', 'Craft', 'Craft: Poison', 'choice', 'One dose for half its price. 7 days.', { choices: ['Burnt Othur Fumes', 'Essence of Ether', 'Torpor'], inputLabel: 'Poison' }),
  ],
  Library: [o('research', 'Research', 'Research: Topical Lore', 'text', 'Up to three accurate, previously unknown facts about the topic after 7 days. The DM supplies them.', { inputLabel: 'Topic' })],
  Archive: [o('lore', 'Research', 'Research: Helpful Lore', 'text', 'After 7 days the hireling knows what Legend Lore would reveal.', { inputLabel: 'Topic' })],
  'Meditation Chamber': [o('peace', 'Empower', 'Empower: Inner Peace', 'none', 'The next Bastion event is rolled twice and the better result kept.')],
  Menagerie: [o('creature', 'Recruit', 'Recruit: Creature', 'choice', 'A creature from the table, paid up front; it counts as a Bastion Defender.', { choices: MENAGERIE_CREATURES.map((c) => `${c.name} (${c.size}, ${c.gp} GP)`), inputLabel: 'Creature' })],
  Observatory: [o('discovery', 'Empower', 'Empower: Eldritch Discovery', 'none', 'Seven nights of stargazing, then a die: odd grants a Charm of Darkvision, Heroism or Vitality.')],
  Pub: [o('spies', 'Research', 'Research: Information Gathering', 'text', 'For 7 days spies report events within 10 miles and can locate a familiar creature within 50 miles, with where it has been for 7 days.', { inputLabel: 'Creature to find (optional)' })],
  Reliquary: [o('talisman', 'Harvest', 'Harvest: Talisman', 'none', 'Replaces one spell’s Material components worth up to 1,000 GP (not consumed). Return it to the Reliquary to recharge.')],
  Sacristy: [
    o('holy', 'Craft', 'Craft: Holy Water', 'gp', 'A flask in 7 days. Each 100 GP spent (up to 500) adds 1d8 damage.', { inputLabel: 'Extra GP (0–500)' }),
    o('relic', 'Craft', 'Craft: Magic Item (Relic)', 'magic', 'Common or Uncommon item from the Relics tables, with the DMG crafting time and cost.'),
  ],
  Sanctuary: [o('focus', 'Craft', 'Craft: Sacred Focus', 'choice', '7 days, no cost.', { choices: ['Druidic Focus (wooden staff)', 'Holy Symbol'], inputLabel: 'Focus' })],
  Sanctum: [o('rites', 'Empower', 'Empower: Fortifying Rites', 'people', 'For 7 days, the named character gains Temporary HP equal to your level after each Long Rest, wherever they are.', { inputLabel: 'Beneficiary' })],
  Scriptorium: [
    o('replica', 'Craft', 'Craft: Book Replica', 'text', 'Copies a nonmagical book onto a blank book from the Bastion’s stores. 7 days.', { inputLabel: 'Book' }),
    o('scroll', 'Craft', 'Craft: Spell Scroll', 'text', 'A Cleric or Wizard spell of level 3 or lower, at the PHB scribing time and cost. Write "Spell name, level".', { inputLabel: 'Spell, level' }),
    o('paperwork', 'Craft', 'Craft: Paperwork', 'number', 'Up to fifty copies at 1 GP each, distributed within 50 miles. 7 days.', { inputLabel: 'Copies' }),
  ],
  Smithy: [
    o('gear', 'Craft', "Craft: Smith's Tools", 'item', "Anything made with Smith's Tools, by the PHB crafting rules. The two hirelings share the work."),
    o('magic', 'Craft', 'Craft: Magic Item (Armament)', 'magic', 'Common or Uncommon item from the Armaments tables.', { minLevel: 9 }),
  ],
  Stable: [
    o('buy', 'Trade', 'Trade: Buy animals', 'gp', 'Buys mounts at normal cost; they live in the Stable. 7 days.', { inputLabel: 'Total price (GP)' }),
    o('sell', 'Trade', 'Trade: Sell animals', 'gp', 'Sells mounts for 20% over the standard price (50% at level 13, 100% at 17). 7 days.', { inputLabel: 'Standard price (GP)' }),
  ],
  Storehouse: [
    o('buy', 'Trade', 'Trade: Procure goods', 'gp', 'Nonmagical goods worth up to 500 GP (2,000 at level 9, 5,000 at 13), stored here. 7 days.', { inputLabel: 'Value (GP)' }),
    o('sell', 'Trade', 'Trade: Sell goods', 'gp', 'Sells stored goods for 10% over value (20% at level 9, 50% at 13, 100% at 17). 7 days.', { inputLabel: 'Value to sell (GP)' }),
  ],
  'Teleportation Circle': [o('invite', 'Recruit', 'Recruit: Spellcaster', 'none', 'A die: even means a Friendly spellcaster arrives and stays 14 days, casting one Wizard spell of level 4 or lower (8 at level 17) for you.')],
  Theater: [o('production', 'Empower', 'Empower: Theatrical Event', 'people', '14 days of rehearsal, then each contributor makes a DC 15 Charisma (Performance) check. More successes than failures: every contributor gains a Theater die.', { inputLabel: 'Contributors and Performance bonus' })],
  'Training Area': [o('training', 'Empower', 'Empower: Training', 'people', 'Characters who train 8 hours a day for 7 days gain the trainer’s benefit for 7 days.', { inputLabel: 'Trainees' })],
  'Trophy Room': [
    o('lore', 'Research', 'Research: Lore', 'text', 'Up to three accurate facts about a legend, creature or famous object. 7 days.', { inputLabel: 'Topic' }),
    o('trinket', 'Research', 'Research: Trinket Trophy', 'none', 'A die: even finds a Common magic item from the Implements table.'),
  ],
  'War Room': [
    o('lieutenant', 'Recruit', 'Recruit: Lieutenant', 'none', 'One new lieutenant (up to ten).'),
    o('soldiers', 'Recruit', 'Recruit: Soldiers', 'choice', 'Each lieutenant musters 100 Guards (or 20 mounted) in 7 days. Feeding costs 1 GP per guard and horse per day; unfed for a day, the army disbands.', { choices: ['On foot', 'Mounted'], inputLabel: 'Troops' }),
  ],
  Workshop: [
    o('gear', 'Craft', 'Craft: Adventuring Gear', 'item', 'Anything made with the Workshop’s tools, by the PHB crafting rules. The hirelings share the work.'),
    o('magic', 'Craft', 'Craft: Magic Item (Implement)', 'magic', 'Common or Uncommon item from the Implements tables.', { minLevel: 9 }),
  ],
};

/** Charms granted by a Long Rest in the Bastion (each lasts 7 days or until used, and can't stack). */
export const BASTION_CHARMS: Record<string, string> = {
  'Arcane Study': 'Arcane Study Charm: cast Identify without a slot or Material components',
  Observatory: 'Observatory Charm: cast Contact Other Plane without a slot',
  Reliquary: 'Reliquary Charm: cast Greater Restoration without a slot or Material components',
  Sanctuary: 'Sanctuary Charm: cast Healing Word without a slot',
  Sanctum: 'Sanctum Charm: cast Heal without a slot',
};

/** Facility hirelings by size (DMG). */
export function facilityHirelings(name: string, size: FacilitySize): number {
  const table: Record<string, number | Partial<Record<FacilitySize, number>>> = {
    'Gaming Hall': 4, Garden: { roomy: 1, vast: 2 }, Pub: { roomy: 1, vast: 4 }, Sanctum: 4, Smithy: 2, Theater: 4, 'Training Area': 4, 'War Room': 2, Menagerie: 2, Workshop: { roomy: 3, vast: 5 },
  };
  const v = table[name];
  if (v == null) return 1;
  return typeof v === 'number' ? v : (v[size] ?? 1);
}

/** Profit when the Stable or Storehouse sells, by owner level. */
export const stableMarkup = (level: number): number => (level >= 17 ? 1 : level >= 13 ? 0.5 : 0.2);
export const storehouseMarkup = (level: number): number => (level >= 17 ? 1 : level >= 13 ? 0.5 : level >= 9 ? 0.2 : 0.1);
export const storehouseLimit = (level: number): number => (level >= 13 ? 5000 : level >= 9 ? 2000 : 500);

/** Bastion events in order of how welcome they are, for the Meditation Chamber's "roll twice, keep either". */
export const EVENT_PREFERENCE = ['Treasure', 'Magical Discovery', 'Friendly Visitors', 'Refugees', 'Guest', 'All Is Well', 'Extraordinary Opportunity', 'Request for Aid', 'Lost Hirelings', 'Criminal Hireling', 'Attack'];

export const ALL_IS_WELL = [
  'Accident reports are way down.',
  'The leak in the roof has been fixed.',
  'No vermin infestations to report.',
  'You-Know-Who lost their spectacles again.',
  'One of your hirelings adopted a stray dog.',
  'You received a lovely letter from a friend.',
  'Some practical joker has been putting rotten eggs in people’s boots.',
  'Someone thought they saw a ghost.',
];

export const TREASURE_TABLE: { upTo: number; what: string; valueGp?: number }[] = [
  { upTo: 40, what: 'Art object (25 GP table)', valueGp: 25 },
  { upTo: 63, what: 'Art object (250 GP table)', valueGp: 250 },
  { upTo: 73, what: 'Art object (750 GP table)', valueGp: 750 },
  { upTo: 75, what: 'Art object (2,500 GP table)', valueGp: 2500 },
  { upTo: 90, what: 'Common magic item (Arcana, Armaments, Implements or Relics table)' },
  { upTo: 98, what: 'Uncommon magic item (Arcana, Armaments, Implements or Relics table)' },
  { upTo: 100, what: 'Rare magic item (Arcana, Armaments, Implements or Relics table)' },
];
