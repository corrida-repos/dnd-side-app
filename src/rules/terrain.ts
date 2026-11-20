import type { ClimateId } from './weather';
import type { Pace } from '../state/types';

export type TerrainType = 'arctic' | 'coastal' | 'desert' | 'forest' | 'grassland' | 'hill' | 'mountain' | 'swamp' | 'underdark' | 'urban' | 'waterborne';

export interface TerrainInfo {
  label: string;
  /** Fastest pace the terrain allows ('special' for travel by water). */
  maxPace: Pace | 'special';
  encounterDistance: string;
  forageDC: number;
  navigationDC: number;
  searchDC: number;
}

/** DMG Travel Terrain table. */
export const TERRAIN: Record<TerrainType, TerrainInfo> = {
  arctic: { label: 'Arctic', maxPace: 'fast', encounterDistance: '6d6 × 10 feet', forageDC: 20, navigationDC: 10, searchDC: 10 },
  coastal: { label: 'Coastal', maxPace: 'normal', encounterDistance: '2d10 × 10 feet', forageDC: 10, navigationDC: 5, searchDC: 15 },
  desert: { label: 'Desert', maxPace: 'normal', encounterDistance: '6d6 × 10 feet', forageDC: 20, navigationDC: 10, searchDC: 10 },
  forest: { label: 'Forest', maxPace: 'normal', encounterDistance: '2d8 × 10 feet', forageDC: 10, navigationDC: 15, searchDC: 15 },
  grassland: { label: 'Grassland', maxPace: 'fast', encounterDistance: '6d6 × 10 feet', forageDC: 15, navigationDC: 5, searchDC: 15 },
  hill: { label: 'Hill', maxPace: 'normal', encounterDistance: '2d10 × 10 feet', forageDC: 15, navigationDC: 10, searchDC: 15 },
  mountain: { label: 'Mountain', maxPace: 'slow', encounterDistance: '4d10 × 10 feet', forageDC: 20, navigationDC: 15, searchDC: 20 },
  swamp: { label: 'Swamp', maxPace: 'slow', encounterDistance: '2d8 × 10 feet', forageDC: 10, navigationDC: 15, searchDC: 20 },
  underdark: { label: 'Underdark', maxPace: 'normal', encounterDistance: '2d6 × 10 feet', forageDC: 20, navigationDC: 10, searchDC: 20 },
  urban: { label: 'Urban', maxPace: 'normal', encounterDistance: '2d6 × 10 feet', forageDC: 20, navigationDC: 15, searchDC: 15 },
  waterborne: { label: 'Waterborne', maxPace: 'special', encounterDistance: '6d6 × 10 feet', forageDC: 15, navigationDC: 10, searchDC: 15 },
};

/** A sensible starting terrain for each climate. */
export const TERRAIN_FOR_CLIMATE: Record<ClimateId, TerrainType> = {
  arctic: 'arctic',
  subarctic: 'forest',
  temperate: 'forest',
  coastal: 'coastal',
  grassland: 'grassland',
  highland: 'hill',
  desert: 'desert',
  tropical: 'forest',
  swamp: 'swamp',
  underdark: 'underdark',
};

const STEPS: Pace[] = ['slow', 'normal', 'fast'];

/** The fastest pace allowed: the terrain's maximum, one step faster on a good road. */
export function maxPaceFor(terrain: TerrainType, goodRoad: boolean): Pace {
  const m = TERRAIN[terrain].maxPace;
  if (m === 'special') return 'normal';
  const i = STEPS.indexOf(m);
  return STEPS[Math.min(2, i + (goodRoad ? 1 : 0))];
}

/** Clamps a requested pace to what the terrain allows. */
export function clampPace(pace: Pace, terrain: TerrainType, goodRoad: boolean): Pace {
  const max = maxPaceFor(terrain, goodRoad);
  return STEPS.indexOf(pace) > STEPS.indexOf(max) ? max : pace;
}
