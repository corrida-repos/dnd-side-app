import type { Character } from '../state/types';

export const PHYSICAL_ABILITIES = ['str', 'dex', 'con'] as const;
export type PhysicalAbility = (typeof PHYSICAL_ABILITIES)[number];

export const PHYSICAL_TRAINING_CAP = 20;

export function physicalTrainingScore(c: Character, ability: PhysicalAbility): number | undefined {
  if (ability === 'str') return c.strScore;
  if (ability === 'con') return c.conScore;
  return c.abilities?.dex;
}

/** Table rule based on Xanathar's five-workday weeks and 25 GP weekly trainer fee. */
export function physicalTrainingCourse(score: number, coached: boolean): { days: number; gp: number } {
  const soloWeeks = 10 + Math.max(0, score - 10);
  const weeks = coached ? Math.ceil(soloWeeks / 2) : soloWeeks;
  return { days: weeks * 5, gp: coached ? weeks * 25 : 0 };
}
