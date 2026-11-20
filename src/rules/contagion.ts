/** Magical contagions from the 2024 DMG (chapter 3, "Curses and Magical Contagions"). */
export type ContagionKind = 'cackle' | 'sewer' | 'sightRot';

export interface ContagionInfo {
  name: string;
  /** DC to resist catching it (from contact, a wound or tainted water). */
  catchDC: number;
  /** DC of the recurring save to fight it off. */
  fightDC: number;
  /** Symptoms start 1d4 days later; Sight Rot strikes at once. */
  incubates: boolean;
  source: string;
  effects: string;
  fighting: string;
}

export const CONTAGIONS: Record<ContagionKind, ContagionInfo> = {
  cackle: {
    name: 'Cackle Fever',
    catchDC: 10,
    fightDC: 13,
    incubates: true,
    source: 'Cheap, tainted potions and elixirs, or starting a turn within 10 ft of someone infected (DC 10 Con save; a success protects against that person for 24 hours). Humanoids only; gnomes are immune.',
    effects: 'Fever: 1 Exhaustion level until the contagion ends. While Exhausted, taking damage other than Psychic forces a DC 13 Con save or 1d10 Psychic damage and Incapacitated with laughter (repeat the save each turn; ends after 1 minute).',
    fighting: 'A DC 13 Con save at the end of each Long Rest. Three successes end it, and the creature is immune for a year.',
  },
  sewer: {
    name: 'Sewer Plague',
    catchDC: 11,
    fightDC: 11,
    incubates: true,
    source: 'Wounds from carriers (otyughs, rats and the like) or contact with contaminated filth or offal (DC 11 Con save). Humanoids only.',
    effects: 'Fatigue: 1 Exhaustion level. While Exhausted, Hit Point Dice heal only half, and a Long Rest neither restores HP nor removes Exhaustion.',
    fighting: 'A DC 11 Con save at dawn each day: a failure adds 1 Exhaustion level, a success removes 1. It ends when Exhaustion reaches 0.',
  },
  sightRot: {
    name: 'Sight Rot',
    catchDC: 15,
    fightDC: 15,
    incubates: false,
    source: 'Drinking water tainted by it, or skin contact with someone infected (DC 15 Con save; a success protects against that person for 24 hours). Beasts and Humanoids.',
    effects: 'Blinded until the contagion ends.',
    fighting: 'Heal or Lesser Restoration ends it. An Herbalism Kit makes an ointment in 1 hour that suppresses it for 24 hours; 72 hours of suppression (three doses) ends it.',
  },
};

/** DMG: 3 days of recuperation (nothing that would interrupt a Long Rest), then a DC 15 Con save for Advantage on contagion saves for 24 hours. */
export const RECUPERATE_DAYS = 3;
export const RECUPERATE_DC = 15;
export const SIGHT_ROT_CURE_HOURS = 72;
