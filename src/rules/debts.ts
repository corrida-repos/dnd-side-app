/**
 * Debts. Neither 2024 book has rules for owing money beyond Xanathar's gambling debts, so this whole system
 * is a table rule. Interest compounds weekly. When a debt goes unpaid past its due date, the creditor escalates
 * week by week according to who they are. Small sums are treated leniently.
 */
export type CreditorKind = 'lawful' | 'criminal' | 'noble' | 'temple';

export const CREDITOR_LABEL: Record<CreditorKind, string> = {
  lawful: 'Lawful (moneylender, bank, town)',
  criminal: 'Criminal (loan shark, gambling den, crime boss)',
  noble: 'Noble house',
  temple: 'Temple',
};

/** Default weekly interest by creditor type. */
export const WEEKLY_INTEREST: Record<CreditorKind, number> = { lawful: 0.02, criminal: 0.1, noble: 0.03, temple: 0 };
/** Days before the first payment is due. */
export const DUE_DAYS: Record<CreditorKind, number> = { lawful: 30, criminal: 7, noble: 30, temple: 60 };
/** Debts below this never go past a warning. */
export const LENIENT_GP = 10;

export interface Escalation {
  /** Weeks overdue when this step happens. */
  week: number;
  label: string;
  action: 'warn' | 'seize' | 'prison' | 'beating' | 'service' | 'violence' | 'renown' | 'quest' | 'garnish';
  text: string;
}

/** What each kind of creditor does as a debt goes unpaid (table rule). */
export const ESCALATION: Record<CreditorKind, Escalation[]> = {
  lawful: [
    { week: 1, label: 'Notice', action: 'warn', text: 'a formal demand for payment arrives' },
    { week: 2, label: 'Seizure', action: 'seize', text: 'bailiffs seize coin, then sellable goods at half value' },
    { week: 4, label: "Debtors' prison", action: 'prison', text: "the debtor is jailed until the debt is paid or worked off at a laborer's wage" },
  ],
  criminal: [
    { week: 1, label: 'Threats', action: 'warn', text: 'a polite visit with impolite implications' },
    { week: 2, label: 'Enforcers', action: 'beating', text: 'enforcers rough the debtor up and take what coin they find' },
    { week: 3, label: 'Forced service', action: 'service', text: 'the boss demands a job: a crime done for them, unpaid, to cut the debt' },
    { week: 5, label: 'Violence', action: 'violence', text: 'a real attempt to hurt the debtor and make an example; the creditor becomes a rival' },
  ],
  noble: [
    { week: 1, label: 'Reminder', action: 'warn', text: 'a pointed letter with the family seal' },
    { week: 3, label: 'Disgrace', action: 'renown', text: 'the house blackens the debtor’s name: renown −1 with every faction' },
    { week: 6, label: 'Seizure', action: 'seize', text: 'the house’s agents take what they can, by law or by force' },
  ],
  temple: [
    { week: 2, label: 'Penance', action: 'warn', text: 'the priests ask for penance and patience runs thin' },
    { week: 4, label: 'Service', action: 'quest', text: 'the temple demands a quest or labor in its service instead' },
  ],
};

/** Weekly wage for working off a debt in debtors' prison (a laborer: untrained hireling rate). */
export const PRISON_LABOR_GP_PER_WEEK = 1.4;
/** Forced service for a criminal creditor cuts this share of the debt (table rule). */
export const SERVICE_CREDIT = 0.25;
