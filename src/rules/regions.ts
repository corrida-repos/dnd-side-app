/**
 * Supernatural regions (Tasha's Cauldron of Everything). Roll d100 when the region's triggers happen.
 * Band labels are short summaries, not the book's text; read Tasha's for the full effect. Bands with `auto`
 * are applied by the tracker because they play out over hours or days.
 */
export type RegionKind = 'blessed' | 'farRealm' | 'haunted' | 'infested' | 'mirror' | 'psychic' | 'unraveling';

export interface RegionBand {
  upTo: number;
  label: string;
  /** How long a lasting effect runs (minutes), and who it touches. */
  minutes?: number;
  target?: 'one' | 'all';
  auto?: 'noRest' | 'restSave' | 'lostHours' | 'hourlyExhaustion' | 'storm' | 'heal3d6' | 'sightRot' | 'coldDay';
}

export interface RegionInfo {
  name: string;
  triggers: string[];
  bands: RegionBand[];
}

const H = 60;
const D = 24 * 60;

export const REGIONS: Record<RegionKind, RegionInfo> = {
  blessed: {
    name: 'Blessed Radiance',
    triggers: ['Someone resists a fiend’s or undead’s power', 'A cleric or paladin spell of level 3+ is cast', 'A critical hit on a fiend or undead', 'A triumph of righteousness'],
    bands: [
      { upTo: 6, label: 'Golden light: divine favor for 1 hour', minutes: H, target: 'one' },
      { upTo: 12, label: 'Radiant burst heals the living 3d6, burns undead', auto: 'heal3d6' },
      { upTo: 18, label: 'Aberrations, fiends and undead falter for 24 hours', minutes: D },
      { upTo: 24, label: 'Bearers of good holy symbols gain Advantage on saves for 24 hours', minutes: D, target: 'all' },
      { upTo: 30, label: 'Celestial power: melee hits deal +2d6 radiant for 1 minute', minutes: 1, target: 'one' },
      { upTo: 36, label: 'A weapon becomes a mace of disruption for 24 hours', minutes: D, target: 'one' },
      { upTo: 42, label: 'A gleaming flying sword hunts an evil creature' },
      { upTo: 48, label: 'Celestial voices answer one question (commune)', target: 'one' },
      { upTo: 54, label: 'Evil creatures glow crimson for 1 minute' },
      { upTo: 60, label: 'Divine light explodes around an evil creature' },
      { upTo: 66, label: 'A sense of purpose: bless for 1 minute', minutes: 1, target: 'one' },
      { upTo: 72, label: 'A booming voice: temporary HP or a stumble' },
      { upTo: 78, label: 'Healing hands: free lesser or greater restoration for 1 hour', minutes: H, target: 'one' },
      { upTo: 84, label: 'Hallow settles over the region for 24 hours', minutes: D },
      { upTo: 90, label: 'An angelic command to grovel' },
      { upTo: 95, label: 'Permanent Resistance to necrotic damage', target: 'one' },
      { upTo: 100, label: 'One guaranteed Divine Intervention within 7 days', minutes: 7 * D, target: 'one' },
    ],
  },
  farRealm: {
    name: 'Far Realm',
    triggers: ['Someone succumbs to madness or alien influence', 'An aberration acts nearby', 'Reality is pushed: a spell of level 5+ is cast', 'The party lingers too long'],
    bands: [
      { upTo: 9, label: 'A whispering structure lures listeners' },
      { upTo: 18, label: 'An elder evil’s attention: resting needs a DC 12 Cha save or it gives no benefit', minutes: D, auto: 'restSave' },
      { upTo: 27, label: 'Plants and beasts turn malevolent' },
      { upTo: 36, label: 'Distance warps: ranged attacks at Disadvantage, range halved', minutes: D },
      { upTo: 45, label: 'The land becomes flesh and gibbering mouthers rise' },
      { upTo: 54, label: 'Murmurs drive one creature to lash out' },
      { upTo: 63, label: 'Writhing limbs burst out and grab' },
      { upTo: 72, label: 'Lost in a loop: 2d10 hours pass with no progress', auto: 'lostHours' },
      { upTo: 79, label: 'Compelled to copy blasphemous designs' },
      { upTo: 85, label: 'The land spells out secrets (DC 20 Arcana to read)' },
      { upTo: 90, label: 'Round things look horribly wrong' },
      { upTo: 95, label: 'Weeping eyes watch: the party can’t surprise anyone here', minutes: D },
      { upTo: 100, label: 'A rift to another plane tears open' },
    ],
  },
  haunted: {
    name: 'Haunted',
    triggers: ['Someone becomes Frightened', 'Several creatures can’t see', 'Someone is alone', 'Midnight or another ominous hour', 'A ghost menaces the party'],
    bands: [
      { upTo: 5, label: 'A violent thunderstorm until the party leaves', auto: 'storm' },
      { upTo: 10, label: 'A building is warded (guards and wards) for 24 hours', minutes: D },
      { upTo: 15, label: 'An object whispers a warning or a secret' },
      { upTo: 20, label: 'All light weakens a step for 24 hours', minutes: D },
      { upTo: 25, label: 'The temperature drops 10°F an hour for 1d6 hours', minutes: 6 * H },
      { upTo: 30, label: 'A shadow acts on its own for 24 hours', minutes: D, target: 'one' },
      { upTo: 35, label: 'After sunset the sun doesn’t rise for 36 hours', minutes: 36 * H },
      { upTo: 40, label: 'A sleeper wakes buried a foot underground' },
      { upTo: 45, label: 'Someone levitates for 1 minute' },
      { upTo: 50, label: 'A harmless but unsettling ghost follows someone for 24 hours', minutes: D, target: 'one' },
      { upTo: 55, label: 'Someone takes on the look of the region’s dead for 24 hours', minutes: D, target: 'one' },
      { upTo: 60, label: 'Humanoids who die here rise as skeletons for 24 hours', minutes: D },
      { upTo: 65, label: 'Spilled blood writes messages for 24 hours', minutes: D },
      { upTo: 70, label: 'A spirit makes a weapon sentient until they leave', target: 'one' },
      { upTo: 75, label: 'A spectral force answers one question (augury)', target: 'one' },
      { upTo: 80, label: 'A sleeper dreams of the region’s past', target: 'one' },
      { upTo: 85, label: 'A small container radiates malice' },
      { upTo: 90, label: 'Healing magic leaves scars for 24 hours', minutes: D },
      { upTo: 95, label: 'A wisp over a grave can cast resurrection once', minutes: D },
      { upTo: 100, label: 'A choking mist rises' },
    ],
  },
  infested: {
    name: 'Infested',
    triggers: ['The party disturbs a nest or hive', 'Someone rests on the ground', 'Food is left out', 'Insects are killed in large numbers'],
    bands: [
      { upTo: 5, label: 'Deafening buzzing for 24 hours: hearing only within 10 ft', minutes: D },
      { upTo: 10, label: 'A swarming migration: no Short or Long Rest for 24 hours', minutes: D, auto: 'noRest' },
      { upTo: 15, label: 'Glowing flies outline someone for 1 minute', target: 'one' },
      { upTo: 20, label: 'Termites unearth bones and treasure' },
      { upTo: 25, label: 'A cricket-cat adopts someone for 24 hours', minutes: D, target: 'one' },
      { upTo: 30, label: 'Glowing grubs that heal like potions of healing' },
      { upTo: 35, label: 'Moth dust charms the party for 1 hour' },
      { upTo: 45, label: 'Webbing chokes the region: Difficult Terrain', minutes: D },
      { upTo: 50, label: 'Crunching shells: Disadvantage on Stealth for 1 hour', minutes: H },
      { upTo: 55, label: 'A bursting maggot greases the ground' },
      { upTo: 60, label: 'The ground opens into a quicksand pit' },
      { upTo: 65, label: 'Parasites: DC 16 Con save or Sight Rot', auto: 'sightRot' },
      { upTo: 70, label: 'Dung bugs: hurry and be Poisoned' },
      { upTo: 75, label: 'Someone may become a giant spider for an hour' },
      { upTo: 80, label: 'Silverfish infest someone’s gear', target: 'one' },
      { upTo: 85, label: 'A tapeworm: no benefit from eating until treated', target: 'one' },
      { upTo: 90, label: 'Mites: Disadvantage in medium or heavy armor for 24 hours', minutes: D },
      { upTo: 95, label: 'Spiders in someone’s clothes after a rest' },
      { upTo: 100, label: 'Bloodsucking swarms: DC 10 Con save each hour for 1d6 hours or Exhaustion', auto: 'hourlyExhaustion' },
    ],
  },
  mirror: {
    name: 'Mirror Zone',
    triggers: ['Someone sees their reflection', 'Illusion or teleportation magic is used', 'Light is focused or reflected'],
    bands: [
      { upTo: 6, label: 'Faces shift: Advantage on Deception and disguise for 24 hours', minutes: D, target: 'all' },
      { upTo: 12, label: 'The terrain looks like something else' },
      { upTo: 18, label: 'Someone blinks in and out for 1 minute', target: 'one' },
      { upTo: 24, label: 'No reflections: social checks suffer', minutes: D },
      { upTo: 34, label: 'Hostile reflections step out of mirrors' },
      { upTo: 40, label: 'Someone gains mirror images', target: 'one' },
      { upTo: 46, label: 'Glass slivers worsen wounds for 24 hours', minutes: D },
      { upTo: 52, label: 'Touching a reflection teleports (misty step)' },
      { upTo: 58, label: 'A mirror allows one scrying within 24 hours', target: 'one' },
      { upTo: 64, label: 'Silvered skin turns spells for 24 hours', minutes: D, target: 'one' },
      { upTo: 70, label: 'A mirror-blade sword of wounding appears' },
      { upTo: 76, label: 'Attacks rebound on attackers for 24 hours', minutes: D },
      { upTo: 82, label: 'A pair of mirror portals for 1 minute' },
      { upTo: 88, label: 'A reflection answers one question', target: 'one' },
      { upTo: 94, label: 'Swirling shards attack for a minute' },
      { upTo: 100, label: 'A hostile duplicate of someone appears' },
    ],
  },
  psychic: {
    name: 'Psychic Resonance',
    triggers: ['Strong emotions run high', 'A psionic creature or effect is present', 'Mind-affecting magic is used'],
    bands: [
      { upTo: 6, label: 'Someone can read thoughts once in 24 hours', target: 'one' },
      { upTo: 12, label: 'Someone’s mind is shielded for 24 hours', minutes: D, target: 'one' },
      { upTo: 18, label: 'Objects fly about for a minute' },
      { upTo: 24, label: 'Sharp memories: double proficiency to recall for 1 hour', minutes: H, target: 'all' },
      { upTo: 34, label: 'Headaches: Disadvantage on Perception for 1 hour', minutes: H, target: 'all' },
      { upTo: 40, label: 'Someone can make one psychic attack', target: 'one' },
      { upTo: 46, label: 'Nightmares: resting needs a DC 10 Wis save or it gives no benefit', minutes: D, auto: 'restSave' },
      { upTo: 52, label: 'Everyone speaks telepathically for 1 hour', minutes: H, target: 'all' },
      { upTo: 58, label: 'Someone senses nearby minds for 1 hour', minutes: H, target: 'one' },
      { upTo: 64, label: 'Scattered thoughts: concentration suffers for 1 hour', minutes: H, target: 'all' },
      { upTo: 70, label: 'Whispered thoughts: Advantage on Insight for 1 hour', minutes: H, target: 'one' },
      { upTo: 76, label: 'Someone can use telekinesis once in 24 hours', target: 'one' },
      { upTo: 82, label: 'Resistance to psychic damage for 1 hour', minutes: H, target: 'all' },
      { upTo: 88, label: 'Psychic stabs for a minute' },
      { upTo: 94, label: 'A wave of joy for 1 minute', target: 'one' },
      { upTo: 100, label: 'Beasts awaken and speak' },
    ],
  },
  unraveling: {
    name: 'Unraveling Magic',
    triggers: ['A spell is cast with a slot', 'A magic item is used', 'Magic fails or is countered'],
    bands: [
      { upTo: 5, label: 'Magic items go dead for 1 hour', minutes: H },
      { upTo: 10, label: 'Antimagic over the region for 1 hour', minutes: H },
      { upTo: 15, label: 'Someone is sealed in a resilient sphere' },
      { upTo: 20, label: 'Someone regains a spent spell slot', target: 'one' },
      { upTo: 25, label: 'Random energy flares for a minute' },
      { upTo: 30, label: 'Someone may become a blink dog for an hour' },
      { upTo: 35, label: 'Someone loses a spell slot in sparks', target: 'one' },
      { upTo: 40, label: 'Fire turns to blue ice; extreme cold for a day', minutes: D, auto: 'coldDay' },
      { upTo: 45, label: 'Someone becomes a focus of wild magic for 1 hour', minutes: H, target: 'one' },
      { upTo: 50, label: 'A flaming sphere wanders in' },
      { upTo: 55, label: 'Mundane weapons become +1 for 1 hour', minutes: H },
      { upTo: 60, label: 'Swirling force: Resistance to force, slower, for 24 hours', minutes: D, target: 'one' },
      { upTo: 65, label: 'Everyone learns a wizard cantrip for 1d8 days', minutes: 8 * D, target: 'all' },
      { upTo: 70, label: 'Someone crackles with light for 1 hour', minutes: H, target: 'one' },
      { upTo: 75, label: 'Lightning arcs between two creatures' },
      { upTo: 80, label: 'Gravity reverses for 1 minute' },
      { upTo: 85, label: 'Two creatures swap places' },
      { upTo: 90, label: 'Someone breaks nearby spells for 1 hour', minutes: H, target: 'one' },
      { upTo: 95, label: 'The next spell may rebound on its caster', minutes: D },
      { upTo: 100, label: 'Someone can cast wish once within a minute', target: 'one' },
    ],
  },
};

export const regionBand = (kind: RegionKind, roll: number): RegionBand => REGIONS[kind].bands.find((b) => roll <= b.upTo)!;
