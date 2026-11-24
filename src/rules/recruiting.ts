/**
 * Winning someone over to join as a sidekick (table rule built on the 2024 DMG Influence action and Tasha's
 * requirement that a sidekick be a friend of at least one adventurer).
 *
 * Someone met along the way, CR 1/2 or lower, is talked round over days of company: one session a day, an Influence
 * check (Charisma: Persuasion, Performance or Deception, as fits) against the 2024 DMG's DC for their attitude.
 * Successes build trust; enough trust and they are willing to join. Bad days put them off, and three in a row turn
 * them away.
 */
export type RecruitAttitude = 'hostile' | 'indifferent' | 'friendly';

export const ATTITUDE_LABEL: Record<RecruitAttitude, string> = { hostile: 'Hostile', indifferent: 'Indifferent', friendly: 'Friendly' };

/** 2024 DMG Influence: a hesitant creature's DC is 15 or its Intelligence score, whichever is higher; a friendly one is easier (table rule 10); a hostile one won't be talked round today (table rule DC 20 just to calm them). */
export function recruitDC(attitude: RecruitAttitude, int: number): number {
  if (attitude === 'friendly') return 10;
  if (attitude === 'hostile') return Math.max(20, int);
  return Math.max(15, int);
}

/** Trust needed before they'll join, by the attitude they started with. Hostile ones must first be calmed to Indifferent. */
export const TRUST_NEEDED: Record<RecruitAttitude, number> = { hostile: 4, indifferent: 4, friendly: 2 };

/** Bad days in a row (failing by 5 or more) before they turn the party away. */
export const RECRUIT_MAX_FAILS = 3;

/** A session is an hour of real company: talking on the road, sharing the fire, helping with their work. */
export const RECRUIT_SESSION_MINUTES = 60;

export interface RecruitAids {
  /** A gift worth having (the party spends gold on it). */
  giftGp: number;
  /** The party stood by them in danger since the last session. */
  sharedDanger: boolean;
}

/** Table rule: a gift of at least this much, or danger faced together, gives Advantage on the session's check. */
export const GIFT_MIN_GP = 5;

export const hasAdvantage = (a: RecruitAids): boolean => a.giftGp >= GIFT_MIN_GP || a.sharedDanger;

/** Trust from one session: +2 for beating the DC by 5, +1 for a success, 0 for a near miss, a bad day for failing by 5. */
export function sessionTrust(total: number, dc: number): { gain: number; bad: boolean } {
  if (total >= dc + 5) return { gain: 2, bad: false };
  if (total >= dc) return { gain: 1, bad: false };
  return { gain: 0, bad: total <= dc - 5 };
}

/** Table rule: doing something real for them (saving a life, settling a debt, righting a wrong) is worth this much trust at once. */
export const HELPED_TRUST = 2;

/** A contact who already likes the party (bond +2 or more) can be asked straight away: they start Friendly, with trust equal to their bond. */
export const CONTACT_INVITE_BOND = 2;

/** What the player sees of how they feel, by trust so far. */
export function recruitCue(name: string, trust: number, needed: number, attitude: RecruitAttitude): string {
  if (attitude === 'hostile') return `${name} keeps a hand near a weapon and answers in single words.`;
  const f = trust / Math.max(1, needed);
  if (f >= 1) return `${name} has started talking about "we" and "us", and asks where the road goes next.`;
  if (f >= 0.5) return `${name} laughs at the party's jokes now, and lingers by the fire after the others turn in.`;
  if (f > 0) return `${name} is warming up: fewer guarded answers, a story or two of their own.`;
  return `${name} is polite but keeps their distance.`;
}
