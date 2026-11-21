/**
 * Rivals (Xanathar's Guide to Everything, "Downtime Revisited"): NPCs who work against the characters while
 * they're busy between adventures. Each time downtime is resolved, a rival advances one of its plans.
 * The ideas and moves here are short paraphrases; the effects on the tracker are table rules.
 */
export const RIVAL_IDEAS = [
  'A tax collector sure the party dodges its fees',
  'A politician who thinks the party causes more trouble than it solves',
  'A high priest who feels the party dims the temple’s glory',
  'A wizard who blames the party for recent troubles',
  'A rival adventuring company',
  'A bard who loves a good scandal',
  'A childhood rival or a feuding clan',
  'A scorned relative',
  'A merchant who blames the party for lost business',
  'An ambitious newcomer out to make a name',
  'Kin or allies of a defeated enemy',
  'An official trying to restore a tarnished reputation',
  'A deadly foe posing as a social rival',
  'A fiend tempting the party toward evil',
  'A spurned admirer',
  'An opportunist looking for a scapegoat',
  'A treacherous noble plotting revolt',
  'A would-be tyrant who tolerates no opposition',
  'An exiled noble seeking revenge',
  'A corrupt official afraid of exposure',
];

export type RivalMoveEffect = 'rumor' | 'sabotage' | 'bribe' | 'thugs' | 'legal' | 'none';

export const RIVAL_MOVES: { text: string; effect: RivalMoveEffect }[] = [
  { text: 'spreads ugly rumors about the party', effect: 'rumor' },
  { text: 'sabotages one of the party’s ventures', effect: 'sabotage' },
  { text: 'bribes officials to watch the party closely', effect: 'bribe' },
  { text: 'sends hired toughs to rough someone up and lift their purse', effect: 'thugs' },
  { text: 'files a complaint that ends in a fine', effect: 'legal' },
  { text: 'gathers allies and resources for a bigger move', effect: 'none' },
  { text: 'turns a contact of the party against them', effect: 'none' },
  { text: 'outbids the party on something they wanted', effect: 'none' },
];

/** Pressure thresholds: at each one the rival is ready for something the DM plays out in person. */
export const RIVAL_ESCALATION: Record<number, string> = {
  3: 'is ready to strike directly (a confrontation, theft or public humiliation the DM plays out)',
  6: 'makes a serious attempt to ruin or harm the party (an adventure-sized threat)',
  9: 'goes all in: the conflict must be resolved one way or another',
};
