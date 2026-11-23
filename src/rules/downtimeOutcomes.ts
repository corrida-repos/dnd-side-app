import { d20, die, rollDice, signed, type Rng } from './dice';
import { ABILITY_LABEL, abilityScore, hasSkill, proficientWith, toolNamed, toolProficiencies, type AbilityKey } from './gear';
import { abilityMod } from './upkeep';
import { proficiencyBonus } from './survival';
import type { Character } from '../state/types';
import { LIFESTYLE_GP, MAGIC_ITEM_VALUE, type Lifestyle } from './money';
import type { Rarity } from './crafting';

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
  /** Advantage on each check, in order (2024 PHB: proficient with a tool and a skill that both apply, e.g. a Gaming Set with Insight). */
  advantage?: boolean[];
  /** Research: consulting an accurate Book on the topic (+5, 2024 PHB). */
  book?: boolean;
  /** Pit fighting: sides of the character's largest Hit Die, rolled and added to the Constitution check. */
  hitDie?: number;
  /** Workweeks spent. Each week is rolled on its own, with its own complication chance (Xanathar's). */
  weeks?: number;
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
  /** Every complication over all the weeks rolled (Xanathar's: 10% each week). */
  complications?: Complication[];
  /** Gold spent on the week's own costs beyond the project's (carousing in better company, research). */
  spent?: number;
}

export const ACTIVITY_CHECKS: Record<ActivityId, string[]> = {
  Carousing: ['Charisma (Persuasion)'],
  Crime: ['Dexterity (Stealth)', "Dexterity (Thieves' Tools)", 'Investigation, Perception or Deception'],
  Gambling: ['Wisdom (Insight)', 'Charisma (Deception)', 'Charisma (Intimidation)'],
  'Pit fighting': ['Strength (Athletics)', 'Dexterity (Acrobatics)', 'Constitution check (+ largest Hit Die)'],
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
  'Buying a magic item': [
    c('the item is a fake, planted by an enemy', { rival: true }),
    c('the item is stolen from you the night after you buy it', { rival: true }),
    c('the item is cursed, and the seller knew'),
    c('its former owner wants it back, and will go to some lengths', { rival: true }),
    c('the seller is murdered before the sale, and you are the last to have seen them'),
    c('a rival buyer outbids you for something else you wanted, and now watches you', { rival: true }),
  ],
  'Selling a magic item': [
    c('thieves break in to take the item before the sale', { rival: true }),
    c('the buyer pays partly in counterfeit coin', { loseGp: '1d6*10' }),
    c('the buyer claims the item was stolen from their family', { rival: true }),
    c('the buyer is a front for a rival who now knows what you carry', { rival: true }),
    c('a thieves’ guild wants its cut of any sale in its territory', { loseGp: '1d4*25' }),
    c('the buyer later demands their money back, swearing it doesn’t work', { rival: true }),
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

function resolveWeek(id: ActivityId, o: ActivityOpts, rng: Rng): ActivityResult {
  const adv = (i: number) => (o.advantage?.[i] ? 'advantage' : 'normal') as 'advantage' | 'normal';
  const roll = (i: number) => d20(adv(i), rng).value;
  const check = (bonus: number, dc: number, i = 0) => {
    const r = roll(i) + bonus;
    return { total: r, ok: r >= dc };
  };
  const b = (i: number) => o.bonuses[i] ?? 0;
  /** 10% each workweek (training: each ten workweeks); a crime that ends with exactly one success always brings one. */
  const pickComplication = (key: string) => {
    const list = COMPLICATIONS[key];
    return list ? list[die(list.length, rng) - 1] : undefined;
  };
  const complication = (key: string = id) => (die(10, rng) === 1 ? pickComplication(key) : undefined);
  switch (id) {
    case 'Carousing': {
      const t = roll(0) + b(0);
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
      return { text: `${text}${circle !== 'lower' ? ` (${circle}-class company, ${CAROUSING_COST[circle]} GP)` : ''}`, gp: 0, notes, complication: complication(`Carousing:${circle}`) };
    }
    case 'Crime': {
      const target = CRIME_TARGETS.find((x) => x.dc === o.dc) ?? CRIME_TARGETS[0];
      const rolls = [0, 1, 2].map((i) => check(b(i), target.dc, i));
      const ok = rolls.filter((r) => r.ok).length;
      const list = rolls.map((r) => r.total).join(', ');
      if (ok === 0) return { text: `${list} vs DC ${target.dc}: caught. Fined ${target.gp} GP and jailed ${Math.ceil(target.gp / 25)} week(s)`, gp: -target.gp, notes: [], jailDays: Math.ceil(target.gp / 25) * 7 };
      if (ok === 1) return { text: `${list} vs DC ${target.dc}: you get away, empty-handed`, gp: 0, notes: [], complication: pickComplication('Crime') };
      if (ok === 2) return { text: `${list} vs DC ${target.dc}: a partial haul`, gp: target.gp / 2, notes: [], complication: complication('Crime') };
      return { text: `${list} vs DC ${target.dc}: a clean job`, gp: target.gp, notes: [], complication: complication('Crime') };
    }
    case 'Gambling': {
      const stake = Math.max(10, Math.min(1000, o.gp ?? 10));
      const rolls = [0, 1, 2].map((i) => {
        const dc = rolledDC(rng);
        const r = check(b(i), dc, i);
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
        // Xanathar's: the Constitution check adds a roll of the character's largest Hit Die (the die isn't spent).
        const r = check(b(i) + (i === 2 && o.hitDie ? die(o.hitDie, rng) : 0), dc, i);
        return { ok: r.ok, t: `${r.total}/${dc}` };
      });
      const ok = rolls.filter((r) => r.ok).length;
      const gp = [0, 50, 100, 200][ok];
      return { text: `${rolls.map((r) => r.t).join(', ')}: ${ok} win${ok === 1 ? '' : 's'}, ${gp} GP`, gp, notes: [], complication: complication() };
    }
    case 'Relaxation':
      return { text: 'a quiet week: Advantage on saves against a lingering disease or poison, and one effect that blocks healing can end', gp: 0, notes: [] };
    case 'Religious service': {
      const t = roll(0) + b(0);
      const n = t <= 10 ? 0 : t <= 20 ? 1 : 2;
      return { text: `${t}: ${n ? `${n} favor${n > 1 ? 's' : ''} earned with the temple` : 'no favors this time'}`, gp: 0, notes: Array.from({ length: n }, () => 'Temple favor owed'), complication: complication() };
    }
    case 'Research': {
      const spent = Math.max(RESEARCH_MIN_GP, o.gp ?? RESEARCH_MIN_GP);
      const bonus = researchBonus(spent);
      const book = o.book ? 5 : 0;
      const t = roll(0) + b(0) + bonus + book;
      const n = t <= 5 ? 0 : t <= 10 ? 1 : t <= 20 ? 2 : 3;
      return { text: `${t}${bonus ? ` (+${bonus} for ${spent} GP spent)` : ''}${book ? ' (+5 from an accurate Book)' : ''}: ${n ? `${n} piece${n > 1 ? 's' : ''} of lore (the DM supplies them)` : 'nothing useful'}`, gp: 0, notes: n ? [`Research: ${n} piece(s) of lore to collect from the DM`] : [], complication: complication() };
    }
    case 'Working a trade': {
      const t = roll(0) + b(0);
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

/** Xanathar's: research needs at least 50 GP a week; every 100 GP beyond the first 100 adds +1, to a maximum of +6. */
export const RESEARCH_MIN_GP = 50;
export const researchBonus = (spent: number): number => Math.min(6, Math.floor(Math.max(0, spent - 100) / 100));

/** Who can carouse in each circle (Xanathar's). */
export const CAROUSING_NEEDS: Record<'lower' | 'middle' | 'upper', string> = {
  lower: 'Anyone.',
  middle: 'Anyone who can pass among merchants and guild members.',
  upper: 'A noble background, a title, a known reputation, or a convincing disguise: the upper class doesn’t admit just anyone.',
};

/** Activities rolled once per workweek. Relaxation and training are one long stretch with no checks. */
export const WEEKLY: ActivityId[] = ['Carousing', 'Crime', 'Gambling', 'Pit fighting', 'Religious service', 'Research', 'Working a trade'];

/** Workweeks in a stretch of downtime days (Xanathar's workweek is 5 days). */
export const weeksIn = (days: number): number => Math.max(1, Math.floor(days / 5));

/**
 * Resolves an activity over its workweeks. Each week is its own set of checks and its own 10% complication chance,
 * and a character caught at a crime is jailed and does nothing more that stretch.
 */
export function resolveActivity(id: ActivityId, o: ActivityOpts, rng: Rng): ActivityResult {
  const weeks = WEEKLY.includes(id) ? Math.max(1, Math.round(o.weeks ?? 1)) : 1;
  if (weeks === 1) {
    const r = withSpending(id, o, resolveWeek(id, o, rng));
    return { ...r, complications: r.complication ? [r.complication] : [] };
  }
  const out: ActivityResult = { text: '', gp: 0, notes: [], complications: [], spent: 0 };
  const lines: string[] = [];
  for (let w = 1; w <= weeks; w++) {
    const r = withSpending(id, o, resolveWeek(id, o, rng));
    lines.push(`week ${w}: ${r.text}`);
    out.gp += r.gp;
    out.spent = (out.spent ?? 0) + (r.spent ?? 0);
    if (r.debt) out.debt = (out.debt ?? 0) + r.debt;
    out.notes.push(...r.notes);
    if (r.lifestyle) out.lifestyle = r.lifestyle;
    if (r.complication) out.complications!.push(r.complication);
    if (r.jailDays) {
      out.jailDays = r.jailDays;
      if (w < weeks) lines.push(`the remaining ${weeks - w} week${weeks - w > 1 ? 's are' : ' is'} spent behind bars`);
      break;
    }
  }
  out.text = lines.join('; ');
  out.complication = out.complications![0];
  return out;
}

/**
 * What an activity costs each week (Xanathar's): the company kept when carousing, the money spent on research.
 * The engine charges whatever the project's own cost didn't already cover.
 */
function withSpending(id: ActivityId, o: ActivityOpts, r: ActivityResult): ActivityResult {
  if (id === 'Carousing') return { ...r, spent: CAROUSING_COST[o.circle ?? 'lower'] };
  if (id === 'Research') return { ...r, spent: Math.max(RESEARCH_MIN_GP, o.gp ?? RESEARCH_MIN_GP) };
  return r;
}

// ---------------------------------------------------------------- buying and selling magic items (Xanathar's)

/**
 * Buying a Magic Item (Xanathar's): a workweek and 100 GP to search, Charisma (Persuasion), +1 for each extra workweek
 * and 100 GP spent, to a maximum of +10. The total decides which Magic Item table the sellers' wares come from.
 * The 2024 DMG sorts items by rarity, not tables, so the tables map to rarities here: A–E hold consumables and
 * other minor items (common to legendary), F–I permanent ones (uncommon to legendary). Totals of 15 or less mean the
 * seller asks one and a half times the price. Prices are the 2024 DMG values (consumables half).
 */
export const BUY_WEEK_GP = 100;
export const BUY_MAX_BONUS = 10;
export const BUY_TABLES: { min: number; table: string; rarity: Rarity; consumable: boolean }[] = [
  { min: 41, table: 'I', rarity: 'legendary', consumable: false },
  { min: 36, table: 'H', rarity: 'veryRare', consumable: false },
  { min: 31, table: 'G', rarity: 'rare', consumable: false },
  { min: 26, table: 'F', rarity: 'uncommon', consumable: false },
  { min: 21, table: 'E', rarity: 'legendary', consumable: true },
  { min: 16, table: 'D', rarity: 'veryRare', consumable: true },
  { min: 11, table: 'C', rarity: 'rare', consumable: true },
  { min: 6, table: 'B', rarity: 'uncommon', consumable: true },
  { min: -99, table: 'A', rarity: 'common', consumable: true },
];
const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'veryRare', 'legendary'];

/** The check total needed to find an item of this rarity (common permanent items sit on table A, Xanathar's). */
export function buyTotalNeeded(rarity: Rarity, consumable: boolean): number {
  if (rarity === 'common') return 1;
  const t = BUY_TABLES.find((x) => x.rarity === rarity && x.consumable === consumable) ?? BUY_TABLES.find((x) => x.rarity === rarity)!;
  return t.min;
}

export const magicPrice = (rarity: Rarity, consumable: boolean): number => MAGIC_ITEM_VALUE[rarity] / (consumable ? 2 : 1);

export interface Offer {
  label: string;
  gp: number;
  /** A shady buyer: no questions asked, and twice the usual complication chance (table rule). */
  shady?: boolean;
}

export interface DealResult {
  text: string;
  /** Search money spent (100 GP a week buying, 25 GP a week selling). */
  spent: number;
  offers: Offer[];
  complication?: Complication;
}

export function resolveBuying(o: { bonus: number; weeks: number; rarity: Rarity; consumable: boolean; advantage?: boolean }, rng: Rng): DealResult {
  const weeks = Math.max(1, Math.round(o.weeks));
  const extra = Math.min(BUY_MAX_BONUS, weeks - 1);
  const roll = d20(o.advantage ? 'advantage' : 'normal', rng).value;
  const total = roll + o.bonus + extra;
  const best = BUY_TABLES.find((t) => total >= t.min)!;
  const need = buyTotalNeeded(o.rarity, o.consumable);
  const markup = total <= 15 ? 1.5 : 1;
  const spent = weeks * BUY_WEEK_GP;
  const complication = die(10, rng) === 1 ? COMPLICATIONS['Buying a magic item'][die(COMPLICATIONS['Buying a magic item'].length, rng) - 1] : undefined;
  const head = `${total}${extra ? ` (+${extra} for ${weeks} weeks of searching)` : ''}: sellers' wares reach table ${best.table} (${best.consumable ? 'minor items' : 'permanent items'} up to ${best.rarity === 'veryRare' ? 'very rare' : best.rarity})`;
  if (total < need) return { text: `${head}. Nobody here has what you seek (it needed ${need}+)`, spent, offers: [], complication };
  const gp = magicPrice(o.rarity, o.consumable) * markup;
  return { text: `${head}. A seller has it${markup > 1 ? ', and knows how hard it was to find: one and a half times the price' : ''}`, spent, offers: [{ label: `Buy for ${gp.toLocaleString()} GP`, gp }], complication };
}

/** The weaker of two rarities, for comparing what was found with what was wanted. */
export const rarityAtMost = (a: Rarity, b: Rarity): boolean => RARITY_ORDER.indexOf(a) <= RARITY_ORDER.indexOf(b);

/**
 * Selling a Magic Item (Xanathar's): a workweek and 25 GP, and a DC 20 Intelligence (Investigation) check to find a
 * buyer (each week is a new try). Then d100 + Charisma (Persuasion) on the Magic Item Offer table, from the base price.
 */
export const SELL_WEEK_GP = 25;
export const SELL_FIND_DC = 20;
export function sellOffers(roll: number, base: number): Offer[] {
  if (roll <= 20) return [{ label: `A tenth of the price: ${base / 10} GP`, gp: base / 10 }];
  if (roll <= 40) return [{ label: `A quarter: ${base / 4} GP`, gp: base / 4 }, { label: `A shady buyer, half: ${base / 2} GP`, gp: base / 2, shady: true }];
  if (roll <= 80) return [{ label: `Half the price: ${base / 2} GP`, gp: base / 2 }, { label: `A shady buyer, the full price: ${base} GP`, gp: base, shady: true }];
  if (roll <= 90) return [{ label: `The full price: ${base} GP`, gp: base }];
  return [{ label: `A shady buyer, one and a half times the price: ${base * 1.5} GP, no questions asked`, gp: base * 1.5, shady: true }];
}

export function resolveSelling(o: { findBonus: number; offerBonus: number; weeks: number; rarity: Rarity; consumable: boolean }, rng: Rng): DealResult {
  const weeks = Math.max(1, Math.round(o.weeks));
  const tries: number[] = [];
  let found = false;
  for (let w = 0; w < weeks && !found; w++) {
    const t = d20('normal', rng).value + o.findBonus;
    tries.push(t);
    found = t >= SELL_FIND_DC;
  }
  const spent = tries.length * SELL_WEEK_GP;
  const list = tries.join(', ');
  const complication = die(10, rng) === 1 ? COMPLICATIONS['Selling a magic item'][die(COMPLICATIONS['Selling a magic item'].length, rng) - 1] : undefined;
  if (!found) return { text: `${list} vs DC ${SELL_FIND_DC}: no buyer turns up in ${weeks} week${weeks > 1 ? 's' : ''}`, spent, offers: [], complication };
  const base = magicPrice(o.rarity, o.consumable);
  const offer = die(100, rng) + o.offerBonus;
  return { text: `${list} vs DC ${SELL_FIND_DC}: a buyer found${tries.length < weeks ? ` in week ${tries.length}` : ''}. Offer roll ${offer} on a ${base.toLocaleString()} GP base price`, spent, offers: sellOffers(offer, base), complication };
}

export const activityOf = (name: string): ActivityId | null => {
  const ids: ActivityId[] = ['Carousing', 'Crime', 'Gambling', 'Pit fighting', 'Relaxation', 'Religious service', 'Research', 'Training', 'Working a trade'];
  return ids.find((x) => name.toLowerCase().startsWith(x.toLowerCase())) ?? null;
};

// ---------------------------------------------------------------- check bonuses from the character sheet

export interface SheetBonus {
  bonus: number;
  /** False when the ability score isn't on the sheet, so the bonus is only a guess (0 or the proficiency alone). */
  known: boolean;
  why: string;
}

type SheetChar = Pick<Character, 'abilities' | 'strScore' | 'conScore' | 'wisMod' | 'skillProfs' | 'toolProfs' | 'trainedProficiencies' | 'level'>;

/** Ability modifier plus Proficiency Bonus when proficient in the skill (2024 PHB). */
export function skillBonus(c: SheetChar, ab: AbilityKey, skill?: string): SheetBonus {
  const score = abilityScore(c, ab);
  const prof = skill ? hasSkill(c, skill) : false;
  const pb = prof ? proficiencyBonus(c.level) : 0;
  const mod = score == null ? 0 : abilityMod(score);
  return {
    bonus: mod + pb,
    known: score != null,
    why: `${ABILITY_LABEL[ab]}${skill ? ` (${skill})` : ''} ${score == null ? '(score not recorded)' : signed(mod)}${prof ? `, proficient +${pb}` : ''}`,
  };
}

function toolBonus(c: SheetChar, tool: string, ab: AbilityKey): SheetBonus {
  const score = abilityScore(c, ab);
  const prof = proficientWith(c, tool);
  const pb = prof ? proficiencyBonus(c.level) : 0;
  const mod = score == null ? 0 : abilityMod(score);
  return { bonus: mod + pb, known: score != null, why: `${ABILITY_LABEL[ab]} with ${tool} ${score == null ? '(score not recorded)' : signed(mod)}${prof ? `, proficient +${pb}` : ''}` };
}

const best = (...xs: SheetBonus[]): SheetBonus => xs.reduce((a, b) => (b.bonus > a.bonus ? b : a));

/** The best bonus a character has for each of an activity's checks, from the sheet. */
export function sheetBonuses(c: SheetChar, id: ActivityId | 'Buying a magic item' | 'Selling a magic item'): SheetBonus[] {
  switch (id) {
    case 'Carousing':
      return [skillBonus(c, 'cha', 'Persuasion')];
    case 'Crime':
      return [skillBonus(c, 'dex', 'Stealth'), toolBonus(c, "Thieves' Tools", 'dex'), best(skillBonus(c, 'int', 'Investigation'), skillBonus(c, 'wis', 'Perception'), skillBonus(c, 'cha', 'Deception'))];
    case 'Gambling':
      return [skillBonus(c, 'wis', 'Insight'), skillBonus(c, 'cha', 'Deception'), skillBonus(c, 'cha', 'Intimidation')];
    case 'Pit fighting':
      return [skillBonus(c, 'str', 'Athletics'), skillBonus(c, 'dex', 'Acrobatics'), skillBonus(c, 'con')];
    case 'Religious service':
      return [best(skillBonus(c, 'int', 'Religion'), skillBonus(c, 'cha', 'Persuasion'))];
    case 'Research':
      return [skillBonus(c, 'int')];
    case 'Working a trade': {
      const tools = toolProficiencies(c)
        .map((t) => toolNamed(t))
        .filter((t): t is NonNullable<typeof t> => !!t && (t.category === 'artisan' || t.category === 'instrument'))
        .map((t) => toolBonus(c, t.name, t.ability));
      return [best(skillBonus(c, 'cha', 'Performance'), skillBonus(c, 'str', 'Athletics'), ...tools)];
    }
    case 'Buying a magic item':
      return [skillBonus(c, 'cha', 'Persuasion')];
    case 'Selling a magic item':
      return [skillBonus(c, 'int', 'Investigation'), skillBonus(c, 'cha', 'Persuasion')];
    default:
      return [];
  }
}
