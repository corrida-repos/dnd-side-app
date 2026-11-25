/**
 * Adventuring gear and tools from the 2024 Player's Handbook (chapter 6), as 5etools publishes them:
 * what's inside each pack, every tool with its ability and Utilize checks, tool proficiency, gear that gets
 * used up (light fuel, Healer's Kit uses), and the gear that matters on the app's clock (tents, shovels,
 * hunting traps, stabling, saddles, caltrops and ball bearings). Table rules are marked as such.
 */
import { abilityMod } from './upkeep';
import { proficiencyBonus } from './survival';
import type { Character } from '../state/types';
import type { TerrainType } from './terrain';

// ---------------------------------------------------------------- packs

export interface PackItem {
  name: string;
  qty: number;
}

/** The 2024 PHB equipment packs and what each holds. */
export const PACKS: Record<string, PackItem[]> = {
  "Burglar's Pack": [
    { name: 'Backpack', qty: 1 },
    { name: 'Ball Bearings', qty: 1 },
    { name: 'Bell', qty: 1 },
    { name: 'Candle', qty: 10 },
    { name: 'Crowbar', qty: 1 },
    { name: 'Hooded Lantern', qty: 1 },
    { name: 'Oil', qty: 7 },
    { name: 'Rations', qty: 5 },
    { name: 'Rope', qty: 1 },
    { name: 'Tinderbox', qty: 1 },
    { name: 'Waterskin', qty: 1 },
  ],
  "Diplomat's Pack": [
    { name: 'Chest', qty: 1 },
    { name: 'Fine Clothes', qty: 1 },
    { name: 'Ink', qty: 1 },
    { name: 'Ink Pen', qty: 5 },
    { name: 'Lamp', qty: 1 },
    { name: 'Map or Scroll Case', qty: 2 },
    { name: 'Oil', qty: 4 },
    { name: 'Paper', qty: 5 },
    { name: 'Parchment', qty: 5 },
    { name: 'Perfume', qty: 1 },
    { name: 'Tinderbox', qty: 1 },
  ],
  "Dungeoneer's Pack": [
    { name: 'Backpack', qty: 1 },
    { name: 'Caltrops', qty: 1 },
    { name: 'Crowbar', qty: 1 },
    { name: 'Oil', qty: 2 },
    { name: 'Rations', qty: 10 },
    { name: 'Rope', qty: 1 },
    { name: 'Tinderbox', qty: 1 },
    { name: 'Torch', qty: 10 },
    { name: 'Waterskin', qty: 1 },
  ],
  "Entertainer's Pack": [
    { name: 'Backpack', qty: 1 },
    { name: 'Bedroll', qty: 1 },
    { name: 'Bell', qty: 1 },
    { name: 'Bullseye Lantern', qty: 1 },
    { name: 'Costume', qty: 3 },
    { name: 'Mirror', qty: 1 },
    { name: 'Oil', qty: 8 },
    { name: 'Rations', qty: 9 },
    { name: 'Tinderbox', qty: 1 },
    { name: 'Waterskin', qty: 1 },
  ],
  "Explorer's Pack": [
    { name: 'Backpack', qty: 1 },
    { name: 'Bedroll', qty: 1 },
    { name: 'Oil', qty: 2 },
    { name: 'Rations', qty: 10 },
    { name: 'Rope', qty: 1 },
    { name: 'Tinderbox', qty: 1 },
    { name: 'Torch', qty: 10 },
    { name: 'Waterskin', qty: 1 },
  ],
  "Priest's Pack": [
    { name: 'Backpack', qty: 1 },
    { name: 'Blanket', qty: 1 },
    { name: 'Holy Water', qty: 1 },
    { name: 'Lamp', qty: 1 },
    { name: 'Rations', qty: 7 },
    { name: 'Robe', qty: 1 },
    { name: 'Tinderbox', qty: 1 },
  ],
  "Scholar's Pack": [
    { name: 'Backpack', qty: 1 },
    { name: 'Book', qty: 1 },
    { name: 'Ink', qty: 1 },
    { name: 'Ink Pen', qty: 1 },
    { name: 'Lamp', qty: 1 },
    { name: 'Oil', qty: 10 },
    { name: 'Parchment', qty: 10 },
    { name: 'Tinderbox', qty: 1 },
  ],
};

const norm = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

/** The pack an inventory line names, e.g. "Explorer's Pack" or "explorers pack". */
export function packNamed(name: string): string | null {
  const n = norm(name).replace(/'/g, '');
  return Object.keys(PACKS).find((k) => norm(k).replace(/'/g, '') === n) ?? null;
}

/** Rations and Waterskins feed the food and water trackers instead of sitting in the inventory. */
export const RATIONS = /^(?:days? of )?rations?(?: \((?:1 day|\d+ days?)\))?$|^rations?,? \d+ days?$/i;
export const WATERSKIN = /^waterskins?$/i;
/** A Waterskin holds 4 pints (2024 PHB). */
export const WATERSKIN_PINTS = 4;

// ---------------------------------------------------------------- tools

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export const ABILITY_LABEL: Record<AbilityKey, string> = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' };

export const SKILLS = [
  'Acrobatics',
  'Animal Handling',
  'Arcana',
  'Athletics',
  'Deception',
  'History',
  'Insight',
  'Intimidation',
  'Investigation',
  'Medicine',
  'Nature',
  'Perception',
  'Performance',
  'Persuasion',
  'Religion',
  'Sleight of Hand',
  'Stealth',
  'Survival',
] as const;
export type Skill = (typeof SKILLS)[number];

export interface UtilizeUse {
  /** What you can do with the tool as a Utilize action (2024 PHB wording). */
  text: string;
  dc: number;
  /** A skill that commonly also applies, giving Advantage when proficient in both (the DM decides). */
  skill?: Skill;
  /** What success looks like, in the world. */
  success: string;
  /** What failure looks like, in the world. */
  failure: string;
  /** Minutes it takes on the app's clock (table rule; most uses take moments). */
  minutes?: number;
  /** Starts a timed effect on the user when it succeeds. */
  effect?: { name: string; minutes: number; note: string };
}

export type ToolCategory = 'artisan' | 'gaming' | 'instrument' | 'other';

export interface ToolInfo {
  name: string;
  category: ToolCategory;
  ability: AbilityKey;
  uses: UtilizeUse[];
  /** Other names it goes by (D&D Beyond, older books). */
  aliases?: string[];
}

const GAME_USES: UtilizeUse[] = [
  { text: 'Discern whether someone is cheating', dc: 10, skill: 'Insight', success: 'spots the palmed card, the weighted die, the signal across the table', failure: 'sees nothing amiss, and the game goes on' },
  { text: 'Win the game', dc: 20, skill: 'Insight', success: 'reads the table and takes the pot', failure: 'loses the hand and the stake with it', minutes: 30 },
];
const TUNE_USES: UtilizeUse[] = [
  { text: 'Play a known tune', dc: 10, skill: 'Performance', success: 'plays it cleanly, and listeners hum along', failure: 'stumbles through it; a few wince', minutes: 5 },
  { text: 'Improvise a song', dc: 15, skill: 'Performance', success: 'spins a new song on the spot that the room remembers', failure: 'loses the thread halfway and trails off', minutes: 5 },
];

const game = (name: string, aliases?: string[]): ToolInfo => ({ name, category: 'gaming', ability: 'wis', uses: GAME_USES, aliases });
const instrument = (name: string, aliases?: string[]): ToolInfo => ({ name, category: 'instrument', ability: 'cha', uses: TUNE_USES, aliases });

/** Every 2024 PHB tool, with its ability and Utilize entries. Each gaming set and instrument needs its own proficiency. */
export const TOOLS: ToolInfo[] = [
  {
    name: "Alchemist's Supplies",
    category: 'artisan',
    ability: 'int',
    uses: [
      { text: 'Identify a substance', dc: 15, skill: 'Arcana', success: 'names the substance from its smell, colour and how it reacts', failure: 'can’t tell what it is', minutes: 10 },
      { text: 'Start a fire', dc: 15, success: 'mixes reagents that flare into flame', failure: 'gets only smoke and a sharp smell', minutes: 1 },
    ],
  },
  {
    name: "Brewer's Supplies",
    category: 'artisan',
    ability: 'int',
    uses: [
      { text: 'Detect poisoned drink', dc: 15, skill: 'Medicine', success: 'tastes something wrong under the flavour', failure: 'can’t tell anything is wrong' },
      { text: 'Identify alcohol', dc: 10, success: 'names the drink, its strength and roughly where it was made', failure: 'knows only that it’s strong' },
    ],
  },
  {
    name: "Calligrapher's Supplies",
    category: 'artisan',
    ability: 'dex',
    uses: [{ text: 'Write text with impressive flourishes that guard against forgery', dc: 15, success: 'writes in a hand so ornate it would be hard to copy', failure: 'produces fine writing, but nothing a forger couldn’t copy', minutes: 30 }],
  },
  {
    name: "Carpenter's Tools",
    category: 'artisan',
    ability: 'str',
    uses: [{ text: 'Seal or pry open a door or container', dc: 20, skill: 'Athletics', success: 'gets it sealed shut, or the boards give with a groan', failure: 'the wood holds', minutes: 1 }],
  },
  {
    name: "Cartographer's Tools",
    category: 'artisan',
    ability: 'wis',
    uses: [{ text: 'Draft a map of a small area', dc: 15, skill: 'Survival', success: 'draws a map good enough to steer by (see Travel)', failure: 'gets a muddle of lines', minutes: 60 }],
  },
  {
    name: "Cobbler's Tools",
    category: 'artisan',
    ability: 'dex',
    uses: [
      {
        text: "Modify footwear to give Advantage on the wearer's next Dexterity (Acrobatics) check",
        dc: 10,
        success: 'reworks the soles for grip and spring',
        failure: 'the boots are no better than before',
        minutes: 10,
        effect: { name: 'Reworked boots', minutes: 24 * 60, note: "Advantage on the wearer's next Dexterity (Acrobatics) check. End it once used." },
      },
    ],
  },
  {
    name: "Cook's Utensils",
    category: 'artisan',
    ability: 'wis',
    uses: [
      { text: "Improve food's flavor", dc: 10, success: 'turns plain fare into something people ask about', failure: 'makes it edible, no more', minutes: 30 },
      { text: 'Detect spoiled or poisoned food', dc: 15, skill: 'Medicine', success: 'notices the off smell or the wrong colour', failure: 'finds nothing wrong' },
    ],
  },
  {
    name: "Glassblower's Tools",
    category: 'artisan',
    ability: 'int',
    uses: [{ text: 'Discern what a glass object held in the past 24 hours', dc: 15, skill: 'Investigation', success: 'reads the residue and knows what it held', failure: 'can’t tell from the traces' }],
  },
  {
    name: "Jeweler's Tools",
    category: 'artisan',
    ability: 'int',
    uses: [{ text: "Discern a gem's value", dc: 15, skill: 'Investigation', success: 'knows what the gem is worth (see Appraise in Gear)', failure: 'can’t judge it' }],
  },
  {
    name: "Leatherworker's Tools",
    category: 'artisan',
    ability: 'dex',
    uses: [{ text: 'Add a design to a leather item', dc: 10, success: 'tools a clean design into the leather', failure: 'the design comes out crooked', minutes: 60 }],
  },
  {
    name: "Mason's Tools",
    category: 'artisan',
    ability: 'str',
    uses: [{ text: 'Chisel a symbol or hole in stone', dc: 10, skill: 'Athletics', success: 'cuts a clean mark or hole', failure: 'chips the stone without getting far', minutes: 10 }],
  },
  {
    name: "Painter's Supplies",
    category: 'artisan',
    ability: 'wis',
    uses: [{ text: "Paint a recognizable image of something you've seen", dc: 10, success: 'paints a likeness anyone would recognise', failure: 'paints something no one could name', minutes: 60 }],
  },
  {
    name: "Potter's Tools",
    category: 'artisan',
    ability: 'int',
    uses: [{ text: 'Discern what a ceramic object held in the past 24 hours', dc: 15, skill: 'Investigation', success: 'reads the stain and smell and knows what it held', failure: 'can’t tell from the traces' }],
  },
  {
    name: "Smith's Tools",
    category: 'artisan',
    ability: 'str',
    uses: [{ text: 'Pry open a door or container', dc: 20, skill: 'Athletics', success: 'the hinge or hasp gives way', failure: 'the metal holds', minutes: 1 }],
  },
  {
    name: "Tinker's Tools",
    category: 'artisan',
    ability: 'dex',
    uses: [
      {
        text: 'Assemble a Tiny item composed of scrap, which falls apart in 1 minute',
        dc: 20,
        success: 'cobbles together a working gadget from scrap',
        failure: 'the parts won’t hold together',
        effect: { name: 'Scrap gadget', minutes: 1, note: 'A Tiny item made of scrap. It falls apart after 1 minute.' },
      },
    ],
  },
  {
    name: "Weaver's Tools",
    category: 'artisan',
    ability: 'dex',
    uses: [
      { text: 'Mend a tear in clothing', dc: 10, success: 'stitches the tear closed (see Damaged gear)', failure: 'the stitches pull loose', minutes: 10 },
      { text: 'Sew a Tiny design', dc: 10, success: 'sews a neat little design', failure: 'the stitching is lumpy', minutes: 30 },
    ],
  },
  {
    name: "Woodcarver's Tools",
    category: 'artisan',
    ability: 'dex',
    uses: [{ text: 'Carve a pattern in wood', dc: 10, success: 'carves a crisp pattern', failure: 'splits the grain', minutes: 30 }],
  },
  {
    name: 'Disguise Kit',
    category: 'other',
    ability: 'cha',
    uses: [
      {
        text: 'Apply makeup',
        dc: 10,
        skill: 'Deception',
        success: 'changes the face in the mirror convincingly',
        failure: 'the makeup looks like makeup',
        minutes: 10,
        effect: { name: 'Disguised', minutes: 8 * 60, note: 'Makeup applied with a Disguise Kit. A Costume also gives Advantage on checks to impersonate who it represents.' },
      },
    ],
  },
  {
    name: 'Forgery Kit',
    category: 'other',
    ability: 'dex',
    uses: [
      { text: "Mimic 10 or fewer words of someone else's handwriting", dc: 15, skill: 'Deception', success: 'copies the hand well enough to pass a glance', failure: 'the letters look wrong to anyone who knows the hand', minutes: 10 },
      { text: 'Duplicate a wax seal', dc: 20, skill: 'Deception', success: 'makes a seal that matches the original', failure: 'the seal is off in some small, telling way', minutes: 30 },
    ],
  },
  {
    name: 'Herbalism Kit',
    category: 'other',
    ability: 'int',
    uses: [{ text: 'Identify a plant', dc: 10, skill: 'Nature', success: 'names the plant and whether it heals or harms', failure: 'can’t place it' }],
  },
  {
    name: "Navigator's Tools",
    category: 'other',
    ability: 'wis',
    uses: [
      { text: 'Plot a course', dc: 10, skill: 'Survival', success: 'plots a sound course (see Travel)', failure: 'can’t settle on a heading', minutes: 10 },
      { text: 'Determine position by stargazing', dc: 15, skill: 'Survival', success: 'fixes the party’s position from the stars (see Travel)', failure: 'can’t make the sightings agree', minutes: 10 },
    ],
  },
  {
    name: "Poisoner's Kit",
    category: 'other',
    ability: 'int',
    uses: [{ text: 'Detect a poisoned object', dc: 10, skill: 'Medicine', success: 'finds the tell-tale residue', failure: 'finds nothing' }],
  },
  {
    name: "Thieves' Tools",
    category: 'other',
    ability: 'dex',
    uses: [
      { text: 'Pick a lock', dc: 15, skill: 'Sleight of Hand', success: 'feels the last pin set and the lock turn', failure: 'the lock won’t give', minutes: 1 },
      { text: 'Disarm a trap', dc: 15, skill: 'Sleight of Hand', success: 'jams the mechanism safely', failure: 'can’t find a safe way to disarm it', minutes: 1 },
    ],
  },
  game('Dice Set', ['Dice']),
  game('Dragonchess Set', ['Dragonchess']),
  game('Playing Cards', ['Playing Card Set', 'Playing Card']),
  game('Three-Dragon Ante Set', ['Three-Dragon Ante', 'Three Dragon Ante Set']),
  instrument('Bagpipes'),
  instrument('Drum'),
  instrument('Dulcimer'),
  instrument('Flute'),
  instrument('Horn'),
  instrument('Lute'),
  instrument('Lyre'),
  instrument('Pan Flute'),
  instrument('Shawm'),
  instrument('Viol'),
];

const toolKey = (s: string): string => norm(s).replace(/'/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

/** The 2024 tool a name refers to, e.g. "thieves tools" or "Playing Card Set". */
export function toolNamed(name: string): ToolInfo | undefined {
  const k = toolKey(name);
  return TOOLS.find((t) => toolKey(t.name) === k || (t.aliases ?? []).some((a) => toolKey(a) === k));
}

/** Does this inventory line hold the tool? */
export const carriesTool = (c: Pick<Character, 'inventory'>, tool: string): boolean => {
  const t = toolNamed(tool);
  const keys = t ? [t.name, ...(t.aliases ?? [])].map(toolKey) : [toolKey(tool)];
  return c.inventory.some((i) => i.qty > 0 && keys.some((k) => toolKey(i.name).includes(k)));
};

/** Tools the character is proficient with: their list plus anything learned in downtime. */
export function toolProficiencies(c: Pick<Character, 'toolProfs' | 'trainedProficiencies'>): string[] {
  return [...(c.toolProfs ?? []), ...(c.trainedProficiencies ?? [])];
}

/** Proficient with this tool? Null when the character's tool proficiencies have never been recorded. */
export function proficientWith(c: Pick<Character, 'toolProfs' | 'trainedProficiencies'>, tool: string): boolean | null {
  const all = toolProficiencies(c);
  if (c.toolProfs === undefined && !all.length) return null;
  const t = toolNamed(tool);
  const want = t ? t.name : tool;
  return all.some((p) => {
    const pt = toolNamed(p);
    return pt ? pt.name === want : toolKey(p) === toolKey(want);
  });
}

/** Sorts tool pickers with proficient, equipped characters first. */
export function toolReadiness(c: Character, tool: string): number {
  return (proficientWith(c, tool) ? 2 : 0) + Number(carriesTool(c, tool));
}

/** Proficient in this skill? Null when the character's skills have never been recorded. */
export function hasSkill(c: Pick<Character, 'skillProfs'>, skill: string): boolean | null {
  if (c.skillProfs === undefined) return null;
  return c.skillProfs.some((s) => s.toLowerCase() === skill.toLowerCase());
}

/** An ability score as recorded, falling back to the fields the tracker always keeps. */
export function abilityScore(c: Pick<Character, 'abilities' | 'strScore' | 'conScore' | 'wisMod'>, a: AbilityKey): number | null {
  const v = c.abilities?.[a];
  if (typeof v === 'number') return v;
  if (a === 'str') return c.strScore;
  if (a === 'con') return c.conScore;
  if (a === 'wis') return 10 + 2 * c.wisMod;
  return null;
}

export interface ToolCheck {
  /** Ability modifier, plus Proficiency Bonus if proficient. Null when the ability score isn't known. */
  bonus: number | null;
  proficient: boolean | null;
  /** 2024 PHB: proficient with the tool and with a skill that also applies gives Advantage. */
  advantage: boolean;
  /** Short explanation for the screen. */
  why: string;
}

/** The 2024 PHB tool check: ability modifier + Proficiency Bonus if proficient, and Advantage if a skill also applies. */
export function toolCheck(c: Character, tool: string, ability?: AbilityKey, skill?: string): ToolCheck {
  const t = toolNamed(tool);
  const ab = ability ?? t?.ability ?? 'int';
  const prof = proficientWith(c, tool);
  const score = abilityScore(c, ab);
  const pb = proficiencyBonus(c.level);
  const bonus = score == null ? null : abilityMod(score) + (prof ? pb : 0);
  const sk = skill ? hasSkill(c, skill) : null;
  const advantage = !!prof && !!sk;
  const parts = [
    `${ABILITY_LABEL[ab]}${score == null ? ' (score not recorded)' : ` ${abilityMod(score) >= 0 ? '+' : ''}${abilityMod(score)}`}`,
    prof ? `proficient (+${pb})` : prof === false ? 'not proficient' : 'proficiency not recorded',
    ...(skill ? [sk ? `${skill} too: Advantage` : sk === false ? `no ${skill}` : `${skill} not recorded`] : []),
  ];
  return { bonus, proficient: prof, advantage, why: parts.join(', ') };
}

// ---------------------------------------------------------------- light and fuel

export type LightFuel = 'torch' | 'makeshift' | 'candle' | 'oil';

export const FUEL_MATCH: Record<LightFuel, RegExp> = {
  torch: /^torch(?:es)?$/i,
  makeshift: /^makeshift torch(?:es)?$/i,
  candle: /^candles?$/i,
  oil: /^(?:oil|oil \(flask\)|flasks? of oil|lamp oil)$/i,
};
export const FUEL_LABEL: Record<LightFuel, string> = { torch: 'a Torch', makeshift: 'a Makeshift Torch', candle: 'a Candle', oil: 'a flask of Oil' };

/** Oil burns 6 hours in a Lamp or Lantern, and can be put out and relit until it has burned 6 hours in all (2024 PHB). */
export const OIL_MINUTES = 6 * 60;
/** Lamps and lanterns that burn Oil, by the light preset's name. */
export const VESSEL_MATCH: { preset: RegExp; item: RegExp; label: string }[] = [
  { preset: /^lamp/i, item: /^lamps?$/i, label: 'a Lamp' },
  { preset: /^hooded lantern/i, item: /hooded lantern/i, label: 'a Hooded Lantern' },
  { preset: /^bullseye lantern/i, item: /bullseye lantern/i, label: 'a Bullseye Lantern' },
];
/** Which fuel a light preset burns. */
export function fuelFor(presetName: string): LightFuel | null {
  if (/^torch/i.test(presetName)) return 'torch';
  if (/^makeshift torch/i.test(presetName)) return 'makeshift';
  if (/^candle/i.test(presetName)) return 'candle';
  if (VESSEL_MATCH.some((v) => v.preset.test(presetName))) return 'oil';
  return null;
}
/** A light that burns Oil can be snuffed and relit; other lights burn until they're gone. */
export const isOilLight = (name: string): boolean => /\b(?:lamp|lantern)\b/i.test(name) && !/continual|light \(cantrip\)/i.test(name);
/** A Hooded Lantern's hood can be lowered to Dim Light in a 5-foot radius (2024 PHB). */
export const isHooded = (name: string): boolean => /hooded lantern/i.test(name);

// ---------------------------------------------------------------- Healer's Kit

export const HEALERS_KIT = /healer'?s kit/i;
/** A Healer's Kit has ten uses (2024 PHB). */
export const HEALERS_KIT_USES = 10;

// ---------------------------------------------------------------- camp and travel gear

/** A Tent sleeps up to two Small or Medium creatures (2024 PHB). */
export const TENT_SLEEPS = 2;
export const TENT = /^(?:tents?|tent, two-person)$/i;

/** Working for an hour with a Shovel digs a hole 5 feet on each side in soil (2024 PHB). */
export const SHOVEL = /^shovels?$/i;
export const SHOVEL_MINUTES = 60;
/** Table rule: digging by hand or with a makeshift tool takes four times as long. */
export const DIG_BY_HAND = 4;
export type DigKind = 'firePit' | 'latrine' | 'cache' | 'snowCave' | 'grave' | 'trench';
export const DIG_LABEL: Record<DigKind, { label: string; holes: number; note: string }> = {
  firePit: { label: 'A sheltered fire pit', holes: 1, note: 'Shelters the campfire from wind and rain.' },
  latrine: { label: 'A latrine', holes: 1, note: 'A tidier camp, less to attract scavengers.' },
  cache: { label: 'A buried cache', holes: 1, note: 'Somewhere to hide gear (record it in Storage).' },
  snowCave: { label: 'A snow cave (in snow)', holes: 2, note: 'Counts as shelter like a cave while the party is in it (table rule).' },
  grave: { label: 'A grave', holes: 1, note: 'Laying a companion or stranger to rest.' },
  trench: { label: 'A defensive trench (10 ft)', holes: 2, note: 'Something to hold behind if trouble comes.' },
};

/** A Hunting Trap (2024 PHB): a creature that steps on it makes a DC 13 Dex save or takes 1d4 Piercing and is held. */
export const HUNTING_TRAP = /hunting traps?/i;
export const TRAP_SAVE_DC = 13;
/** Table rule: a trap set overnight on a game trail catches something on a d20 roll of this or higher… */
export const TRAP_CATCH_ON = 13;
/** …and a catch yields this many pounds of meat (a hare, a fox, a small deer at best). */
export const TRAP_MEAT_DICE = '1d4+1';

/** 2024 PHB Tack: Stabling costs 5 SP a day, and Feed 5 CP a day. */
export const STABLING_GP_PER_DAY = 0.5;
export type Saddle = 'none' | 'riding' | 'military' | 'exotic';
export const SADDLE_LABEL: Record<Saddle, string> = {
  none: 'No saddle',
  riding: 'Riding Saddle',
  military: 'Military Saddle (Advantage on checks to stay mounted)',
  exotic: 'Exotic Saddle (needed for flying or swimming mounts)',
};
export type MountMovement = 'land' | 'fly' | 'swim';

/** Is a mount ridden without the saddle it needs (2024 PHB: an Exotic Saddle for aquatic or flying mounts)? */
export const needsExoticSaddle = (m: Pick<Character, 'movement' | 'saddle'>): boolean => (m.movement === 'fly' || m.movement === 'swim') && m.saddle !== 'exotic';

// ---------------------------------------------------------------- other gear on the clock

/** A Magnifying Glass gives Advantage on checks to appraise or inspect a highly detailed item (2024 PHB). */
export const MAGNIFYING_GLASS = /magnifying glass/i;
/** Lighting a fire with one needs sunlight-bright light, tinder and about 5 minutes (2024 PHB). */
export const MAGNIFIER_FIRE_MINUTES = 5;

/** Consulting an accurate nonfiction Book on its topic gives +5 to Intelligence (Arcana, History, Nature or Religion) checks (2024 PHB). */
export const BOOK_BONUS = 5;
export const BOOK = /\bbooks?\b|\btome\b|\bspellbook\b/i;

/** Perfume: for 1 hour, Advantage on Charisma (Persuasion) checks to influence an Indifferent Humanoid within 5 feet (2024 PHB). */
export const PERFUME = /perfume/i;
export const PERFUME_MINUTES = 60;

/** A Signal Whistle is heard up to 600 feet away, a Bell up to 60 feet (2024 PHB). */
export const SIGNAL_WHISTLE = /signal whistle/i;
export const BELL = /^bells?$/i;
/** Table rule: a Bell hung on String or Rope around the camp rings when something crosses the line, waking the camp. */
export const ALARM_LINE = /^(?:string|rope|rope, hempen|rope, silk|chain|vine cord)/i;
export const ALARM_MINUTES = 10;

/** Objects seen through a Spyglass are magnified to twice their size (2024 PHB). Table rule: the watch spots things twice as far off. */
export const SPYGLASS = /spyglass/i;

/** Caltrops and Ball Bearings take 10 minutes to recover after they're spread (2024 PHB). */
export const SCATTERABLE = /^(?:caltrops|ball bearings)(?: \(bag of \d+\))?$/i;
export const GATHER_MINUTES = 10;

/** A Barrel holds 40 gallons of liquid (2024 PHB); a Jug or Iron Pot holds 1 gallon; a Flask a pint; a Glass Bottle 1½ pints; a Vial 4 ounces. */
export const LIQUID_GALLONS: [RegExp, number][] = [
  [/^barrels?$/i, 40],
  [/^jugs?$/i, 1],
  [/^iron pots?$/i, 1],
  [/^buckets?$/i, 3.7],
  [/^glass bottles?$/i, 1.5 / 8],
  [/^flasks?$/i, 1 / 8],
];
/** Ink: a 1-ounce bottle writes about 500 pages. Paper or Parchment: about 250 words a sheet (2024 PHB). */
export const INK_PAGES = 500;
export const INK = /^ink(?: \(1 ounce bottle\))?$/i;
export const PAPER = /^(?:paper|parchment)(?: \(one sheet\)| sheets?)?$/i;

/** Liquid storage the party carries, in gallons, from barrels, jugs and the like. */
export function liquidCapacity(items: { name: string; qty: number }[]): number {
  let gal = 0;
  for (const i of items) {
    const hit = LIQUID_GALLONS.find(([re]) => re.test(i.name.trim()));
    if (hit) gal += hit[1] * i.qty;
  }
  return Math.round(gal * 10) / 10;
}

/** Gaming Set proficiency in downtime gambling (2024 PHB skill-and-tool rule): Advantage on the Insight check. */
export const isGamingSet = (name: string): boolean => toolNamed(name)?.category === 'gaming';
export const isInstrument = (name: string): boolean => toolNamed(name)?.category === 'instrument';

// ---------------------------------------------------------------- doing without (table rules, under the improvised switch)


/** Table rule: lighting a torch or lamp with no Tinderbox and no fire to hand: friction, 10 minutes. */
export const FRICTION_LIGHT_MINUTES = 10;
export const TINDERBOX = /tinderbox/i;

/** Where wood, brush and leaves can be gathered for makeshift gear, and how hard it is (Wisdom (Survival)). */
export const MAKESHIFT_DC: Record<TerrainType, number | null> = {
  forest: 10,
  swamp: 10,
  coastal: 10,
  grassland: 15,
  hill: 15,
  mountain: 15,
  arctic: null,
  desert: null,
  underdark: null,
  urban: null,
  waterborne: null,
};

/** Table rule: a makeshift torch (branch and rags or dry grass), Survival DC 10, 10 minutes, burns 30 minutes. */
export const MAKESHIFT_TORCH = { dc: 10, minutes: 10, burns: 30, name: 'Makeshift Torch' };
export const MAKESHIFT_TORCH_MATCH = /^makeshift torch(?:es)?$/i;

/** Table rule: a lean-to of branches (or a trench in deep snow), 1 hour, sleeps two like a Tent. */
export const LEAN_TO = { minutes: 60, sleeps: 2, snowDC: 15, snowInches: 12 };
export function leanToDC(terrain: TerrainType, snowIn: number): number | null {
  if (snowIn >= LEAN_TO.snowInches) return LEAN_TO.snowDC;
  return MAKESHIFT_DC[terrain];
}

/** Table rule: a bed of pine boughs or leaf litter, Survival DC 10, 30 minutes: counts as a Blanket tonight. */
export const BEDDING = { dc: 10, minutes: 30 };

/** Table rule: a snare of String or Rope, Survival DC 15 to set; catches small game on a d20 roll of 16+. */
export const SNARE = { dc: 15, catchOn: 16 };
export const SNARE_LINE = /^(?:string|rope|rope, hempen|rope, silk|vine cord.*)$/i;

/** Table rule: an Iron Pot, Bucket or cans hung on a line: intruders who beat Stealth DC 12 cross it quietly. */
export const POTS = /^(?:iron pots?|pots?|buckets?|pans?|cans?|mess kits?|kettles?)$/i;
export const POT_ALARM_DC = 12;

/** Something to boil water in. Table rule: without one, hot stones in a hide or bowl take twice as long and do half as much. */
export const BOILING_POT = /\b(?:iron pot|pot|kettle|cauldron|cook'?s utensils|mess kit)\b/i;

/** Table rule: charcoal on bark or hide, no Ink or Paper: a short note of a few lines, smudged by rain. */
export const CHARCOAL_WORDS = 50;

/** Table rule: riding bareback means Disadvantage on checks to stay mounted, and no galloping. */
export const isBareback = (m: Pick<Character, 'saddle'>): boolean => m.saddle === 'none';

/** Table rule: a waterskin sewn from a hunted hide, Survival DC 12, 1 hour. */
export const HIDE_WATERSKIN = { dc: 12, minutes: 60 };

/** Table rule: 10 feet of vine or bark cord, Survival DC 15, 1 hour; bursts at Strength DC 15 instead of Rope's 20. */
export const VINE_CORD = { dc: 15, minutes: 60, name: 'Vine cord (10 ft, bursts at DC 15)' };
