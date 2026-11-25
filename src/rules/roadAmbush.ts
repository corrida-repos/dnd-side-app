import type { TerrainType } from './terrain';
import { die, type Rng } from './dice';
import type { OpeningPosition } from './butler';
import type { EncounterCreature } from './encounters';

// 2024 DMG Falling Net, p. 100. Use passive Perception for travellers who are not actively searching.
export const ROAD_NET_NOTICE_DC = 11;
export const ROAD_NET_SAVE_DC = 10;

// Only known ambushers and creatures named for a role that suggests preparing an ambush.
const AMBUSHER = /\b(bandit|brigand|bugbear|goblin|hobgoblin|kobold|orc|scout|poacher|hunter|trapper|highwayman|brigands|daask|boromar)\b/i;

/** Table rule. A creature grouping can prepare a net if at least one member sets one. */
export function roadNetChance(leader: EncounterCreature, count: number, follower?: EncounterCreature, followerCount = 0): number {
  const capable = (creature: EncounterCreature) => AMBUSHER.test(creature.name)
    && ['humanoid', 'fey'].includes(creature.type.toLowerCase());
  if (!capable(leader) && !(follower && followerCount > 0 && capable(follower))) return 0;
  return count + followerCount > 1 ? 30 : 15;
}


const POSITIONS: Partial<Record<TerrainType, { feature: string; cover?: OpeningPosition['cover']; height?: number }>> = {
  arctic: { feature: 'an ice ridge', cover: 'half', height: 10 },
  coastal: { feature: 'a rocky outcrop', cover: 'half', height: 10 },
  desert: { feature: 'a rocky rise', cover: 'half', height: 10 },
  forest: { feature: 'roots and rocks on the slope', cover: 'half', height: 10 },
  grassland: { feature: 'a low rise', height: 5 },
  hill: { feature: 'a boulder-strewn ridge', cover: 'half', height: 15 },
  mountain: { feature: 'a ledge with boulders', cover: 'three-quarters', height: 20 },
  swamp: { feature: 'a tangle of raised roots', cover: 'half' },
  underdark: { feature: 'a shelf among stone pillars', cover: 'three-quarters', height: 15 },
  urban: { feature: 'masonry along a raised walkway', cover: 'three-quarters', height: 10 },
};

/** A prepared force is likelier to claim good ground. Cover is relative to the party's approach. */
export function roadOpeningPosition(terrain: TerrainType, prepared: boolean, rng: Rng): OpeningPosition | undefined {
  const site = POSITIONS[terrain];
  if (!site) return undefined;
  const cover = site.cover && die(100, rng) <= (prepared ? 65 : 30) ? site.cover : undefined;
  const elevationFt = site.height && die(100, rng) <= (prepared ? 45 : 20) ? site.height : undefined;
  return cover || elevationFt ? { feature: site.feature, cover, elevationFt } : undefined;
}
