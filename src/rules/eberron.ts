import type { Settlement } from './services';

interface Locality {
  name: string;
  district: string;
  authority: string;
  size: Settlement;
  water: boolean;
  providers: readonly (readonly [building: string, name: string])[];
}

// Local provider names, prices and timetables are campaign defaults.
export const BRELAND = {
  'middle-menthis': {
    name: 'Sharn · Middle Menthis',
    district: 'Middle Menthis Plateau',
    authority: 'Sharn Watch',
    size: 'city',
    water: false,
    providers: [
      ['inn', 'Ghallanda guesthouse'], ['courier', 'Sivis message station'],
      ['magic', 'Menthis magewright'], ['tavern', 'The Lantern Stage'],
    ],
  },
  'upper-central': {
    name: 'Sharn · Upper Central',
    district: 'Upper Central Plateau',
    authority: 'Sharn Watch',
    size: 'city',
    water: false,
    providers: [
      ['bank', 'Kundarak vault'], ['healer', 'Jorasco infirmary'],
      ['inn', 'Ghallanda house'], ['courier', 'Sivis message station'],
    ],
  },
  'terminus': {
    name: 'Sharn · Terminus',
    district: 'Lower Tavick’s Landing',
    authority: 'Sharn Watch',
    size: 'city',
    water: false,
    providers: [
      ['coaching', 'Orien departures'], ['inn', 'The Last Platform'],
      ['courier', 'Sivis message station'], ['general', 'Terminus outfitter'],
    ],
  },
  'wroat': {
    name: 'Wroat',
    district: 'Breland',
    authority: 'Breland Crown Watch',
    size: 'city',
    water: true,
    providers: [
      ['coaching', 'Orien departures'], ['inn', 'Ghallanda riverside inn'],
      ['courier', 'Sivis message station'], ['bank', 'Kundarak vault'],
      ['temple', 'Sovereign Host temple'], ['smithy', 'Riverside smithy'], ['docks', 'Dagger River dock'],
    ],
  },
} as const satisfies Record<string, Locality>;

export type BrelishLocality = keyof typeof BRELAND;
export const SHARN_START: BrelishLocality = 'middle-menthis';

export interface BrelishRoute {
  id: string;
  label: string;
  from: BrelishLocality;
  to: BrelishLocality;
  departures: number[];
  travelMinutes: number;
  fareGp: number;
}

const links = [
  { id: 'menthis-central', label: 'Skycoach', from: 'middle-menthis', to: 'upper-central', departures: [8, 12, 16, 20], travelMinutes: 20, fareGp: 0.2 },
  { id: 'menthis-terminus', label: 'Skycoach', from: 'middle-menthis', to: 'terminus', departures: [8, 12, 16, 20], travelMinutes: 30, fareGp: 0.3 },
  { id: 'sharn-wroat', label: 'Orien lightning rail', from: 'terminus', to: 'wroat', departures: [8, 16], travelMinutes: 8 * 60, fareGp: 20 },
] satisfies BrelishRoute[];

export const BRELAND_ROUTES: BrelishRoute[] = links.flatMap((route) => [
  route, { ...route, id: `${route.id}-return`, from: route.to, to: route.from },
]);

export function nextDeparture(route: BrelishRoute, now: number): number {
  const day = Math.floor(now / 1440) * 1440;
  return route.departures.map((hour) => day + hour * 60).find((minute) => minute >= now)
    ?? day + 1440 + route.departures[0] * 60;
}

export const GALIFAR_COINS = { cp: 'crown', sp: 'sovereign', ep: 'electrum', gp: 'galifar', pp: 'dragon' } as const;
