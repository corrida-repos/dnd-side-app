import type { Stash, TransportMode, TransportStatus } from '../state/types';
export interface ContainerInfo {
  /** Pounds it holds, or null when it's counted in items (quivers, cases) or effectively unlimited. */
  capacityLb: number | null;
  /** Contents don't add to the carrier's load (extradimensional space). */
  weightless: boolean;
  note?: string;
}

/** Containers from the 2024 PHB and DMG, by lowercase name. */
export const CONTAINERS: Record<string, ContainerInfo> = {
  backpack: { capacityLb: 30, weightless: false },
  sack: { capacityLb: 30, weightless: false },
  basket: { capacityLb: 40, weightless: false },
  pouch: { capacityLb: 6, weightless: false },
  'component pouch': { capacityLb: 6, weightless: false },
  chest: { capacityLb: 300, weightless: false, note: '12 cubic feet' },
  barrel: { capacityLb: 250, weightless: false, note: '4 cubic feet (liquid or solid)' },
  quiver: { capacityLb: null, weightless: false, note: '20 arrows' },
  'crossbow bolt case': { capacityLb: null, weightless: false, note: '20 bolts' },
  'map or scroll case': { capacityLb: null, weightless: false, note: '10 sheets of paper or 5 of parchment' },
  'bag of holding': { capacityLb: 500, weightless: true, note: 'Contents weigh nothing; 64 cubic feet' },
  "heward's handy haversack": { capacityLb: 900, weightless: true, note: 'Two side pouches (200 lb each) and a central pouch (500 lb)' },
  'handy haversack': { capacityLb: 900, weightless: true, note: 'Two side pouches (200 lb each) and a central pouch (500 lb)' },
  'portable hole': { capacityLb: null, weightless: true, note: 'A 10-foot-deep extradimensional hole' },
  'quiver of ehlonna': { capacityLb: null, weightless: true, note: '60 arrows or bolts, 18 javelins, 6 long items' },
};

export function detectContainer(name: string): ContainerInfo | null {
  const n = name.toLowerCase().replace(/\s+/g, ' ').trim().replace(/s$/, '');
  if (CONTAINERS[n]) return CONTAINERS[n];
  for (const key of Object.keys(CONTAINERS).sort((a, b) => b.length - a.length)) if (n.includes(key)) return CONTAINERS[key];
  return null;
}

export const TRANSPORT_MODES: Record<TransportMode, string> = { land: 'Land', sea: 'Sea', air: 'Air' };
export const TRANSPORT_STATUSES: Record<TransportStatus, string> = {
  ready: 'Available',
  reserved: 'Reserved',
  unavailable: 'Unavailable',
};

export const EBERRON_AIRSHIPS_URL = 'https://5e.tools/book.html#efa,7';
export const VEHICLE_RULES_URL = 'https://5e.tools/book.html#xphb,6,mounts%20and%20vehicles';

/** Land cargo limits are table defaults. Vessel cargo is converted at 2,000 lb per ton. */
export const VEHICLES: { name: string; mode: TransportMode; capacityLb: number; note: string; speedMph?: number; source?: string }[] = [
  { name: 'Cart', mode: 'land', capacityLb: 1500, note: 'Table default; depends on the animal pulling it' },
  { name: 'Wagon', mode: 'land', capacityLb: 3000, note: 'Table default; depends on the team pulling it' },
  { name: 'Sled', mode: 'land', capacityLb: 1000, note: 'Table default' },
  { name: 'Carriage', mode: 'land', capacityLb: 500, note: 'Table default; mostly passengers' },
  { name: 'Rowboat', mode: 'sea', speedMph: 1.5, capacityLb: 300, note: 'Table default; no cargo hold' },
  { name: 'Keelboat', mode: 'sea', speedMph: 1, capacityLb: 1000, note: 'PHB: ½ ton of cargo' },
  { name: 'Airship', mode: 'air', speedMph: 8, capacityLb: 2000, note: 'PHB: 1 ton of cargo' },
  { name: 'Longship', mode: 'sea', speedMph: 3, capacityLb: 20000, note: 'PHB: 10 tons of cargo' },
  { name: 'Sailing Ship', mode: 'sea', speedMph: 2, capacityLb: 200000, note: 'PHB: 100 tons of cargo' },
  { name: 'Galley', mode: 'sea', speedMph: 4, capacityLb: 300000, note: 'PHB: 150 tons of cargo' },
  { name: 'Warship', mode: 'sea', speedMph: 2.5, capacityLb: 400000, note: 'PHB: 200 tons of cargo' },
  { name: 'Lyrandar Skyskiff', mode: 'air', speedMph: 7, capacityLb: 1000, note: '2 crew and 2 passengers', source: EBERRON_AIRSHIPS_URL },
  { name: 'Strider Airship', mode: 'air', speedMph: 8, capacityLb: 2000, note: '6 crew and 20 passengers', source: EBERRON_AIRSHIPS_URL },
  { name: 'Lyrandar Air Cruiser', mode: 'air', speedMph: 10, capacityLb: 4000, note: '10 crew and 40 passengers', source: EBERRON_AIRSHIPS_URL },
  { name: 'Elemental Airship (Rising from the Last War)', mode: 'air', speedMph: 20, capacityLb: 60000, note: 'Typical clear-sky speed and maximum cargo. Many cities lack docking towers', source: 'https://5e.tools/book.html#erlw,10,travel' },
];

export function transportMode(stash: Stash): TransportMode {
  return stash.vehicle?.mode ?? (/airship/i.test(stash.name) ? 'air' : stash.speedMph ? 'sea' : 'land');
}

export function canTravelAboard(stash: Stash): boolean {
  return stash.kind === 'vehicle' && !!stash.speedMph && (stash.vehicle?.status ?? 'ready') === 'ready';
}
