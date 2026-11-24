import { die, rollDice, type Rng } from './dice';

/** 2024 DMG, Audible Distance and Underwater Encounter Distance. */
export const NOISE = {
  quiet: { label: 'Trying to be quiet', multiplier: 5 },
  normal: { label: 'Normal noise', multiplier: 10 },
  loud: { label: 'Very loud', multiplier: 50 },
} as const;
export type Noise = keyof typeof NOISE;
export const audibleDistance = (noise: Noise, rng: Rng) => rollDice(2, 6, rng) * NOISE[noise].multiplier;

export const UNDERWATER_DISTANCE = {
  bright: { label: 'Clear water, bright light', feet: 60 },
  dim: { label: 'Clear water, dim light', feet: 30 },
  murky: { label: 'Murky water or darkness', feet: 10 },
} as const;
export type UnderwaterVisibility = keyof typeof UNDERWATER_DISTANCE;

/** 2024 DMG, Lock Quality and Lock Complexity. */
export const LOCK_DC = { Inferior: 10, Good: 15, Superior: 20 } as const;
export const LOCK_MINUTES = { Simple: 0, Complex: 1 } as const;
export interface LockDetails {
  quality: keyof typeof LOCK_DC;
  complexity: keyof typeof LOCK_MINUTES;
}

const MONSTER_PERSONALITIES = [
  'Cowardly and quick to surrender',
  'Greedy and looking for treasure',
  'Boastful until danger arrives',
  'Disorderly and easily shaken',
  'Fanatical and willing to die fighting',
  'Brave and steady in danger',
  'Jocular and prone to taunting',
  'Orderly and hard to rattle',
];
const MONSTER_RELATIONSHIPS = [
  'Two rivals in the group want to see each other suffer.',
  'One bullied creature hangs back and looks for a chance to escape.',
  'The others revere one creature and would die defending it.',
  'The others admire one creature and try to help or impress it.',
  'One creature looks out only for itself.',
  'One creature forces the others into danger, and they hope it loses.',
];

export function monsterBehavior(groupSize: number, rng: Rng): { personality: string; relationship?: string } {
  return {
    personality: MONSTER_PERSONALITIES[die(8, rng) - 1],
    relationship: groupSize > 1 ? MONSTER_RELATIONSHIPS[die(6, rng) - 1] : undefined,
  };
}
