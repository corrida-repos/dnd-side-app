/**
 * Detailed NPCs (2024 DMG, chapter 3): name, stat block, alignment, personality, appearance and secret.
 * Personality follows the 2024 PHB "Personality Traits by Alignment" table: one trait for each part of the alignment.
 * Stat blocks are 2024 Monster Manual NPCs.
 */
import { die, type Rng } from './dice';

/** 2024 DMG name tables: roll 1d6 for the table, then 1d12 for the given name and 1d12 for the surname. */
export const NAME_TABLES: { style: string; given: string[]; surname: string[] }[] = [
  { style: 'Common', given: ['Adrik', 'Alvyn', 'Aurora', 'Eldeth', 'Eldon', 'Farris', 'Kathra', 'Kellen', 'Lily', 'Nissa', 'Xinli', 'Zorra'], surname: ['Brightsun', 'Dundragon', 'Frostbeard', 'Garrick', 'Goodbarrel', 'Greycastle', 'Ironfist', 'Jaerin', 'Merryweather', 'Redthorn', 'Stormriver', 'Wren'] },
  { style: 'Guttural', given: ['Abzug', 'Bajok', 'Bharash', 'Grovis', 'Gruuna', 'Hokrun', 'Mardred', 'Rhogar', 'Skuldark', 'Thokk', 'Urzul', 'Varka'], surname: ['Burska', 'Gruuthok', 'Hrondl', 'Jarzzok', 'Kraltus', 'Shamog', 'Skrangval', 'Ungart', 'Uuthrakt', 'Vrakir', 'Yuldra', 'Zulrax'] },
  { style: 'Lyrical', given: ['Arannis', 'Damaia', 'Darsis', 'Dweomer', 'Evabeth', 'Jhessail', 'Keyleth', 'Netheria', 'Orianna', 'Sorcyl', 'Umarion', 'Velissa'], surname: ['Arvannis', 'Brawnanvil', 'Daardendrian', 'Drachedandion', 'Endryss', 'Meliamne', 'Mishann', 'Silverfrond', 'Snowmantle', 'Summerbreeze', 'Thunderfoot', 'Zashir'] },
  { style: 'Monosyllabic', given: ['Chen', 'Creel', 'Dain', 'Dorn', 'Flint', 'Glim', 'Henk', 'Krusk', 'Nox', 'Nyx', 'Rukh', 'Shan'], surname: ['Dench', 'Drog', 'Dusk', 'Holg', 'Horn', 'Imsh', 'Jask', 'Keth', 'Ku', 'Kung', 'Mott', 'Quaal'] },
  { style: 'Sinister', given: ['Arachne', 'Axyss', 'Carrion', 'Grinnus', 'Melkhis', 'Morthos', 'Nadir', 'Scandal', 'Skellendyre', 'Thaltus', 'Valkora', 'Vexander'], surname: ['Doomwhisper', 'Dreadfield', 'Gallows', 'Hellstryke', 'Killraven', 'Nightblade', 'Norixius', 'Shadowfang', 'Valtar', 'Winterspell', 'Xandros', 'Zarkynzorn'] },
  { style: 'Whimsical', given: ['Cricket', 'Daisy', 'Dimble', 'Ellywick', 'Erky', 'Fiddlestyx', 'Fonkin', 'Golly', 'Mimsy', 'Pumpkin', 'Quarrel', 'Sybilwick'], surname: ['Borogove', 'Goldjoy', 'Hoddypeak', 'Huddle', 'Jollywind', 'Oneshoe', 'Scramblewise', 'Sunnyhill', 'Tallgrass', 'Timbers', 'Underbough', 'Wimbly'] },
];

/** 2024 DMG NPC Appearance (d12). */
export const APPEARANCE = [
  'Distinctive jewelry',
  'Flamboyant, outlandish, formal, or ragged clothes',
  'Uses an elegant mobility device (wheelchair, brace, or cane)',
  'Pronounced scar',
  'Unusual eye color (or two different colors)',
  'Tattoos or piercings',
  'Birthmark',
  'Unusual hair color',
  'Bald, or braided beard or hair',
  'Distinctive nose (large, bulbous, angular, small)',
  'Distinctive posture (stooped or rigid)',
  'Exceptionally beautiful or ugly',
];

/** 2024 DMG NPC Secrets (d10). */
export const SECRETS = [
  'In disguise, concealing their identity or some aspect of their appearance.',
  'Currently planning, executing, or covering up a crime.',
  'They (or their family) have been threatened with harm unless they do something.',
  'Under a magical compulsion (perhaps a Geas spell or some kind of curse) to behave in a certain way.',
  'Seriously ill or in terrible pain.',
  'Feels responsible for someone’s death or ill fortune.',
  'On the brink of financial ruin.',
  'Desperately lonely or harboring an unrequited passion.',
  'Nurses a powerful ambition.',
  'Deeply dissatisfied or unhappy.',
];

/** 2024 PHB Personality Traits by Alignment (d4 each). */
export const ALIGNMENT_TRAITS: Record<'L' | 'N' | 'C' | 'G' | 'E', string[]> = {
  C: ['Boastful', 'Impulsive', 'Rebellious', 'Self-absorbed'],
  G: ['Compassionate', 'Helpful', 'Honest', 'Kind'],
  E: ['Dishonest', 'Vengeful', 'Cruel', 'Greedy'],
  L: ['Cooperative', 'Loyal', 'Judgmental', 'Methodical'],
  N: ['Selfish', 'Disinterested', 'Laconic', 'Pragmatic'],
};

/** 2024 Monster Manual NPC stat blocks used for townsfolk: CR and passive Perception, for quick reference. */
export const STAT_BLOCKS: Record<string, { cr: string; pp: number; ac: number; hp: number }> = {
  Commoner: { cr: '0', pp: 10, ac: 10, hp: 4 },
  Noble: { cr: '1/8', pp: 12, ac: 15, hp: 9 },
  Guard: { cr: '1/8', pp: 12, ac: 16, hp: 11 },
  'Warrior Infantry': { cr: '1/8', pp: 10, ac: 13, hp: 9 },
  Bandit: { cr: '1/8', pp: 10, ac: 12, hp: 11 },
  'Priest Acolyte': { cr: '1/4', pp: 12, ac: 13, hp: 11 },
  Scout: { cr: '1/2', pp: 15, ac: 13, hp: 16 },
  Tough: { cr: '1/2', pp: 10, ac: 12, hp: 32 },
  Performer: { cr: '1/2', pp: 12, ac: 13, hp: 27 },
  Spy: { cr: '1', pp: 16, ac: 12, hp: 27 },
  Priest: { cr: '2', pp: 15, ac: 13, hp: 38 },
  'Mage Apprentice': { cr: '2', pp: 13, ac: 15, hp: 49 },
  'Bandit Captain': { cr: '2', pp: 10, ac: 15, hp: 52 },
  Druid: { cr: '2', pp: 15, ac: 13, hp: 44 },
  'Warrior Veteran': { cr: '3', pp: 12, ac: 17, hp: 65 },
  Knight: { cr: '3', pp: 10, ac: 18, hp: 52 },
  'Scout Captain': { cr: '3', pp: 16, ac: 15, hp: 66 },
  'Guard Captain': { cr: '4', pp: 14, ac: 18, hp: 75 },
  'Tough Boss': { cr: '4', pp: 10, ac: 16, hp: 82 },
  Gladiator: { cr: '5', pp: 11, ac: 16, hp: 112 },
  Mage: { cr: '6', pp: 14, ac: 15, hp: 81 },
  'Performer Maestro': { cr: '6', pp: 15, ac: 18, hp: 110 },
  Assassin: { cr: '8', pp: 16, ac: 16, hp: 97 },
  'Spy Master': { cr: '10', pp: 21, ac: 19, hp: 137 },
  'Warrior Commander': { cr: '10', pp: 17, ac: 18, hp: 161 },
  'Bandit Crime Lord': { cr: '11', pp: 20, ac: 17, hp: 169 },
  Archmage: { cr: '12', pp: 16, ac: 17, hp: 170 },
  Archpriest: { cr: '12', pp: 19, ac: 16, hp: 240 },
};

/**
 * Leaning of an NPC's alignment by their line of work (table rule; the DMG says to choose one).
 * Each axis lists weights: law [Lawful, Neutral, Chaotic], morals [Good, Neutral, Evil].
 */
export type Lean = 'any' | 'lawful' | 'good' | 'devout' | 'shady' | 'criminal';
const LEANS: Record<Lean, { law: [number, number, number]; moral: [number, number, number] }> = {
  any: { law: [1, 2, 1], moral: [1, 2, 1] },
  lawful: { law: [3, 2, 0.5], moral: [1, 2, 1] },
  good: { law: [1, 2, 1], moral: [3, 2, 0.5] },
  devout: { law: [2, 1, 1], moral: [4, 2, 0.3] },
  shady: { law: [0.5, 2, 2], moral: [0.5, 2, 1.5] },
  criminal: { law: [0.5, 1, 3], moral: [0.2, 1.5, 3] },
};

const weighted = <T,>(opts: T[], w: number[], rng: Rng): T => {
  let r = rng() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < opts.length; i++) if ((r -= w[i]) < 0) return opts[i];
  return opts[opts.length - 1];
};

export type AlignCode = 'LG' | 'NG' | 'CG' | 'LN' | 'N' | 'CN' | 'LE' | 'NE' | 'CE';
export const ALIGN_LABEL: Record<AlignCode, string> = { LG: 'Lawful Good', NG: 'Neutral Good', CG: 'Chaotic Good', LN: 'Lawful Neutral', N: 'Neutral', CN: 'Chaotic Neutral', LE: 'Lawful Evil', NE: 'Neutral Evil', CE: 'Chaotic Evil' };

export function rollAlignment(lean: Lean, rng: Rng): AlignCode {
  const l = weighted(['L', 'N', 'C'], LEANS[lean].law, rng);
  const m = weighted(['G', 'N', 'E'], LEANS[lean].moral, rng);
  if (l === 'N' && m === 'N') return 'N';
  return `${l}${m}` as AlignCode;
}

/** One trait for each part of the alignment (a Neutral NPC gets two Neutral traits). */
export function rollTraits(a: AlignCode, rng: Rng): string[] {
  const parts = (a === 'N' ? ['N', 'N'] : a.split('')) as (keyof typeof ALIGNMENT_TRAITS)[];
  const out: string[] = [];
  for (const p of parts) {
    const opts = ALIGNMENT_TRAITS[p].filter((t) => !out.includes(t));
    out.push(opts[die(opts.length, rng) - 1]);
  }
  return out;
}

export function rollName(rng: Rng, style?: string): string {
  const t = NAME_TABLES.find((x) => x.style === style) ?? NAME_TABLES[die(6, rng) - 1];
  return `${t.given[die(12, rng) - 1]} ${t.surname[die(12, rng) - 1]}`;
}

export interface Npc {
  name: string;
  /** What they do here: innkeeper, high priest, captain of the watch. */
  role?: string;
  /** 2024 Monster Manual stat block. */
  stat?: string;
  align?: AlignCode;
  traits?: string[];
  appearance?: string;
  /** DM only. */
  secret?: string;
}

/**
 * A named NPC per the 2024 DMG: name (d6 table, d12 + d12), stat block, alignment, a PHB trait per alignment part,
 * one standout feature of their appearance, and a secret.
 */
export function rollNpc(role: string, stat: string, lean: Lean, rng: Rng, style?: string): Npc {
  const align = rollAlignment(lean, rng);
  return {
    name: rollName(rng, style),
    role,
    stat,
    align,
    traits: rollTraits(align, rng),
    appearance: APPEARANCE[die(12, rng) - 1],
    secret: SECRETS[die(10, rng) - 1],
  };
}

/** One line describing an NPC for the DM: "Lawful Good, loyal and kind. Pronounced scar." */
export function npcLine(n: Npc): string {
  const bits: string[] = [];
  if (n.align) bits.push(`${ALIGN_LABEL[n.align]}${n.traits?.length ? `, ${n.traits.map((t) => t.toLowerCase()).join(' and ')}` : ''}.`);
  if (n.appearance) bits.push(`${n.appearance}.`);
  return bits.join(' ');
}

export const statLine = (stat: string | undefined): string => {
  const s = stat ? STAT_BLOCKS[stat] : undefined;
  return stat ? `${stat}${s ? ` (CR ${s.cr}, AC ${s.ac}, HP ${s.hp}, passive Perception ${s.pp})` : ''}` : '';
};
