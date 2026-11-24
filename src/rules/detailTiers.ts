import type { Settings } from '../state/types';
import { FACILITY_BOOKS } from './bastion';

/** Light includes 5.5e player options. Complete adds 5.5e checks, costs and tracking. Higher tiers add legacy and table rules. */
export type TierId = 1 | 2 | 3 | 4 | 5;

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
    tagline: 'Core tracking and 5.5e player options, including Circle Magic and all supported Bastion facilities.',
    load: 'The clock, rests and timers run with minimal bookkeeping.',
  },
  {
    id: 2,
    name: 'Complete',
    tagline: 'Adds 5.5e requirements for survival, travel, carrying gear and paying costs.',
    load: 'Log meals and supplies, pay expenses, and roll saves and checks as conditions call for them.',
  },
  {
    id: 3,
    name: 'Gritty',
    tagline: 'Adds legacy and table rules for camp, sidekicks and downtime.',
    load: 'Daily chores at camp and in town, more saves, closer inventory keeping.',
  },
  {
    id: 4,
    name: 'Hardcore',
    tagline: 'Adds detailed rules for weather damage, appraisals and sleeping in armor.',
    load: 'Adds work in combat and at every sale. For tables that enjoy the simulation.',
  },
  {
    id: 5,
    name: 'Brutal',
    tagline: 'Adds lingering injuries, madness, and wear on gear and ships.',
    load: 'Injuries to heal, madness to play out and gear to keep up, on top of everything in Hardcore.',
  },
];

/** Settings that are plain on/off switches. */
export type SwitchKey = { [K in keyof Settings]: Settings[K] extends boolean ? K : never }[keyof Settings];

export type MechanicArea = 'Survival' | 'Weather' | 'Travel' | 'Camp' | 'Rest' | 'Gear' | 'Money' | 'Downtime' | 'Magic' | 'World' | 'Combat' | 'Party';

type PublishedSource = '2024 PHB' | '2024 DMG' | 'Forgotten Realms: Heroes of Faerûn';
type OtherSource = 'Table rule' | "Xanathar's" | "Tasha's" | '2014 rule' | '2014 DMG';

export type Mechanic = {
  key: SwitchKey;
  area: MechanicArea;
  label: string;
  cost: string;
} & (
  | { source: PublishedSource; tier: 1 | 2 }
  | { source: OtherSource; tier: 3 | 4 | 5 }
);

export const MECHANICS: Mechanic[] = [
  // ---- Light: published 5.5e player options.
  { key: 'circleMagic', tier: 1, area: 'Magic', source: 'Forgotten Realms: Heroes of Faerûn', label: 'Circle Magic: secondary casters can join eligible spells with a casting time of 1 minute or longer', cost: 'When the party casts a spell as a circle, choose the secondary casters and its effect.' },

  // ---- Complete: published 5.5e checks, costs and bookkeeping.
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
  { key: 'coinWeight', tier: 2, area: 'Gear', source: '2024 PHB', label: 'Coins count toward carried weight (50 per pound)', cost: 'Big hoards need carrying, banking or changing into gems.' },
  { key: 'tentSpace', tier: 2, area: 'Camp', source: '2024 PHB', label: 'A Tent sleeps two: anyone without a place sleeps in the open', cost: 'Tents to count against the party when camping in them.' },

  // ---- Gritty: legacy and table rules.
  { key: 'deathSavesResolve', tier: 3, area: 'Rest', source: 'Table rule', label: 'Time can’t pass while someone is dying: their death saves roll at once', cost: 'Saves work: skipping time never leaves a character stuck at 0 HP waiting for rolls.' },
  { key: 'fireWarmsCamp', tier: 3, area: 'Camp', source: 'Table rule', label: 'A lit campfire protects the camp from extreme cold', cost: 'Saves work: no hourly cold saves at a camp with a fire.' },
  { key: 'workWhileMarching', tier: 3, area: 'Downtime', source: 'Table rule', label: 'Crafters who are only marching keep working on hand-held projects (not at a fast pace) at half rate; writers only at a slow pace, keeping concentration', cost: 'Saves time: travel days still move hand-held work along, logged with each leg.' },
  { key: 'batchCrafting', tier: 3, area: 'Downtime', source: 'Table rule', label: 'Cheap items are crafted in batches: 20 days of Rations take one workday, not twenty', cost: 'Saves work: one project for a stack of arrows, torches or rations.' },
  { key: 'fallbackNavigator', tier: 3, area: 'Travel', source: 'Table rule', label: 'With no navigator able to act, the best Survival in the party finds the way', cost: 'Saves work: travel never stalls for want of a navigator.' },
  { key: 'armsTraining', tier: 3, area: 'Downtime', source: 'Table rule', label: 'Armor training and weapon proficiency can be learned in downtime: 5 to 20 workweeks at 25 GP a week, Light before Medium before Heavy', cost: 'One more downtime activity to choose; nothing to track once it starts.' },
  { key: 'sidekicks', tier: 3, area: 'Party', source: "Tasha's", label: 'Sidekicks: hire or befriend a co-adventurer (CR 1/2 or lower) with the Expert, Spellcaster or Warrior class, levelling with the party', cost: 'One more character to run; levels, Hit Points and features are handled for you.' },
  { key: 'taming', tier: 3, area: 'Party', source: 'Table rule', label: 'Tame wild Beasts and Monstrosities of Intelligence 5 or lower with Animal Handling', cost: 'Track daily attempts and progress for each creature being tamed.' },
  { key: 'variantEncumbrance', tier: 3, area: 'Gear', source: 'Table rule', label: 'Encumbered over 5 × Strength, Heavily Encumbered over 10 × Strength', cost: 'Speed and Disadvantage penalties kick in long before capacity, so every pound counts.' },
  { key: 'fireLightingCheck', tier: 3, area: 'Camp', source: 'Table rule', label: 'Lighting a campfire takes a Wisdom (Survival) check', cost: 'A roll every camp, more in wet or windy weather, plus fuel to gather.' },
  { key: 'coldNights', tier: 3, area: 'Weather', source: 'Table rule', label: 'Cold nights: sleeping out without warm cover risks Exhaustion', cost: 'A save on waking after any cold night unless everyone has a bedroll, blanket or fire.' },
  { key: 'rawFoodRisk', tier: 3, area: 'Survival', source: 'Table rule', label: 'Raw food can make you sick', cost: 'Foraged and hunted food has to be cooked, or it means a save.' },
  { key: 'wildNeedsPurifying', tier: 3, area: 'Survival', source: 'Table rule', label: 'Unpurified water can make you sick', cost: 'Water from the wild has to be boiled or purified, or it means a save.' },
  { key: 'hirelingsEat', tier: 3, area: 'Survival', source: 'Table rule', label: 'Hirelings eat and drink from the camp stores outside settlements', cost: 'Camp stores drain faster and need restocking.' },
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
  { key: 'duesAndTaxes', tier: 3, area: 'Money', source: 'Table rule', label: 'Taxes, tithes, rent and guild dues are charged when due; unpaid ones become debts', cost: 'Recurring charges to set up and pay.' },
  { key: 'notoriety', tier: 3, area: 'World', source: 'Table rule', label: 'Crimes raise heat with the law in a place; the watch may recognise the party there; heat cools week by week', cost: 'A daily recognition roll while in a place where the party is wanted.' },
  { key: 'contactsFade', tier: 3, area: 'World', source: 'Table rule', label: 'Friendly contacts cool after 60 days without word, and won’t do a second favor within 30 days', cost: 'Letters and visits to keep contacts warm.' },
  { key: 'piety', tier: 3, area: 'World', source: 'Table rule', label: 'Piety: deeds, offerings and temple service raise a character’s standing with their god; neglect and sins lower it, and below 0 the god turns away', cost: 'Deeds to award after sessions; a check every 60 days for neglect.' },
  { key: 'pathsToPower', tier: 3, area: 'World', source: 'Table rule', label: 'Paths to power: court and guild ranks rise by petition or award, with monthly duties, titles and land for nobles and better business rolls for guild masters', cost: 'Petitions to roll and a monthly duty check for each character with a rank.' },
  { key: 'newsTravels', tier: 3, area: 'World', source: 'Table rule', label: 'News of distant events reaches the party only as fast as word travels', cost: 'Nothing to roll: news simply arrives later.' },
  { key: 'appraiseByEye', tier: 3, area: 'Money', source: 'Table rule', label: 'Anyone can judge a valuable’s worth by eye at DC 20', cost: 'More appraisal rolls before selling treasure.' },

  // ---- Hardcore: additional rule variants and finer bookkeeping.
  { key: 'coldGear2014', tier: 4, area: 'Weather', source: '2014 rule', label: 'Cold weather gear protects against extreme cold', cost: 'Check who has cold weather gear before rolling cold saves.' },
  { key: 'heavyClothing2014', tier: 4, area: 'Weather', source: '2014 rule', label: 'Heavy clothing gives Disadvantage on extreme heat saves', cost: 'Check clothing as well as armor when rolling heat saves.' },
  { key: 'climateAdjustedPrecip', tier: 4, area: 'Weather', source: 'Table rule', label: 'Adjust daily precipitation rolls for climate', cost: 'The app adjusts the weather roll for drier deserts and wetter jungles.' },
  { key: 'weatherDamage', tier: 4, area: 'Combat', source: 'Table rule', label: 'Weather favors or hinders some damage types (+1 or −1 per die)', cost: 'A modifier to work out on damage rolls all through combat.' },
  { key: 'sleepInArmorPenalty', tier: 4, area: 'Rest', source: "Xanathar's", label: 'Sleeping in Medium or Heavy armor spoils the Long Rest', cost: 'Armor to take off and put on around every rest, and the minutes that takes.' },
  { key: 'doubleWaterInHeat', tier: 4, area: 'Survival', source: '2014 rule', label: 'Double water needs on days of 100 °F or hotter', cost: 'Twice the water to carry and log on hot days.' },
  { key: 'prestigeRenownMin', tier: 4, area: 'World', source: 'Table rule', label: 'Factions and rulers refuse titles (knight 10, lord or count 25, duke 50) and fortifications (25) below these renown scores', cost: 'Renown to check before each faction grant.' },
  { key: 'appraiseOneTry', tier: 4, area: 'Money', source: 'Table rule', label: 'One appraisal try per person until a rest', cost: 'Tracking who has tried which item.' },
  { key: 'appraiseTime', tier: 4, area: 'Money', source: 'Table rule', label: 'A careful appraisal takes 10 minutes', cost: 'The clock moves for each appraisal.' },
  { key: 'appraiseMisjudge', tier: 4, area: 'Money', source: 'Table rule', label: 'Secret appraisal rolls; failing by 5 or more gives a wrong value', cost: 'Secret rolls and values the party can’t trust.' },

  // ---- Tier 5: the hardest, with lasting harm to body, mind and gear.
  { key: 'lingeringInjuries', tier: 5, area: 'Rest', source: '2014 DMG', label: 'Lingering injuries (d20 table) from dropping to 0 HP, failing a death save by 5 or more, or a critical hit', cost: 'An injury to heal over days, with a daily Medicine check for a festering wound.' },
  { key: 'madness', tier: 5, area: 'World', source: '2014 DMG', label: 'Madness: short-term, long-term and indefinite madness when the DM calls for it, and a DC 15 Wisdom save when Stress or Fear reaches 6', cost: 'A save when Stress or Fear climbs high, and a madness to play for minutes, hours or until cured.' },
  { key: 'gearWear', tier: 5, area: 'Gear', source: 'Table rule', label: 'Hard travel, heavy rain and salt water wear gear down until it is damaged; storms and long voyages wear ships', cost: 'An hour of upkeep every few days of hard travel, and repairs to pay for.' },
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

/** The switches and supplemental facility catalog included at this tier. */
export function tierPreset(tier: TierId): Pick<Settings, SwitchKey | 'facilityBooks'> {
  const switches = Object.fromEntries(MECHANICS.map((m) => [m.key, m.tier <= tier])) as Pick<Settings, SwitchKey>;
  return { ...switches, facilityBooks: [...FACILITY_BOOKS] };
}

/** Applies a preset while preserving numeric thresholds, DM rulings and other book selections. */
export function applyTier(settings: Settings, tier: TierId): void {
  Object.assign(settings, tierPreset(tier));
}

function tierDifferences(settings: Settings, tier: TierId): number {
  const switches = MECHANICS.filter((m) => !!settings[m.key] !== (m.tier <= tier)).length;
  const books = settings.facilityBooks ?? FACILITY_BOOKS;
  const supplementalFacilities = FACILITY_BOOKS.filter((book) => !books.includes(book)).length;
  return switches + supplementalFacilities;
}

/** The tier the current switches match exactly, or null if they've been mixed by hand. */
export function matchTier(settings: Settings): TierId | null {
  return TIERS.find((t) => tierDifferences(settings, t.id) === 0)?.id ?? null;
}

/** The tier the current switches are closest to, and how many switches differ from it. */
export function closestTier(settings: Settings): { tier: TierId; differences: number } {
  return TIERS.map((t) => ({ tier: t.id, differences: tierDifferences(settings, t.id) })).reduce((a, b) => (b.differences < a.differences ? b : a));
}

export const tierName = (id: TierId): string => TIERS.find((t) => t.id === id)!.name;
