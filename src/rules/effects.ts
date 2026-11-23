export type EffectKind = 'light' | 'spell' | 'potion' | 'curse' | 'gift' | 'other';

export const EFFECT_KIND_LABEL: Record<EffectKind, string> = {
  light: 'Light source',
  spell: 'Spell',
  potion: 'Potion',
  curse: 'Curse or long effect',
  gift: 'Supernatural gift',
  other: 'Other',
};

export interface EffectPreset {
  name: string;
  kind: EffectKind;
  /** Duration in minutes; null means it lasts until ended. */
  minutes: number | null;
  concentration?: boolean;
  /** Keeps the weather and temperature out while you're inside, like a building. */
  shelter?: boolean;
  note?: string;
}

const H = 60;
const DAY = 24 * H;

export const EFFECT_PRESETS: EffectPreset[] = [
  { name: 'Torch', kind: 'light', minutes: H, note: 'Bright Light 20 ft, Dim Light 20 ft more.' },
  { name: 'Makeshift Torch', kind: 'light', minutes: 30, note: 'Bright Light 20 ft, Dim Light 20 ft more, for about 30 minutes (table rule).' },
  { name: 'Candle', kind: 'light', minutes: H, note: 'Bright Light 5 ft, Dim Light 5 ft more.' },
  { name: 'Lamp (one flask of oil)', kind: 'light', minutes: 6 * H, note: 'Bright Light 15 ft, Dim Light 30 ft more.' },
  { name: 'Hooded Lantern (one flask of oil)', kind: 'light', minutes: 6 * H, note: 'Bright Light 30 ft, Dim Light 30 ft more.' },
  { name: 'Bullseye Lantern (one flask of oil)', kind: 'light', minutes: 6 * H, note: '60-ft Cone of Bright Light, Dim Light 60 ft more.' },
  { name: 'Light (cantrip)', kind: 'light', minutes: H },
  { name: 'Dancing Lights', kind: 'light', minutes: 1, concentration: true },
  { name: 'Daylight', kind: 'light', minutes: H },
  { name: 'Continual Flame', kind: 'light', minutes: null },

  { name: 'Mage Armor', kind: 'spell', minutes: 8 * H },
  { name: 'Aid', kind: 'spell', minutes: 8 * H },
  { name: 'Darkvision', kind: 'spell', minutes: 8 * H },
  { name: 'Longstrider', kind: 'spell', minutes: H },
  { name: 'Death Ward', kind: 'spell', minutes: 8 * H },
  { name: 'Freedom of Movement', kind: 'spell', minutes: H },
  { name: 'Water Breathing', kind: 'spell', minutes: DAY },
  { name: "Heroes' Feast", kind: 'spell', minutes: DAY },
  { name: 'Goodberry (berries)', kind: 'spell', minutes: DAY, note: 'The berries lose their potency after 24 hours.' },
  { name: 'Alarm', kind: 'spell', minutes: 8 * H },
  { name: "Leomund's Tiny Hut", kind: 'spell', minutes: 8 * H, shelter: true, note: 'Comfortable and dry inside, whatever the weather.' },
  { name: 'Rope Trick', kind: 'spell', minutes: H, shelter: true },
  { name: "Mordenkainen's Magnificent Mansion", kind: 'spell', minutes: DAY, shelter: true },
  { name: 'Nondetection', kind: 'spell', minutes: 8 * H },
  { name: 'Detect Magic', kind: 'spell', minutes: 10, concentration: true },
  { name: 'Pass without Trace', kind: 'spell', minutes: H, concentration: true },
  { name: 'Invisibility', kind: 'spell', minutes: H, concentration: true },
  { name: 'Fly', kind: 'spell', minutes: 10, concentration: true },
  { name: 'Protection from Energy', kind: 'spell', minutes: H, concentration: true },
  { name: 'Polymorph', kind: 'spell', minutes: H, concentration: true },
  { name: 'Bless', kind: 'spell', minutes: 1, concentration: true },
  { name: 'Haste', kind: 'spell', minutes: 1, concentration: true },
  { name: 'Gentle Repose', kind: 'spell', minutes: 10 * DAY, note: 'Days spent under it don’t count toward resurrection time limits.' },

  { name: 'Potion of Invisibility', kind: 'potion', minutes: H },
  { name: 'Potion of Flying', kind: 'potion', minutes: H },
  { name: 'Potion of Water Breathing', kind: 'potion', minutes: H },
  { name: 'Potion of Heroism', kind: 'potion', minutes: H },
  { name: 'Potion of Giant Strength', kind: 'potion', minutes: H },
  { name: 'Potion of Resistance', kind: 'potion', minutes: H },
  { name: 'Potion of Climbing', kind: 'potion', minutes: H },
  { name: 'Potion of Growth', kind: 'potion', minutes: 10 },

  { name: 'Geas', kind: 'curse', minutes: 30 * DAY },
  { name: 'Bestow Curse (long-term)', kind: 'curse', minutes: 8 * H, note: 'Higher-level slots last longer, up to until dispelled. Adjust the duration.' },
];

/** Hold breath: 1 + Con modifier minutes, minimum 30 seconds. */
export const holdBreathSeconds = (conMod: number): number => Math.max(30, (1 + conMod) * 60);

/** Warn this many minutes before a light source goes out. */
export const LIGHT_WARNING_MINUTES = 10;
export const EXPLORATION_TURN_MINUTES = 10;
