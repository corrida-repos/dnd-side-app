import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { State } from './types';
import { moonPhase, divinationFailChance } from '../rules/longterm';
import { EFFECT_PRESETS } from '../rules/effects';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
const LOW = ctx(0);
const HIGH = ctx(0.999);

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.settings.sleepDeprivation = false;
  s.characters = [newCharacter({ name: 'A', needsFood: false, needsWater: false, className: 'Wizard' })];
  s.log = [];
  patch(s);
  return s;
}

describe('spells cast every day', () => {
  it('builds a streak, loses it on a missed day, and becomes permanent', () => {
    let s = E.addRitual(fresh(), ctx(), 'Forbiddance', 3, 'Temple', null);
    const id = s.rituals[0].id;
    s = E.castRitual(s, ctx(), id);
    expect(E.castRitual(s, ctx(), id).rituals[0].streak).toBe(1); // only once a day
    s = E.advance(s, ctx(), 24 * 60);
    s = E.castRitual(s, ctx(), id);
    expect(s.rituals[0].streak).toBe(2);
    const missed = E.advance(s, ctx(), 48 * 60);
    expect(missed.rituals[0].streak).toBe(0);
    s = E.advance(s, ctx(), 24 * 60);
    s = E.castRitual(s, ctx(), id);
    expect(s.rituals[0]).toMatchObject({ streak: 3, permanent: true });
  });
});

describe('death and resurrection windows', () => {
  it('counts time since death, minus Gentle Repose, and revives', () => {
    let s = fresh();
    const id = s.characters[0].id;
    s = E.markDead(s, ctx(), id, true);
    s = E.advance(s, ctx(), 2 * 1440);
    expect(E.deadFor(s, s.characters[0])).toBe(2 * 1440);
    s = E.addEffect(s, ctx(), { preset: EFFECT_PRESETS.find((p) => p.name === 'Gentle Repose')!, minutes: 10 * 1440, targetIds: [id], casterId: null });
    s = E.advance(s, ctx(), 5 * 1440);
    expect(E.deadFor(s, s.characters[0])).toBe(2 * 1440);
    s = E.markDead(s, ctx(), id, false);
    expect(s.characters[0]).toMatchObject({ diedAt: null, reposeMinutes: 0 });
    expect(s.characters[0].hp).toBeGreaterThan(0);
  });

  it('records death from Exhaustion 6 and skips the dead in survival checks', () => {
    const s = fresh((d) => {
      d.characters[0].exhaustion = 5;
      d.characters[0].needsWater = true;
      d.minutes = 23 * 60;
    });
    const n = E.advance(s, ctx(), 60);
    expect(n.characters[0].diedAt).not.toBeNull();
    expect(E.advance(n, ctx(), 1440).characters[0].exhaustion).toBe(6);
  });
});

describe('divination limits', () => {
  it('adds 25% per extra casting and resets on a Long Rest', () => {
    expect([0, 1, 2, 5].map(divinationFailChance)).toEqual([0, 25, 50, 100]);
    let s = fresh();
    const id = s.characters[0].id;
    s = E.castDivination(s, ctx(), id, 'Augury');
    const fail = E.castDivination(s, LOW, id, 'Augury');
    expect(fail.log[0].text).toContain('25% chance');
    expect(fail.log[0].text).toContain('fails');
    expect(E.castDivination(s, HIGH, id, 'Augury').log[0].text).toContain('normally');
    expect(E.longRest(fail, ctx(), false).characters[0].divinationCasts).toEqual({});
  });
});

describe('moon and spellbook', () => {
  it('cycles the moon about every 30 days', () => {
    expect(moonPhase(0, 0).name).toBe('New moon');
    expect(moonPhase(15, 0).name).toBe('Full moon');
    expect(moonPhase(15, 0).daysToFull).toBe(0);
    expect(moonPhase(30, 0).name).toBe('New moon');
  });

  it('replaces a spellbook at 1 hour and 10 GP per prepared spell level', () => {
    const s = fresh((d) => {
      d.characters[0].gp = 100;
      d.characters[0].spells = [
        { name: 'Shield', level: 1, prepared: true, alwaysPrepared: false },
        { name: 'Fireball', level: 3, prepared: true, alwaysPrepared: false },
        { name: 'Fly', level: 3, prepared: false, alwaysPrepared: false },
      ];
    });
    const n = E.replaceSpellbook(s, ctx(), s.characters[0].id);
    expect(n.characters[0].gp).toBe(60);
    expect(n.minutes).toBe(s.minutes + 4 * 60);
  });
});
