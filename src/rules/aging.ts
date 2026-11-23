/**
 * Ages, birthdays and lifespans. The 2024 PHB gives most species a typical lifespan in its species
 * descriptions; where it's silent the app uses a human-like default. All of it can be overridden per character.
 * Magical aging (a Ghost's Horrifying Visage, a Potion of Longevity) is tracked separately from calendar years.
 */
export interface Lifespan {
  /** Typical age of adulthood and the age they usually live to. */
  adult: number;
  span: number;
}

const HUMANLIKE: Lifespan = { adult: 18, span: 90 };

/** Typical lifespans by species name (matched loosely: "Wood Elf" finds Elf). */
export const LIFESPANS: { match: RegExp; name: string; life: Lifespan }[] = [
  { match: /elf|eladrin|drow/i, name: 'Elf', life: { adult: 100, span: 750 } },
  { match: /dwarf|duergar/i, name: 'Dwarf', life: { adult: 50, span: 350 } },
  { match: /gnome/i, name: 'Gnome', life: { adult: 40, span: 425 } },
  { match: /halfling/i, name: 'Halfling', life: { adult: 20, span: 150 } },
  { match: /aasimar/i, name: 'Aasimar', life: { adult: 18, span: 160 } },
  { match: /dragonborn/i, name: 'Dragonborn', life: { adult: 15, span: 80 } },
  { match: /orc/i, name: 'Orc', life: { adult: 14, span: 80 } },
  { match: /goliath/i, name: 'Goliath', life: { adult: 18, span: 90 } },
  { match: /tiefling/i, name: 'Tiefling', life: { adult: 18, span: 100 } },
  { match: /warforged/i, name: 'Warforged', life: { adult: 2, span: 150 } },
  { match: /changeling|kalashtar|shifter/i, name: 'Eberron species', life: { adult: 18, span: 90 } },
  { match: /human/i, name: 'Human', life: HUMANLIKE },
];

export function lifespanFor(species: string): Lifespan & { name: string; guessed: boolean } {
  const hit = LIFESPANS.find((l) => l.match.test(species ?? ''));
  return hit ? { ...hit.life, name: hit.name, guessed: false } : { ...HUMANLIKE, name: 'human-like (default)', guessed: true };
}

export type AgeStage = 'child' | 'young' | 'adult' | 'middle' | 'old' | 'venerable';

export const STAGE_LABEL: Record<AgeStage, string> = {
  child: 'Child',
  young: 'Young adult',
  adult: 'Adult',
  middle: 'Middle-aged',
  old: 'Old',
  venerable: 'Venerable',
};

/** Life stage from age and lifespan: middle age from half the lifespan, old from two-thirds, venerable past it. */
export function ageStage(age: number, life: Lifespan): AgeStage {
  if (age < life.adult) return 'child';
  if (age < life.adult + Math.max(2, (life.span - life.adult) * 0.12)) return 'young';
  if (age < life.span / 2) return 'adult';
  if (age < (life.span * 2) / 3) return 'middle';
  if (age <= life.span) return 'old';
  return 'venerable';
}

/** What others notice about someone of this stage (for the in-world line on a birthday that crosses into it). */
export const STAGE_SENSE: Record<AgeStage, string> = {
  child: 'is still growing, all elbows and appetite',
  young: 'has the easy strength of youth',
  adult: 'is in the prime of life',
  middle: 'notices the first grey hairs and the aches that linger a day longer',
  old: 'feels the cold more and the stairs more, and their reflection looks like a parent’s',
  venerable: 'feels every year in their joints, and others offer them a seat without being asked',
};

/** Years the body has aged: calendar years since birth (slowed for those who age slowly) plus magical aging. */
export function bodyAge(o: { birthYear: number; magicYears?: number; slowSinceYear?: number | null; slowFactor?: number }, year: number, birthdayPassed: boolean): number {
  const calendar = year - o.birthYear - (birthdayPassed ? 0 : 1);
  let age = calendar;
  if (o.slowSinceYear != null && year > o.slowSinceYear) {
    const slowed = year - Math.max(o.slowSinceYear, o.birthYear);
    age = calendar - slowed + slowed * (o.slowFactor ?? 0.1);
  }
  return Math.max(0, Math.floor(age + (o.magicYears ?? 0)));
}

/** Ways characters age (or grow younger) by magic, with what to roll. */
export const MAGIC_AGING: { id: string; label: string; years: string; note: string }[] = [
  { id: 'visage', label: 'Ghost’s Horrifying Visage', years: '1d4*10', note: 'A creature that fails its save against the Visage may age 1d4 × 10 years (2014 Monster Manual; the aging can be reversed by Greater Restoration within 24 hours).' },
  { id: 'longevity', label: 'Potion of Longevity', years: '-(1d6+6)', note: 'Grow 1d6 + 6 years younger. Each later potion has a cumulative 10% chance to age you 1d6 + 6 years instead.' },
  { id: 'custom', label: 'Other magic', years: '', note: 'Enter the years: positive to age, negative to grow younger.' },
];

/** Chance that a Potion of Longevity ages instead of rejuvenating, after this many earlier potions. */
export const longevityBackfire = (earlier: number): number => Math.min(1, earlier * 0.1);

/** Archdruid (2024 PHB, Druid 20): every ten years that pass, the body ages only one. */
export const SLOW_AGING_FACTOR = 0.1;
