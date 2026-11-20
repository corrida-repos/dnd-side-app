import { rollDice, type Rng } from './dice';

/**
 * Running a Business (2014 DMG, p. 129). The 2024 rules have no equivalent, so this is an optional rule.
 * Roll d100 + days spent (at most 30), −10 for each unpaid debt, and read the table.
 */
export const BUSINESS_MAX_DAYS = 30;
export const BUSINESS_DEBT_PENALTY = 10;

/** Daily maintenance costs for common holdings (2014 DMG Maintenance Costs table). Any cost can be edited. */
export const BUSINESS_PRESETS: { name: string; gpPerDay: number }[] = [
  { name: 'Shop', gpPerDay: 2 },
  { name: 'Farm', gpPerDay: 0.5 },
  { name: 'Inn, town or city', gpPerDay: 5 },
  { name: 'Inn, rural roadside', gpPerDay: 10 },
  { name: 'Guildhall, town or city', gpPerDay: 5 },
  { name: 'Lodge', gpPerDay: 1 },
  { name: 'Trading post', gpPerDay: 10 },
  { name: 'Small temple', gpPerDay: 1 },
  { name: 'Large temple', gpPerDay: 25 },
  { name: 'Noble estate', gpPerDay: 10 },
  { name: 'Abbey', gpPerDay: 20 },
];

export interface BusinessResult {
  roll: number;
  total: number;
  /** Maintenance the owner must pay out of pocket. */
  payGp: number;
  profitGp: number;
  text: string;
}

export function rollBusiness(rng: Rng, days: number, gpPerDay: number, debts: number): BusinessResult {
  const d = Math.min(BUSINESS_MAX_DAYS, Math.max(0, days));
  const roll = rollDice(1, 100, rng);
  const total = roll + d - BUSINESS_DEBT_PENALTY * debts;
  const upkeep = gpPerDay * d;
  const r = (x: number) => Math.round(x * 100) / 100;
  if (total <= 20) return { roll, total, payGp: r(upkeep * 1.5), profitGp: 0, text: 'A bad stretch: pay one and a half times the maintenance' };
  if (total <= 30) return { roll, total, payGp: r(upkeep), profitGp: 0, text: 'Pay the full maintenance' };
  if (total <= 40) return { roll, total, payGp: r(upkeep / 2), profitGp: 0, text: 'Profits cover half the maintenance; pay the other half' };
  if (total <= 60) return { roll, total, payGp: 0, profitGp: 0, text: 'The business covers its own maintenance' };
  if (total <= 80) return { roll, total, payGp: 0, profitGp: rollDice(1, 6, rng) * 5, text: 'Covers its maintenance and turns a small profit (1d6 × 5 GP)' };
  if (total <= 90) return { roll, total, payGp: 0, profitGp: rollDice(2, 8, rng) * 5, text: 'Covers its maintenance and turns a good profit (2d8 × 5 GP)' };
  return { roll, total, payGp: 0, profitGp: rollDice(3, 10, rng) * 5, text: 'A great stretch: covers its maintenance and turns a big profit (3d10 × 5 GP)' };
}
