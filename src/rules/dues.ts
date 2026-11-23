/**
 * Taxes, tithes and dues (table rule). The 2024 books mention tolls and guild membership but set no recurring
 * charges, so the amounts here are suggestions. A due falls on its day; whoever pays it settles it from their
 * purse, and what they can't cover becomes a debt to the collector (and escalates like any other debt).
 */
import type { CreditorKind } from './debts';

export type DueKind = 'landTax' | 'propertyTax' | 'tithe' | 'guild' | 'rent' | 'license' | 'other';
export type DuePeriod = 'week' | 'month' | 'year';

export interface DuePreset {
  label: string;
  /** Suggested amount in GP per period (for a tithe: a share of income instead). */
  gp: number;
  /** Tithes take a share of gold earned since the last payment. */
  share?: number;
  period: DuePeriod;
  /** Who the unpaid amount is owed to, for the debt it becomes. */
  creditor: CreditorKind;
  collector: string;
  note: string;
  /** What missing it means beyond the debt. */
  missed: string;
}

export const DUE_PRESETS: Record<DueKind, DuePreset> = {
  landTax: { label: 'Land tax', gp: 10, period: 'month', creditor: 'lawful', collector: 'The crown’s tax collector', note: 'For a parcel of land or a fortification held from a ruler: a tenth of a typical month’s income.', missed: 'The grantor’s trust in the holder falls.' },
  propertyTax: { label: 'Property tax', gp: 2, period: 'month', creditor: 'lawful', collector: 'The city assessor', note: 'A house, shop or warehouse inside a city’s walls.', missed: 'Bailiffs follow, as for any lawful debt.' },
  tithe: { label: 'Temple tithe', gp: 0, share: 0.1, period: 'month', creditor: 'temple', collector: 'The temple', note: 'A tenth of the gold earned since the last tithe. Expected of clerics, paladins and the devout.', missed: 'The temple’s patience thins: penance, then a quest.' },
  guild: { label: 'Guild dues', gp: 5, period: 'month', creditor: 'lawful', collector: 'The guild', note: 'Membership of a merchants’ or artisans’ guild (5 GP a month is the traditional rate).', missed: 'After three missed months the guild expels the member and its perks are lost.' },
  rent: { label: 'Rent', gp: 1, period: 'week', creditor: 'lawful', collector: 'The landlord', note: 'A room, house or workshop rented by the week, outside the lifestyle the character pays.', missed: 'The landlord changes the locks once it’s two periods behind.' },
  license: { label: 'Trade license', gp: 10, period: 'year', creditor: 'lawful', collector: 'The magistrate', note: 'Permission to trade, run a business or carry arms in a city.', missed: 'The business can be shut down by the watch.' },
  other: { label: 'Other', gp: 1, period: 'month', creditor: 'lawful', collector: 'The collector', note: 'Anything else that falls due regularly.', missed: 'It becomes a debt.' },
};

export const PERIOD_DAYS: Record<DuePeriod, number> = { week: 7, month: 30, year: 365 };
export const PERIOD_LABEL: Record<DuePeriod, string> = { week: 'a week', month: 'a month', year: 'a year' };

/** What a due costs this time: a fixed amount, or a share of what was earned. */
export function dueAmount(o: { gp: number; share?: number }, earnedGp: number): number {
  if (o.share) return Math.round(Math.max(0, earnedGp) * o.share * 100) / 100;
  return Math.round(o.gp * 100) / 100;
}

/** Missed payments in a row before a guild expels its member. */
export const GUILD_EXPULSION = 3;
