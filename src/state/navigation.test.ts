import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { State } from './types';
import { navigationDC } from '../rules/navigation';
import { readSky, rangeLabel } from '../rules/skyclock';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
const LOW = ctx(0);
const HIGH = ctx(0.999);

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.settings.sleepDeprivation = false;
  s.characters = [newCharacter({ name: 'Scout', survival: 3, needsFood: false, needsWater: false })];
  s.minutes = 8 * 60;
  s.place.terrain = 'forest';
  s.place.onRoute = false;
  s.log = [];
  patch(s);
  return s;
}

describe('getting lost', () => {
  it('sets the DC by terrain, plus heavy weather and darkness', () => {
    expect(navigationDC(null, { heavyPrecip: true, dark: true, poorVisibilityRule: true }).dc).toBeNull();
    expect(navigationDC(5, { heavyPrecip: false, dark: false, poorVisibilityRule: true }).dc).toBe(5);
    expect(navigationDC(15, { heavyPrecip: true, dark: true, poorVisibilityRule: true }).dc).toBe(25);
    expect(navigationDC(15, { heavyPrecip: true, dark: true, poorVisibilityRule: false }).dc).toBe(15);
  });

  it('gets lost on a failed check, wanders off course, and finds the way on a later check', () => {
    const s = fresh();
    const id = s.characters[0].id;
    const lost = E.travel(s, LOW, { hours: 3, pace: 'normal', difficult: false, foragerIds: [], navigatorId: id });
    expect(lost.travel.lost).toBe(true);
    expect(lost.travel.milesOffCourse).toBe(9); // every recheck also fails when all dice roll 1
    expect(lost.log.some((l) => l.text.includes('strays off course'))).toBe(true);
    const found = E.travel(lost, HIGH, { hours: 2, pace: 'normal', difficult: false, foragerIds: [], navigatorId: id });
    expect(found.travel.lost).toBe(false);
    expect(found.log.some((l) => l.text.includes('finds the way again'))).toBe(true);
  });

  it('needs no check on a road, and slow pace helps', () => {
    const road = fresh((d) => (d.place.onRoute = true));
    expect(E.travel(road, LOW, { hours: 2, pace: 'normal', difficult: false, foragerIds: [], navigatorId: road.characters[0].id }).travel.lost).toBe(false);
    const s = fresh();
    const slow = E.travel(s, ctx(0.5), { hours: 1, pace: 'slow', difficult: false, foragerIds: [], navigatorId: s.characters[0].id });
    expect(slow.log.some((l) => l.text.includes('11/11 +3 = 14 against DC 15'))).toBe(true); // Advantage: two d20s
    expect(E.travel(s, HIGH, { hours: 1, pace: 'fast', difficult: false, foragerIds: [], navigatorId: s.characters[0].id }).travel.lost).toBe(false);
  });
});

describe('telling the time by nature', () => {
  const w = (precip: 'none' | 'heavy') => ({ ...createDefaultState(() => 0).weather, precip, wind: 'none' as const });

  it('reads the phase of day from the sky', () => {
    expect(readSky(5.5 * 60, 'spring', w('none'), false).phase).toBe('Dawn');
    expect(readSky(12 * 60 + 15, 'spring', w('none'), false).phase).toBe('Midday');
    expect(readSky(19 * 60, 'spring', w('none'), false).phase).toBe('Dusk');
    expect(readSky(1 * 60, 'spring', w('none'), false).phase).toBe('Deep night');
  });

  it('gets vaguer under cloud and gives up underground', () => {
    const clear = readSky(10 * 60, 'spring', w('none'), false);
    const cloudy = readSky(10 * 60, 'spring', w('heavy'), false);
    expect(clear.phase).toBe('Mid-morning');
    expect(cloudy.phase).toBe('Daytime');
    expect(cloudy.to - cloudy.from).toBeGreaterThan(clear.to - clear.from);
    const deep = readSky(10 * 60, 'spring', w('none'), true);
    expect(deep.view).toBe('none');
    expect(rangeLabel(deep)).toBe('any hour');
  });

  it('lets a character judge the hour with a Survival check', () => {
    const s = fresh((d) => (d.place.onRoute = true));
    const good = E.readTheSky(s, HIGH, s.characters[0].id);
    expect(good.log[0].text).toContain('about 08:00 (right to within the hour)');
    const bad = E.readTheSky(s, LOW, s.characters[0].id);
    expect(bad.log[0].text).toContain("wrong: it's really about 08:00");
  });
});
