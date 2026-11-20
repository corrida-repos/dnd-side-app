/**
 * Spell facts used by the "Ways around this" catalog, checked against the 2024 Player's Handbook data
 * (as published by 5etools): level, ritual tag, the base-class spell lists that include it, and any
 * Material component with a gold cost.
 */
export interface SpellFact {
  level: number;
  classes: string[];
  ritual?: boolean;
  concentration?: boolean;
  castTime: string;
  duration: string;
  /** Costly Material component, e.g. "300 GP diamond, consumed". */
  cost?: string;
}

const f = (level: number, classes: string, castTime: string, duration: string, extra: Partial<SpellFact> = {}): SpellFact => ({
  level,
  classes: classes.split(',').map((s) => s.trim()),
  castTime,
  duration,
  ...extra,
});

const R = { ritual: true };
const C = { concentration: true };

export const SPELL_FACTS: Record<string, SpellFact> = {
  // Food and water
  Goodberry: f(1, 'Druid, Ranger', 'Action', '24 hours'),
  'Create Food and Water': f(3, 'Cleric, Paladin', 'Action', 'Instantaneous'),
  'Create or Destroy Water': f(1, 'Cleric, Druid', 'Action', 'Instantaneous'),
  'Purify Food and Drink': f(1, 'Cleric, Druid, Paladin', 'Action', 'Instantaneous', R),
  "Heroes' Feast": f(6, 'Bard, Cleric, Druid', '10 minutes', 'Instantaneous', { cost: '1,000 GP bowl, consumed' }),
  'Plant Growth': f(3, 'Bard, Druid, Ranger', 'Action or 8 hours', 'Instantaneous'),
  // Conditions and healing
  'Lesser Restoration': f(2, 'Bard, Cleric, Druid, Paladin, Ranger', 'Bonus Action', 'Instantaneous'),
  'Greater Restoration': f(5, 'Bard, Cleric, Druid, Paladin, Ranger', 'Action', 'Instantaneous', { cost: '100 GP diamond dust, consumed' }),
  'Protection from Poison': f(2, 'Cleric, Druid, Paladin, Ranger', 'Action', '1 hour'),
  'Protection from Energy': f(3, 'Cleric, Druid, Ranger, Sorcerer, Wizard', 'Action', '1 hour', C),
  'Fire Shield': f(4, 'Druid, Sorcerer, Wizard', 'Action', '10 minutes'),
  'Prayer of Healing': f(2, 'Cleric, Paladin', '10 minutes', 'Instantaneous'),
  'Healing Word': f(1, 'Bard, Cleric, Druid', 'Bonus Action', 'Instantaneous'),
  'Cure Wounds': f(1, 'Bard, Cleric, Druid, Paladin, Ranger', 'Action', 'Instantaneous'),
  'Spare the Dying': f(0, 'Cleric, Druid', 'Action', 'Instantaneous'),
  Heal: f(6, 'Cleric, Druid', 'Action', 'Instantaneous'),
  Bless: f(1, 'Cleric, Paladin', 'Action', '1 minute', { ...C, cost: '5 GP holy symbol' }),
  Invisibility: f(2, 'Bard, Sorcerer, Warlock, Wizard', 'Action', '1 hour', C),
  Nondetection: f(3, 'Bard, Ranger, Wizard', 'Action', '8 hours', { cost: '25 GP diamond dust, consumed' }),
  'Death Ward': f(4, 'Cleric, Paladin', 'Action', '8 hours'),
  Aid: f(2, 'Bard, Cleric, Druid, Paladin, Ranger', 'Action', '8 hours'),
  'Calm Emotions': f(2, 'Bard, Cleric', 'Action', '1 minute', C),
  Heroism: f(1, 'Bard, Paladin', 'Action', '1 minute', C),
  // Shelter and camp
  "Leomund's Tiny Hut": f(3, 'Bard, Wizard', '1 minute', '8 hours', R),
  'Rope Trick': f(2, 'Wizard', 'Action', '1 hour'),
  "Mordenkainen's Magnificent Mansion": f(7, 'Bard, Wizard', '1 minute', '24 hours', { cost: '15 GP miniature door' }),
  Demiplane: f(8, 'Sorcerer, Warlock, Wizard', 'Action', '1 hour'),
  Alarm: f(1, 'Ranger, Wizard', '1 minute', '8 hours', R),
  "Mordenkainen's Faithful Hound": f(4, 'Wizard', 'Action', '8 hours'),
  "Mordenkainen's Private Sanctum": f(4, 'Wizard', '10 minutes', '24 hours'),
  'Guards and Wards': f(6, 'Bard, Wizard', '1 hour', '24 hours', { cost: '10 GP silver rod' }),
  Forbiddance: f(6, 'Cleric', '10 minutes', '1 day', { ...R, cost: '1,000 GP ruby dust' }),
  'Glyph of Warding': f(3, 'Bard, Cleric, Wizard', '1 hour', 'Until dispelled or triggered', { cost: '200 GP diamond dust, consumed' }),
  'Magic Mouth': f(2, 'Bard, Wizard', '1 minute', 'Until dispelled', { ...R, cost: '10 GP jade dust, consumed' }),
  Hallow: f(5, 'Cleric', '24 hours', 'Until dispelled', { cost: '1,000 GP incense, consumed' }),
  // Fire, light and weather
  Prestidigitation: f(0, 'Bard, Sorcerer, Warlock, Wizard', 'Action', 'Up to 1 hour'),
  Druidcraft: f(0, 'Druid', 'Action', 'Instantaneous'),
  Elementalism: f(0, 'Druid, Sorcerer, Wizard', 'Action', 'Instantaneous'),
  'Produce Flame': f(0, 'Druid', 'Bonus Action', '10 minutes'),
  'Fire Bolt': f(0, 'Sorcerer, Wizard', 'Action', 'Instantaneous'),
  Light: f(0, 'Bard, Cleric, Sorcerer, Wizard', 'Action', '1 hour'),
  'Dancing Lights': f(0, 'Bard, Sorcerer, Wizard', 'Action', '1 minute', C),
  'Continual Flame': f(2, 'Cleric, Druid, Wizard', 'Action', 'Until dispelled', { cost: '50 GP ruby dust, consumed' }),
  Daylight: f(3, 'Cleric, Druid, Paladin, Ranger, Sorcerer', 'Action', '1 hour'),
  Darkvision: f(2, 'Druid, Ranger, Sorcerer, Wizard', 'Action', '8 hours'),
  'Control Weather': f(8, 'Cleric, Druid, Wizard', '10 minutes', '8 hours', C),
  'Gust of Wind': f(2, 'Druid, Ranger, Sorcerer, Wizard', 'Action', '1 minute', C),
  'Wind Wall': f(3, 'Druid, Ranger', 'Action', '1 minute', C),
  // Movement and travel
  Longstrider: f(1, 'Bard, Druid, Ranger, Wizard', 'Action', '1 hour'),
  'Phantom Steed': f(3, 'Wizard', '1 minute', '1 hour', R),
  'Find Steed': f(2, 'Paladin', 'Action', 'Instantaneous'),
  'Wind Walk': f(6, 'Druid', '1 minute', '8 hours'),
  Fly: f(3, 'Sorcerer, Warlock, Wizard', 'Action', '10 minutes', C),
  Levitate: f(2, 'Sorcerer, Wizard', 'Action', '10 minutes', C),
  'Feather Fall': f(1, 'Bard, Sorcerer, Wizard', 'Reaction', '1 minute'),
  'Spider Climb': f(2, 'Sorcerer, Warlock, Wizard', 'Action', '1 hour', C),
  'Water Walk': f(3, 'Cleric, Druid, Ranger, Sorcerer', 'Action', '1 hour', R),
  'Water Breathing': f(3, 'Druid, Ranger, Sorcerer, Wizard', 'Action', '24 hours', R),
  'Freedom of Movement': f(4, 'Bard, Cleric, Druid, Ranger', 'Action', '1 hour'),
  'Alter Self': f(2, 'Sorcerer, Wizard', 'Action', '1 hour', C),
  Polymorph: f(4, 'Bard, Druid, Sorcerer, Wizard', 'Action', '1 hour', C),
  'Enlarge/Reduce': f(2, 'Bard, Druid, Sorcerer, Wizard', 'Action', '1 minute', C),
  'Misty Step': f(2, 'Sorcerer, Warlock, Wizard', 'Bonus Action', 'Instantaneous'),
  'Teleportation Circle': f(5, 'Bard, Sorcerer, Warlock, Wizard', '1 minute', '1 round', { cost: '50 GP rare inks, consumed' }),
  Teleport: f(7, 'Bard, Sorcerer, Wizard', 'Action', 'Instantaneous'),
  'Transport via Plants': f(6, 'Druid', 'Action', '1 minute'),
  'Tree Stride': f(5, 'Druid, Ranger', 'Action', '1 minute', C),
  'Word of Recall': f(6, 'Cleric', 'Action', 'Instantaneous'),
  // Finding things
  Guidance: f(0, 'Cleric, Druid', 'Action', '1 minute', C),
  'Enhance Ability': f(2, 'Bard, Cleric, Druid, Ranger, Sorcerer, Wizard', 'Action', '1 hour', C),
  'Find the Path': f(6, 'Bard, Cleric, Druid', '1 minute', '1 day', { ...C, cost: '100 GP divination tools' }),
  'Locate Animals or Plants': f(2, 'Bard, Druid, Ranger', 'Action', 'Instantaneous', R),
  'Locate Object': f(2, 'Bard, Cleric, Druid, Paladin, Ranger, Wizard', 'Action', '10 minutes', C),
  'Locate Creature': f(4, 'Bard, Cleric, Druid, Paladin, Ranger, Wizard', 'Action', '1 hour', C),
  'Commune with Nature': f(5, 'Druid, Ranger', '1 minute', '1 minute', R),
  "Hunter's Mark": f(1, 'Ranger', 'Bonus Action', '1 hour', C),
  'Speak with Animals': f(1, 'Bard, Druid, Ranger, Warlock', 'Action', '10 minutes', R),
  'Speak with Plants': f(3, 'Bard, Druid, Ranger', 'Action', '10 minutes'),
  'Beast Sense': f(2, 'Druid, Ranger', 'Action', '1 hour', { ...R, ...C }),
  'Pass without Trace': f(2, 'Druid, Ranger', 'Action', '1 hour', C),
  'Find Familiar': f(1, 'Wizard', '1 hour', 'Instantaneous', { ...R, cost: '10 GP incense, consumed' }),
  'Find Traps': f(2, 'Cleric, Druid, Ranger', 'Action', 'Instantaneous'),
  'Arcane Eye': f(4, 'Wizard', 'Action', '1 hour', C),
  // Knowledge
  Identify: f(1, 'Bard, Wizard', '1 minute', 'Instantaneous', { ...R, cost: '100 GP pearl' }),
  'Detect Magic': f(1, 'Bard, Cleric, Druid, Paladin, Ranger, Sorcerer, Warlock, Wizard', 'Action', '10 minutes', { ...R, ...C }),
  'Legend Lore': f(5, 'Bard, Cleric, Wizard', '10 minutes', 'Instantaneous', { cost: '250 GP incense (consumed) and 200 GP of ivory strips' }),
  'Remove Curse': f(3, 'Cleric, Paladin, Warlock, Wizard', 'Action', 'Instantaneous'),
  Augury: f(2, 'Cleric, Druid, Wizard', '1 minute', 'Instantaneous', { ...R, cost: '25 GP divinatory tokens' }),
  Divination: f(4, 'Cleric, Druid, Wizard', 'Action', 'Instantaneous', { ...R, cost: '25 GP incense, consumed' }),
  Commune: f(5, 'Cleric', '1 minute', '1 minute', R),
  'Contact Other Plane': f(5, 'Warlock, Wizard', '1 minute', '1 minute', R),
  'Comprehend Languages': f(1, 'Bard, Sorcerer, Warlock, Wizard', 'Action', '1 hour', R),
  Tongues: f(3, 'Bard, Cleric, Sorcerer, Warlock, Wizard', 'Action', '1 hour'),
  // Messages
  Message: f(0, 'Bard, Druid, Sorcerer, Wizard', 'Action', '1 round'),
  'Animal Messenger': f(2, 'Bard, Druid, Ranger', 'Action', '24 hours', R),
  Sending: f(3, 'Bard, Cleric, Wizard', 'Action', 'Instantaneous'),
  Dream: f(5, 'Bard, Warlock, Wizard', '1 minute', '8 hours'),
  "Rary's Telepathic Bond": f(5, 'Bard, Wizard', 'Action', '1 hour', R),
  Scrying: f(5, 'Bard, Cleric, Druid, Warlock, Wizard', '10 minutes', '10 minutes', { ...C, cost: '1,000 GP focus' }),
  // Labour and making things
  'Unseen Servant': f(1, 'Bard, Warlock, Wizard', 'Action', '1 hour', R),
  "Tenser's Floating Disk": f(1, 'Wizard', 'Action', '1 hour', R),
  Mending: f(0, 'Bard, Cleric, Druid, Sorcerer, Wizard', '1 minute', 'Instantaneous'),
  Fabricate: f(4, 'Wizard', '10 minutes', 'Instantaneous'),
  Creation: f(5, 'Sorcerer, Wizard', '1 minute', 'Varies'),
  'Stone Shape': f(4, 'Cleric, Druid, Wizard', 'Action', 'Instantaneous'),
  'Move Earth': f(6, 'Druid, Sorcerer, Wizard', 'Action', '2 hours', C),
  'Wall of Stone': f(5, 'Druid, Sorcerer, Wizard', 'Action', '10 minutes', C),
  "Leomund's Secret Chest": f(4, 'Wizard', 'Action', 'Until dispelled', { cost: '5,050 GP chest and replica' }),
  Shillelagh: f(0, 'Druid', 'Bonus Action', '1 minute'),
  'Mage Armor': f(1, 'Sorcerer, Wizard', 'Action', '8 hours'),
  // Death
  'Gentle Repose': f(2, 'Cleric, Paladin, Wizard', 'Action', '10 days', { ...R, cost: '2 CP, consumed' }),
  Revivify: f(3, 'Cleric, Druid, Paladin, Ranger', 'Action', 'Instantaneous', { cost: '300 GP diamond, consumed' }),
  'Raise Dead': f(5, 'Bard, Cleric, Paladin', '1 hour', 'Instantaneous', { cost: '500 GP diamond, consumed' }),
  Reincarnate: f(5, 'Druid', '1 hour', 'Instantaneous', { cost: '1,000 GP rare oils, consumed' }),
  Resurrection: f(7, 'Bard, Cleric', '1 hour', 'Instantaneous', { cost: '1,000 GP diamond, consumed' }),
  'True Resurrection': f(9, 'Cleric, Druid', '1 hour', 'Instantaneous', { cost: '25,000 GP diamonds, consumed' }),
  Clone: f(8, 'Wizard', '1 hour', 'Instantaneous', { cost: '1,000 GP diamond (consumed) and a 2,000 GP vessel' }),
  Wish: f(9, 'Sorcerer, Wizard', 'Action', 'Instantaneous'),
};
