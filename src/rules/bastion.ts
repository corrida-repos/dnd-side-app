import { die, type Rng } from './dice';

/** A Bastion turn passes every 7 days (DMG). */
export const BASTION_TURN_DAYS = 7;
/** Characters gain a Bastion at this level. */
export const BASTION_MIN_LEVEL = 5;

export type FacilitySize = 'cramped' | 'roomy' | 'vast';
export const SIZE_LABEL: Record<FacilitySize, string> = { cramped: 'Cramped', roomy: 'Roomy', vast: 'Vast' };
export const SIZE_SQUARES: Record<FacilitySize, number> = { cramped: 4, roomy: 16, vast: 36 };

/** Adding a basic facility: cost and build time by size. */
export const BASIC_BUILD: Record<FacilitySize, { gp: number; days: number }> = {
  cramped: { gp: 500, days: 20 },
  roomy: { gp: 1000, days: 45 },
  vast: { gp: 3000, days: 125 },
};

/** Enlarging a facility one size step. */
export const ENLARGE: Partial<Record<FacilitySize, { to: FacilitySize; gp: number; days: number }>> = {
  cramped: { to: 'roomy', gp: 500, days: 25 },
  roomy: { to: 'vast', gp: 2000, days: 80 },
};

export const BASIC_FACILITIES = ['Bedroom', 'Dining Room', 'Parlor', 'Courtyard', 'Kitchen', 'Storage'];

export type Order = 'Craft' | 'Empower' | 'Harvest' | 'Maintain' | 'Recruit' | 'Research' | 'Trade';
export const ORDERS: Order[] = ['Craft', 'Empower', 'Harvest', 'Maintain', 'Recruit', 'Research', 'Trade'];

export interface SpecialFacility {
  name: string;
  level: number;
  /** Sizes it can be built at (DMG); the first is the default. */
  sizes?: FacilitySize[];
  /** The order this facility usually takes. Any facility can be told to Maintain. */
  order: Order;
  /** Book it comes from: the 2024 DMG unless set (FRHoF: Forgotten Realms: Heroes of Faerûn; EFA: Eberron: Forge of the Artificer). */
  book?: 'FRHoF' | 'EFA';
}

export const FACILITY_BOOK_LABEL = { FRHoF: 'Forgotten Realms: Heroes of Faerûn', EFA: 'Eberron: Forge of the Artificer' } as const;

export const SPECIAL_FACILITIES: SpecialFacility[] = [
  { name: 'Arcane Study', level: 5, order: 'Craft' },
  { name: 'Armory', level: 5, order: 'Trade' },
  { name: 'Barrack', sizes: ['roomy', 'vast'], level: 5, order: 'Recruit' },
  { name: 'Garden', sizes: ['roomy', 'vast'], level: 5, order: 'Harvest' },
  { name: 'Library', level: 5, order: 'Research' },
  { name: 'Sanctuary', level: 5, order: 'Craft' },
  { name: 'Smithy', level: 5, order: 'Craft' },
  { name: 'Storehouse', level: 5, order: 'Trade' },
  { name: 'Workshop', sizes: ['roomy', 'vast'], level: 5, order: 'Craft' },
  { name: 'Gaming Hall', sizes: ['vast'], level: 9, order: 'Trade' },
  { name: 'Greenhouse', level: 9, order: 'Harvest' },
  { name: 'Laboratory', level: 9, order: 'Craft' },
  { name: 'Sacristy', level: 9, order: 'Craft' },
  { name: 'Scriptorium', level: 9, order: 'Craft' },
  { name: 'Stable', sizes: ['roomy', 'vast'], level: 9, order: 'Trade' },
  { name: 'Teleportation Circle', level: 9, order: 'Recruit' },
  { name: 'Theater', sizes: ['vast'], level: 9, order: 'Empower' },
  { name: 'Training Area', sizes: ['vast'], level: 9, order: 'Empower' },
  { name: 'Trophy Room', level: 9, order: 'Research' },
  { name: 'Archive', sizes: ['roomy', 'vast'], level: 13, order: 'Research' },
  { name: 'Meditation Chamber', sizes: ['cramped'], level: 13, order: 'Empower' },
  { name: 'Menagerie', sizes: ['vast'], level: 13, order: 'Recruit' },
  { name: 'Observatory', level: 13, order: 'Empower' },
  { name: 'Pub', sizes: ['roomy', 'vast'], level: 13, order: 'Research' },
  { name: 'Reliquary', sizes: ['cramped'], level: 13, order: 'Harvest' },
  { name: 'Demiplane', sizes: ['vast'], level: 17, order: 'Empower' },
  { name: 'Guildhall', sizes: ['vast'], level: 17, order: 'Recruit' },
  { name: 'Sanctum', level: 17, order: 'Empower' },
  { name: 'War Room', sizes: ['vast'], level: 17, order: 'Recruit' },
  // Forgotten Realms: Heroes of Faerûn (2025)
  { name: 'Amethyst Dragon Den', sizes: ['vast'], level: 5, order: 'Empower', book: 'FRHoF' },
  { name: 'Harper Hideout', level: 5, order: 'Empower', book: 'FRHoF' },
  { name: 'Red Wizard Necropolis', level: 5, order: 'Recruit', book: 'FRHoF' },
  { name: 'Zhentarim Travel Station', sizes: ['vast'], level: 5, order: 'Research', book: 'FRHoF' },
  { name: 'Emerald Enclave Grove', sizes: ['vast'], level: 9, order: 'Recruit', book: 'FRHoF' },
  { name: "Lords' Alliance Noble Residence", sizes: ['vast'], level: 9, order: 'Recruit', book: 'FRHoF' },
  { name: 'Order of the Gauntlet Tournament Field', sizes: ['vast'], level: 9, order: 'Empower', book: 'FRHoF' },
  { name: 'Cult of the Dragon Archive', level: 13, order: 'Research', book: 'FRHoF' },
  // Eberron: Forge of the Artificer (2025)
  { name: 'Dragonmark Outpost', level: 5, order: 'Empower', book: 'EFA' },
  { name: 'Kundarak Vault', sizes: ['cramped'], level: 9, order: 'Trade', book: 'EFA' },
  { name: "Navigator's Helm", sizes: ['cramped'], level: 9, order: 'Empower', book: 'EFA' },
  { name: 'Orien Helm', sizes: ['cramped'], level: 9, order: 'Empower', book: 'EFA' },
  { name: "Artificer's Forge", level: 13, order: 'Craft', book: 'EFA' },
  { name: 'Inquisitive Agency', level: 13, order: 'Research', book: 'EFA' },
  { name: 'Lyrandar Helm', sizes: ['cramped'], level: 13, order: 'Empower', book: 'EFA' },
  { name: 'Manifest Zone', sizes: ['vast'], level: 13, order: 'Empower', book: 'EFA' },
  { name: 'Museum', sizes: ['roomy', 'vast'], level: 13, order: 'Research', book: 'EFA' },
  { name: 'Construct Forge', sizes: ['vast'], level: 17, order: 'Recruit', book: 'EFA' },
];

/** A special facility's default size (DMG): Roomy unless listed otherwise. */
export const defaultSize = (name: string): FacilitySize => SPECIAL_FACILITIES.find((f) => f.name === name)?.sizes?.[0] ?? 'roomy';

/** How many special facilities a Bastion owner may have at a given character level. */
export function specialSlots(level: number): number {
  if (level >= 17) return 6;
  if (level >= 13) return 5;
  if (level >= 9) return 4;
  if (level >= 5) return 2;
  return 0;
}

const EVENTS: [number, string][] = [
  [50, 'All Is Well'],
  [55, 'Attack'],
  [58, 'Criminal Hireling'],
  [63, 'Extraordinary Opportunity'],
  [72, 'Friendly Visitors'],
  [76, 'Guest'],
  [79, 'Lost Hirelings'],
  [83, 'Magical Discovery'],
  [91, 'Refugees'],
  [98, 'Request for Aid'],
  [100, 'Treasure'],
];

/** Bastion Events table (d100), rolled when every special facility was told to Maintain. Read the full entry in the DMG. */
export function rollBastionEvent(rng: Rng): { roll: number; event: string } {
  const roll = die(100, rng);
  return { roll, event: EVENTS.find(([max]) => roll <= max)![1] };
}

/** 2024 DMG "Fall of a Bastion": with no orders for as many consecutive turns as the owner's level, the hirelings leave. */
export const neglectLimit = (ownerLevel: number): number => Math.max(1, ownerLevel);
