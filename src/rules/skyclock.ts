import type { Season } from '../state/types';
import { sunTimes } from './calendar';
import type { Weather } from './weather';

export type SkyView = 'clear' | 'overcast' | 'none';

export interface SkyReading {
  phase: string;
  cue: string;
  /** Best guess range in hours of the day (can wrap past midnight). */
  from: number;
  to: number;
  view: SkyView;
}

/** Wisdom (Survival) DC to judge the hour from nature (table rule). */
export const SKY_DC: Record<SkyView, number> = { clear: 10, overcast: 15, none: 20 };

interface Band {
  phase: string;
  clear: string;
  overcast: string;
  start: number;
  end: number;
}

function bands(rise: number, set: number): Band[] {
  const noon = (rise + set) / 2;
  return [
    { phase: 'Before dawn', start: rise - 2, end: rise - 1, clear: 'The eastern sky turns grey, the stars fade, dew settles, and the first birds stir.', overcast: 'The darkness thins to a dull grey. Birds begin to stir.' },
    { phase: 'Dawn', start: rise - 1, end: rise, clear: 'Pink and gold light on the eastern horizon, and a loud dawn chorus of birdsong.', overcast: 'A cold grey light grows behind the clouds. The dawn chorus starts up.' },
    { phase: 'Early morning', start: rise, end: rise + 2.5, clear: 'The sun sits low in the east. Long shadows point west, and mist lifts from low ground.', overcast: 'Flat, pale light with no shadows. It feels early: damp, cool, dew on everything.' },
    { phase: 'Mid-morning', start: rise + 2.5, end: noon - 1, clear: 'The sun climbs. Shadows shorten, the dew is gone, and the air warms.', overcast: 'Steady grey daylight. Hard to tell morning from afternoon.' },
    { phase: 'Midday', start: noon - 1, end: noon + 1, clear: 'The sun is at its highest and shadows pool right beneath you. It is the hottest part of the day.', overcast: 'The light is at its brightest behind the clouds, but no shadow says the hour.' },
    { phase: 'Afternoon', start: noon + 1, end: set - 2.5, clear: 'The sun slides west and shadows stretch out east. Insects drone in the heat.', overcast: 'Steady grey daylight. Hard to tell afternoon from morning.' },
    { phase: 'Late afternoon', start: set - 2.5, end: set, clear: 'The sun hangs low in the west and the light turns golden. Birds and beasts grow busy again.', overcast: 'The light begins to fade and the air cools.' },
    { phase: 'Dusk', start: set, end: set + 1, clear: 'Red and purple streak the western sky, the first stars appear, and bats come out.', overcast: 'The grey light drains away quickly into gloom.' },
    { phase: 'Evening', start: set + 1, end: set + 3.5, clear: 'Twilight is gone. Stars brighten overhead and the night creatures begin calling.', overcast: 'Full dark under the clouds. Night insects and owls call.' },
    { phase: 'Deep night', start: set + 3.5, end: rise + 22, clear: 'Stars wheel slowly overhead and the world is still. Only the turning sky marks the hours.', overcast: 'Total darkness. Without stars there is no way to read the hour.' },
  ];
}

const norm = (h: number) => ((h % 24) + 24) % 24;

/** What the sky shows right now, and how precisely it tells the time. */
export function readSky(minutes: number, season: Season, weather: Weather, underground: boolean): SkyReading {
  if (underground) {
    return { phase: 'Unknown', cue: 'No sky to read. Hunger, thirst and tiredness are the only clocks down here.', from: 0, to: 24, view: 'none' };
  }
  const [rise, set] = sunTimes(season);
  const h = minutes / 60;
  const view: SkyView = weather.precip === 'none' ? 'clear' : 'overcast';
  for (const b of bands(rise, set)) {
    const span = norm(b.end - b.start) || 24;
    if (norm(h - b.start) < span) {
      let from = norm(b.start);
      let to = norm(b.end);
      // Under cloud you can only tell morning-to-afternoon apart roughly.
      if (view === 'overcast' && (b.phase === 'Mid-morning' || b.phase === 'Midday' || b.phase === 'Afternoon')) {
        from = norm(rise + 2.5);
        to = norm(set - 2.5);
      }
      const snowy = weather.precip === 'heavy' ? ' Heavy weather hides the sky completely.' : '';
      return { phase: view === 'overcast' && (b.phase === 'Mid-morning' || b.phase === 'Afternoon') ? 'Daytime' : b.phase, cue: (view === 'clear' ? b.clear : b.overcast) + snowy, from, to, view };
    }
  }
  return { phase: 'Night', cue: 'It is dark.', from: 0, to: 24, view };
}

export function fmtHour(h: number): string {
  const n = norm(h);
  const hh = Math.floor(n);
  const mm = Math.round((n - hh) * 60 / 15) * 15;
  return `${String((hh + (mm === 60 ? 1 : 0)) % 24).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}`;
}

export const rangeLabel = (r: SkyReading): string => (r.view === 'none' ? 'any hour' : `roughly ${fmtHour(r.from)}–${fmtHour(r.to)}`);
