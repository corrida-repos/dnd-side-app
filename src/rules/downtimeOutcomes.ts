import { d20, die, rollDice, type Rng } from './dice';
import { LIFESTYLE_GP, type Lifestyle } from './money';

/**
 * Downtime activity outcomes. The 2024 books give these activities no tables, so this follows the optional
 * *Xanathar's Guide to Everything* (2014) rules: one workweek (5 days), checks against set or rolled DCs,
 * and a 10% chance of a complication. Complications here are short generic versions (table rule).
 */
export type ActivityId = 'Carousing' | 'Crime' | 'Gambling' | 'Pit fighting' | 'Relaxation' | 'Religious service' | 'Research' | 'Training' | 'Working a trade';

export interface ActivityOpts {
  /** Check bonuses, in the order the activity lists its checks. */
  bonuses: number[];
  /** Gambling stake, crime haul value, research spending. */
  gp?: number;
  /** Crime target DC (10/15/20/25). */
  dc?: number;
  /** Carousing circle. */
  circle?: 'lower' | 'middle' | 'upper';
}

export interface ActivityResult {
  text: string;
  /** Gold won (+) or lost (−), and any debt run up. */
  gp: number;
  debt?: number;
  /** Lines to keep on the character: contacts, favors, lore. */
  notes: string[];
  /** Days in jail. */
  jailDays?: number;
  /** Lifestyle earned for the week by working. */
  lifestyle?: Lifestyle;
  complication?: string;
}

export const ACTIVITY_CHECKS: Record<ActivityId, string[]> = {
  Carousing: ['Charisma (Persuasion)'],
  Crime: ['Dexterity (Stealth)', "Dexterity (Thieves' Tools)", 'Investigation, Perception or Deception'],
  Gambling: ['Wisdom (Insight)', 'Charisma (Deception)', 'Charisma (Intimidation)'],
  'Pit fighting': ['Strength (Athletics)', 'Dexterity (Acrobatics)', 'Constitution check (Hit Die bonus)'],
  Relaxation: [],
  'Religious service': ['Intelligence (Religion) or Charisma (Persuasion)'],
  Research: ['Intelligence check'],
  Training: [],
  'Working a trade': ['Tool, skill or ability check'],
};

export const CAROUSING_COST = { lower: 10, middle: 50, upper: 250 };
export const CRIME_TARGETS = [
  { dc: 10, gp: 50, label: 'Small time (DC 10, 50 GP)' },
  { dc: 15, gp: 100, label: 'Modest merchant (DC 15, 100 GP)' },
  { dc: 20, gp: 200, label: 'Wealthy mark (DC 20, 200 GP)' },
  { dc: 25, gp: 1000, label: 'Major target (DC 25, 1,000 GP)' },
];

const COMPLICATIONS: Partial<Record<ActivityId, string[]>> = {
  Carousing: ['a rival takes offense at something said in drink', 'a bar brawl leaves a bruise and a grudge', 'someone claims they were promised money', 'a romance ends badly and publicly', 'the watch takes notice of the noise', 'a stranger with a strange request won’t leave you alone'],
  Crime: ['a bounty is posted on a description that fits you', 'a fence talks to the wrong people', 'the victim was protected by someone powerful', 'an accomplice wants a bigger cut', 'a witness recognized you', 'a rival gang claims the territory'],
  Gambling: ['you’re accused of cheating', 'a loser blames you and wants revenge', 'the house expects a favor', 'a debt collector follows you home', 'you win something stolen', 'a noble wants a rematch'],
  'Pit fighting': ['an opponent wants a rematch, to the death', 'a bookie asks you to take a dive', 'an injury lingers for a few days', 'a patron wants to sponsor you, with strings', 'the fights are raided by the watch', 'a rival fighter spreads lies about you'],
  'Religious service': ['a rival sect objects to your presence', 'a priest asks a dangerous favor', 'you witness something you shouldn’t have', 'your faith is publicly questioned', 'a relic goes missing on your watch', 'an omen points to trouble'],
  Research: ['your inquiries alert someone who wants the topic buried', 'a source turns out to be forged', 'a scholar demands credit and payment', 'you damage a valuable book', 'a cult notices your interest', 'you uncover a secret that puts you in danger'],
  'Working a trade': ['a customer refuses to pay', 'a guild objects to your working without membership', 'a tool breaks', 'a demanding client wants the impossible', 'a rival undercuts you', 'an accident at work'],
};

/** XGtE: 5 + 2d10 DCs for the contested checks of gambling and pit fighting. */
const rolledDC = (rng: Rng) => 5 + rollDice(2, 10, rng);

export function resolveActivity(id: ActivityId, o: ActivityOpts, rng: Rng): ActivityResult {
  const check = (bonus: number, dc: number) => {
    const r = d20('normal', rng).value + bonus;
    return { total: r, ok: r >= dc };
  };
  const b = (i: number) => o.bonuses[i] ?? 0;
  const complication = () => {
    const list = COMPLICATIONS[id];
    return list && die(10, rng) === 1 ? list[die(list.length, rng) - 1] : undefined;
  };
  switch (id) {
    case 'Carousing': {
      const t = d20('normal', rng).value + b(0);
      const circle = o.circle ?? 'lower';
      const notes: string[] = [];
      let text: string;
      if (t <= 5) {
        text = `${t}: you make a hostile contact`;
        notes.push(`Hostile contact (${circle} circles)`);
      } else if (t <= 10) text = `${t}: no new contacts`;
      else {
        const n = t <= 15 ? 1 : t <= 20 ? 2 : 3;
        text = `${t}: ${n} allied contact${n > 1 ? 's' : ''}`;
        for (let i = 0; i < n; i++) notes.push(`Allied contact (${circle} circles)`);
      }
      return { text, gp: 0, notes, complication: complication() };
    }
    case 'Crime': {
      const target = CRIME_TARGETS.find((x) => x.dc === o.dc) ?? CRIME_TARGETS[0];
      const rolls = [0, 1, 2].map((i) => check(b(i), target.dc));
      const ok = rolls.filter((r) => r.ok).length;
      const list = rolls.map((r) => r.total).join(', ');
      if (ok === 0) return { text: `${list} vs DC ${target.dc}: caught. Fined ${target.gp} GP and jailed ${Math.ceil(target.gp / 25)} week(s)`, gp: -target.gp, notes: [], jailDays: Math.ceil(target.gp / 25) * 7, complication: complication() };
      if (ok === 1) return { text: `${list} vs DC ${target.dc}: you get away, empty-handed`, gp: 0, notes: [], complication: complication() };
      if (ok === 2) return { text: `${list} vs DC ${target.dc}: a partial haul`, gp: target.gp / 2, notes: [], complication: complication() };
      return { text: `${list} vs DC ${target.dc}: a clean job`, gp: target.gp, notes: [], complication: complication() };
    }
    case 'Gambling': {
      const stake = Math.max(10, Math.min(1000, o.gp ?? 10));
      const rolls = [0, 1, 2].map((i) => {
        const dc = rolledDC(rng);
        const r = check(b(i), dc);
        return `${r.total}/${dc}`;
      });
      const ok = rolls.filter((x) => Number(x.split('/')[0]) >= Number(x.split('/')[1])).length;
      const list = rolls.join(', ');
      if (ok === 0) return { text: `${list}: you lose the ${stake} GP stake and owe as much again`, gp: -stake, debt: stake, notes: [`Gambling debt: ${stake} GP`], complication: complication() };
      if (ok === 1) return { text: `${list}: you lose half the stake`, gp: -stake / 2, notes: [], complication: complication() };
      if (ok === 2) return { text: `${list}: you win half your stake again`, gp: stake / 2, notes: [], complication: complication() };
      return { text: `${list}: you double your stake`, gp: stake, notes: [], complication: complication() };
    }
    case 'Pit fighting': {
      const rolls = [0, 1, 2].map((i) => {
        const dc = rolledDC(rng);
        const r = check(b(i), dc);
        return { ok: r.ok, t: `${r.total}/${dc}` };
      });
      const ok = rolls.filter((r) => r.ok).length;
      const gp = [0, 50, 100, 200][ok];
      return { text: `${rolls.map((r) => r.t).join(', ')}: ${ok} win${ok === 1 ? '' : 's'}, ${gp} GP`, gp, notes: [], complication: complication() };
    }
    case 'Relaxation':
      return { text: 'a quiet week: Advantage on saves against a lingering disease or poison, and one effect that blocks healing can end', gp: 0, notes: [] };
    case 'Religious service': {
      const t = d20('normal', rng).value + b(0);
      const n = t <= 10 ? 0 : t <= 20 ? 1 : 2;
      return { text: `${t}: ${n ? `${n} favor${n > 1 ? 's' : ''} earned with the temple` : 'no favors this time'}`, gp: 0, notes: Array.from({ length: n }, () => 'Temple favor owed'), complication: complication() };
    }
    case 'Research': {
      const spent = Math.max(50, o.gp ?? 50);
      const bonus = Math.min(6, Math.floor(Math.max(0, spent - 100) / 100));
      const t = d20('normal', rng).value + b(0) + bonus;
      const n = t <= 5 ? 0 : t <= 10 ? 1 : t <= 20 ? 2 : 3;
      return { text: `${t}${bonus ? ` (+${bonus} for ${spent} GP spent)` : ''}: ${n ? `${n} piece${n > 1 ? 's' : ''} of lore (the DM supplies them)` : 'nothing useful'}`, gp: 0, notes: n ? [`Research: ${n} piece(s) of lore to collect from the DM`] : [], complication: complication() };
    }
    case 'Working a trade': {
      const t = d20('normal', rng).value + b(0);
      const lifestyle: Lifestyle = t <= 9 ? 'poor' : t <= 14 ? 'modest' : 'comfortable';
      const extra = t >= 21 ? 25 : 0;
      return { text: `${t}: earns a ${lifestyle} living for the week${extra ? ' plus 25 GP' : ''}`, gp: LIFESTYLE_GP[lifestyle] * 7 + extra, notes: [], lifestyle, complication: complication() };
    }
    case 'Training':
      return { text: 'training complete', gp: 0, notes: [] };
  }
}

export const activityOf = (name: string): ActivityId | null => {
  const ids: ActivityId[] = ['Carousing', 'Crime', 'Gambling', 'Pit fighting', 'Relaxation', 'Religious service', 'Research', 'Training', 'Working a trade'];
  return ids.find((x) => name.toLowerCase().startsWith(x.toLowerCase())) ?? null;
};
