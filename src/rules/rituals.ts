import type { SpellRef } from '../state/types';

/** Ritual casting adds this many minutes to a spell's casting time, and uses no spell slot. */
export const RITUAL_EXTRA_MINUTES = 10;

const H = 60;
const DAY = 24 * H;

/** Common ritual spells with casting time and duration (durations: null = instantaneous). Imported 5etools data takes priority. */
type R = { name: string; level: number; castTime: string; castMinutes: number; durationMinutes: number | null; concentration?: boolean; permanent?: boolean; aka?: string[] };
const a = (name: string, level: number, dur: number | null, extra: Partial<R> = {}): R => ({ name, level, castTime: '1 action', castMinutes: 0, durationMinutes: dur, ...extra });
const m = (name: string, level: number, mins: number, dur: number | null, extra: Partial<R> = {}): R => ({
  name,
  level,
  castTime: mins >= 60 ? `${mins / 60} hour${mins > 60 ? 's' : ''}` : `${mins} minute${mins > 1 ? 's' : ''}`,
  castMinutes: mins,
  durationMinutes: dur,
  ...extra,
});

export const RITUALS: R[] = [
  m('Alarm', 1, 1, 8 * H),
  a('Comprehend Languages', 1, H),
  a('Detect Magic', 1, 10, { concentration: true }),
  a('Detect Poison and Disease', 1, 10, { concentration: true }),
  m('Find Familiar', 1, H, null),
  m('Identify', 1, 1, null),
  m('Illusory Script', 1, 1, 10 * DAY),
  a('Purify Food and Drink', 1, null),
  a('Speak with Animals', 1, 10),
  a("Tenser's Floating Disk", 1, H, { aka: ['Floating Disk'] }),
  a('Unseen Servant', 1, H),
  a('Animal Messenger', 2, DAY),
  m('Augury', 2, 1, null),
  a('Beast Sense', 2, H, { concentration: true }),
  a('Gentle Repose', 2, 10 * DAY),
  m('Magic Mouth', 2, 1, null, { permanent: true }),
  a('Silence', 2, 10, { concentration: true }),
  a('Skywrite', 2, H, { concentration: true }),
  a('Feign Death', 3, H),
  m("Leomund's Tiny Hut", 3, 1, 8 * H, { aka: ['Tiny Hut'] }),
  a('Meld into Stone', 3, 8 * H),
  m('Phantom Steed', 3, 1, H),
  a('Water Breathing', 3, DAY),
  a('Water Walk', 3, H),
  a('Divination', 4, null),
  m('Commune', 5, 1, 1),
  m('Commune with Nature', 5, 1, null),
  m('Contact Other Plane', 5, 1, 1),
  a("Rary's Telepathic Bond", 5, H, { aka: ['Telepathic Bond'] }),
  m("Drawmij's Instant Summons", 6, 1, null, { permanent: true, aka: ['Instant Summons'] }),
  m('Forbiddance', 6, 10, DAY),
];

const norm = (s: string) => s.toLowerCase().replace(/^[a-z]+'s\s+/, '').trim();

/** Fills in ritual tag, casting time and duration from imported data first, then the built-in list. */
export function spellInfo(sp: SpellRef, library: SpellRef[]): SpellRef {
  const key = norm(sp.name);
  const lib = library.find((x) => norm(x.name) === key);
  const builtIn = RITUALS.find((r) => norm(r.name) === key || r.aka?.some((x) => norm(x) === key));
  return {
    ...(builtIn ? { ritual: true, castTime: builtIn.castTime, castMinutes: builtIn.castMinutes, durationMinutes: builtIn.durationMinutes, concentration: builtIn.concentration, permanent: builtIn.permanent } : {}),
    ...stripUndefined(lib ?? {}),
    ...stripUndefined(sp),
  } as SpellRef;
}

function stripUndefined<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}
