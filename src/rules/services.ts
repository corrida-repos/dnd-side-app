/** Services from the 2024 PHB (chapter 6). */

export type Settlement = 'village' | 'town' | 'city';

/** Travel fares: per mile per passenger, plus tolls. */
export const PASSAGE: { id: string; label: string; gpPerMile?: number; gpFlat?: number; gpPerDay?: number }[] = [
  { id: 'coach', label: 'Coach ride between towns (3 CP per mile)', gpPerMile: 0.03 },
  { id: 'cityCoach', label: 'Coach ride within a city (1 CP per mile)', gpPerMile: 0.01 },
  { id: 'ship', label: "Ship's passage (1 SP per mile)", gpPerMile: 0.1 },
  { id: 'hammock', label: 'Hammock aboard ship (5 SP per day)', gpPerDay: 0.5 },
  { id: 'cabin', label: 'Small private cabin (2 GP per day)', gpPerDay: 2 },
  { id: 'toll', label: 'Road or gate toll (1 CP)', gpFlat: 0.01 },
];

/** Spellcasting services: price by spell level and where you can find a caster. Add costly components on top. */
export const SPELL_SERVICES: { level: string; minLevel: number; where: Settlement; gp: number }[] = [
  { level: 'Cantrip', minLevel: 0, where: 'village', gp: 30 },
  { level: 'Level 1', minLevel: 1, where: 'village', gp: 50 },
  { level: 'Level 2', minLevel: 2, where: 'village', gp: 200 },
  { level: 'Level 3', minLevel: 3, where: 'town', gp: 300 },
  { level: 'Levels 4–5', minLevel: 4, where: 'town', gp: 2000 },
  { level: 'Levels 6–8', minLevel: 6, where: 'city', gp: 20000 },
  { level: 'Level 9', minLevel: 9, where: 'city', gp: 100000 },
];

const SIZE: Record<Settlement, number> = { village: 0, town: 1, city: 2 };
export const spellServiceAvailable = (where: Settlement, here: Settlement): boolean => SIZE[here] >= SIZE[where];

/** Common requests, with the costly components the spell consumes or needs. */
export const COMMON_SPELL_REQUESTS: { name: string; level: number; componentGp: number; note: string }[] = [
  { name: 'Purify Food and Drink', level: 1, componentGp: 0, note: 'Makes food and drink in a 5-ft sphere safe (ritual).' },
  { name: 'Identify', level: 1, componentGp: 100, note: 'A 100 GP pearl, not consumed.' },
  { name: 'Lesser Restoration', level: 2, componentGp: 0, note: 'Ends Blinded, Deafened, Paralyzed or Poisoned; cures Sight Rot.' },
  { name: 'Remove Curse', level: 3, componentGp: 0, note: 'Ends curses; lets you end attunement to a cursed item.' },
  { name: 'Sending', level: 3, componentGp: 0, note: 'A 25-word message to someone you know, anywhere on the plane.' },
  { name: 'Revivify', level: 3, componentGp: 300, note: 'Diamonds worth 300+ GP, consumed. Within 1 minute of death.' },
  { name: 'Greater Restoration', level: 5, componentGp: 100, note: 'Diamond dust worth 100+ GP, consumed. Removes 1 Exhaustion level, or ends a curse, Charmed or Petrified, among others.' },
  { name: 'Raise Dead', level: 5, componentGp: 500, note: 'A diamond worth 500+ GP, consumed. Dead no longer than 10 days.' },
  { name: 'Heal', level: 6, componentGp: 0, note: 'Restores 70 HP and ends Blinded, Deafened and Poisoned.' },
  { name: 'Resurrection', level: 7, componentGp: 1000, note: 'A diamond worth 1,000+ GP, consumed. Dead no longer than a century.' },
];
