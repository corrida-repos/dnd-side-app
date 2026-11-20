import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { State } from './types';
import { EFFECT_PRESETS, holdBreathSeconds } from '../rules/effects';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
const LOW = ctx(0);
const HIGH = ctx(0.999);
const preset = (name: string) => EFFECT_PRESETS.find((p) => p.name === name)!;

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.settings.sleepDeprivation = false;
  s.characters = [newCharacter({ name: 'A', needsFood: false, needsWater: false })];
  s.log = [];
  patch(s);
  return s;
}

describe('lights and timed effects', () => {
  it('burns a torch down, warns 10 minutes before, then goes out', () => {
    const s = E.addEffect(fresh(), ctx(), { preset: preset('Torch'), minutes: 60, targetIds: [], casterId: null });
    const low = E.advance(s, ctx(), 50);
    expect(low.effects).toHaveLength(1);
    expect(low.log.some((l) => l.text.includes('burning low'))).toBe(true);
    const out = E.advance(low, ctx(), 10);
    expect(out.effects).toHaveLength(0);
    expect(out.log[0].text).toBe('Torch goes out.');
  });

  it('keeps one Concentration spell per caster', () => {
    const s = fresh();
    const id = s.characters[0].id;
    const a = E.addEffect(s, ctx(), { preset: preset('Bless'), minutes: 1, targetIds: [], casterId: id });
    const b = E.addEffect(a, ctx(), { preset: preset('Fly'), minutes: 10, targetIds: [], casterId: id });
    expect(b.effects.map((e) => e.name)).toEqual(['Fly']);
    const c = E.addEffect(b, ctx(), { preset: preset('Mage Armor'), minutes: 480, targetIds: [], casterId: id });
    expect(c.effects.map((e) => e.name)).toEqual(['Fly', 'Mage Armor']);
  });

  it('extends lamps and lasts until ended when there is no duration', () => {
    const s = E.addEffect(fresh(), ctx(), { preset: preset('Continual Flame'), minutes: null, targetIds: [], casterId: null });
    expect(E.advance(s, ctx(), 5 * 1440).effects).toHaveLength(1);
    const lamp = E.addEffect(fresh(), ctx(), { preset: preset('Lamp (one flask of oil)'), minutes: 360, targetIds: [], casterId: null });
    const more = E.extendEffect(lamp, ctx(), lamp.effects[0].id, 360);
    expect(E.advance(more, ctx(), 700).effects).toHaveLength(1);
  });

  it("lets Leomund's Tiny Hut keep out extreme cold", () => {
    const cold = (d: State) => {
      d.weather = { ...d.weather, high: -10, low: -20 };
      d.minutes = 10 * 60;
    };
    const s = fresh(cold);
    expect(E.advance(s, LOW, 60).characters[0].exhaustion).toBe(1);
    const hut = E.addEffect(s, ctx(), { preset: preset("Leomund's Tiny Hut"), minutes: 480, targetIds: [], casterId: null });
    expect(E.advance(hut, LOW, 60).characters[0].exhaustion).toBe(0);
  });
});

describe('exploration turns, breath and frigid water', () => {
  it('passes 10 minutes and can roll wandering monsters', () => {
    const s = fresh((d) => {
      d.settings.encounters = false;
      d.settings.exploreEncounterOn = 19;
    });
    const n = E.explorationTurn(s, HIGH, 'search the shrine');
    expect(n.minutes).toBe(s.minutes + 10);
    expect(n.log.some((l) => l.text.startsWith('Wandering monster'))).toBe(true);
    expect(E.explorationTurn(s, LOW, '').log.some((l) => l.text.startsWith('Wandering monster'))).toBe(false);
  });

  it('holds breath for 1 + Con modifier minutes, at least 30 seconds', () => {
    expect(holdBreathSeconds(2)).toBe(180);
    expect(holdBreathSeconds(-3)).toBe(30);
  });

  it('makes frigid water dangerous after Con score minutes, unless resistant to cold', () => {
    const s = fresh((d) => void (d.characters[0].conScore = 10));
    const n = E.frigidWater(s, LOW, s.characters[0].id, 12);
    expect(n.characters[0].exhaustion).toBe(2);
    expect(n.characters[0].exhaustionCauses).toEqual(['frigid', 'frigid']);
    s.characters[0].coldResist = 'resistance';
    expect(E.frigidWater(s, LOW, s.characters[0].id, 12).characters[0].exhaustion).toBe(0);
  });
});
