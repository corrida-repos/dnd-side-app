import type { Settings } from '../state/types';

/**
 * Levels of detail: every switchable mechanic ranked by how much it slows play down.
 *
 * The measure is table time, not realism: how often a mechanic asks for a roll, a decision or an entry,
 * how often it interrupts the scene, and how much inventory or ledger keeping it adds. A save the app rolls
 * by itself costs little; a chore someone has to remember every day, or a modifier on every damage die, costs a lot.
 */
export type TierId = 1 | 2 | 3 | 4;

export interface Tier {
  id: TierId;
  name: string;
  /** One line on what playing at this tier feels like. */
  tagline: string;
  /** Roughly what it asks of the table. */
  load: string;
}

export const TIERS: Tier[] = [
  {
    id: 1,
    name: 'Light',
    tagline: 'Time, rests and timers run themselves. Nothing wears the party down unless you say so.',
    load: 'Almost no extra rolls or entries: skip ahead freely.',
  },
  {
    id: 2,
    name: 'Standard',
    tagline: 'The 2024 PHB and DMG as written: food and water, extreme weather, forced marches, getting lost, carrying capacity, costs and random encounters.',
    load: 'A few automatic saves a day, meals to log, coins spent. The app rolls most of it.',
  },
  {
    id: 3,
    name: 'Gritty',
    tagline: 'Table rules on top: campfires to light, raw food and dirty water, cold nights, coin weight, lifestyle risks, downtime complications.',
    load: 'Daily chores at camp and in town, more saves, closer inventory keeping.',
  },
  {
    id: 4,
    name: 'Hardcore',
    tagline: 'Everything, including the fiddliest rules: weather modifying every damage die, secret and one-shot appraisals, armor that spoils sleep.',
    load: 'Adds work in combat and at every sale. For tables that enjoy the simulation.',
  },
];

/** Settings that are plain on/off switches. */
export type SwitchKey = { [K in keyof Settings]: Settings[K] extends boolean ? K : never }[keyof Settings];

export type MechanicArea = 'Survival' | 'Weather' | 'Travel' | 'Camp' | 'Rest' | 'Gear' | 'Money' | 'Downtime' | 'Magic' | 'World' | 'Combat';

export interface Mechanic {
  key: SwitchKey;
  /** The lowest tier that turns it on. Tier 1 rules save work, so every tier keeps them. */
  tier: TierId;
  area: MechanicArea;
  label: string;
  /** Where the rule comes from. */
  source: '2024 PHB' | '2024 DMG' | 'Table rule' | "Xanathar's" | '2014 rule' | '2014 DMG';
  /** What it costs at the table, and why it sits in its tier. */
  cost: string;
}

export const MECHANICS: Mechanic[] = [
  // ---- Tier 1: rules that take work away, so even the lightest game keeps them.
  { key: 'deathSavesResolve', tier: 1, area: 'Rest', source: 'Table rule', label: 'Time can’t pass while someone is dying: their death saves roll at once', cost: 'Saves work: skipping time never leaves a character stuck at 0 HP waiting for rolls.' },
  { key: 'fireWarmsCamp', tier: 1, area: 'Camp', source: 'Table rule', label: 'A lit campfire protects the camp from extreme cold', cost: 'Saves work: no hourly cold saves at a camp with a fire.' },
  { key: 'workWhileMarching', tier: 1, area: 'Downtime', source: 'Table rule', label: 'Crafters who are only marching keep working on hand-held projects at half rate; writers must keep their concentration', cost: 'Saves time: travel days still move hand-held work along, logged with each leg.' },
  { key: 'batchCrafting', tier: 1, area: 'Downtime', source: 'Table rule', label: 'Cheap items are crafted in batches: 20 days of Rations take one workday, not twenty', cost: 'Saves work: one project for a stack of arrows, torches or rations.' },
  { key: 'fallbackNavigator', tier: 1, area: 'Travel', source: 'Table rule', label: 'With no navigator able to act, the best Survival in the party finds the way', cost: 'Saves work: travel never stalls for want of a navigator.' },

  // ---- Tier 2: the 2024 rules as written. Mostly automatic, but each one creates consequences to manage.
  { key: 'foodAndWater', tier: 2, area: 'Survival', source: '2024 DMG', label: 'Food and water: dehydration and malnutrition at midnight', cost: 'Meals and drinks to log for every character and mount each day; missing them gives Exhaustion that only full meals can lift.' },
  { key: 'extremeWeather', tier: 2, area: 'Weather', source: '2024 DMG', label: 'Extreme cold and heat: hourly Constitution saves', cost: 'A save per character per hour outdoors at 0 °F or below, or 100 °F or above. Rare in mild climates, constant in harsh ones.' },
  { key: 'forcedMarch', tier: 2, area: 'Travel', source: '2024 PHB', label: 'Forced march: a Con save each hour past 8 hours of travel', cost: 'A save per character per extra hour, only when the party pushes on.' },
  { key: 'navigation', tier: 2, area: 'Travel', source: '2024 DMG', label: 'Getting lost: the navigator’s Survival check off the road', cost: 'A check per leg off the road, rechecks while lost, and miles that go the wrong way.' },
  { key: 'encumbrance', tier: 2, area: 'Gear', source: '2024 PHB', label: 'Carrying capacity: going over Strength × 15 slows the party', cost: 'Needs inventories kept up to date; matters mostly after big hauls of loot.' },
  { key: 'chargeCosts', tier: 2, area: 'Money', source: '2024 PHB', label: 'Charge costs to characters’ gold (crafting, construction, lifestyle, wages, feed)', cost: 'Purses change every day in town or with hirelings, and unpaid bills become debts.' },
  { key: 'trackComponents', tier: 2, area: 'Magic', source: '2024 PHB', label: 'Costly spell components must be carried and are used up', cost: 'Casters have to buy and carry diamonds, incense and the like before casting.' },
  { key: 'trackGearUse', tier: 2, area: 'Gear', source: '2024 PHB', label: 'Torches, candles and lamp oil burn up, and Healer’s Kits run out after ten uses', cost: 'Lights and kits come out of the inventory, so they need restocking.' },
  { key: 'stabling', tier: 2, area: 'Money', source: '2024 PHB', label: 'Mounts in town are stabled and fed: 5 SP and 5 CP a day each', cost: 'A small daily charge per animal in every settlement.' },
  { key: 'encounters', tier: 2, area: 'Travel', source: '2024 DMG', label: 'Random encounter checks by the location’s danger', cost: 'Checks roll by themselves, but every encounter they find is a scene to run.' },

  // ---- Tier 3: table and optional rules that add chores, saves and bookkeeping.
  { key: 'variantEncumbrance', tier: 3, area: 'Gear', source: 'Table rule', label: 'Encumbered over 5 × Strength, Heavily Encumbered over 10 × Strength', cost: 'Speed and Disadvantage penalties kick in long before capacity, so every pound counts.' },
  { key: 'coinWeight', tier: 3, area: 'Gear', source: '2024 PHB', label: 'Coins count toward carried weight (50 per pound)', cost: 'Big hoards need carrying, banking or changing into gems.' },
  { key: 'fireLightingCheck', tier: 3, area: 'Camp', source: 'Table rule', label: 'Lighting a campfire takes a Wisdom (Survival) check', cost: 'A roll every camp, more in wet or windy weather, plus fuel to gather.' },
  { key: 'coldNights', tier: 3, area: 'Weather', source: 'Table rule', label: 'Cold nights: sleeping out without warm cover risks Exhaustion', cost: 'A save on waking after any cold night unless everyone has a bedroll, blanket or fire.' },
  { key: 'rawFoodRisk', tier: 3, area: 'Survival', source: 'Table rule', label: 'Raw food can make you sick', cost: 'Foraged and hunted food has to be cooked, or it means a save.' },
  { key: 'wildNeedsPurifying', tier: 3, area: 'Survival', source: 'Table rule', label: 'Unpurified water can make you sick', cost: 'Water from the wild has to be boiled or purified, or it means a save.' },
  { key: 'hirelingsEat', tier: 3, area: 'Survival', source: 'Table rule', label: 'Hirelings eat and drink from the camp stores outside settlements', cost: 'Camp stores drain faster and need restocking.' },
  { key: 'tentSpace', tier: 3, area: 'Camp', source: '2024 PHB', label: 'A Tent sleeps two: anyone without a place sleeps in the open', cost: 'Tents to count against the party when camping in them.' },
  { key: 'sleepDeprivation', tier: 3, area: 'Rest', source: "Xanathar's", label: 'Staying awake too long causes Exhaustion', cost: 'A save for everyone each 24 hours without a Long Rest. Rare unless the party pushes through the night.' },
  { key: 'poorVisibilityNav', tier: 3, area: 'Travel', source: 'Table rule', label: 'Heavy rain or snow, and darkness, each make navigating harder (+5 DC)', cost: 'More failed navigation checks in bad weather and at night.' },
  { key: 'nightTravelSlow', tier: 3, area: 'Travel', source: 'Table rule', label: 'Travelling at night without a light, if anyone lacks Darkvision, goes at a Slow pace', cost: 'Lights to carry and track for night travel.' },
  { key: 'carryDowned', tier: 3, area: 'Travel', source: 'Table rule', label: 'Carrying an Unconscious companion without a spare mount forces a Slow pace', cost: 'Slower travel after a bad fight.' },
  { key: 'unchartedLand', tier: 3, area: 'Travel', source: 'Table rule', label: 'Uncharted stages: the distance is only a guess until the party arrives, and a mapper can chart the way', cost: 'Journeys into unknown land can run longer than planned, so supplies need a margin.' },
  { key: 'stormsAtSea', tier: 3, area: 'Travel', source: 'Table rule', label: 'Storms at sea: a DC 15 Wisdom (Survival) check or half the day’s sailing is lost', cost: 'A check on each stormy sailing day.' },
  { key: 'lifestyleRisks', tier: 3, area: 'Money', source: 'Table rule', label: 'Lifestyle risks in town: foul city water, rats, vermin, gangs, the watch and sleeping rough for the Squalid and Wretched; theft and attention for others', cost: 'A daily save and several weekly rolls for anyone living Squalid or Wretched, and the Wretched face the weather. They can lead to Sewer Plague, Cackle Fever or Sight Rot.' },
  { key: 'debtDropsLifestyle', tier: 3, area: 'Money', source: 'Table rule', label: 'A character in debt drops to a cheaper lifestyle each day they can’t pay', cost: 'Lifestyles to keep an eye on when purses run dry.' },
  { key: 'downtimeOutcomes', tier: 3, area: 'Downtime', source: "Xanathar's", label: 'Downtime activities roll their outcomes and complications', cost: 'Each finished activity brings results, complications and sometimes a rival’s move to play out.' },
  { key: 'runningBusiness', tier: 3, area: 'Downtime', source: '2014 DMG', label: 'Running a business as a downtime activity', cost: 'Upkeep and profit rolls for every business the party owns.' },
  { key: 'prestigeRules', tier: 3, area: 'World', source: 'Table rule', label: 'Marks of Prestige carry obligations: land brings income and trouble, titles must be lived up to, and neglect costs the grantor’s trust', cost: 'A monthly roll for each parcel of land and a check on each title holder’s lifestyle.' },
  { key: 'regionDailyRoll', tier: 3, area: 'World', source: 'Table rule', label: 'Supernatural regions roll their table each dawn', cost: 'A daily roll and its effect while in a supernatural region.' },
  { key: 'appraiseCrafts', tier: 3, area: 'Money', source: 'Table rule', label: 'Jeweler’s Tools also value jewelry; History values art objects at DC 15', cost: 'More appraisal rolls before selling treasure.' },
  { key: 'improvised', tier: 3, area: 'Gear', source: 'Table rule', label: 'Improvised attempts without the right tool: DC +5, twice as long', cost: 'More checks become possible without the proper kit, each slower and harder.' },
  { key: 'appraiseByEye', tier: 3, area: 'Money', source: 'Table rule', label: 'Anyone can judge a valuable’s worth by eye at DC 20', cost: 'More appraisal rolls before selling treasure.' },

  // ---- Tier 4: the fiddliest rules, which add work in combat or at every sale.
  { key: 'weatherDamage', tier: 4, area: 'Combat', source: 'Table rule', label: 'Weather favors or hinders some damage types (+1 or −1 per die)', cost: 'A modifier to work out on damage rolls all through combat.' },
  { key: 'sleepInArmorPenalty', tier: 4, area: 'Rest', source: "Xanathar's", label: 'Sleeping in Medium or Heavy armor spoils the Long Rest', cost: 'Armor to take off and put on around every rest, and the minutes that takes.' },
  { key: 'doubleWaterInHeat', tier: 4, area: 'Survival', source: '2014 rule', label: 'Double water needs on days of 100 °F or hotter', cost: 'Twice the water to carry and log on hot days.' },
  { key: 'prestigeRenownMin', tier: 4, area: 'World', source: 'Table rule', label: 'Factions and rulers refuse titles (knight 10, lord or count 25, duke 50) and fortifications (25) below these renown scores', cost: 'Renown to check before each faction grant.' },
  { key: 'appraiseOneTry', tier: 4, area: 'Money', source: 'Table rule', label: 'One appraisal try per person until a rest', cost: 'Tracking who has tried which item.' },
  { key: 'appraiseTime', tier: 4, area: 'Money', source: 'Table rule', label: 'A careful appraisal takes 10 minutes', cost: 'The clock moves for each appraisal.' },
  { key: 'appraiseMisjudge', tier: 4, area: 'Money', source: 'Table rule', label: 'Secret appraisal rolls; failing by 5 or more gives a wrong value', cost: 'Secret rolls and values the party can’t trust.' },
];

/** Built in at every tier: they run on the clock and need no rolls or entries beyond what play already gives. */
export const ALWAYS_ON: string[] = [
  'The clock, calendar, sunrise and sunset, moons and holidays',
  'Daily weather from the DMG tables (shown, with no saves unless Extreme weather is on)',
  'Short and Long Rests, one Long Rest per 24 hours, HP, Hit Point Dice, spell slots and limited-use features',
  'Spell and effect timers, Concentration, lights burning down',
  'Dying, death saves, stabilizing and waking',
  'Attunement (and its 100-foot, 24-hour limit) and charges regained at dawn',
];

/** Features that only cost time when the table chooses to use them, whatever the tier. */
export const ON_DEMAND: string[] = [
  'Bastions, facilities and their orders',
  'Crafting, downtime activities, training and research',
  'Hunting, foraging and cooking',
  'Diseases, poisons and supernatural regions',
  'Night watches, interrupted rests and journeys planned in stages',
  'Identifying magic items, debts, rivals, factions and patrons',
  'Hirelings, mounts, vehicles and storage',
];

/** Every switch a tier sets: on if the rule's tier is at or below the chosen one. */
export function tierPreset(tier: TierId): Pick<Settings, SwitchKey> {
  return Object.fromEntries(MECHANICS.map((m) => [m.key, m.tier <= tier])) as Pick<Settings, SwitchKey>;
}

/** Sets every tiered switch to match a tier. Other settings (variants, numbers, books) are left alone. */
export function applyTier(settings: Settings, tier: TierId): void {
  Object.assign(settings, tierPreset(tier));
}

/** The tier the current switches match exactly, or null if they've been mixed by hand. */
export function matchTier(settings: Settings): TierId | null {
  return TIERS.find((t) => MECHANICS.every((m) => !!settings[m.key] === m.tier <= t.id))?.id ?? null;
}

/** The tier the current switches are closest to, and how many switches differ from it. */
export function closestTier(settings: Settings): { tier: TierId; differences: number } {
  return TIERS.map((t) => ({ tier: t.id, differences: MECHANICS.filter((m) => !!settings[m.key] !== m.tier <= t.id).length })).reduce((a, b) => (b.differences < a.differences ? b : a));
}

export const tierName = (id: TierId): string => TIERS.find((t) => t.id === id)!.name;
