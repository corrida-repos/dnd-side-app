import type { Lifestyle } from './money';
import type { LandKind, TitleRank } from './prestige';

/**
 * Paths to power (table rule, behind the `pathsToPower` switch). Three ladders share one shape: five ranks on the
 * DMG renown steps (1 / 3 / 10 / 25 / 50) and level steps (1 / 3 / 5 / 11 / 17), each needing renown with the
 * path's institution, the path's own measure of power and time served in the rank below. The clerical ladder
 * is in `priesthood.ts` (its measure is piety); the noble and bourgeois ladders are here.
 *
 * How a rank is reached:
 * - join: presented at court or indentured to a master; joining makes them a member (renown at least 1);
 * - petition: asked for with a check, or awarded by whoever holds the power to give it;
 * - award: given only by someone with the power to grant it (a ruler, an election, a vacancy), never petitioned.
 * Any rank can be awarded directly by the DM, requirements or not: a knighthood on the battlefield, a guild's
 * honorary mastership, a mayor chosen by acclaim.
 *
 * Monthly duties keep a rank; three months missed in a row cost a step.
 */

export type LadderId = 'court' | 'guild';
export type Way = 'join' | 'petition' | 'award';

export interface Rung {
  rank: number;
  title: string;
  /** Guild ranks 4 and 5 on the civic branch: alderman and lord mayor. */
  civic?: string;
  renown: number;
  level: number;
  daysInRank: number;
  way: Way;
  /** Petition DC (0 for join and award). */
  dc: number;
  check: string;
  /** Days of duty a month. */
  dutyDays: number;
  /** What the rank gives and asks. */
  does: string;
  /** Noble: the title granted as a Mark of Prestige (with its expected lifestyle), and land that comes with it. */
  titleRank?: TitleRank;
  land?: LandKind;
  /** Bourgeois: proficiency with the guild's tool, finished businesses owned, wealth in GP. */
  tool?: boolean;
  businesses?: number;
  wealth?: number;
  /** Bourgeois: bonus to Running a Business rolls for businesses the character owns (table rule). */
  businessBonus?: number;
  lifestyle?: Lifestyle;
}

const PERSUADE_HISTORY = 'Charisma (Persuasion) or Intelligence (History)';
const TRADE_CHECK = 'a check with the guild’s tool';

export const LADDERS: Record<LadderId, { label: string; institution: string; rungs: Rung[] }> = {
  court: {
    label: 'Noble',
    institution: 'the ruler’s court',
    rungs: [
      { rank: 0, title: 'Commoner', renown: 0, level: 1, daysInRank: 0, way: 'join', dc: 0, check: '', dutyDays: 0, does: 'No standing at court.' },
      { rank: 1, title: 'Courtier', renown: 0, level: 1, daysInRank: 0, way: 'join', dc: 0, check: '', dutyDays: 0, does: 'Known at court: admitted to audiences and feasts, and close enough to hear its gossip.' },
      {
        rank: 2,
        title: 'Esquire',
        renown: 3,
        level: 3,
        daysInRank: 30,
        way: 'petition',
        dc: 12,
        check: PERSUADE_HISTORY,
        dutyDays: 1,
        lifestyle: 'modest',
        does: 'Gentry: a coat of arms, arms borne in the ruler’s presence, and a word that carries weight with officials.',
      },
      {
        rank: 3,
        title: 'Knight',
        renown: 10,
        level: 5,
        daysInRank: 90,
        way: 'petition',
        dc: 15,
        check: PERSUADE_HISTORY,
        dutyDays: 2,
        titleRank: 'knight',
        land: 'farmland',
        lifestyle: 'comfortable',
        does: 'The accolade, often given on the field for valor. A knight’s fee of farmland pays rents; the ruler may call them to service.',
      },
      {
        rank: 4,
        title: 'Lord',
        renown: 25,
        level: 11,
        daysInRank: 180,
        way: 'award',
        dc: 0,
        check: '',
        dutyDays: 4,
        titleRank: 'lord',
        land: 'village',
        lifestyle: 'wealthy',
        does: 'A baron, lord or count, granted by the ruler when a fief falls vacant or for great service: a village and its people to protect, and a seat in the ruler’s council.',
      },
      {
        rank: 5,
        title: 'Duke',
        renown: 50,
        level: 17,
        daysInRank: 365,
        way: 'award',
        dc: 0,
        check: '',
        dutyDays: 7,
        titleRank: 'duke',
        land: 'village',
        lifestyle: 'aristocratic',
        does: 'A peer of the realm, granted only by the ruler: a duchy’s seat, its levies and the ear of the throne.',
      },
    ],
  },
  guild: {
    label: 'Bourgeois',
    institution: 'the guild',
    rungs: [
      { rank: 0, title: 'Commoner', renown: 0, level: 1, daysInRank: 0, way: 'join', dc: 0, check: '', dutyDays: 0, does: 'Not a member of a guild.' },
      { rank: 1, title: 'Apprentice', renown: 0, level: 1, daysInRank: 0, way: 'join', dc: 0, check: '', dutyDays: 0, does: 'Indentured to a master: room, board and training in the trade, and chores in return.' },
      {
        rank: 2,
        title: 'Journeyman',
        renown: 3,
        level: 3,
        daysInRank: 30,
        way: 'petition',
        dc: 12,
        check: TRADE_CHECK,
        dutyDays: 0,
        tool: true,
        lifestyle: 'modest',
        does: 'Free to work for any master in any town the guild is known in, at a journeyman’s wage.',
      },
      {
        rank: 3,
        title: 'Master',
        renown: 10,
        level: 5,
        daysInRank: 90,
        way: 'petition',
        dc: 15,
        check: `${TRADE_CHECK} (the masterpiece is judged)`,
        dutyDays: 2,
        tool: true,
        businesses: 1,
        businessBonus: 5,
        lifestyle: 'comfortable',
        does: 'May keep a shop under the guild’s mark, take apprentices and vote in the guild. Their businesses do better with the guild behind them.',
      },
      {
        rank: 4,
        title: 'Guild warden',
        civic: 'Alderman',
        renown: 25,
        level: 11,
        daysInRank: 180,
        way: 'petition',
        dc: 20,
        check: 'Charisma (Persuasion): an election',
        dutyDays: 4,
        businesses: 2,
        wealth: 5000,
        businessBonus: 10,
        lifestyle: 'wealthy',
        does: 'Elected to run the guild’s affairs, or the ward’s on the town council: prices, licences, the watch’s pay and who builds where.',
      },
      {
        rank: 5,
        title: 'Guildmaster',
        civic: 'Lord mayor',
        renown: 50,
        level: 17,
        daysInRank: 365,
        way: 'award',
        dc: 0,
        check: '',
        dutyDays: 7,
        businesses: 2,
        wealth: 25000,
        businessBonus: 15,
        lifestyle: 'aristocratic',
        does: 'Head of the guild, or of the whole city, chosen when the seat falls vacant: the town’s purse and its voice before the ruler.',
      },
    ],
  },
};

export const TOP = 5;
export const LADDER_PETITION_WAIT_DAYS = 30;
export const LADDER_STRIKES = 3;
export const LADDER_MONTH = 30;

export const rungTitle = (ladder: LadderId, rank: number, civic?: boolean): string => {
  const r = LADDERS[ladder].rungs[Math.max(0, Math.min(TOP, rank))];
  return (civic && r.civic) || r.title;
};

export interface LadderStanding {
  renown: number;
  level: number;
  daysInRank: number;
  /** null when unknown (not recorded on the sheet). */
  hasTool: boolean | null;
  businesses: number;
  wealth: number;
}

/** What still stands between a character and a rank (empty when they meet it). */
export function ladderMissing(ladder: LadderId, rank: number, st: LadderStanding): string[] {
  const r = LADDERS[ladder].rungs[rank];
  if (!r) return ['There is no higher rank.'];
  const out: string[] = [];
  if (st.renown < r.renown) out.push(`renown ${r.renown} with ${LADDERS[ladder].institution} (has ${st.renown})`);
  if (st.level < r.level) out.push(`level ${r.level}`);
  if (st.daysInRank < r.daysInRank) out.push(`${r.daysInRank - st.daysInRank} more day(s) in the present rank`);
  if (r.tool && st.hasTool === false) out.push('proficiency with the guild’s tool');
  if (r.businesses && st.businesses < r.businesses) out.push(`${r.businesses} business${r.businesses > 1 ? 'es' : ''} of their own (has ${st.businesses})`);
  if (r.wealth && st.wealth < r.wealth) out.push(`${r.wealth.toLocaleString('en')} GP of wealth`);
  return out;
}

/** Renown that already meets the rank above earns Advantage on the petition: the institution is behind them. */
export function ladderAdvantage(ladder: LadderId, rank: number, renown: number): boolean {
  const above = LADDERS[ladder].rungs[rank + 1];
  return renown >= (above ? above.renown : LADDERS[ladder].rungs[rank].renown * 2);
}

/** Social standing from the highest rank held on any ladder (the priesthood included). */
export const SOCIAL_TIER = ['Commoner', 'Commoner', 'Notable', 'Gentry', 'Magnate', 'Grandee'] as const;
export const SOCIAL_TIER_TEXT: Record<(typeof SOCIAL_TIER)[number], string> = {
  Commoner: 'One of the many: officials and nobles owe them nothing.',
  Notable: 'Known in their town: shopkeepers extend credit and officials take their meetings.',
  Gentry: 'Among the gentry: nobles receive them, and commoners step aside on the road.',
  Magnate: 'A power in the land: rulers court them, and their word moves councils.',
  Grandee: 'Among the highest in the realm: few doors stay shut, and rivals are other powers.',
};
export const socialTier = (rank: number) => SOCIAL_TIER[Math.max(0, Math.min(TOP, rank))];
