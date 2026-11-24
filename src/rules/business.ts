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

export interface BuildingPreset {
  name: string;
  gp: number;
  days: number;
  /** Matching business kind, for its daily maintenance. */
  business?: string;
  /** true: from the 2014 DMG Building a Stronghold table; false: a table-rule estimate. */
  official: boolean;
}

/**
 * Construction cost (materials and labor) and time while the owner oversees the work.
 * The official rows are the 2014 DMG's Building a Stronghold table. The DMG prices no shops, taverns,
 * inns or farms, so those are table-rule estimates scaled from it and from 2024 Bastion facility costs
 * (Cramped 500 GP / 20 days, Roomy 1,000 GP / 45 days, Vast 3,000 GP / 125 days).
 */
export const BUILDING_PRESETS: BuildingPreset[] = [
  { name: 'Market stall', gp: 50, days: 5, business: 'Shop', official: false },
  { name: 'Small shop', gp: 1000, days: 45, business: 'Shop', official: false },
  { name: 'Workshop or smithy', gp: 1500, days: 50, business: 'Shop', official: false },
  { name: 'Tavern', gp: 2500, days: 60, business: 'Inn, town or city', official: false },
  { name: 'Farm (house, barn and fields)', gp: 1500, days: 60, business: 'Farm', official: false },
  { name: 'Inn, town or city', gp: 5000, days: 60, business: 'Inn, town or city', official: false },
  { name: 'Inn, rural roadside (with stables)', gp: 6000, days: 75, business: 'Inn, rural roadside', official: false },
  { name: 'Shrine or small temple', gp: 1000, days: 45, business: 'Small temple', official: false },
  { name: 'Guildhall, town or city', gp: 5000, days: 60, business: 'Guildhall, town or city', official: true },
  { name: 'Trading post', gp: 5000, days: 60, business: 'Trading post', official: true },
  { name: 'Noble estate with manor', gp: 25000, days: 150, business: 'Noble estate', official: true },
  { name: 'Outpost or fort', gp: 15000, days: 100, official: true },
  { name: 'Tower, fortified', gp: 15000, days: 100, official: true },
  { name: 'Temple', gp: 50000, days: 400, business: 'Large temple', official: true },
  { name: 'Abbey', gp: 50000, days: 400, business: 'Abbey', official: true },
  { name: 'Keep or small castle', gp: 50000, days: 400, official: true },
  { name: 'Palace or large castle', gp: 500000, days: 1200, official: true },
];

/** DMG: work goes on while the owner is away, but each day away adds 3 days, so it advances a third as fast. */
export const AWAY_PROGRESS = 1 / 3;

/*
 * Speeding up construction. Neither DMG has rules for this, so all of it is a table rule.
 */

/** Each extra crew adds half the normal pace and costs half the construction price for the work still left. */
export const CREW_SPEED = 0.5;
export const CREW_COST_SHARE = 0.5;
export const MAX_EXTRA_CREWS = 2;

/** A character working on site adds this much pace (more with carpenter's or mason's tools). */
export const HELPER_SPEED = { skilled: 0.1, untrained: 0.05 };

/** Spells that do construction work at once, in workdays of progress per casting (table rule). */
export const BUILD_SPELLS: { name: string; level: number; days: number; ritual?: boolean; note: string }[] = [
  { name: 'Stone Shape', level: 4, days: 1, note: 'Shapes doors, windows and fittings from existing stone.' },
  { name: 'Fabricate', level: 4, days: 2, note: 'Turns raw timber or stone into finished beams, planks or blocks.' },
  { name: 'Wall of Stone', level: 5, days: 5, note: 'Ten 10-ft panels, permanent if concentration lasts the full 10 minutes.' },
  { name: 'Move Earth', level: 6, days: 3, note: 'Digs foundations and levels ground over 2 hours of concentration.' },
];

/** Pace multiplier from crews and helpers (before the away penalty). */
export function buildPace(extraCrews: number, skilled: number, untrained: number): number {
  return 1 + CREW_SPEED * extraCrews + HELPER_SPEED.skilled * skilled + HELPER_SPEED.untrained * untrained;
}

export interface BusinessResult {
  roll: number;
  total: number;
  /** Maintenance the owner must pay out of pocket. */
  payGp: number;
  profitGp: number;
  text: string;
}

/** Table rule: an owner who runs the place well adds this to the 2014 DMG roll, so even a week's work tends to pay. */
export const BUSINESS_TABLE_BONUS = 20;
/** Table rule: profits scale with the stretch, ×1 for up to 10 days, ×2 up to 20, ×3 up to 30 (the 2014 table pays the same for 1 day or 30). */
export const profitScale = (days: number): number => Math.max(1, Math.ceil(days / 10));

export function rollBusiness(rng: Rng, days: number, gpPerDay: number, debts: number, extra = 0): BusinessResult {
  const d = Math.min(BUSINESS_MAX_DAYS, Math.max(0, days));
  const roll = rollDice(1, 100, rng);
  const total = roll + d + BUSINESS_TABLE_BONUS + extra - BUSINESS_DEBT_PENALTY * debts;
  const x = profitScale(d);
  const scaled = (r: BusinessResult): BusinessResult => (r.profitGp && x > 1 ? { ...r, profitGp: r.profitGp * x, text: `${r.text}, ×${x} for ${d} days` } : r);
  const upkeep = gpPerDay * d;
  const r = (x: number) => Math.round(x * 100) / 100;
  if (total <= 20) return { roll, total, payGp: r(upkeep * 1.5), profitGp: 0, text: 'A bad stretch: pay one and a half times the maintenance' };
  if (total <= 30) return { roll, total, payGp: r(upkeep), profitGp: 0, text: 'Pay the full maintenance' };
  if (total <= 40) return { roll, total, payGp: r(upkeep / 2), profitGp: 0, text: 'Profits cover half the maintenance; pay the other half' };
  if (total <= 60) return { roll, total, payGp: 0, profitGp: 0, text: 'The business covers its own maintenance' };
  if (total <= 80) return scaled({ roll, total, payGp: 0, profitGp: rollDice(1, 6, rng) * 5, text: 'Covers its maintenance and turns a small profit (1d6 × 5 GP)' });
  if (total <= 90) return scaled({ roll, total, payGp: 0, profitGp: rollDice(2, 8, rng) * 5, text: 'Covers its maintenance and turns a good profit (2d8 × 5 GP)' });
  return scaled({ roll, total, payGp: 0, profitGp: rollDice(3, 10, rng) * 5, text: 'A great stretch: covers its maintenance and turns a big profit (3d10 × 5 GP)' });
}

/**
 * What a business is worth for standing (table rule): its recorded value; else the construction price of a building
 * named like it; else the cheapest real building (1,000 GP or more) of its kind; else 500 × its daily maintenance.
 */
export function businessValue(b: { name: string; gpPerDay: number; valueGp?: number }): number {
  if (b.valueGp != null) return b.valueGp;
  const n = b.name.toLowerCase();
  const named = BUILDING_PRESETS.find((x) => n.includes(x.name.toLowerCase()) || x.name.toLowerCase().includes(n));
  if (named) return named.gp;
  const kind = BUSINESS_PRESETS.find((p) => p.gpPerDay === b.gpPerDay && n.includes(p.name.split(',')[0].toLowerCase()));
  const built = kind && BUILDING_PRESETS.filter((x) => x.business === kind.name && x.gp >= 1000).sort((a, c) => a.gp - c.gp)[0];
  return built ? built.gp : Math.round(b.gpPerDay * 500);
}
