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
  complication?: Complication;
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

export interface Complication {
  text: string;
  /** A rival could be behind it (marked in Xanathar's tables). */
  rival?: boolean;
  /** Gold lost (dice or a number), a debt taken on, days in jail, wages one step lower or unpaid. */
  loseGp?: string;
  debt?: string;
  jailDays?: number;
  wageDown?: boolean;
  noPay?: boolean;
}

const c = (text: string, extra: Partial<Complication> = {}): Complication => ({ text, ...extra });

/** Short versions of each activity's complications (table rule wording), with their mechanical effects. */
export const COMPLICATIONS: Record<string, Complication[]> = {
  'Carousing:lower': [
    c('a pickpocket lifts some coin', { rival: true, loseGp: '1d10*5' }),
    c('a bar brawl leaves you with a scar', { rival: true }),
    c('you dimly remember doing something very illegal'),
    c('you are banned from a tavern for your behavior', { rival: true }),
    c('you swore in public to take on a dangerous quest'),
    c('you woke up married'),
    c('a naked dash through the streets seemed wise at the time'),
    c('everyone calls you by an embarrassing nickname', { rival: true }),
  ],
  'Carousing:middle': [
    c('you insulted a guild master and owe a public apology', { rival: true }),
    c('you swore to complete a quest for a temple or guild'),
    c('a social blunder makes you the talk of the town', { rival: true }),
    c('an obnoxious admirer won’t leave you alone', { rival: true }),
    c('you made an enemy of a local spellcaster', { rival: true }),
    c('you’ve been roped into running a local festival'),
    c('a drunken toast scandalized the locals'),
    c('you spent extra trying to impress people', { loseGp: '100' }),
  ],
  'Carousing:upper': [
    c('a pushy noble family wants you to marry their heir', { rival: true }),
    c('you fell during a dance and nobody will forget it'),
    c('you agreed to take on a noble’s debts', { debt: '1d6*100' }),
    c('a knight challenges you to a joust', { rival: true }),
    c('you made an enemy of a local noble', { rival: true }),
    c('a dull noble insists you visit daily to hear their theories'),
    c('embarrassing rumors about you spread', { rival: true }),
    c('you spent extra trying to impress people', { loseGp: '500' }),
  ],
  Crime: [
    c('a bounty matching your take is posted for information', { rival: true }),
    c('someone knows, and wants a service for their silence', { rival: true }),
    c('your victim is financially ruined'),
    c('someone who knows about your crime was arrested for something else', { rival: true }),
    c('the loot is one easily traced item you can’t fence here'),
    c('your victim was under a crime lord’s protection'),
    c('the victim calls in a favor and the watch doubles its efforts'),
    c('the victim asks one of your companions to solve the crime'),
  ],
  Gambling: [
    c('you are accused of cheating', { rival: true }),
    c('the watch raids the hall and jails you', { rival: true, jailDays: 7 }),
    c('a noble who lost badly vows revenge', { rival: true }),
    c('a thieves’ guild wants back what you won from one of its members'),
    c('a crime boss insists you gamble only at their parlor'),
    c('a high-stakes gambler demands you join a game'),
  ],
  'Pit fighting': [
    c('an opponent swears revenge', { rival: true }),
    c('a crime boss offers money to throw a few fights', { rival: true }),
    c('you beat a crowd favorite and the crowd turns on you'),
    c('you beat a noble’s servant and anger the house', { rival: true }),
    c('you’re accused of cheating and your name suffers', { rival: true }),
    c('you nearly killed an opponent by accident'),
  ],
  'Religious service': [
    c('you offended a priest', { rival: true }),
    c('you committed accidental blasphemy'),
    c('a secret sect within the temple invites you in'),
    c('another temple tries to recruit you as a spy', { rival: true }),
    c('the elders urge you to take up a holy quest'),
    c('you discover an important temple figure worships a fiend'),
  ],
  Research: [
    c('you damaged a rare book'),
    c('you offended a sage who now demands a lavish gift', { rival: true }),
    c('the book you opened was cursed'),
    c('a sage is obsessed with convincing you of strange theories', { rival: true }),
    c('you are banned from a library until you make amends', { rival: true }),
    c('the lore came at the price of a dangerous promise'),
  ],
  Training: [
    c('your instructor vanished and you lost a week finding another', { rival: true }),
    c('your teacher’s old-fashioned methods draw comment'),
    c('your teacher is a spy sent to learn your plans', { rival: true }),
    c('your teacher is a wanted criminal'),
    c('your teacher is a cruel taskmaster'),
    c('your teacher asks for help with a threat'),
  ],
  'Working a trade': [
    c('a difficult customer or coworker cuts your wages a step', { rival: true, wageDown: true }),
    c('your employer can’t pay you this week', { rival: true, noPay: true }),
    c('a well-connected coworker takes a dislike to you', { rival: true }),
    c('your employer is tied to a cult or a criminal ring'),
    c('a crime ring tries to extort the business', { rival: true }),
    c('you get a reputation for laziness', { rival: true }),
  ],
};

/** XGtE: 5 + 2d10 DCs for the contested checks of gambling and pit fighting. */
const rolledDC = (rng: Rng) => 5 + rollDice(2, 10, rng);

export function resolveActivity(id: ActivityId, o: ActivityOpts, rng: Rng): ActivityResult {
  const check = (bonus: number, dc: number) => {
    const r = d20('normal', rng).value + bonus;
    return { total: r, ok: r >= dc };
  };
  const b = (i: number) => o.bonuses[i] ?? 0;
  /** 10% each workweek (training: each ten workweeks); crime instead triggers on exactly one success. */
  const pickComplication = (key: string) => {
    const list = COMPLICATIONS[key];
    return list ? list[die(list.length, rng) - 1] : undefined;
  };
  const complication = (key: string = id) => (die(10, rng) === 1 ? pickComplication(key) : undefined);
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
      return { text: `${text}${circle !== 'lower' ? ` (${CAROUSING_COST[circle] - CAROUSING_COST.lower} GP more for ${circle}-class company)` : ''}`, gp: -(CAROUSING_COST[circle] - CAROUSING_COST.lower), notes, complication: complication(`Carousing:${circle}`) };
    }
    case 'Crime': {
      const target = CRIME_TARGETS.find((x) => x.dc === o.dc) ?? CRIME_TARGETS[0];
      const rolls = [0, 1, 2].map((i) => check(b(i), target.dc));
      const ok = rolls.filter((r) => r.ok).length;
      const list = rolls.map((r) => r.total).join(', ');
      if (ok === 0) return { text: `${list} vs DC ${target.dc}: caught. Fined ${target.gp} GP and jailed ${Math.ceil(target.gp / 25)} week(s)`, gp: -target.gp, notes: [], jailDays: Math.ceil(target.gp / 25) * 7 };
      if (ok === 1) return { text: `${list} vs DC ${target.dc}: you get away, empty-handed`, gp: 0, notes: [], complication: pickComplication('Crime') };
      if (ok === 2) return { text: `${list} vs DC ${target.dc}: a partial haul`, gp: target.gp / 2, notes: [] };
      return { text: `${list} vs DC ${target.dc}: a clean job`, gp: target.gp, notes: [] };
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
      if (ok === 0) return { text: `${list}: you lose the ${stake} GP stake and owe as much again`, gp: -stake, debt: stake, notes: [], complication: complication() };
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
      const bonus = Math.min(6, Math.floor(Math.max(0, spent - 50) / 50));
      const t = d20('normal', rng).value + b(0) + bonus;
      const n = t <= 5 ? 0 : t <= 10 ? 1 : t <= 20 ? 2 : 3;
      return { text: `${t}${bonus ? ` (+${bonus} for ${spent} GP spent)` : ''}: ${n ? `${n} piece${n > 1 ? 's' : ''} of lore (the DM supplies them)` : 'nothing useful'}`, gp: 0, notes: n ? [`Research: ${n} piece(s) of lore to collect from the DM`] : [], complication: complication() };
    }
    case 'Working a trade': {
      const t = d20('normal', rng).value + b(0);
      const comp = complication();
      const steps: Lifestyle[] = ['squalid', 'poor', 'modest', 'comfortable'];
      let i = t <= 9 ? 1 : t <= 14 ? 2 : 3;
      if (comp?.wageDown) i -= 1;
      const lifestyle = steps[i];
      const extra = t >= 21 && !comp?.wageDown ? 25 : 0;
      const gp = comp?.noPay ? 0 : LIFESTYLE_GP[lifestyle] * 7 + extra;
      return { text: `${t}: ${comp?.noPay ? 'the work is done but the pay never comes' : `earns a ${lifestyle} living for the week${extra ? ' plus 25 GP' : ''}`}`, gp, notes: [], lifestyle, complication: comp };
    }
    case 'Training':
      return { text: 'training complete', gp: 0, notes: [], complication: complication('Training') };
  }
}

export const activityOf = (name: string): ActivityId | null => {
  const ids: ActivityId[] = ['Carousing', 'Crime', 'Gambling', 'Pit fighting', 'Relaxation', 'Religious service', 'Research', 'Training', 'Working a trade'];
  return ids.find((x) => name.toLowerCase().startsWith(x.toLowerCase())) ?? null;
};
