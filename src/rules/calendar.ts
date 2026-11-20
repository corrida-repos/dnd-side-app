import type { Season } from '../state/types';

export interface Month {
  name: string;
  days: number;
  season: Season;
  festival?: boolean;
  /** Eberron: the moon associated with this month. */
  moon?: string;
}

export interface CalendarHoliday {
  name: string;
  monthIndex: number;
  day: number;
  /** Number of days it lasts (default 1). */
  days?: number;
}

export interface Calendar {
  id: string;
  name: string;
  era: string;
  months: Month[];
  /** Holidays that come with the calendar. */
  holidays?: CalendarHoliday[];
}

const m = (name: string, days: number, season: Season, festival = false): Month => ({ name, days, season, festival });

const gm = (name: string, season: Season): Month => ({ name, days: 28, season, moon: name });

export const CALENDARS: Record<string, Calendar> = {
  galifar: {
    id: 'galifar',
    name: 'Calendar of Galifar (Eberron)',
    era: 'YK',
    months: [
      gm('Zarantyr', 'winter'),
      gm('Olarune', 'winter'),
      gm('Therendor', 'spring'),
      gm('Eyre', 'spring'),
      gm('Dravago', 'spring'),
      gm('Nymm', 'summer'),
      gm('Lharvion', 'summer'),
      gm('Barrakas', 'summer'),
      gm('Rhaan', 'autumn'),
      gm('Sypheros', 'autumn'),
      gm('Aryth', 'autumn'),
      gm('Vult', 'winter'),
    ],
    holidays: [
      { name: 'Crystalfall', monthIndex: 1, day: 9 },
      { name: 'The Day of Mourning', monthIndex: 1, day: 20 },
      { name: "Sun's Blessing", monthIndex: 2, day: 15 },
      { name: "Aureon's Crown", monthIndex: 4, day: 26 },
      { name: 'Brightblade', monthIndex: 5, day: 12 },
      { name: 'The Race of Eight Winds', monthIndex: 6, day: 23 },
      { name: 'The Hunt', monthIndex: 7, day: 4 },
      { name: "Fathen's Fall", monthIndex: 7, day: 25 },
      { name: "Boldrei's Feast", monthIndex: 8, day: 9 },
      { name: 'The Ascension', monthIndex: 9, day: 1 },
      { name: 'Wildnight', monthIndex: 9, day: 18, days: 2 },
      { name: 'Thronehold', monthIndex: 10, day: 11 },
      { name: 'Long Shadows', monthIndex: 11, day: 26, days: 3 },
    ],
  },
  harptos: {
    id: 'harptos',
    name: 'Calendar of Harptos (Forgotten Realms)',
    era: 'DR',
    months: [
      m('Hammer', 30, 'winter'),
      m('Midwinter', 1, 'winter', true),
      m('Alturiak', 30, 'winter'),
      m('Ches', 30, 'spring'),
      m('Tarsakh', 30, 'spring'),
      m('Greengrass', 1, 'spring', true),
      m('Mirtul', 30, 'spring'),
      m('Kythorn', 30, 'summer'),
      m('Flamerule', 30, 'summer'),
      m('Midsummer', 1, 'summer', true),
      m('Eleasis', 30, 'summer'),
      m('Eleint', 30, 'autumn'),
      m('Highharvestide', 1, 'autumn', true),
      m('Marpenoth', 30, 'autumn'),
      m('Uktar', 30, 'autumn'),
      m('Feast of the Moon', 1, 'autumn', true),
      m('Nightal', 30, 'winter'),
    ],
  },
  gregorian: {
    id: 'gregorian',
    name: 'Gregorian (365 days)',
    era: '',
    months: [
      m('January', 31, 'winter'),
      m('February', 28, 'winter'),
      m('March', 31, 'spring'),
      m('April', 30, 'spring'),
      m('May', 31, 'spring'),
      m('June', 30, 'summer'),
      m('July', 31, 'summer'),
      m('August', 31, 'summer'),
      m('September', 30, 'autumn'),
      m('October', 31, 'autumn'),
      m('November', 30, 'autumn'),
      m('December', 31, 'winter'),
    ],
  },
  generic: {
    id: 'generic',
    name: 'Simple (12 × 30 days)',
    era: '',
    months: (['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'] as Season[]).map(
      (season, i) => m(`Month ${i + 1}`, 30, season),
    ),
  },
};

export const yearLength = (c: Calendar): number => c.months.reduce((a, mo) => a + mo.days, 0);

export interface DateParts {
  year: number;
  monthIndex: number;
  month: Month;
  day: number;
  dayOfYear: number;
}

export function dateFromIndex(c: Calendar, startYear: number, dayIndex: number): DateParts {
  const yl = yearLength(c);
  const yearOffset = Math.floor(dayIndex / yl);
  let rest = dayIndex - yearOffset * yl;
  const dayOfYear = rest;
  for (let i = 0; i < c.months.length; i++) {
    const mo = c.months[i];
    if (rest < mo.days) return { year: startYear + yearOffset, monthIndex: i, month: mo, day: rest + 1, dayOfYear };
    rest -= mo.days;
  }
  // Unreachable for a valid calendar.
  const last = c.months.length - 1;
  return { year: startYear + yearOffset, monthIndex: last, month: c.months[last], day: c.months[last].days, dayOfYear };
}

export function indexFromDate(c: Calendar, startYear: number, year: number, monthIndex: number, day: number): number {
  let idx = (year - startYear) * yearLength(c);
  for (let i = 0; i < monthIndex && i < c.months.length; i++) idx += c.months[i].days;
  const mo = c.months[Math.min(monthIndex, c.months.length - 1)];
  return idx + Math.min(Math.max(day, 1), mo.days) - 1;
}

export function formatDate(c: Calendar, startYear: number, dayIndex: number): string {
  const d = dateFromIndex(c, startYear, dayIndex);
  const yr = c.era ? `${d.year} ${c.era}` : `${d.year}`;
  return d.month.festival || d.month.days === 1 ? `${d.month.name}, ${yr}` : `${d.day} ${d.month.name}, ${yr}`;
}

export function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const mm = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function formatDuration(minutes: number): string {
  if (minutes >= 24 * 60) {
    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    return hours ? `${days} d ${hours} h` : `${days} d`;
  }
  const h = Math.floor(minutes / 60);
  const mm = minutes % 60;
  if (!h) return `${mm} min`;
  return mm ? `${h} h ${mm} min` : `${h} h`;
}

/** Approximate sunrise/sunset by season (hours, 24h clock). Table convenience, not a rules text. */
const SUN: Record<Season, [number, number]> = {
  winter: [7.5, 16.5],
  spring: [6, 18.5],
  summer: [5, 20.5],
  autumn: [6.5, 18],
};

/** Sunrise and sunset in hours for a season. */
export const sunTimes = (season: Season): [number, number] => SUN[season];

/** Sunrise as minutes after midnight. */
export const sunriseMinutes = (season: Season): number => Math.round(SUN[season][0] * 60);

export type LightPhase = 'Night' | 'Dawn' | 'Day' | 'Dusk';

export function lightAt(minutes: number, season: Season): { phase: LightPhase; light: string; sunrise: number; sunset: number } {
  const h = minutes / 60;
  const [rise, set] = SUN[season];
  if (h >= rise && h < set) return { phase: 'Day', light: 'Bright Light outdoors', sunrise: rise, sunset: set };
  if (h >= rise - 1 && h < rise) return { phase: 'Dawn', light: 'Dim Light outdoors', sunrise: rise, sunset: set };
  if (h >= set && h < set + 1) return { phase: 'Dusk', light: 'Dim Light outdoors', sunrise: rise, sunset: set };
  return { phase: 'Night', light: 'Darkness outdoors (unless moonlit)', sunrise: rise, sunset: set };
}

export const hourLabel = (h: number): string => formatClock(Math.round(h * 60) % 1440);
