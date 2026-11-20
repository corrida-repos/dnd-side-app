import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { State } from './types';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });

function one(): State {
  const s = createDefaultState(() => 0);
  s.settings.sleepDeprivation = false;
  s.settings.coldNights = false;
  s.weather = { ...s.weather, high: 65, low: 50, wind: 'none', precip: 'none' };
  s.characters = [newCharacter({ name: 'Ada', conSave: 0, needsFood: false, needsWater: false })];
  s.log = [];
  return s;
}

describe('magical contagions', () => {
  it('Sewer Plague incubates 1d4 days, then fights it out at dawn', () => {
    let s = one();
    // rng 0.5: d4 = 3 days; resist roll d20 = 11 vs DC 11 would pass, so infect outright
    s = E.exposeContagion(s, ctx(), s.characters[0].id, 'sewer', false);
    expect(s.characters[0].contagions[0].onset).toBe(false);
    s = E.advance(s, ctx(), 3 * 24 * 60);
    expect(s.characters[0].contagions[0].onset).toBe(true);
    expect(s.characters[0].exhaustion).toBe(1);
    // Next dawn: d20 = 20 (rng 0.99) succeeds → Exhaustion 0 → cured
    s = E.advance(s, ctx(0.99), 24 * 60);
    expect(s.characters[0].contagions).toHaveLength(0);
    expect(s.characters[0].exhaustion).toBe(0);
  });

  it('Sewer Plague makes a Long Rest restore no HP and no Exhaustion', () => {
    let s = one();
    s = E.exposeContagion(s, ctx(), s.characters[0].id, 'sewer', false);
    const c = s.characters[0];
    c.contagions[0].onsetAt = E.absNow(s);
    s = E.advance(s, ctx(), 1);
    s.characters[0].hp = 1;
    s.minutes = 22 * 60;
    s = E.longRest(s, ctx(0.01), true);
    expect(s.characters[0].hp).toBe(1);
    expect(s.characters[0].exhaustion).toBeGreaterThanOrEqual(1);
  });

  it('Sight Rot blinds at once; three days of ointment cure it', () => {
    let s = one();
    s = E.exposeContagion(s, ctx(), s.characters[0].id, 'sightRot', false);
    const id = s.characters[0].id;
    expect(s.characters[0].contagions[0].onset).toBe(true);
    for (let i = 0; i < 3; i++) {
      s = E.applySightRotOintment(s, ctx(), id, id);
      s = E.advance(s, ctx(), 24 * 60);
    }
    expect(s.characters[0].contagions).toHaveLength(0);
  });

  it('Cackle Fever ends after three successful Long Rest saves, taking its Exhaustion with it', () => {
    let s = one();
    s = E.exposeContagion(s, ctx(), s.characters[0].id, 'cackle', false);
    s.characters[0].contagions[0].onsetAt = E.absNow(s);
    s = E.advance(s, ctx(), 1);
    expect(s.characters[0].exhaustion).toBe(1);
    for (let i = 0; i < 3; i++) {
      s.minutes = 22 * 60;
      s.lastLongRestEnd = null;
      s = E.longRest(s, ctx(0.99), true);
    }
    expect(s.characters[0].contagions).toHaveLength(0);
    expect(s.characters[0].exhaustion).toBe(0);
  });
});
