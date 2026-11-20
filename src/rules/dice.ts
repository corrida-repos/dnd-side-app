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

/** Rolls a simple expression like "1d6+1", "2d4", "d20-1" or a flat "3". Returns null if it can't be read. */
export function rollExpr(expr: string, rng: Rng): number | null {
  const m = expr.replace(/\s+/g, '').toLowerCase().match(/^(?:(\d*)d(\d+))?([+-]\d+)?$|^(\d+)$/);
  if (!m || !expr.trim()) return null;
  if (m[4]) return Number(m[4]);
  const count = m[2] ? Number(m[1] || 1) : 0;
  const total = (count ? rollDice(count, Number(m[2]), rng) : 0) + (m[3] ? Number(m[3]) : 0);
  return total;
}
