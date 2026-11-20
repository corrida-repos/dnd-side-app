/** Ways to get word to a distant Bastion (and back). */
export type CommMethod = 'messenger' | 'courier' | 'animal' | 'sending' | 'dream' | 'sivis';

export interface CommInfo {
  label: string;
  /** Miles covered per day, for methods that travel. */
  milesPerDay?: number;
  /** Fixed delay in minutes, for methods that don't depend on distance. */
  fixedMinutes?: number;
  /** Longest distance it can cover, if limited. */
  maxMiles?: number;
  /** Cost per mile in GP, or a flat cost. */
  gpPerMile?: number;
  gp?: number;
  /** What it needs: a messenger hireling, or a caster who knows the spell. */
  needs?: 'messenger' | 'Sending' | 'Animal Messenger' | 'Dream';
  /** Spell slot level used, if any (Animal Messenger can be a ritual). */
  slotLevel?: number;
  note: string;
}

export const COMMS: Record<CommMethod, CommInfo> = {
  messenger: { label: 'Messenger hireling', milesPerDay: 24, gpPerMile: 0.02, needs: 'messenger', note: 'Travels on foot at a normal pace (24 miles a day) and charges 2 CP per mile. Busy until back.' },
  courier: { label: 'Mounted courier', milesPerDay: 27, note: 'A rider at a normal pace, galloping for an hour a day (table rule: 27 miles a day). Bastion hirelings carry reports this way for free.' },
  animal: { label: 'Animal Messenger', milesPerDay: 50, maxMiles: 50, needs: 'Animal Messenger', note: 'A flying beast covers about 50 miles in the spell’s 24 hours. Castable as a ritual (no slot).' },
  sending: { label: 'Sending', fixedMinutes: 0, needs: 'Sending', slotLevel: 3, note: 'Instant, up to 25 words, and the recipient can answer at once. Uses a level 3 slot.' },
  dream: { label: 'Dream', fixedMinutes: 8 * 60, needs: 'Dream', slotLevel: 5, note: 'The message arrives when the recipient next sleeps (table rule: within 8 hours). Uses a level 5 slot.' },
  sivis: { label: 'Sivis message station (Eberron)', fixedMinutes: 4 * 60, gp: 2, note: 'House Sivis speaking stones relay a short message between stations, usually the same day (table rule: 4 hours, 2 GP).' },
};

/** Minutes until a message sent now arrives, or null if the method can't reach that far. */
export function commDelay(method: CommMethod, miles: number): number | null {
  const m = COMMS[method];
  if (m.maxMiles != null && miles > m.maxMiles) return null;
  if (m.fixedMinutes != null) return m.fixedMinutes;
  return Math.max(1, Math.round((miles / (m.milesPerDay ?? 24)) * 24 * 60));
}

export function commCost(method: CommMethod, miles: number): number {
  const m = COMMS[method];
  return Math.round(((m.gpPerMile ?? 0) * miles + (m.gp ?? 0)) * 100) / 100;
}
