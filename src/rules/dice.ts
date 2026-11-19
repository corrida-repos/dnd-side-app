export type Rng = () => number;
export type RollMode = 'normal' | 'advantage' | 'disadvantage';

export const die = (sides: number, rng: Rng): number => Math.floor(rng() * sides) + 1;

export function rollDice(count: number, sides: number, rng: Rng): number {
  let total = 0;
  for (let i = 0; i < count; i++) total += die(sides, rng);
  return total;
}

export function d20(mode: RollMode, rng: Rng): { rolls: number[]; value: number } {
  const a = die(20, rng);
  if (mode === 'normal') return { rolls: [a], value: a };
  const b = die(20, rng);
  return { rolls: [a, b], value: mode === 'advantage' ? Math.max(a, b) : Math.min(a, b) };
}

/** Advantage and disadvantage cancel out, regardless of how many sources of each. */
export function combineModes(...modes: RollMode[]): RollMode {
  const adv = modes.includes('advantage');
  const dis = modes.includes('disadvantage');
  if (adv && !dis) return 'advantage';
  if (dis && !adv) return 'disadvantage';
  return 'normal';
}

export const signed = (n: number): string => (n >= 0 ? `+${n}` : `${n}`);
