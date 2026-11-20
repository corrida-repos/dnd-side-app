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

/** Table defaults for vehicle storage (the PHB lists ship cargo in tons; land vehicles depend on what pulls them). */
export const VEHICLES: { name: string; capacityLb: number; note: string }[] = [
  { name: 'Cart', capacityLb: 1500, note: 'Table default; depends on the animal pulling it' },
  { name: 'Wagon', capacityLb: 3000, note: 'Table default; depends on the team pulling it' },
  { name: 'Sled', capacityLb: 1000, note: 'Table default' },
  { name: 'Carriage', capacityLb: 500, note: 'Table default; mostly passengers' },
  { name: 'Rowboat', capacityLb: 300, note: 'Table default; no cargo hold' },
  { name: 'Keelboat', capacityLb: 1000, note: 'PHB: ½ ton of cargo' },
  { name: 'Airship', capacityLb: 2000, note: 'PHB: 1 ton of cargo' },
  { name: 'Longship', capacityLb: 20000, note: 'PHB: 10 tons of cargo' },
  { name: 'Sailing Ship', capacityLb: 200000, note: 'PHB: 100 tons of cargo' },
  { name: 'Galley', capacityLb: 300000, note: 'PHB: 150 tons of cargo' },
  { name: 'Warship', capacityLb: 400000, note: 'PHB: 200 tons of cargo' },
];
