/**
 * Rising in the priesthood (table rule, under the `piety` switch). The 2024 books give temples and priests
 * (the Priest Acolyte, Priest and Archpriest stat blocks, the Acolyte background) but no ladder to climb.
 * This one asks for three things at each step, on the DMG renown thresholds: renown with the faith (the
 * institution trusts them), piety (the god favors them) and character level (the world knows them), plus time
 * served in the rank below. Then the character petitions the hierarchy with a check.
 *
 * Office brings a monthly stipend and monthly duties. Duties missed three months running cost the office one step,
 * and an Estranged character's office is suspended (no stipend, no say) until they atone.
 */

export type OfficePath = 'clergy' | 'order';

export interface Office {
  rank: number;
  /** Titles on the clergy path and in a holy order of knights (for Paladins and other warriors of the faith). */
  title: Record<OfficePath, string>;
  renown: number;
  piety: number;
  level: number;
  /** Days served in the rank below before petitioning. */
  daysInRank: number;
  /** DC of the petition: Intelligence (Religion) or Charisma (Persuasion). 0 = no check (the DM decides). */
  dc: number;
  /** Days of temple duty (or service to the order) expected each month. */
  dutyDays: number;
  /** Stipend in GP paid each month the duties are kept, after the 2024 PHB lifestyle costs. */
  stipendGp: number;
  /** What the office means. */
  does: string;
}

export const OFFICES: Office[] = [
  { rank: 0, title: { clergy: 'Lay worshipper', order: 'Lay worshipper' }, renown: 0, piety: 0, level: 1, daysInRank: 0, dc: 0, dutyDays: 0, stipendGp: 0, does: 'No place in the hierarchy.' },
  {
    rank: 1,
    title: { clergy: 'Acolyte', order: 'Squire of the order' },
    renown: 1,
    piety: 0,
    level: 1,
    daysInRank: 0,
    dc: 0,
    dutyDays: 0,
    stipendGp: 0,
    does: 'A novice: a cot and simple meals at the faith’s temples, lessons from the priests, and chores when there.',
  },
  {
    rank: 2,
    title: { clergy: 'Priest', order: 'Knight of the order' },
    renown: 3,
    piety: 3,
    level: 3,
    daysInRank: 30,
    dc: 10,
    dutyDays: 2,
    stipendGp: 30,
    does: 'Ordained: may lead rites, bless marriages and bury the dead in the god’s name. The stipend covers a Modest lifestyle.',
  },
  {
    rank: 3,
    title: { clergy: 'Senior priest', order: 'Knight-captain' },
    renown: 10,
    piety: 10,
    level: 5,
    daysInRank: 90,
    dc: 15,
    dutyDays: 4,
    stipendGp: 60,
    does: 'Keeper of a shrine or a chapter house: acolytes to command and a say in the faith’s affairs in the region. The stipend covers a Comfortable lifestyle.',
  },
  {
    rank: 4,
    title: { clergy: 'High priest', order: 'Marshal of the order' },
    renown: 25,
    piety: 25,
    level: 11,
    daysInRank: 180,
    dc: 20,
    dutyDays: 7,
    stipendGp: 120,
    does: 'Head of a great temple or a fortress of the order: priests, temple guards and treasuries answer to them. The stipend covers a Wealthy lifestyle.',
  },
  {
    rank: 5,
    title: { clergy: 'Head of the faith', order: 'Grand master of the order' },
    renown: 50,
    piety: 50,
    level: 17,
    daysInRank: 365,
    dc: 0,
    dutyDays: 10,
    stipendGp: 300,
    does: 'Leads the whole faith or order. The seat is filled only when it falls vacant, by election, omen or the god’s plain sign: the DM decides. The stipend covers an Aristocratic lifestyle.',
  },
];

export const TOP_RANK = OFFICES.length - 1;

/** A failed petition can be tried again after this many days. */
export const PETITION_WAIT_DAYS = 30;
/** Months in a row with duties missed before the office is lost a step. */
export const STRIKES_TO_DEMOTE = 3;
/** Duties and stipends are settled this often, counted from taking office. */
export const OFFICE_MONTH = 30;

export const officeTitle = (rank: number, path: OfficePath): string => OFFICES[Math.max(0, Math.min(TOP_RANK, rank))].title[path];

export interface Standing {
  renown: number;
  piety: number;
  level: number;
  daysInRank: number;
}

/** What still stands between a character and the next rank (empty when they may petition). */
export function missingFor(rank: number, st: Standing): string[] {
  const o = OFFICES[rank];
  if (!o) return ['There is no higher office.'];
  const out: string[] = [];
  if (st.renown < o.renown) out.push(`renown ${o.renown} with the faith (has ${st.renown})`);
  if (st.piety < o.piety) out.push(`piety ${o.piety} (has ${st.piety})`);
  if (st.level < o.level) out.push(`level ${o.level}`);
  if (st.daysInRank < o.daysInRank) out.push(`${o.daysInRank - st.daysInRank} more day(s) in the present rank`);
  return out;
}

/** Piety well past the next rank's need (by its own step again) earns Advantage on the petition: the god's favor shows. */
export function petitionAdvantage(rank: number, piety: number): boolean {
  const o = OFFICES[rank];
  const next = OFFICES[rank + 1];
  return !!o && piety >= (next ? next.piety : o.piety * 2);
}
