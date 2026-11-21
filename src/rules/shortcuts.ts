import type { Character } from '../state/types';
import { SPELL_FACTS, type SpellFact } from './shortcutSpells';

/**
 * "Ways around this": for every challenge, wait or cost the tracker models, the spells, class features,
 * feats, species traits, invocations, items and Bastion facilities that shortcut or avoid it, with the
 * edge cases that trip tables up. Checked against the 2024 Player's Handbook and Dungeon Master's Guide
 * as published by 5etools; Artificer entries come from Eberron: Forge of the Artificer (2025).
 */

export type WayKind = 'spell' | 'class' | 'subclass' | 'feat' | 'species' | 'invocation' | 'gear' | 'magic-item' | 'bastion';

export interface Way {
  name: string;
  kind: WayKind;
  /** Spell level for spells; class level for features; character level for species traits. */
  level?: number;
  /** Class that has the feature (class, subclass and invocation entries). */
  className?: string;
  subclass?: string;
  /** How it gets around the problem. */
  how: string;
  /** Edge cases and fine print. */
  catches?: string[];
  /** How the rules settle a question tables argue about: the rules-as-written reading, and a common table ruling if it differs. */
  ruling?: Ruling;
  rarity?: string;
  attune?: boolean;
  /** Words that identify the species or subclass in a character's details, e.g. ["elf", "drow"]. */
  keys?: string[];
  /** A lineage, ancestry or legacy the species needs, e.g. ["silver", "white"]. */
  choice?: string[];
  source?: string;
}

export interface Ruling {
  /** The rules-as-written answer, with the text it rests on. */
  raw: string;
  /** A common table ruling, when many tables play it differently. */
  table?: string;
}

export type TopicId =
  | 'food'
  | 'water'
  | 'foraging'
  | 'hunting'
  | 'tainted'
  | 'cold'
  | 'heat'
  | 'weather'
  | 'altitude'
  | 'fire'
  | 'armor'
  | 'shortRest'
  | 'longRest'
  | 'watch'
  | 'exhaustion'
  | 'march'
  | 'lost'
  | 'tracking'
  | 'mounts'
  | 'carrying'
  | 'ammo'
  | 'light'
  | 'exploration'
  | 'breath'
  | 'hazards'
  | 'identify'
  | 'attunement'
  | 'dying'
  | 'death'
  | 'divination'
  | 'rituals'
  | 'lifestyle'
  | 'hirelings'
  | 'crafting'
  | 'spellbook'
  | 'downtime'
  | 'messages'
  | 'building'
  | 'dailyCasting'
  | 'fear'
  | 'disease'
  | 'encounters'
  | 'services'
  | 'poisonHarvest'
  | 'saves'
  | 'concentration'
  | 'bastionEvents'
  | 'timekeeping'
  | 'poison'
  | 'shopping';

export interface Topic {
  id: TopicId;
  title: string;
  /** The challenge, wait or cost, in one or two sentences. */
  problem: string;
  ways: Way[];
}

const spell = (name: string, how: string, catches?: string[]): Way => {
  if (!SPELL_FACTS[name]) throw new Error(`Unknown spell in shortcuts: ${name}`);
  return { name, kind: 'spell', level: SPELL_FACTS[name].level, how, catches };
};
const feature = (className: string, level: number, name: string, how: string, catches?: string[], source?: string): Way => ({ name, kind: 'class', className, level, how, catches, source });
const sub = (className: string, subclass: string, level: number, name: string, how: string, catches?: string[], source?: string, keys?: string[]): Way => ({
  name,
  kind: 'subclass',
  className,
  subclass,
  level,
  how,
  catches,
  source,
  keys,
});
const feat = (name: string, how: string, catches?: string[]): Way => ({ name, kind: 'feat', how, catches });
const species = (name: string, how: string, catches?: string[], level?: number, match: { keys?: string[]; choice?: string[] } = {}): Way => ({ name, kind: 'species', how, catches, level, ...match });
const invocation = (name: string, level: number, how: string, catches?: string[]): Way => ({ name, kind: 'invocation', className: 'Warlock', level, how, catches });
const gear = (name: string, how: string, catches?: string[]): Way => ({ name, kind: 'gear', how, catches });
const item = (name: string, rarity: string, attune: boolean, how: string, catches?: string[]): Way => ({ name, kind: 'magic-item', rarity, attune, how, catches });
const bastion = (name: string, level: number, how: string, catches?: string[]): Way => ({ name, kind: 'bastion', level, how, catches });

const ruled = (way: Way, raw: string, table?: string): Way => ({ ...way, ruling: { raw, table } });

const LONG_REST_CAST = 'Casting it during a Long Rest interrupts the rest (any spell other than a cantrip does), so cast it before you settle down.';

export const TOPICS: Topic[] = [
  {
    id: 'food',
    title: 'Food and malnutrition',
    problem:
      'Every creature needs food by size each day. Eating less than half means a DC 10 Con save or Exhaustion, five days of nothing means Exhaustion every day, and that Exhaustion stays until a full day of food is eaten.',
    ways: [
      ruled(spell('Goodberry', 'Ten berries; each one is a full day of nourishment for one creature, whatever its size, plus 1 HP.', [
        'The berries vanish after 24 hours, so you can’t stockpile them.',
        'It’s food only. It gives no water.',
      ]), 'A berry “provides enough nourishment to sustain a creature for one day”, with no size limit, so it covers a horse or a Large ally too.', 'Some tables scale it by size (2 berries for Large, 4 for Huge).'),
      spell('Create Food and Water', '45 lb of food and 30 gallons of water: a day’s food for about 15 Medium creatures or 5 horses.', [
        'The food spoils after 24 hours if uneaten. The water doesn’t.',
        'Only Clerics and Paladins have it on their lists.',
      ]),
      spell("Heroes' Feast", 'A one-hour meal for up to 12 creatures. It counts as eating, and it also gives immunity to Poisoned and Frightened, Poison Resistance and 2d10 extra HP for 24 hours.', [
        'The 1,000 GP bowl is consumed, so it’s an expensive way to skip rations.',
      ]),
      spell('Plant Growth', 'The 8-hour Enrichment version doubles the food that plants yield within half a mile for a year: useful for farms and Bastions, not for tonight’s dinner.'),
      feature('Monk', 10, 'Self-Restoration', 'Forgoing food and drink doesn’t give the Monk Exhaustion at all.', ['It covers the Monk only, not the party or their mount.']),
      item('Ioun Stone (Sustenance)', 'rare', true, 'While it orbits your head, you don’t need to eat or drink.'),
      bastion('Garden (Food)', 5, 'A Harvest order gives 100 days of Rations in 7 days, at no cost.'),
      gear('Cook’s Utensils', 'Crafts Rations (PHB crafting) and can spot spoiled or poisoned food (DC 15).'),
    ],
  },
  {
    id: 'water',
    title: 'Water and dehydration',
    problem: 'Drinking less than half the day’s water means 1 Exhaustion level, with no save, and it can’t be removed until a full day’s water is drunk. Water is heavy: 8 lb a gallon.',
    ways: [
      spell('Create or Destroy Water', '10 gallons of clean water, +10 per slot level above 1: a day’s water for 10 Medium creatures from a level 1 slot.', [
        'It must go into an open container, or fall as rain over a 30-foot cube (and put out exposed flames there).',
      ]),
      spell('Create Food and Water', '30 gallons of fresh water that doesn’t spoil (the food does after 24 hours).'),
      item('Decanter of Endless Water', 'uncommon', false, 'Splash 1 gallon, Fountain 5 gallons, or Geyser 30 gallons each Magic action, fresh or salt water. No limit per day.', [
        'The Geyser setting is a 30-foot line of force (Strength save or 1d4 Bludgeoning and Prone), so aim it into barrels, not at friends.',
      ]),
      item('Alchemy Jug', 'uncommon', false, 'Produces up to 8 gallons of fresh water each day (or other liquids), and refills at dawn.', [
        'One kind of liquid per day: once you choose water, that’s it until dawn.',
      ]),
      feature('Monk', 10, 'Self-Restoration', 'No Exhaustion from going without drink.'),
      item('Ioun Stone (Sustenance)', 'rare', true, 'No need to drink at all.'),
      spell('Druidcraft', 'The Weather Sensor predicts the next 24 hours of weather, so you know whether rain will refill the skins.'),
    ],
  },
  {
    id: 'foraging',
    title: 'Foraging',
    problem: 'A Wisdom (Survival) check against the terrain’s foraging DC (10, 15 or 20) once per journey stage or day. A failure finds nothing.',
    ways: [
      spell('Guidance', '+1d4 to the Survival check.', ['Concentration for 1 minute, so cast it right before the roll.']),
      spell('Enhance Ability', 'Advantage on Wisdom checks for an hour, Survival included.'),
      spell('Locate Animals or Plants', 'Learn the direction and distance to the nearest kind of edible plant or game within 5 miles. A ritual, so it costs no slot.'),
      spell('Speak with Animals', 'Ask local beasts where the water and food are (they know what they saw in the last day). Ritual.'),
      spell('Goodberry', 'Skip foraging entirely: ten days of food from one level 1 slot.'),
      feature('Ranger', 2, 'Deft Explorer', 'Expertise in one skill: pick Survival to double the proficiency bonus.'),
      feature('Barbarian', 3, 'Primal Knowledge', 'While raging, make the Survival check with Strength instead of Wisdom.', [
        'Rage needs a Bonus Action and ends early if you don’t keep it going, so roll quickly.',
      ]),
      species('Elf (Keen Senses)', 'Proficiency in Survival (or Insight or Perception).', undefined, undefined, { keys: ['elf', 'drow'] }),
      feat('Skilled', 'Three skill or tool proficiencies, so Survival for whoever needs it.'),
      { ...gear('Slow pace', 'Traveling at a Slow pace gives Advantage on Survival (and Perception) checks.'), source: 'PHB rule' },
    ],
  },
  {
    id: 'hunting',
    title: 'Hunting and butchering',
    problem: 'Finding and bringing down game takes time and checks, and butchering a big animal can waste half the meat.',
    ways: [
      spell("Hunter's Mark", 'Advantage on Wisdom (Perception or Survival) checks to find the marked creature, and an extra 1d6 damage when you hit it.', [
        'You have to see the animal first to mark it.',
      ]),
      spell('Locate Animals or Plants', 'Name the beast (“elk”) and learn the direction and distance to the nearest one within 5 miles. Ritual.'),
      spell('Beast Sense', 'Ride along in a willing beast’s senses for an hour to scout for herds. Ritual.'),
      spell('Speak with Animals', 'Persuade animals to lead you to prey, or simply ask where the herds graze.'),
      sub('Ranger', 'Beast Master', 3, 'Primal Companion', 'The Beast of the Land or Sky can scout and help bring the prey down.'),
      feature('Druid', 2, 'Wild Companion', 'Spend a Wild Shape use to get a familiar (Find Familiar) that scouts for game until your next Long Rest.'),
      spell('Find Familiar', 'A hawk or owl familiar scouts ahead and shares its senses. Ritual, but the 10 GP incense is consumed each time.'),
    ],
  },
  {
    id: 'tainted',
    title: 'Raw food, dirty water and getting Sick',
    problem: 'Eating raw food or drinking unpurified water calls for a Con save; a failure means the character is Sick: Poisoned until they finish a Long Rest.',
    ways: [
      spell('Purify Food and Drink', 'Removes poison and rot from all nonmagical food and drink in a 5-foot-radius sphere. A ritual, so no slot is needed.', [
        'Pile everything together: the sphere is small.',
        'It doesn’t cook raw food, but it removes the reason raw food is dangerous.',
        'It doesn’t work on magical potions or poisons.',
      ]),
      spell('Lesser Restoration', 'Ends the Poisoned condition right away, and with it the sickness. Only a Bonus Action in 2024.'),
      spell('Protection from Poison', 'Ends Poisoned and gives Advantage on saves to avoid it for an hour: cast it before a doubtful meal.'),
      spell("Heroes' Feast", 'Immunity to the Poisoned condition for 24 hours.'),
      feature('Paladin', 1, 'Lay on Hands', 'Spend 5 points from the pool to remove the Poisoned condition.'),
      sub('Monk', 'Warrior of Mercy', 6, "Physician's Touch", 'Hand of Healing also ends Poisoned.'),
      feature('Monk', 10, 'Self-Restoration', 'Ends Poisoned on yourself at the end of each of your turns.'),
      sub('Druid', 'Circle of the Land', 10, "Nature's Ward", 'Immune to the Poisoned condition.'),
      species('Dwarf (Dwarven Resilience)', 'Advantage on saves to avoid or end Poisoned, and Poison Resistance.'),
      gear('Antitoxin', 'Bonus Action to drink: Advantage on saves against Poisoned for 1 hour, so drink it before a doubtful meal or drink. 50 GP.', ['It cures nothing: someone already Sick stays Sick until a Long Rest or magic ends it.']),
      gear('Cook’s Utensils', 'Detect spoiled or poisoned food with a DC 15 Wisdom check before anyone eats it.'),
      item('Periapt of Proof against Poison', 'rare', true, 'Immunity to Poisoned and Poison damage.'),
      item('Necklace of Adaptation', 'uncommon', true, 'Advantage on saves to avoid or end Poisoned (and you can breathe anywhere).'),
      bastion('Greenhouse', 9, 'Three Fruits of Restoration a day, each acting as Lesser Restoration when eaten.', ['A picked fruit loses its magic after 24 hours.']),
    ],
  },
  {
    id: 'cold',
    title: 'Extreme cold and cold nights',
    problem: 'At 0 °F or lower, each hour exposed means a DC 10 Con save or Exhaustion. Anyone with Cold Resistance or Immunity automatically succeeds.',
    ways: [
      spell("Leomund's Tiny Hut", 'Inside, the air is comfortable and dry whatever the weather: no cold saves for 8 hours. Ritual.', [
        'The spell ends if the caster leaves the dome.',
        'It fails if a creature in the area is too big to fit fully inside the 10-foot dome, so a big mount may have to stand clear.',
        LONG_REST_CAST,
      ]),
      spell("Mordenkainen's Magnificent Mansion", 'A warm extradimensional house for 24 hours, with food for 100.'),
      ruled(spell('Rope Trick', 'An extradimensional space for up to eight Medium creatures for an hour.'), 'Unlike Tiny Hut, the spell says nothing about the air or temperature inside, so it doesn’t stop extreme cold saves.', 'Many tables treat the pocket as sheltered, like a tent.'),
      spell('Protection from Energy', 'Cold Resistance for an hour, so that hour’s save succeeds automatically.', ['Concentration, and it lasts exactly one hour: recast it every hour or it lapses.']),
      ruled(spell('Fire Shield', 'The warm shield gives Cold Resistance for 10 minutes, with no Concentration.'), 'The save comes “at the end of each hour”, and a creature with Cold Resistance at that moment succeeds automatically, so casting it in the last 10 minutes of each hour works.', 'Some tables require Resistance for the whole hour.'),
      sub('Warlock', 'Fiend Patron', 10, 'Fiendish Resilience', 'Choose Cold after a Short or Long Rest: Resistance until you change it, so every cold save succeeds.'),
      feat('Boon of Energy Resistance', 'Resistance to two damage types, changeable each Long Rest: pick Cold for a winter journey.'),
      species('Dragonborn (Silver or White)', 'Permanent Cold Resistance.', undefined, undefined, { choice: ['silver', 'white'] }),
      item('Ring of Warmth', 'uncommon', true, 'You and everything you wear and carry are unharmed by temperatures of 0 °F or lower.'),
      item('Boots of the Winterlands', 'uncommon', true, 'Cold Resistance, you tolerate 0 °F or lower without other protection, and you ignore Difficult Terrain from ice or snow.'),
      item('Ring of Cold Resistance', 'rare', false, 'Permanent Cold Resistance, and it doesn’t need attunement.'),
      item('Potion of Cold Resistance', 'uncommon', false, 'Cold Resistance for 1 hour: one hour of safe travel per potion.'),
      { ...gear('Campfire', 'Resting or camping beside a burning fire keeps you out of extreme cold, down to −20°F by default (10°F lower in a sheltered pit). Adjust the limit in Settings.', ['It doesn’t help while traveling, and it goes out in strong wind or heavy rain unless the pit is sheltered.']), source: 'Table rule' },
      gear('Bedroll', 'While you sleep in it, you automatically succeed on extreme cold saves.', ['It only helps while you’re in it, not while walking.']),
      gear('Blanket', 'Advantage on extreme cold saves while wrapped in it.'),
    ],
  },
  {
    id: 'heat',
    title: 'Extreme heat',
    problem:
      'At 100 °F or higher, a creature without drinkable water makes a Con save each hour (DC 5, +1 per hour) or gains Exhaustion; Medium or Heavy armor gives Disadvantage. Fire Resistance or Immunity means automatic success.',
    ways: [
      spell('Create or Destroy Water', 'The 2024 rule only threatens creatures without access to drinkable water, so a cleric who can make water keeps everyone safe.', [
        'The save applies to anyone who has run out, so share the water.',
      ]),
      item('Decanter of Endless Water', 'uncommon', false, 'Unlimited drinking water, so no heat saves.'),
      spell("Leomund's Tiny Hut", 'Comfortable air inside for 8 hours. Rest out the hottest part of the day. Ritual.'),
      spell('Protection from Energy', 'Fire Resistance for one hour: that hour’s save succeeds automatically.', ['Concentration, and only one hour long.']),
      ruled(spell('Fire Shield', 'The chill shield gives Fire Resistance for 10 minutes.'), 'The heat save comes at the end of each hour, so Fire Resistance from a shield cast in the last 10 minutes counts.', 'Some tables require Resistance for the whole hour.'),
      spell('Mage Armor', 'AC without Medium or Heavy armor, so there’s no Disadvantage on the heat saves.'),
      sub('Warlock', 'Fiend Patron', 10, 'Fiendish Resilience', 'Choose Fire: every heat save succeeds automatically.'),
      feat('Boon of Energy Resistance', 'Choose Fire Resistance for a desert crossing.'),
      species('Tiefling (Infernal)', 'Permanent Fire Resistance.', undefined, undefined, { choice: ['infernal'] }),
      species('Dragonborn (Brass, Gold or Red)', 'Permanent Fire Resistance.', undefined, undefined, { choice: ['brass', 'gold', 'red'] }),
      item('Ring of Fire Resistance', 'rare', false, 'Permanent Fire Resistance, and it doesn’t need attunement.'),
      item('Potion of Fire Resistance', 'uncommon', false, 'One hour of Fire Resistance.'),
      feature('Barbarian', 1, 'Unarmored Defense', 'Good AC without armor, so there’s no Disadvantage from Medium or Heavy armor. Monks have the same benefit.'),
    ],
  },
  {
    id: 'weather',
    title: 'Wind, rain, snow and fog',
    problem:
      'Strong wind puts out flames, grounds fliers and spoils ranged attacks. Heavy rain or snow means Disadvantage on Perception and puts out open flames. Fog and storms make it easier to get lost.',
    ways: [
      spell('Control Weather', 'Shift precipitation, temperature and wind one step at a time within 5 miles for 8 hours.', [
        'You must be outdoors, it takes 10 minutes to cast and each change takes 1d4 × 10 minutes to arrive.',
        'Concentration, and it ends if you go indoors.',
      ]),
      spell('Druidcraft', 'Predicts the weather for the next 24 hours: decide whether to march or wait.'),
      spell("Leomund's Tiny Hut", 'Dry and calm inside, whatever the storm.'),
      spell('Gust of Wind', 'Disperses gas and fog in a 60-foot line, and puts out unprotected flames.'),
      spell('Create or Destroy Water', 'Destroy Water clears fog in a 30-foot cube.'),
      spell('Wind Wall', 'A 50-foot wall of wind that blocks gas, fog and flying creatures for a minute.'),
      ruled(gear('Hooded or Bullseye Lantern', 'Light that keeps going when the weather puts out torches and campfires.'), 'Strong wind and heavy rain extinguish “open flames”. A lantern’s flame is enclosed, so it stays lit; torches, candles and campfires don’t.'),
    ],
  },
  {
    id: 'altitude',
    title: 'High altitude',
    problem: 'Above 10,000 feet each hour of travel counts as 2 for forced marching. Acclimatizing takes 30 days, and creatures can’t acclimatize above 20,000 feet unless they’re native to it.',
    ways: [
      ruled(item('Necklace of Adaptation', 'uncommon', true, 'You can breathe normally in any environment.'), 'High altitude is taxing “because of the reduced amount of oxygen in the air”, and the necklace lets you breathe normally anywhere, so its wearer travels as if acclimatized.'),
      spell('Wind Walk', 'Fly in cloud form instead of climbing.', ['It doesn’t change the altitude rule, but the trip takes a fraction of the time.']),
      spell('Teleport', 'Skip the climb entirely if you know the destination.'),
      species('Goliath', 'There’s no altitude trait in 2024. The 2014 Goliath’s “Mountain Born” acclimatization is gone, so check which version your table uses.'),
    ],
  },
  {
    id: 'fire',
    title: 'Campfire: lighting, fuel and cooking',
    problem: 'Lighting a campfire takes a Wisdom (Survival) check (table rule: DC 10, harder with damp fuel, foul weather or no Tinderbox), wind and heavy rain put it out, and fuel needs gathering. Lit, it warms the camp down to a temperature limit, lights the night watch and cooks raw food and boils water.',
    ways: [
      spell('Prestidigitation', 'Light or snuff out a candle, torch or small campfire instantly, with no roll, and warm or flavor food.', [
        'It works on a small campfire only.',
        'Warming food doesn’t make raw meat safe. Cooking or purifying does.',
      ]),
      spell('Druidcraft', 'Light or snuff out a candle, torch or campfire instantly, with no roll.'),
      spell('Elementalism', 'Beckon Fire’s embers light candles, torches and lamps.', ['A campfire isn’t on that list.']),
      spell('Fire Bolt', 'Sets alight flammable objects that aren’t worn or carried, campfires included.'),
      spell('Continual Flame', 'Gives light that never goes out, but no heat, so it doesn’t replace a fire for warmth or cooking.'),
      species('Gnome (Rock Gnome)', 'A 10-minute Prestidigitation casting makes a Tiny clockwork fire starter that anyone can trigger as a Bonus Action.', undefined, undefined, { choice: ['rock'] }),
      feature('Artificer', 1, "Tinker's Magic", 'Conjure a Tinderbox, Torch, Oil or Lamp with Tinker’s Tools. They last until your next Long Rest.', undefined, 'EFA'),
      feat('Chef', 'Proficiency with Cook’s Utensils, plus Replenishing Meals on Short Rests and Bolstering Treats.'),
      spell("Mordenkainen's Magnificent Mansion", 'Its servants light fires and serve a nine-course banquet.'),
    ],
  },
  {
    id: 'armor',
    title: 'Putting armor on and taking it off',
    problem: 'Donning armor takes 1 minute (Light), 5 (Medium) or 10 (Heavy), and taking it off 1, 1 or 5. Sleeping in Medium or Heavy armor is a table rule penalty.',
    ways: [
      spell('Mage Armor', 'Base AC 13 + Dex for 8 hours, with no armor to put on.', ['It needs a level 1 slot each day, and it ends if you put on armor.']),
      invocation('Armor of Shadows', 1, 'Cast Mage Armor on yourself at will, without a slot.'),
      feature('Barbarian', 1, 'Unarmored Defense', 'AC 10 + Dex + Con with no armor: nothing to take off at night.'),
      feature('Monk', 1, 'Unarmored Defense', 'AC 10 + Dex + Wis with no armor.'),
      item('Bracers of Defense', 'rare', true, '+2 AC while wearing no armor and no shield.'),
      gear('Shield', 'Donning or doffing a shield takes only the Utilize action.'),
    ],
  },
  {
    id: 'shortRest',
    title: 'Short Rests and healing between fights',
    problem: 'A Short Rest takes an hour, needs at least 1 HP, and ends with no benefit if anyone rolls Initiative, casts a spell (other than a cantrip) or takes damage.',
    ways: [
      spell('Prayer of Healing', 'Up to five creatures gain the benefits of a Short Rest, plus 2d8 HP, in 10 minutes instead of an hour.', [
        'Each creature can benefit only once until it finishes a Long Rest.',
        'It’s cast instead of a rest, not during one: casting a spell interrupts a Short Rest.',
        'Features that recharge on a Short Rest recharge too (see the Exhaustion entry for the reasoning).',
      ]),
      feat('Durable', 'Spend a Hit Point Die as a Bonus Action at any time, no rest needed.'),
      feat('Healer', 'With a Healer’s Kit, let a creature spend a Hit Point Die as a Utilize action and add your Proficiency Bonus.'),
      feat('Chef', 'A Replenishing Meal on a Short Rest: +1d8 HP for each creature that spends Hit Point Dice.'),
      feature('Warlock', 2, 'Magical Cunning', 'A 1-minute rite restores up to half your Pact Magic slots, once per Long Rest, with no Short Rest needed.'),
      feature('Wizard', 1, 'Arcane Recovery', 'Recover slots on a Short Rest (half your Wizard level in combined levels), once per day.'),
      sub('Druid', 'Circle of the Land', 6, 'Natural Recovery', 'Recover slots on a Short Rest, once per Long Rest.'),
      item('Periapt of Wound Closure', 'uncommon', true, 'Each Hit Point Die heals double.'),
      item('Potion of Vitality', 'very rare', false, 'For 24 hours, Hit Point Dice heal their maximum.'),
      spell('Rope Trick', 'An hour in a pocket space no attack or spell can enter: exactly one safe Short Rest.', [
        'Rope Trick is not a ritual in 2024, so it costs a level 2 slot. Cast it before the rest starts.',
      ]),
      bastion('Workshop', 5, 'An entire Short Rest in your Workshop grants Heroic Inspiration, once per Long Rest.'),
    ],
  },
  {
    id: 'longRest',
    title: 'Long Rests, sleep and staying awake',
    problem:
      'A Long Rest takes 8 hours with at least 6 asleep, needs 1 HP, and you must wait 16 hours after one before starting another. Combat, damage, casting a spell or an hour of exertion interrupts it. Going without one leads to the optional sleep-deprivation saves.',
    ways: [
      species('Elf (Trance)', 'You don’t need to sleep, magic can’t put you to sleep, and you finish a Long Rest in 4 hours of conscious meditation.', [
        'You still need the Long Rest itself, and the 16-hour wait still applies.',
        'Xanathar’s sleep-deprivation rule counts Long Rests, not sleep, so an elf who skips the 4-hour trance still makes the save.',
        'Because you stay conscious, you notice things as if awake (the tracker lets you watch 4 hours).',
      ], undefined, { keys: ['elf', 'drow'] }),
      spell("Leomund's Tiny Hut", 'Other creatures and objects can’t pass in, and spells of level 3 or lower can’t be cast through it, so a rest is far less likely to be interrupted. Ritual.', [
        LONG_REST_CAST,
        'Spells of level 4 or higher still get through, and the spell ends if the caster leaves.',
      ]),
      spell("Mordenkainen's Magnificent Mansion", 'A sealed house with beds and servants for 24 hours: the safest rest in the game.'),
      spell('Alarm', 'A mental alarm wakes the caster (within 1 mile) when something enters a 20-foot cube. Ritual, lasts 8 hours.', [LONG_REST_CAST]),
      spell("Mordenkainen's Faithful Hound", 'An invisible watchdog with 30-foot Truesight barks at intruders and bites them for 8 hours.'),
      spell("Mordenkainen's Private Sanctum", 'Blocks scrying, teleporting in and, optionally, sound and sight. Good for a secure base.'),
      bastion('Demiplane', 17, 'An Empower order gives Temporary HP (five times your level) after an entire Long Rest in the Demiplane.'),
      gear('Bedroll and Tent', 'Shelter the tracker counts against cold nights and the weather.'),
    ],
  },
  {
    id: 'watch',
    title: 'Night watch and noticing danger',
    problem: 'Only 2 hours of light activity fit in a Long Rest (4 for those who trance), sleepers notice little, and darkness cuts passive Perception.',
    ways: [
      spell('Alarm', 'Wakes the caster mentally, or rings audibly, when anyone enters the warded area. Covers the whole night with no watcher. Ritual.'),
      spell("Mordenkainen's Faithful Hound", 'Watches for 8 hours with 30-foot Truesight and barks a warning.'),
      ruled(spell('Find Familiar', 'The familiar keeps watch, has Darkvision in many forms and can wake you by telepathy.'), 'Nothing in the spell says a familiar doesn’t sleep, and Xanathar’s says most creatures do, so it can cover a watch shift but not the whole night.', 'Many tables let a familiar watch all night, since it’s a spirit in animal form.'),
      spell("Leomund's Tiny Hut", 'Nothing outside can see in, and creatures can’t come in: fewer reasons to keep watch.'),
      species('Elf (Trance)', 'Rests in 4 hours and stays conscious while doing so, so elves can take double watches.', undefined, undefined, { keys: ['elf', 'drow'] }),
      feat('Observant', 'Expertise or proficiency in Perception (or Insight or Investigation), raising passive Perception.'),
      feat('Alert', 'Add your Proficiency Bonus to Initiative and swap Initiative with an ally when something does get through.'),
      invocation("Devil's Sight", 2, 'See normally in magical and nonmagical darkness to 120 feet: the watcher’s Perception isn’t hampered at night.'),
      gear('Hooded Lantern', 'Lit for the watch, so the watcher doesn’t take the −5 for dim light or rely on hearing alone.'),
      item('Horn of Silent Alarm', 'common', false, 'A watcher can silently alert one chosen sleeper within 600 feet.'),
    ],
  },
  {
    id: 'exhaustion',
    title: 'Removing Exhaustion',
    problem: 'Each level gives −2 to D20 Tests and −5 ft Speed. Normally only a Long Rest removes one level, and Exhaustion from hunger or thirst stays until the need is met.',
    ways: [
      ruled(spell('Greater Restoration', 'Removes 1 Exhaustion level (or a curse, petrification, etc.).', ['The 100 GP diamond dust is consumed.']), 'Malnutrition and dehydration say their Exhaustion “can’t be removed until the creature eats (or drinks) the full amount”. That specific rule blocks the spell too, so the tracker keeps those levels 🔒 locked until the need is met.', 'Some tables let magic win and remove a locked level anyway.'),
      ruled(item('Potion of Vitality', 'very rare', false, 'Removes all Exhaustion levels and ends Poisoned.'), 'Levels from malnutrition or dehydration “can’t be removed” until the need is met, so the potion clears every other level and leaves those.', 'Some tables let the potion clear them too.'),
      feature('Ranger', 10, 'Tireless', 'Every Short Rest removes 1 Exhaustion level as well.'),
      bastion('Reliquary', 13, 'After a Long Rest in your Bastion you get a Charm to cast Greater Restoration once without a slot or diamond dust.'),
      ruled(spell('Prayer of Healing', 'Gives the benefits of a Short Rest in 10 minutes, so a level 10+ Ranger also loses a level of Exhaustion through Tireless.'), 'The Short Rest rules list “some features are recharged by a Short Rest” among the rest’s benefits, and the spell grants “the benefits of a Short Rest”, so features that trigger when you finish a Short Rest (Tireless, Arcane Recovery, Pact Magic slots) apply.', 'Strict tables allow only the listed benefit: spending Hit Point Dice.'),
      feature('Monk', 14, 'Disciplined Survivor', 'Proficiency in all saves, and spend 1 Focus Point to reroll a failed save: forced march, cold and heat saves included.'),
      feature('Paladin', 6, 'Aura of Protection', 'Allies within 10 feet add the Paladin’s Charisma modifier to every save: cold, heat, forced march and malnutrition saves alike.', [
        'The aura is only 10 feet, and it switches off while the Paladin is Incapacitated (asleep, for instance).',
      ]),
      spell('Bless', '+1d4 to saves for three creatures.', ['Only 1 minute, so it suits a single dangerous save rather than an hourly one.']),
      species('Human (Resourceful)', 'Heroic Inspiration after every Long Rest: reroll a failed Exhaustion save.'),
      species('Halfling (Luck)', 'Reroll a 1 on any save.'),
    ],
  },
  {
    id: 'march',
    title: 'Travel speed and the forced march',
    problem: 'Normal pace is 3 miles an hour, 24 a day. Each hour past 8 means a Con save (DC 10 + 1 per extra hour) or Exhaustion. Terrain caps the pace.',
    ways: [
      spell('Phantom Steed', 'A horse with Speed 100 ft that travels 13 miles an hour, for an hour. It’s a ritual, so a Wizard can recast it all day for free.', [
        'It ends if it takes any damage.',
        'Riding isn’t exertion for the rider, but hours ridden still count as travel for the forced march rule.',
        'Wizard only, and Ritual Caster can’t pick it (level 3).',
      ]),
      spell('Wind Walk', 'Up to 11 creatures get a Fly Speed of 300 ft for 8 hours: 30 miles an hour, 240 miles a day by the DMG’s special-movement rule.', [
        'Changing form takes a minute, during which you’re Stunned.',
        'A strong wind forces fliers to land at the end of each turn.',
      ]),
      spell('Fly', 'Flying ignores terrain: fast pace anywhere (DMG). Speed 60 ft, so 6 miles an hour.', ['Concentration and only 10 minutes, so it’s for crossings, not journeys.']),
      spell('Teleportation Circle', 'Step through to any permanent circle whose sigils you know.', ['The 50 GP inks are consumed. Many temples and guildhalls have circles.']),
      spell('Teleport', 'Up to eight creatures go anywhere you know on the same plane.', [
        'There’s a chance of a mishap or ending up off target unless you know the place well or hold a linked object.',
      ]),
      spell('Transport via Plants', 'Step from one big plant to another you’ve seen or touched, any distance away.'),
      spell('Word of Recall', 'Instant return to a sanctuary you prepared earlier, for you and up to five others.'),
      spell('Longstrider', '+10 ft Speed.', ['In 2024, travel pace doesn’t depend on Speed, so it won’t get you there sooner. It helps against the −5 ft per Exhaustion level, though.']),
      spell('Find Steed', 'A loyal otherworldly mount for a Paladin, with no cost to keep.', ['Mounts can gallop at double distance for 1 hour, then need a rest before doing it again.']),
      item('Horseshoes of a Zephyr', 'very rare', false, 'The horse can travel 12 hours a day without Exhaustion from extended travel, ignores Difficult Terrain and leaves no tracks.'),
      item('Carpet of Flying', 'very rare', false, 'Fly Speed 80 ft (3×5 ft carpet): 8 miles an hour, and fast pace regardless of terrain.', ['A carpet halves its speed above its normal capacity.']),
      item('Broom of Flying', 'uncommon', true, 'Fly Speed 50 ft, 30 ft carrying over 200 lb.'),
      feature('Monk', 14, 'Disciplined Survivor', 'Reroll a failed forced march save with a Focus Point.'),
      { ...gear('Vessels', 'Ships can travel up to 24 hours a day with enough crew, and passengers don’t make forced march saves.'), source: 'PHB rule' },
    ],
  },
  {
    id: 'lost',
    title: 'Getting lost',
    problem: 'Off the road, a navigator makes a Wisdom (Survival) check against the terrain (DC 5 to 20). A failure sends the party off course, adding 1d6 × 10% to the stage.',
    ways: [
      spell('Find the Path', 'For a day you know the direction and distance to a familiar location and the most direct path at every fork.', [
        'Concentration, a 100 GP focus, and it fails for moving or vague destinations (“the dragon’s lair”).',
      ]),
      spell('Commune with Nature', 'Learn the locations of settlements, water or portals within 3 miles. Ritual.', ['It doesn’t work in built-up places, and only 300 feet underground.']),
      spell('Locate Object', 'Sense the direction to a known object within 1,000 feet, such as a landmark you have seen.'),
      spell('Guidance', '+1d4 to the navigator’s Survival check.'),
      spell('Enhance Ability', 'Advantage on the navigator’s Wisdom checks.'),
      spell('Speak with Animals', 'Ask local animals the way. Ritual.'),
      spell('Druidcraft', 'Forecast the weather, so you can avoid traveling in fog or a storm.'),
      feature('Ranger', 2, 'Deft Explorer', 'Expertise in Survival.'),
      gear('Navigator’s Tools', 'Plot a course (DC 10) or fix your position by the stars (DC 15).'),
      gear('Cartographer’s Tools', 'Draft a map of an area (DC 15) to keep from getting lost on the way back.'),
      { ...gear('Help action', 'Another member of the group can Help the navigator for Advantage.'), source: 'DMG rule' },
      { ...gear('Slow pace', 'Advantage on Survival checks.'), source: 'PHB rule' },
    ],
  },
  {
    id: 'tracking',
    title: 'Searching and tracking on a journey',
    problem: 'Finding hidden things or following a trail uses Wisdom checks against the terrain’s search DC, and enemies can track you too.',
    ways: [
      spell("Hunter's Mark", 'Advantage on Perception and Survival checks to find the marked creature.'),
      spell('Locate Creature', 'Direction to a creature you know within 1,000 feet for an hour.', ['Lead blocks it, and it can’t find a creature that’s been polymorphed or turned to stone.']),
      spell('Pass without Trace', '+10 to Stealth for the party, and you leave no tracks.'),
      spell('Speak with Animals', 'Beasts can say what passed by in the last day.'),
      spell('Find Traps', 'Sense whether there is a trap within range (not where it is).'),
      item('Boots of False Tracks', 'common', true, 'Leave the tracks of any kind of Humanoid of your size.'),
      feat('Observant', 'Search as a Bonus Action, and Expertise in Perception or Investigation.'),
    ],
  },
  {
    id: 'mounts',
    title: 'Mounts and pack animals',
    problem: 'Mounts cost money, need food and water by size every day, tire like characters do and need rest after galloping.',
    ways: [
      ruled(spell('Find Steed', 'An otherworldly steed that comes back whenever you recast the spell.'), 'The Otherworldly Steed stat block has no trait freeing it from food, water or sleep, so the rules for a Large creature apply: add it as a mount and it eats like a horse.', 'Most tables say a summoned spirit doesn’t eat: untick “needs food” and “needs water” on its mount card.'),
      spell('Phantom Steed', 'A quasi-real horse that needs no food or water, a ritual (no slot) and 13 miles an hour.'),
      spell("Tenser's Floating Disk", 'Carries 500 lb, follows you and never eats. Ritual.', ['It can’t cross a 10-foot drop, and the spell ends if you get 100 feet away.']),
      spell('Goodberry', 'One berry is a full day’s food for a horse too.'),
      item('Figurine of Wondrous Power', 'uncommon to very rare', false, 'Summon a mount or beast of burden for hours at a time, with no upkeep.'),
      bastion('Stable', 9, 'Comes with a Riding Horse or Camel and two Ponies or Mules, cared for by a hireling. After 14 days there, Animal Handling checks with a mount have Advantage.'),
    ],
  },
  {
    id: 'carrying',
    title: 'Carrying capacity and encumbrance',
    problem: 'Capacity is Strength × 15 lb (by size); the variant rule slows you at 5 × and 10 × Strength. Coins weigh 50 to the pound.',
    ways: [
      item('Bag of Holding', 'uncommon', false, 'Holds 500 lb (64 cubic feet) and always weighs 5 lb.', [
        'Putting it inside another extradimensional space destroys both and opens a gate to the Astral Plane.',
        'The air inside lasts 10 minutes for one creature.',
      ]),
      item("Heward's Handy Haversack", 'rare', false, '500 lb in the main pouch and 200 lb in each side pouch; always 5 lb, and the item you want is on top.'),
      item('Portable Hole', 'rare', false, 'A 10-foot-deep extradimensional hole that weighs nothing when folded.'),
      spell("Tenser's Floating Disk", 'A floating platform for 500 lb that follows you. Ritual.'),
      spell('Unseen Servant', 'Fetches and carries, but with Strength 2 it can lift only about 30 lb. Ritual.'),
      spell('Enlarge/Reduce', 'Enlarge makes a creature Large (double capacity) and gives Advantage on Strength checks.', ['Only 1 minute, with Concentration.']),
      species('Goliath (Powerful Build)', 'Counts as one size larger for carrying capacity.'),
      item('Gauntlets of Ogre Power', 'uncommon', true, 'Strength 19, so a much higher capacity.'),
      item('Belt of Giant Strength', 'rare', true, 'Strength 21 to 29 depending on the giant.'),
      item('Boots of Striding and Springing', 'uncommon', true, 'Your Speed isn’t reduced by carrying too much weight or wearing Heavy armor.'),
      spell("Leomund's Secret Chest", 'Stash 12 cubic feet on the Ethereal Plane and call it back.', ['After 60 days there’s a growing 5% daily chance the spell ends and the chest is stranded.']),
      { ...gear('Moneychanger', 'Swap copper and silver for gold, platinum or gems: the same wealth at a fraction of the weight.'), source: 'Tracker' },
    ],
  },
  {
    id: 'ammo',
    title: 'Running out of ammunition',
    problem: 'Each shot spends a piece of ammunition, and only half can be recovered after a fight.',
    ways: [
      { ...item('Repeating Shot', 'uncommon', true, 'The weapon makes its own ammunition, so you never run out.'), source: 'EFA (Artificer plan)' },
      spell('Shillelagh', 'Fight with a club or quarterstaff instead, with no ammunition to track.'),
      spell('Fire Bolt', 'A ranged cantrip attack with nothing to recover. Other attack cantrips work the same way.'),
      item('Quiver of Ehlonna', 'uncommon', false, 'Holds 60 arrows or bolts, 18 javelins and 6 bows or staves, and never weighs more than 2 lb.'),
      spell('Mending', 'Repairs broken arrows (1 minute each).', ['Arrows that were destroyed are gone; Mending fixes only a break.']),
      feature('Artificer', 1, "Tinker's Magic", 'Doesn’t make ammunition, but it does make Caltrops, Nets and Ball Bearings for free.', undefined, 'EFA'),
    ],
  },
  {
    id: 'light',
    title: 'Light and darkness',
    problem: 'Torches burn an hour and lamps 6 hours per flask, and in darkness you see nothing without Darkvision.',
    ways: [
      spell('Light', 'An hour of torch-like light from a cantrip: never buy torches again.', ['It ends if you cast it again, so one at a time.']),
      spell('Continual Flame', 'Torch light that never goes out, can’t be smothered and needs no fuel. A permanent torch for 50 GP of ruby dust.', ['It gives no heat.']),
      spell('Daylight', 'A 60-foot sphere of sunlight for an hour, and it dispels magical darkness of level 3 or lower.'),
      spell('Dancing Lights', 'Up to four movable lights.', ['Concentration, and only 1 minute.']),
      spell('Darkvision', 'Darkvision 150 ft for 8 hours.'),
      spell('Produce Flame', '20-foot light for 10 minutes, with no fuel.'),
      invocation("Devil's Sight", 2, 'See normally in any darkness, magical included, to 120 feet.'),
      sub('Ranger', 'Gloom Stalker', 3, 'Umbral Sight', 'Darkvision 60 ft (or +60), and you’re invisible to creatures relying on Darkvision to see you.'),
      sub('Wizard', 'Diviner', 10, 'The Third Eye', 'Darkvision 120 ft until your next rest.', undefined, undefined, ['divin']),
      sub('Barbarian', 'Path of the Wild Heart', 6, 'Aspect of the Wilds (Owl)', 'Darkvision 60 ft, or +60 ft.'),
      species('Dwarf, Orc or Drow', 'Darkvision 120 ft. Most other 2024 species have 60 ft; Humans, Halflings and Goliaths have none.'),
      item('Goggles of Night', 'uncommon', false, 'Darkvision 60 ft, or +60 ft.'),
      item('Driftglobe', 'uncommon', false, 'Casts Light at will (and Daylight once per dawn) and floats after you.'),
      item('Candle of the Deep', 'common', false, 'A candle that stays lit underwater.'),
    ],
  },
  {
    id: 'exploration',
    title: 'Exploration turns and wandering monsters',
    problem: 'Careful exploration eats 10-minute turns, each a chance for a wandering monster, while lights and spells run down.',
    ways: [
      spell('Pass without Trace', '+10 to Stealth and no tracks: far fewer encounters notice you.'),
      spell('Find Familiar', 'Scout ahead through your familiar’s eyes without moving the party.'),
      spell('Arcane Eye', 'An invisible eye scouts for an hour.'),
      spell('Find Traps', 'Know whether a trap is in sight before searching for it.'),
      spell('Detect Magic', 'Sense magic within 30 feet for 10 minutes. Ritual.'),
      spell('Locate Object', 'Head straight for the object you came for.'),
      feat('Observant', 'Search as a Bonus Action.'),
      feat('Keen Mind', 'Study as a Bonus Action.'),
    ],
  },
  {
    id: 'breath',
    title: 'Holding breath, drowning and frigid water',
    problem: 'You can hold your breath for 1 + Con modifier minutes (at least 30 seconds). Frigid water allows Con-score minutes, then a DC 10 Con save each minute or Exhaustion.',
    ways: [
      spell('Water Breathing', 'Up to ten creatures breathe water for 24 hours. Ritual.'),
      spell('Alter Self', 'Aquatic Adaptation: breathe water and gain a Swim Speed for an hour.'),
      invocation('Gift of the Depths', 5, 'Breathe underwater, gain a Swim Speed, and cast Water Breathing once per Long Rest for free.'),
      invocation('Master of Myriad Forms', 5, 'Cast Alter Self at will: gills whenever you need them.'),
      spell('Polymorph', 'Turn someone into a fish or seal for an hour.'),
      feature('Druid', 2, 'Wild Shape', 'Turn into a swimming beast for hours at a time (half your Druid level).'),
      sub('Druid', 'Circle of the Sea', 6, 'Aquatic Affinity', 'A Swim Speed equal to your Speed.'),
      feature('Ranger', 6, 'Roving', 'A Swim Speed (and a Climb Speed).'),
      sub('Barbarian', 'Path of the Wild Heart', 6, 'Aspect of the Wilds (Salmon)', 'A Swim Speed.'),
      spell('Protection from Energy', 'Cold Resistance: you automatically succeed on frigid water saves.'),
      species('Dragonborn (Silver or White)', 'Cold Resistance: automatic success on frigid water saves.', undefined, undefined, { choice: ['silver', 'white'] }),
      item('Cap of Water Breathing', 'uncommon', false, 'Creates an air bubble around your head underwater.'),
      item('Necklace of Adaptation', 'uncommon', true, 'Breathe normally in any environment.'),
      ruled(item('Ring of Warmth', 'uncommon', true, 'Unharmed by temperatures of 0 °F or lower.'), 'Only Cold Resistance or Immunity, or being adapted to icy water, makes frigid water saves succeed. The ring grants neither, and frigid water is usually warmer than 0 °F, so it doesn’t help in the water.'),
    ],
  },
  {
    id: 'hazards',
    title: 'Environmental hazards',
    problem: 'Thin ice, slippery ice, webs, razorvine, poisonous gas, rockslides, quicksand and deep water each call for saves or checks.',
    ways: [
      spell('Water Walk', 'Ten creatures cross water, mud, snow and quicksand as if it were solid ground. Ritual.'),
      ruled(spell('Freedom of Movement', 'Ignore Difficult Terrain, and magic can’t Restrain or Paralyze you; escape nonmagical restraints with 5 feet of movement.'), 'A Web spell can’t Restrain you at all. Natural spider webs are nonmagical restraints, so they can catch you, but you spend 5 feet of movement to slip out automatically.'),
      spell('Spider Climb', 'Walk on walls and ceilings around the hazard.'),
      spell('Levitate', 'Float over thin ice or quicksand.'),
      spell('Feather Fall', 'A Reaction that slows a fall for up to five creatures.'),
      spell('Gust of Wind', 'A strong wind disperses poisonous gas for 1 minute.'),
      spell('Fire Bolt', 'Webs are vulnerable to Fire, so burn a path through.'),
      spell('Protection from Poison', 'Advantage on saves against poison and Poison Resistance in gas.'),
      feature('Monk', 9, 'Acrobatic Movement', 'Move across liquids and up walls on your turn without falling.'),
      feat('Athlete', 'A Climb Speed and easier jumps.'),
      item('Ring of Free Action', 'rare', true, 'Difficult Terrain doesn’t cost you extra movement, and magic can’t Paralyze or Restrain you.'),
      gear('Climber’s Kit', 'Anchor yourself so you can’t fall more than 25 feet.'),
    ],
  },
  {
    id: 'identify',
    title: 'Identifying magic items',
    problem: 'Learning what an item does takes a spell, a Short Rest of study, or trial and error, and curses can hide.',
    ways: [
      spell('Identify', 'Learn an item’s properties, charges and whether it needs Attunement. Ritual (11 minutes).', [
        'The 100 GP pearl isn’t consumed.',
        'The 2024 spell doesn’t mention curses, so a curse can stay hidden.',
      ]),
      spell('Detect Magic', 'Shows which items are magical and their school. Ritual.'),
      spell('Legend Lore', 'Lore about a famous item, curses and history included.'),
      { ...gear('Short Rest of study', 'Spend a Short Rest focused on the item while touching it to learn its properties (but not a curse).'), source: 'PHB rule' },
      { ...gear('A taste', 'A little taste is enough to tell you what a potion does: no spell or rest needed.'), source: 'PHB rule' },
      bastion('Arcane Study', 5, 'After a Long Rest in your Bastion you get a Charm to cast Identify without a slot or the pearl.'),
      sub('Wizard', 'Diviner', 10, 'The Third Eye', 'Read any language, such as runes on the item.', undefined, undefined, ['divin']),
      spell('Remove Curse', 'Ends attunement to a cursed item once the curse shows.'),
    ],
  },
  {
    id: 'attunement',
    title: 'Attunement',
    problem: 'Attuning takes a Short Rest focused on the item, you can be attuned to at most three items, and attunement ends after 24 hours more than 100 feet away.',
    ways: [
      sub('Rogue', 'Thief', 13, 'Use Magic Device', 'Attune to four items, and use any Spell Scroll.'),
      feature('Artificer', 10, 'Magic Item Adept', 'Attune to four items (five at level 14, six at 18).', undefined, 'EFA'),
      feature('Artificer', 2, 'Replicate Magic Item', 'An item you make with this feature can be attuned the instant you make it, with no Short Rest needed.', undefined, 'EFA'),
      spell('Greater Restoration', 'Ends attunement to a cursed item.'),
      spell('Remove Curse', 'Ends attunement to a cursed item.'),
    ],
  },
  {
    id: 'dying',
    title: 'Dying and stabilizing',
    problem: 'At 0 HP a character makes death saves; three failures and they die. A Medicine check or a Healer’s Kit stabilizes them, and a stable character wakes after 1d4 hours.',
    ways: [
      spell('Healing Word', 'Any healing ends dying at once, and this one works from 60 feet as a Bonus Action.'),
      spell('Spare the Dying', 'Stabilizes from 15 ft (30 ft at level 5, 60 at 11, 120 at 17).'),
      spell('Death Ward', 'The first time the target would drop to 0 HP in the next 8 hours, it drops to 1 instead.'),
      spell('Revivify', 'Brings back someone who died within the last minute.', ['300 GP diamond, consumed.']),
      gear('Healer’s Kit', 'Stabilize without a Medicine check (10 uses).'),
      feat('Durable', 'Advantage on death saves.'),
      species('Orc (Relentless Endurance)', 'Drop to 1 HP instead of 0 once per Long Rest.'),
      sub('Paladin', 'Oath of the Ancients', 15, 'Undying Sentinel', 'Drop to 1 HP instead, and regain HP, once per Long Rest.'),
      feat('Boon of Recovery', 'Drop to 1 HP instead and regain half your HP, once per Long Rest.'),
      item('Periapt of Wound Closure', 'uncommon', true, 'Turn a death save of 9 or lower into a 10.'),
      bastion('Sanctuary', 5, 'A Charm to cast Healing Word without a slot after a Long Rest in your Bastion.'),
    ],
  },
  {
    id: 'death',
    title: 'Death and resurrection windows',
    problem: 'Revivify works within 1 minute, Raise Dead and Reincarnate within 10 days, Resurrection within 100 years, and each costs a costly material component.',
    ways: [
      spell('Gentle Repose', 'Days under the spell don’t count against the time limit, and the body can’t become Undead. Ritual, 10 days, recast as needed.', [
        'Cast it the moment you can’t raise the body right away.',
      ]),
      spell('Revivify', 'Within 1 minute, back with 1 HP.'),
      spell('Raise Dead', 'Within 10 days.', ['The target takes −4 to D20 Tests, reduced by 1 each Long Rest. It can’t restore missing vital parts, such as a head.']),
      spell('Reincarnate', 'Within 10 days, in a new body of a random species. Missing parts don’t matter.'),
      spell('Resurrection', 'Within 100 years, missing parts restored.', ['Raising someone dead for a year or more leaves the caster unable to cast spells until their next Long Rest.']),
      spell('True Resurrection', 'Within 200 years, with a new body if needed.'),
      feature('Cleric', 10, 'Divine Intervention', 'Cast any Cleric spell of level 5 or lower with no slot and no Material component: Raise Dead without the 500 GP diamond.', ['Once per Long Rest.']),
      bastion('Reliquary', 13, 'A Harvest order makes a talisman that replaces one spell’s components worth up to 1,000 GP, without being consumed: Raise Dead or Resurrection with no diamond.'),
      bastion('Teleportation Circle', 9, 'A Recruit order may bring an NPC caster who will cast one Wizard spell of level 4 or lower for you (level 8 or lower from character level 17).'),
      spell('Clone', 'An inert clone grows for 120 days; if you die, your soul moves into it.'),
    ],
  },
  {
    id: 'divination',
    title: 'Divination limits',
    problem: 'Augury, Divination and Commune become unreliable when cast more than once before a Long Rest (a cumulative chance of no or wrong answers).',
    ways: [
      spell('Augury', 'The limit is counted per caster, so two clerics in the party each get a reliable first casting.'),
      spell('Contact Other Plane', 'A different spell with its own risk (an Intelligence save) rather than the repeat penalty.'),
      spell('Legend Lore', 'Lore about famous people, places and things, with no repeat penalty.'),
      spell('Commune with Nature', 'Facts about the land within 3 miles with no repeat penalty. Ritual.'),
      bastion('Library', 5, 'A Research order gives three accurate facts about a topic after 7 days.'),
      bastion('Pub', 13, 'A Research order finds a familiar creature within 50 miles and where it has been for 7 days.'),
    ],
  },
  {
    id: 'rituals',
    title: 'Ritual casting time',
    problem: 'A ritual takes its casting time plus 10 minutes, and you normally need the spell prepared.',
    ways: [
      feat('Ritual Caster', 'Quick Ritual: once per Long Rest, cast a prepared ritual at its normal casting time with no slot. Also adds level 1 rituals, always prepared.'),
      feature('Wizard', 1, 'Ritual Adept', 'Cast any ritual in your spellbook without preparing it, reading from the book.'),
      invocation('Pact of the Tome', 1, 'Your Book of Shadows holds two level 1 rituals from any class, always prepared.', [
        'You choose them again whenever you conjure the book after a Short or Long Rest, so you can swap in Purify Food and Drink or Alarm as needed.',
      ]),
      feat('Magic Initiate', 'A level 1 spell always prepared, cast once without a slot. Picking a ritual such as Purify Food and Drink or Alarm lets you ritual-cast it any time.'),
      species('Wood Elf, High Elf or Forest Gnome', 'Free spells such as Speak with Animals, Detect Magic or Longstrider with no slot.'),
    ],
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle, lodging and meals',
    problem: 'In town, lifestyle costs from free (Wretched) to 10 GP a day (Aristocratic), covering meals and a bed.',
    ways: [
      spell("Leomund's Tiny Hut", 'A free, dry bed for the night outside town. Ritual.'),
      spell("Mordenkainen's Magnificent Mansion", 'Aristocratic living for free: a banquet for 100 and servants.'),
      spell('Create Food and Water', 'Meals for 15 people at no cost.'),
      spell('Goodberry', 'A day’s food for ten from one level 1 slot.'),
      bastion('Garden (Food)', 5, '100 days of Rations per Harvest order.'),
      bastion('Storehouse', 5, 'Buy goods at cost and sell them for 10% to 100% more, depending on your level.'),
    ],
  },
  {
    id: 'hirelings',
    title: 'Hirelings and their wages',
    problem: 'Skilled hirelings cost 2 GP a day, untrained ones 2 SP, and messengers 2 CP a mile.',
    ways: [
      spell('Unseen Servant', 'A free porter, cleaner and fire-lighter for an hour at a time. Ritual.', ['It can carry very little (Strength 2) and can’t go more than 60 feet from you.']),
      spell("Tenser's Floating Disk", 'Replaces a porter for up to 500 lb. Ritual.'),
      spell('Light', 'Replaces a torchbearer.'),
      spell('Continual Flame', 'A permanent torch: no torchbearer, no torches.'),
      spell("Mordenkainen's Faithful Hound", 'A guard for 8 hours.'),
      spell('Alarm', 'An alarm instead of a night guard. Ritual.'),
      spell('Find the Path', 'Replaces a guide for a familiar destination.'),
      spell('Comprehend Languages', 'Understand any language for an hour: no interpreter. Ritual.'),
      spell('Tongues', 'Speak and understand any language for an hour.'),
      spell('Animal Messenger', 'Free messages: 25 miles a day (50 if the beast flies). Ritual.'),
      spell('Sending', 'A 25-word message with a reply, any distance.'),
      spell('Find Steed', 'A free mount that needs no groom.'),
      feat('Healer', 'Replace a hired healer.'),
      feat('Chef', 'Replace a hired cook.'),
    ],
  },
  {
    id: 'crafting',
    title: 'Crafting time and cost',
    problem: 'Nonmagical items take a day per 10 GP of price and materials worth half. Spell Scrolls take 1 to 120 days, and magic items 5 to 250 days by rarity.',
    ways: [
      spell('Fabricate', 'Turns raw materials into finished objects in 10 minutes.', [
        'You need proficiency with the matching Artisan’s Tools for skilled work such as weapons and armor.',
        'It can’t make magic items or creatures, and metal or stone objects are limited to Medium.',
        'The quality depends on the raw materials.',
      ]),
      spell('Creation', 'Makes an object from shadow material in a minute.', ['It’s temporary (hours or days by material), and using it as a spell component makes that spell fail.']),
      spell('Mending', 'Repairs a break or tear up to 1 foot, instead of buying new.'),
      feat('Crafter', '20% off nonmagical items you buy, and after each Long Rest you can make one item from the Fast Crafting table (a ladder, torch, rope, tent and so on).', [
        'The item falls apart after your next Long Rest.',
      ]),
      feature('Artificer', 1, "Tinker's Magic", 'Make adventuring gear such as rope, a tinderbox, a bedroll, a lamp or caltrops in an action, lasting until your next Long Rest.', undefined, 'EFA'),
      feature(
        'Artificer',
        2,
        'Replicate Magic Item',
        'Make magic items such as a Bag of Holding, Alchemy Jug, Cap of Water Breathing or Sending Stones at the end of a Long Rest, with no gold or crafting days.',
        ['The number is limited by your level, and an item vanishes if you swap its plan or die.'],
        'EFA',
      ),
      {
        ...sub(
          'Artificer',
          'subclasses',
          3,
          'Tools of the Trade',
          'Each subclass halves crafting time for its kind of item: Alchemist potions, Armorer armor, Artillerist wands, Battle Smith weapons, Cartographer scrolls.',
        ),
        source: 'EFA',
      },
      { ...gear('Assistants', 'Each helper with the right tool proficiency divides the time (normally one helper, more with DM approval).'), source: 'PHB rule' },
      bastion('Workshop', 5, 'Hirelings craft adventuring gear for you while you’re away.'),
      bastion('Scriptorium', 9, 'A hireling scribes Cleric or Wizard Spell Scrolls of level 3 or lower (you pay the cost).'),
      bastion('Smithy', 5, 'Hirelings craft Smith’s Tools items (and uncommon armaments from level 9).'),
    ],
  },
  {
    id: 'spellbook',
    title: 'Copying spells into a spellbook',
    problem: 'Copying a new spell takes 2 hours and 50 GP per spell level; recopying your own book takes 1 hour and 10 GP per level.',
    ways: [
      sub('Wizard', 'Abjurer, Diviner, Evoker or Illusionist', 3, 'Savant', 'Two spells of your school free at level 3, and one more each time you gain a new spell slot level: no time or gold.', undefined, undefined, ['abjur', 'divin', 'evok', 'evoc', 'illusion']),
      feature('Wizard', 5, 'Memorize Spell', 'Swap a prepared spell on a Short Rest: less need to copy just in case.'),
      { ...gear('Backup spellbook', 'Recopying spells you already know costs a fifth of the gold and half the time, so keep a spare book.'), source: 'PHB rule' },
    ],
  },
  {
    id: 'downtime',
    title: 'Downtime checks and selling items',
    problem: 'Downtime activities end with ability checks, and buying or selling magic items takes days and a check.',
    ways: [
      spell('Guidance', '+1d4 to one ability check of a skill you choose.'),
      spell('Enhance Ability', 'Advantage on checks with one ability for an hour.'),
      spell('Comprehend Languages', 'Read foreign contracts and records during research. Ritual.'),
      feature('Rogue', 1, 'Expertise', 'Double proficiency in two skills.'),
      feature('Bard', 2, 'Expertise', 'Double proficiency in two skills.'),
      bastion('Storehouse', 5, 'Sell trade goods for 10% to 100% over standard price.'),
      bastion('Library', 5, 'Research a topic in 7 days via hirelings.'),
    ],
  },
  {
    id: 'messages',
    title: 'Messages over distance',
    problem: 'Messengers walk about 24 miles a day and charge by the mile, and a Bastion run from afar only gets orders when they arrive.',
    ways: [
      spell('Sending', '25 words to someone you’ve met, any distance, and they can answer at once.', ['5% chance of failure to another plane.', 'The recipient can block you for 8 hours.']),
      spell('Dream', 'Talk with a sleeping creature on the same plane for as long as it sleeps.'),
      spell('Animal Messenger', 'A Tiny beast carries 25 words 25 miles a day (50 flying). Ritual. Higher slots add 48 hours each.'),
      spell("Rary's Telepathic Bond", 'Up to eight creatures talk telepathically at any distance for an hour. Ritual.', ['It doesn’t reach other planes.']),
      spell('Message', 'Whisper up to 120 feet away, around corners.'),
      spell('Scrying', 'See and hear a creature or place.'),
      item('Sending Stones', 'uncommon', false, 'Cast Sending between the pair once per dawn.'),
      feat('Telepathic', 'Talk telepathically to anyone you see within 60 feet.'),
    ],
  },
  {
    id: 'building',
    title: 'Construction time and cost',
    problem: 'Bastion facilities, walls and businesses take weeks or months and cost hundreds or thousands of GP.',
    ways: [
      spell('Wall of Stone', 'Up to ten 10-by-10-foot stone panels; permanent if you keep Concentration for the full 10 minutes.'),
      spell('Stone Shape', 'Shape stone into walls, doors and passages.'),
      spell('Move Earth', 'Dig foundations, moats and earthworks over 2 hours.'),
      spell('Fabricate', 'Turn a clump of trees into a wooden bridge, beams or furniture.'),
      spell('Creation', 'Temporary objects, such as scaffolding.'),
      bastion('Demiplane', 17, 'Create a nonmagical object up to 5 feet across, worth up to 5 GP, from nothing once per Long Rest.'),
    ],
  },
  {
    id: 'dailyCasting',
    title: 'Spells cast every day until permanent',
    problem: 'Teleportation Circle, Guards and Wards and Private Sanctum become permanent after 365 daily castings, and Forbiddance after 30. Missing a day means starting over.',
    ways: [
      bastion('Teleportation Circle', 9, 'Your Bastion comes with a permanent teleportation circle, with no year of casting.'),
      spell('Hallow', 'Permanent from a single (24-hour) casting.'),
      spell('Magic Mouth', 'Permanent from a single casting, as a cheap alarm. Ritual.'),
      spell('Glyph of Warding', 'A permanent ward from a single casting, until triggered.', ['The 200 GP of diamond dust is consumed, and moving the warded object more than 10 feet breaks it.']),
      feature('Cleric', 10, 'Divine Intervention', 'Cast a level 5 or lower Cleric spell with no slot, so a daily Hallow-type casting doesn’t cost a slot.'),
    ],
  },
  {
    id: 'fear',
    title: 'Fear and stress',
    problem: 'Fear and stress (table rule) build up and ease only slowly with rests.',
    ways: [
      spell('Calm Emotions', 'Suppresses Charmed and Frightened.', ['Humanoids only. Each target makes a Charisma save, but the 2024 rules let any creature choose to fail a save, so allies are affected.']),
      spell('Heroism', 'Immune to Frightened, plus Temporary HP each turn.'),
      spell("Heroes' Feast", 'Immune to Frightened for 24 hours.'),
      feature('Paladin', 10, 'Aura of Courage', 'Allies within your aura are immune to Frightened.'),
      feat('Inspiring Leader', 'Temporary HP for six allies after each rest.'),
      feat('Musician', 'Heroic Inspiration for allies after each rest.'),
      bastion('Meditation Chamber', 13, 'Seven days of meditation give Advantage on two kinds of saves for a week.'),
    ],
  },
  {
    id: 'disease',
    title: 'Diseases (magical contagions)',
    problem: 'Cackle Fever, Sewer Plague and Sight Rot bring Exhaustion or blindness and are fought off with Con saves over days.',
    ways: [
      spell('Lesser Restoration', 'Ends Sight Rot immediately (the DMG names it).', ['The 2024 spell lists no general disease cure: it doesn’t end Cackle Fever or Sewer Plague.']),
      spell('Heal', 'Ends Sight Rot immediately and restores 70 HP.'),
      spell('Greater Restoration', 'Sewer Plague ends when the creature’s Exhaustion reaches 0, so removing its last level cures it.', [
        'It doesn’t help with Cackle Fever: that level “lasts until the contagion ends”, so it comes straight back.',
      ]),
      item('Potion of Vitality', 'very rare', false, 'Removes all Exhaustion, which ends Sewer Plague outright.'),
      feature('Ranger', 10, 'Tireless', 'Each Short Rest removes an Exhaustion level, which can bring Sewer Plague to 0 and end it.'),
      ruled(spell('Purify Food and Drink', 'Sight Rot is caught by drinking tainted water, so purify the water first. Ritual.'), 'The spell “removes poison and rot from nonmagical food and drink”. The water is nonmagical and the taint is rot, so purified water no longer carries Sight Rot.', 'Some tables say a magical contagion needs Lesser Restoration and that the spell does nothing.'),
      gear('Herbalism Kit', 'An hour makes an ointment that suppresses Sight Rot for 24 hours; three days of it end the disease.'),
      species('Gnome', 'Immune to Cackle Fever.'),
      feature('Paladin', 6, 'Aura of Protection', 'Allies within 10 feet add the Paladin’s Charisma modifier to every save, the contagion saves included.'),
      feature('Monk', 14, 'Disciplined Survivor', 'Proficiency in all saves, and reroll a failed one with a Focus Point.'),
      feat('Resilient', 'Proficiency in Constitution saves.'),
      species('Human (Resourceful)', 'Heroic Inspiration after each Long Rest: reroll the save at the end of that rest.'),
    ],
  },
  {
    id: 'encounters',
    title: 'Random encounters',
    problem: 'Travel, camping and exploration all carry a chance of an encounter, more often in dangerous places.',
    ways: [
      spell('Pass without Trace', '+10 to Stealth for everyone within 30 feet and no tracks, so far fewer creatures notice you.'),
      spell("Leomund's Tiny Hut", 'Opaque from outside and nothing can come in: a night camp that wanderers can’t reach. Ritual.'),
      spell('Rope Trick', 'An invisible pocket for up to eight creatures for an hour.'),
      spell("Mordenkainen's Magnificent Mansion", 'A hidden door to a house for 24 hours.'),
      spell('Alarm', 'Warning before an encounter reaches the camp. Ritual.'),
      spell("Mordenkainen's Faithful Hound", 'A guard dog with Truesight that bites intruders.'),
      spell('Invisibility', 'One creature (more with higher slots) goes unseen for an hour.'),
      spell('Nondetection', 'Hidden from divination, so hunters using magic can’t find you.'),
      spell('Find Familiar', 'Scout ahead and avoid what you see first.'),
      spell('Speak with Animals', 'Ask local beasts what dangers are nearby. Ritual.'),
      spell('Teleport', 'Skip the dangerous stretch entirely.'),
      { ...gear('Slow pace', 'Advantage on Perception checks and no penalty to Stealth, at the cost of distance.'), source: 'PHB rule' },
    ],
  },
  {
    id: 'services',
    title: 'Paying for spellcasting and passage',
    problem: 'Hiring a caster costs from 30 GP for a cantrip to 100,000 GP for level 9, plus costly components, and higher levels only in towns or cities.',
    ways: [
      feature('Cleric', 10, 'Divine Intervention', 'Cast any Cleric spell of level 5 or lower with no slot and no Material component, once per Long Rest.'),
      bastion(
        'Teleportation Circle',
        9,
        'A Recruit order may bring an NPC caster who casts one Wizard spell of level 4 or lower for you (8 or lower from level 17); you pay only for costly components.',
      ),
      bastion('Reliquary', 13, 'A talisman replaces one spell’s components worth up to 1,000 GP, without being consumed.'),
      bastion('Arcane Study', 5, 'A Charm to cast Identify for free.'),
      bastion('Sanctuary', 5, 'A Charm to cast Healing Word for free.'),
      bastion('Scriptorium', 9, 'Buy Spell Scrolls at crafting cost instead of a caster’s fee.'),
      feat('Magic Initiate', 'Learn two cantrips and a level 1 spell yourself.'),
      feat('Ritual Caster', 'Learn level 1 rituals yourself, such as Identify or Purify Food and Drink.'),
      spell('Teleportation Circle', 'Travel between permanent circles instead of paying for a ship’s passage.'),
    ],
  },
  {
    id: 'poisonHarvest',
    title: 'Harvesting poison',
    problem: 'Harvesting poison from a creature takes 1d6 minutes and a DC 20 Intelligence (Nature) check with a Poisoner’s Kit; failing by 5 or more exposes you to the poison.',
    ways: [
      spell('Guidance', '+1d4 to the Nature check.'),
      spell('Enhance Ability', 'Advantage on Intelligence checks.'),
      spell('Protection from Poison', 'Advantage on saves against the poison and Poison Resistance if the harvest goes wrong.'),
      feature('Wizard', 2, 'Scholar', 'Expertise in Nature (or another lore skill).'),
      feat('Keen Mind', 'Proficiency, or Expertise, in Nature.'),
      species('Dwarf (Dwarven Resilience)', 'Advantage against Poisoned and Poison Resistance if you’re exposed.'),
      item('Periapt of Proof against Poison', 'rare', true, 'Immune to the poison if the harvest fails.'),
      bastion('Greenhouse', 9, 'Harvest Assassin’s Blood, Malice, Pale Tincture or Truth Serum in 7 days, with no check.'),
      bastion('Garden (Poison)', 5, 'Two vials of Antitoxin or one of Basic Poison per Harvest order.'),
    ],
  },
  {
    id: 'saves',
    title: 'Saving throws over time',
    problem: 'Cold, heat, forced marches, malnutrition, frigid water and disease all come down to Con saves, one after another.',
    ways: [
      feature('Paladin', 6, 'Aura of Protection', 'You and allies within 10 feet add your Charisma modifier (at least +1) to every save.', ['It switches off while the Paladin is Incapacitated, asleep included, so it doesn’t cover saves made in your sleep.']),
      feature('Monk', 14, 'Disciplined Survivor', 'Proficiency in every save, and spend 1 Focus Point to reroll a failed one.'),
      feat('Resilient', 'Proficiency in Constitution saves (choose Constitution).'),
      feat('Lucky', 'Spend a Luck Point for Advantage on a save, several times per Long Rest.'),
      species('Halfling (Luck)', 'Reroll a 1 on any save.'),
      species('Human (Resourceful)', 'Heroic Inspiration after every Long Rest: reroll one die.'),
      feat('Musician', 'Give allies Heroic Inspiration after each rest.'),
      spell('Bless', '+1d4 to saves for three creatures.', ['Concentration for only 1 minute: it suits one dangerous save, not hourly ones.']),
      bastion('Meditation Chamber', 13, 'Seven days of meditation give Advantage on two randomly chosen kinds of saves for the next 7 days.'),
      { ...gear('Avoid the save instead', 'Most hourly saves have an automatic success: Cold or Fire Resistance, a Bedroll at night, drinkable water in the heat. See the topics for each one.'), source: 'Tip' },
    ],
  },
  {
    id: 'concentration',
    title: 'One Concentration spell at a time',
    problem: 'Each caster holds only one Concentration spell; casting another ends the first, and taking damage calls for a Con save to keep it.',
    ways: [
      { ...gear('Share the load', 'Concentration is per caster: let different casters hold Protection from Energy, Pass without Trace and Guidance.'), source: 'Tip' },
      spell("Leomund's Tiny Hut", 'Shelter for 8 hours with no Concentration, unlike Protection from Energy.'),
      spell('Fire Shield', 'Cold or Fire Resistance with no Concentration (10 minutes).'),
      spell('Light', 'Light with no Concentration, unlike Dancing Lights.'),
      spell('Continual Flame', 'Permanent light with no Concentration.'),
      feat('War Caster', 'Advantage on Con saves to keep Concentration.'),
      invocation('Eldritch Mind', 1, 'Advantage on Con saves to keep Concentration.'),
      feat('Resilient', 'Proficiency in Constitution saves, which covers Concentration saves.'),
      item('Ring of Spell Storing', 'rare', true, 'A caster stores a spell (up to 5 levels); the ally wearing the ring casts it and concentrates on it themselves, so the caster stays free for another Concentration spell.'),
    ],
  },
  {
    id: 'bastionEvents',
    title: 'Bastion events and attacks',
    problem: 'Each Maintain order rolls a Bastion event. An attack rolls 6d6 and loses a defender for each 1; with no defenders, a special facility shuts down for a turn.',
    ways: [
      bastion('Barrack', 5, 'Recruit up to four Bastion Defenders per order, at no cost. Any defenders at all keep facilities from shutting down in an attack.'),
      bastion('Armory', 5, 'When stocked (100 GP + 100 per defender, half with a Smithy), roll d8s instead of d6s, so fewer 1s and fewer losses.', ['The stock is used up by the attack, whatever happens.']),
      { ...gear('Defensive walls', 'A Bastion fully enclosed by walls rolls 2 fewer dice in an attack (250 GP and 10 days per 5-foot square).'), source: 'DMG rule' },
      bastion('War Room', 17, 'Each lieutenant housed in the Bastion removes one more die from the attack roll.'),
      bastion('Meditation Chamber', 13, 'An Empower order lets you roll twice on the next Bastion event and choose.'),
      spell('Guards and Wards', 'Wards the Bastion’s halls; permanent after a year of daily castings.'),
      spell('Glyph of Warding', 'Permanent traps at the gates from one casting.'),
      spell('Alarm', 'Warns of intruders. Ritual.'),
      { ...gear('Give real orders', 'Events only happen on Maintain turns, so giving facilities other orders avoids the roll entirely.'), source: 'DMG rule' },
    ],
  },
  {
    id: 'timekeeping',
    title: 'Telling the time without a clock',
    problem: 'With no timepiece, reading the sky is a Wisdom (Survival) check: DC 10 under a clear sky, 15 when overcast, 20 underground. A failure is off by 1d4 hours.',
    ways: [
      spell('Guidance', '+1d4 to the Survival check.'),
      spell('Enhance Ability', 'Advantage on Wisdom checks.'),
      feature('Ranger', 2, 'Deft Explorer', 'Expertise in Survival.'),
      gear('Navigator’s Tools', 'Fix your position by the stars (DC 15) on a clear night, which also pins down the hour.'),
      spell('Druidcraft', 'Predicts the next 24 hours of weather, so you know when the sky will be readable.'),
      { ...gear('No clocks in 2024', 'Neither the 2024 Player’s Handbook nor the Dungeon Master’s Guide sells a clock or timepiece, so a working one is a DM-placed treasure.'), source: 'Note' },
    ],
  },
  {
    id: 'poison',
    title: 'Poisons and the Poisoned condition',
    problem: 'A poison calls for a Con save; a failure means Poison damage, the Poisoned condition (Disadvantage on attack rolls and ability checks) or worse, for minutes or hours.',
    ways: [
      spell('Protection from Poison', 'Ends Poisoned, then Advantage on saves against it and Poison Resistance for an hour.'),
      spell('Lesser Restoration', 'Ends Poisoned as a Bonus Action.'),
      spell('Heal', 'Ends Poisoned (and Blinded and Deafened) and restores 70 HP.'),
      spell("Heroes' Feast", 'Immunity to Poisoned and Poison Resistance for 24 hours: cast it before entering a poisoner’s lair.'),
      feature('Paladin', 1, 'Lay on Hands', '5 points from the pool remove Poisoned.'),
      sub('Monk', 'Warrior of Mercy', 6, "Physician's Touch", 'Hand of Healing ends Poisoned.'),
      feature('Monk', 10, 'Self-Restoration', 'Ends Poisoned on yourself at the end of each of your turns.'),
      sub('Druid', 'Circle of the Land', 10, "Nature's Ward", 'Immune to the Poisoned condition.'),
      species('Dwarf (Dwarven Resilience)', 'Advantage on saves to avoid or end Poisoned, and Poison Resistance.'),
      species('Tiefling (Abyssal)', 'Poison Resistance (halves the damage, though not the condition).', undefined, undefined, { choice: ['abyssal'] }),
      feat('Boon of Energy Resistance', 'Choose Poison Resistance.'),
      gear('Antitoxin', 'Bonus Action: Advantage on saves to avoid or end Poisoned for 1 hour (50 GP).', ['It doesn’t end Poisoned on its own: it only helps with saves, such as the repeated saves some poisons allow.']),
      item('Periapt of Proof against Poison', 'rare', true, 'Immunity to Poisoned and Poison damage.'),
      item('Periapt of Health', 'uncommon', true, 'Advantage on saves to avoid or end Poisoned, and 2d4 + 2 HP once per dawn.'),
      item('Potion of Vitality', 'very rare', false, 'Ends Poisoned and removes Exhaustion.'),
      item('Ring of Poison Resistance', 'rare', false, 'Permanent Poison Resistance.'),
      bastion('Garden (Poison)', 5, 'Two vials of Antitoxin per Harvest order.'),
      bastion('Greenhouse', 9, 'Fruits of Restoration act as Lesser Restoration, three a day.'),
    ],
  },
  {
    id: 'shopping',
    title: 'Buying gear and selling loot',
    problem: 'Shops charge full price, small settlements may not stock what you need, and selling usually fetches half.',
    ways: [
      feat('Crafter', '20% off every nonmagical item you buy.'),
      { ...gear('Make it yourself', 'Crafting needs raw materials worth half the price, so a proficient crafter halves the cost (and takes a day per 10 GP).'), source: 'PHB rule' },
      bastion('Storehouse', 5, 'A hireling procures nonmagical goods worth up to 500 GP in 7 days (2,000 GP from level 9, 5,000 from 13), and sells your goods for 10% to 100% over the standard price.'),
      bastion('Stable', 9, 'Sell mounts for 20% over the standard price (50% from level 13, 100% from 17).'),
      bastion('Smithy', 5, 'Hirelings craft Smith’s Tools items, so you pay for materials, not the shop price.'),
      bastion('Workshop', 5, 'Hirelings craft adventuring gear with the Workshop’s tools.'),
      spell('Mending', 'Repair torn or broken gear instead of replacing it.'),
      spell('Fabricate', 'Turn raw materials into finished goods in 10 minutes (proficiency needed for weapons and armor).'),
      feature('Artificer', 1, "Tinker's Magic", 'Conjure common gear (rope, a lamp, caltrops and more) that lasts until your next Long Rest.', undefined, 'EFA'),
      spell('Teleportation Circle', 'Reach a city’s permanent circle when the village shop doesn’t have it.'),
      spell('Sending', 'Ask a merchant or contact in another town whether they have it before you make the trip.'),
    ],
  },
];

/** How the topics are grouped on the Ways Around tab. */
export const TOPIC_GROUPS: { title: string; topics: TopicId[] }[] = [
  { title: 'Food, water, poison and illness', topics: ['food', 'water', 'foraging', 'hunting', 'tainted', 'poison', 'disease', 'poisonHarvest'] },
  { title: 'Weather and the wild', topics: ['cold', 'heat', 'weather', 'altitude', 'breath', 'hazards'] },
  { title: 'Rest, recovery and saves', topics: ['shortRest', 'longRest', 'watch', 'exhaustion', 'saves', 'dying', 'death', 'fear'] },
  { title: 'Travel and exploration', topics: ['march', 'lost', 'tracking', 'encounters', 'exploration', 'mounts', 'timekeeping'] },
  { title: 'Camp and gear', topics: ['fire', 'light', 'armor', 'carrying', 'ammo'] },
  { title: 'Magic', topics: ['rituals', 'concentration', 'identify', 'attunement', 'divination', 'dailyCasting'] },
  { title: 'Money, downtime and Bastions', topics: ['lifestyle', 'shopping', 'hirelings', 'services', 'crafting', 'spellbook', 'downtime', 'messages', 'building', 'bastionEvents'] },
];

/** The sections options are sorted into, in display order. */
export const WAY_SECTIONS: { title: string; kinds: WayKind[] }[] = [
  { title: 'Spells', kinds: ['spell'] },
  { title: 'Class features', kinds: ['class', 'subclass', 'invocation'] },
  { title: 'Species and feats', kinds: ['species', 'feat'] },
  { title: 'Gear, items and rules', kinds: ['gear', 'magic-item'] },
  { title: 'Bastion facilities', kinds: ['bastion'] },
];

export const TOPIC_BY_ID: Record<TopicId, Topic> = Object.fromEntries(TOPICS.map((t) => [t.id, t])) as Record<TopicId, Topic>;

export function spellFact(name: string): SpellFact | undefined {
  return SPELL_FACTS[name];
}

// ---------------------------------------------------------------------------
// Matching against the party
// ---------------------------------------------------------------------------

export type MatchStatus = 'ready' | 'known' | 'ritual' | 'has' | 'maybe' | 'list';

export interface PartyMatch {
  charId: string;
  name: string;
  status: MatchStatus;
  /** What a "maybe" depends on, e.g. "if they're a Thief". */
  note?: string;
}

export const STATUS_TEXT: Record<MatchStatus, string> = {
  ready: 'prepared',
  ritual: 'can cast as a ritual from the spellbook',
  known: 'knows it, not prepared',
  has: 'has it',
  maybe: 'might have it',
  list: 'on their spell list',
};

/** The label shown for a match: the note for a "maybe", otherwise the status. */
export const matchText = (m: PartyMatch): string => m.note ?? STATUS_TEXT[m.status];

/** Strip a wizard's name and punctuation so "Leomund's Tiny Hut" matches "Tiny Hut". */
export function normalizeSpellName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(leomund|mordenkainen|tenser|rary|drawmij|bigby|otiluke|otto|melf|evard|tasha|nystul|snilloc|maximilian)['’]s\s+/, '')
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9/' ]/g, '')
    .trim();
}

/** Highest spell level a class can cast at a class level (Warlocks include Mystic Arcanum). */
export function maxSpellLevel(className: string, level: number): number {
  const lv = Math.max(1, Math.min(20, level));
  switch (className) {
    case 'Bard':
    case 'Cleric':
    case 'Druid':
    case 'Sorcerer':
    case 'Wizard':
      return Math.min(9, Math.ceil(lv / 2));
    case 'Paladin':
    case 'Ranger':
    case 'Artificer':
      return Math.min(5, Math.ceil(lv / 4));
    case 'Warlock':
      return lv >= 17 ? 9 : lv >= 15 ? 8 : lv >= 13 ? 7 : lv >= 11 ? 6 : Math.min(5, Math.ceil(lv / 2));
    default:
      return 0;
  }
}

const norm = (x: string): string => x.toLowerCase().replace(/[’']/g, "'").trim();
const splitList = (x: string): string[] => x.split(/,\s*|\s+or\s+/).map(norm).filter(Boolean);
const hasWord = (hay: string, word: string): boolean => new RegExp(`(^|[^a-z])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(hay);

/** Free text about a character: notes, resource, item and inventory names. */
const textOf = (c: Character): string => norm([c.notes, ...c.resources.map((r) => r.name), ...c.items.map((i) => i.name), ...c.inventory.map((i) => i.name)].join('\n'));

/** The name before any parentheses, e.g. "Elf (Trance)" → "elf". */
const baseName = (name: string): string => norm(name.replace(/\s*\(.*\)\s*/g, ''));

/** Treat an "Other" character whose details mention Artificer as an Artificer. */
const classOf = (c: Character): string => (c.className === 'Other' && /artificer/i.test(`${c.subclass} ${c.notes} ${c.features.join(' ')}`) ? 'Artificer' : c.className);

function matchSpecies(way: Way, c: Character): Omit<PartyMatch, 'charId' | 'name'> | null {
  const keys = way.keys ?? splitList(baseName(way.name));
  const sp = norm(c.species ?? '');
  const hay = sp || textOf(c);
  if (!keys.some((k) => hasWord(hay, k))) return null;
  if (!way.choice) return { status: 'has' };
  const detail = `${sp} ${textOf(c)}`;
  if (way.choice.some((k) => hasWord(detail, k))) return { status: 'has' };
  return { status: 'maybe', note: `if they have the ${way.choice.map((k) => k[0].toUpperCase() + k.slice(1)).join(' or ')} ${keys[0] === 'tiefling' ? 'legacy' : keys[0] === 'gnome' ? 'lineage' : 'ancestry'}` };
}

/** Who in the party can use this way, and how ready they are. */
export function matchParty(way: Way, chars: Character[]): PartyMatch[] {
  const out: PartyMatch[] = [];
  for (const c of chars) {
    if (c.kind !== 'pc') continue;
    const cls = classOf(c);
    const text = textOf(c);
    let m: Omit<PartyMatch, 'charId' | 'name'> | null = null;
    if (way.kind === 'spell') {
      const fact = SPELL_FACTS[way.name];
      const key = normalizeSpellName(way.name);
      const sp = c.spells.find((x) => normalizeSpellName(x.name) === key);
      if (sp) {
        if (sp.prepared || sp.alwaysPrepared) m = { status: 'ready' };
        else if (fact?.ritual && c.className === 'Wizard') m = { status: 'ritual' };
        else m = { status: 'known' };
      } else if (fact && fact.classes.includes(cls) && maxSpellLevel(cls, c.level) >= fact.level) {
        m = { status: 'list' };
      } else if (text.includes(key)) {
        m = { status: 'has' };
      }
    } else if (way.kind === 'class') {
      if (way.className === cls && c.level >= (way.level ?? 1)) m = { status: 'has' };
    } else if (way.kind === 'subclass') {
      if (way.className === cls && c.level >= (way.level ?? 1)) {
        const keys = way.keys ?? splitList(way.subclass ?? '').map((k) => k.replace(/^(circle|oath|path|college|domain|way|warrior|school) of (the )?/, '').replace(/ patron$/, ''));
        const sub = norm(c.subclass ?? '');
        const anySub = way.subclass === 'any subclass';
        if (anySub) m = { status: 'has' };
        else if (sub) m = keys.some((k) => hasWord(sub, k)) ? { status: 'has' } : null;
        else m = keys.some((k) => hasWord(text, k)) || hasWord(text, norm(way.name)) ? { status: 'has' } : { status: 'maybe', note: `if their subclass is ${way.subclass}` };
      }
    } else if (way.kind === 'invocation') {
      const name = norm(way.name);
      const listed = (c.features ?? []).map(norm);
      if (listed.some((f) => f.includes(name)) || text.includes(name)) m = { status: 'has' };
      else if (cls === 'Warlock' && c.level >= (way.level ?? 1) && !listed.length) m = { status: 'maybe', note: 'if they took this invocation' };
    } else if (way.kind === 'feat') {
      const name = baseName(way.name);
      const feats = (c.feats ?? []).map(norm);
      if (feats.some((f) => f.startsWith(name) || name.startsWith(f)) || (name === 'chef' && c.chef) || text.includes(name)) m = { status: 'has' };
    } else if (way.kind === 'species') {
      m = matchSpecies(way, c);
    } else {
      const words = baseName(way.name);
      if (words && text.includes(words)) m = { status: 'has' };
    }
    if (m) out.push({ charId: c.id, name: c.name, ...m });
  }
  return out;
}

const RANK: Record<MatchStatus, number> = { ready: 0, has: 1, ritual: 2, known: 3, list: 4, maybe: 5 };

/** Whether someone can use it right now (prepared spell, a feature they have, an item they carry). */
export const isReady = (m: PartyMatch): boolean => m.status === 'ready' || m.status === 'has' || m.status === 'ritual';

/** Ways sorted so that what the party can use right now comes first. */
export function rankWays(ways: Way[], chars: Character[]): { way: Way; matches: PartyMatch[] }[] {
  const rows = ways.map((way, i) => {
    const matches = matchParty(way, chars).sort((a, b) => RANK[a.status] - RANK[b.status]);
    const best = matches.length ? RANK[matches[0].status] : 9;
    return { way, matches, best, i };
  });
  rows.sort((a, b) => a.best - b.best || a.i - b.i);
  return rows.map(({ way, matches }) => ({ way, matches }));
}

/** A stable key for a way within a topic. */
export const wayKey = (w: Way): string => `${w.kind}:${w.className ?? ''}:${w.name}`;

/** Short label for a way's kind and level, e.g. "Spell · level 3 · ritual". */
export function wayLabel(way: Way): string {
  switch (way.kind) {
    case 'spell': {
      const f = SPELL_FACTS[way.name];
      const parts = [f.level === 0 ? 'Cantrip' : `Level ${f.level} spell`];
      if (f.ritual) parts.push('ritual');
      if (f.concentration) parts.push('concentration');
      return parts.join(' · ');
    }
    case 'class':
      return `${way.className} ${way.level}`;
    case 'subclass':
      return `${way.className} (${way.subclass}) ${way.level}`;
    case 'invocation':
      return `Eldritch Invocation${way.level && way.level > 1 ? ` · Warlock ${way.level}` : ''}`;
    case 'feat':
      return 'Feat';
    case 'species':
      return way.level ? `Species · level ${way.level}` : 'Species';
    case 'gear':
      return way.source ?? 'Equipment';
    case 'magic-item':
      return `Magic item · ${way.rarity}${way.attune ? ' · attunement' : ''}`;
    case 'bastion':
      return `Bastion facility · level ${way.level}`;
  }
}

/** Search across names, descriptions and edge cases. */
export function searchWays(query: string): { topic: Topic; way: Way }[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out: { topic: Topic; way: Way }[] = [];
  for (const topic of TOPICS) {
    for (const way of topic.ways) {
      const hay = [way.name, way.how, ...(way.catches ?? []), way.className ?? '', way.subclass ?? ''].join(' ').toLowerCase();
      if (hay.includes(q)) out.push({ topic, way });
    }
  }
  return out;
}
