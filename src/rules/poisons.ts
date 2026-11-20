/** Poisons from the 2024 DMG ("Sample Poisons") and the 2024 PHB (Basic Poison). Prices are per dose. */
export type PoisonType = 'contact' | 'ingested' | 'inhaled' | 'injury';

export interface PoisonInfo {
  name: string;
  type: PoisonType;
  gp: number;
  /** Constitution save DC (Basic Poison has none). */
  dc: number | null;
  /** Damage dice on a failed save, and whether a success halves it. */
  damage?: string;
  halfOnSave?: boolean;
  /** Poisoned for this long on a failed save, in minutes, or a dice expression of hours. */
  poisonedMinutes?: number;
  poisonedHoursDice?: string;
  /** Extra condition while Poisoned this way. */
  alsoCondition?: 'Unconscious' | 'Paralyzed' | 'Blinded';
  /** Fail by 5 or more for the extra condition (Lolth's Sting). */
  extraOnFailBy5?: boolean;
  effect: string;
}

export const POISONS: PoisonInfo[] = [
  { name: 'Basic Poison', type: 'injury', gp: 100, dc: null, damage: '1d4', effect: 'Coats one weapon or up to three pieces of ammunition (Bonus Action). Piercing or Slashing damage deals an extra 1d4 Poison damage. Lasts 1 minute or until it deals its damage.' },
  { name: "Assassin's Blood", type: 'ingested', gp: 150, dc: 10, damage: '1d12', halfOnSave: true, poisonedMinutes: 24 * 60, effect: 'DC 10 Con save: on a failure 1d12 Poison damage and Poisoned for 24 hours; on a success half damage only.' },
  { name: 'Burnt Othur Fumes', type: 'inhaled', gp: 500, dc: 13, damage: '3d6', effect: 'DC 13 Con save or 3d6 Poison damage; repeat the save each turn (1d6 on each further failure) until three successes.' },
  { name: 'Carrion Crawler Mucus', type: 'contact', gp: 200, dc: 13, poisonedMinutes: 1, alsoCondition: 'Paralyzed', effect: 'DC 13 Con save or Poisoned and Paralyzed for 1 minute (repeat the save each turn).' },
  { name: 'Essence of Ether', type: 'inhaled', gp: 300, dc: 15, poisonedMinutes: 8 * 60, alsoCondition: 'Unconscious', effect: 'DC 15 Con save or Poisoned and Unconscious for 8 hours. Damage or a shake wakes them.' },
  { name: "Lolth's Sting", type: 'injury', gp: 200, dc: 13, poisonedMinutes: 60, alsoCondition: 'Unconscious', extraOnFailBy5: true, effect: 'DC 13 Con save or Poisoned for 1 hour; failing by 5 or more also Unconscious. Damage or a shake wakes them.' },
  { name: 'Malice', type: 'inhaled', gp: 250, dc: 15, poisonedMinutes: 60, alsoCondition: 'Blinded', effect: 'DC 15 Con save or Poisoned and Blinded for 1 hour.' },
  { name: 'Midnight Tears', type: 'ingested', gp: 1500, dc: 17, damage: '9d6', halfOnSave: true, effect: 'No effect until midnight; then DC 17 Con save, 9d6 Poison damage or half on a success. Anything that ends Poisoned neutralizes it first.' },
  { name: 'Oil of Taggit', type: 'contact', gp: 400, dc: 13, poisonedMinutes: 24 * 60, alsoCondition: 'Unconscious', effect: 'DC 13 Con save or Poisoned and Unconscious for 24 hours. Damage wakes them.' },
  { name: 'Pale Tincture', type: 'ingested', gp: 250, dc: 16, damage: '1d6', effect: 'DC 16 Con save or 1d6 Poison damage and Poisoned. Repeat the save every 24 hours (1d6 on a failure); the damage can’t be healed while Poisoned. Seven successes end it.' },
  { name: 'Purple Worm Poison', type: 'injury', gp: 2000, dc: 21, damage: '10d6', halfOnSave: true, effect: 'DC 21 Con save, 10d6 Poison damage or half on a success.' },
  { name: 'Serpent Venom', type: 'injury', gp: 200, dc: 11, damage: '3d6', halfOnSave: true, effect: 'DC 11 Con save, 3d6 Poison damage or half on a success.' },
  { name: 'Torpor', type: 'ingested', gp: 600, dc: 15, poisonedHoursDice: '4d6', effect: 'DC 15 Con save or Poisoned for 4d6 hours, with Speed halved.' },
  { name: 'Truth Serum', type: 'ingested', gp: 150, dc: 11, poisonedMinutes: 60, effect: 'DC 11 Con save or Poisoned for 1 hour and unable to knowingly lie.' },
  { name: 'Wyvern Poison', type: 'injury', gp: 1200, dc: 14, damage: '7d6', halfOnSave: true, effect: 'DC 14 Con save, 7d6 Poison damage or half on a success.' },
];

export const poisonByName = (name: string): PoisonInfo | undefined => {
  const n = name.toLowerCase();
  return POISONS.find((p) => n.includes(p.name.toLowerCase()));
};

/** Inventory name for a dose. */
export const poisonItemName = (p: PoisonInfo | string): string => `Poison: ${typeof p === 'string' ? p : p.name}`;
