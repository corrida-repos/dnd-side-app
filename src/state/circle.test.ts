import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { State } from './types';
import { circleEligible, helperProblem } from '../rules/circle';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
const slots = (id: string, level: number, n: number) => ({ id, name: `Spell slots (level ${level})`, max: n, current: n, recharge: 'long' as const });

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.settings.sleepDeprivation = false;
  s.settings.encounters = false;
  s.spellLibrary = [
    { name: 'Warding Glyphwork', level: 3, castTime: '10 minutes', castMinutes: 10, durationMinutes: 60 * 24 },
    { name: 'Long Weave', level: 2, castTime: '2 hours', castMinutes: 120, durationMinutes: null },
    { name: 'Quick Bolt', level: 1, castTime: '1 action', castMinutes: 0, durationMinutes: null },
  ];
  s.characters = [
    newCharacter({
      name: 'Lead',
      needsFood: false,
      needsWater: false,
      spells: ['Warding Glyphwork', 'Long Weave', 'Quick Bolt'].map((name, i) => ({ name, level: [3, 2, 1][i], prepared: true, alwaysPrepared: false })),
      resources: [slots('a3', 3, 2)],
    }),
    newCharacter({ name: 'Second', needsFood: false, needsWater: false, spells: [{ name: 'Bless', level: 1, prepared: true, alwaysPrepared: false }], resources: [slots('b3', 3, 1), slots('b1', 1, 3)] }),
    newCharacter({ name: 'Third', needsFood: false, needsWater: false, resources: [slots('c4', 4, 1)] }),
    newCharacter({ name: 'Fighter', needsFood: false, needsWater: false }),
  ];
  s.minutes = 9 * 60;
  s.log = [];
  patch(s);
  return s;
}
const ids = (s: State, ...names: string[]) => names.map((n) => s.characters.find((c) => c.name === n)!.id);
const cur = (s: State, name: string) => s.characters.find((c) => c.name === name)!.resources.map((r) => r.current);

describe('Circle Magic (Heroes of Faerûn, optional)', () => {
  it('only tracks leveled spells that take 1 minute or longer', () => {
    expect(circleEligible({ name: 'Quick Bolt', level: 1, castMinutes: 0 }).ok).toBe(false);
    expect(circleEligible({ name: 'Light', level: 0, castMinutes: 0 }).ok).toBe(false);
    expect(circleEligible({ name: 'Mystery', level: 2 }).ok).toBe(false);
    expect(circleEligible({ name: 'Warding Glyphwork', level: 3, castMinutes: 10 }).ok).toBe(true);
  });

  it('needs Spellcasting or Pact Magic and a slot of the spell’s level or higher', () => {
    const s = fresh();
    expect(helperProblem(s.characters[3], 3)).toMatch(/no Spellcasting/);
    expect(helperProblem(s.characters[1], 4)).toMatch(/no spell slot of level 4/);
    expect(helperProblem(s.characters[2], 3)).toBe('');
  });

  it('spends a slot from every caster, passes the casting time and notes the circle on the effect', () => {
    const s = fresh();
    const [lead, second, third] = ids(s, 'Lead', 'Second', 'Third');
    const n = E.castSpell(s, ctx(), lead, 'Warding Glyphwork', 'slot', null, { helperIds: [second, third], option: 'larger area' });
    expect(cur(n, 'Lead')).toEqual([1]);
    expect(cur(n, 'Second')).toEqual([0, 3]); // the level 3 slot, not level 1
    expect(cur(n, 'Third')).toEqual([0]);
    expect(E.absNow(n) - E.absNow(s)).toBe(10);
    const eff = n.effects.find((e) => e.name === 'Warding Glyphwork')!;
    expect(eff.notes).toMatch(/Circle spell with Second, Third\. Circle option: larger area/);
    expect(n.log.some((l) => /completes Warding Glyphwork as a Circle spell/.test(l.text) && l.sense)).toBe(true);
  });

  it('refuses before anything is spent if a secondary caster can’t contribute', () => {
    const s = fresh();
    const [lead, fighter] = ids(s, 'Lead', 'Fighter');
    const n = E.castSpell(s, ctx(), lead, 'Warding Glyphwork', 'slot', null, { helperIds: [fighter] });
    expect(cur(n, 'Lead')).toEqual([2]);
    expect(E.absNow(n)).toBe(E.absNow(s));
    expect(n.log[0].text).toMatch(/doesn't begin/);
  });

  it('won’t circle-cast quick spells, rituals, or with the rule switched off', () => {
    const s = fresh();
    const [lead, second] = ids(s, 'Lead', 'Second');
    expect(E.castSpell(s, ctx(), lead, 'Quick Bolt', 'slot', null, { helperIds: [second] }).log[0].text).toMatch(/combat's timescale/);
    expect(E.castSpell(s, ctx(), lead, 'Warding Glyphwork', 'ritual', null, { helperIds: [second] }).log[0].text).toMatch(/can't be cast as a ritual/);
    const off = fresh((d) => (d.settings.circleMagic = false));
    expect(E.castSpell(off, ctx(), ids(off, 'Lead')[0], 'Warding Glyphwork', 'slot', null, { helperIds: ids(off, 'Second') }).log[0].text).toMatch(/switched off/);
  });

  it('ends what every caster in the circle was concentrating on', () => {
    const s = fresh((d) => d.effects.push({ id: 'x', name: 'Bless', kind: 'spell', targetIds: [], casterId: d.characters[1].id, concentration: true, shelter: false, startedAt: E.absNow(d), endsAt: E.absNow(d) + 60, notes: '' }));
    const [lead, second] = ids(s, 'Lead', 'Second');
    const n = E.castSpell(s, ctx(), lead, 'Warding Glyphwork', 'slot', null, { helperIds: [second] });
    expect(n.effects.some((e) => e.name === 'Bless')).toBe(false);
    expect(n.log.some((l) => /Second stops concentrating on Bless/.test(l.text))).toBe(true);
  });

  it('breaks off when an encounter turns up mid-casting: the spell fails and no slot is spent', () => {
    const s = fresh((d) => {
      d.settings.encounters = true;
      d.place.danger = 'deadly';
      d.encounterClock = 0;
    });
    const [lead, second] = ids(s, 'Lead', 'Second');
    const n = E.castSpell(s, ctx(0.9), lead, 'Long Weave', 'slot', null, { helperIds: [second] });
    expect(cur(n, 'Lead')).toEqual([2]);
    expect(cur(n, 'Second')).toEqual([1, 3]);
    expect(E.absNow(n) - E.absNow(s)).toBe(60);
    expect(n.log.some((l) => /break off casting Long Weave after 1 h/.test(l.text) && l.sense)).toBe(true);
  });

  it('a solo casting of 1 minute or longer also needs Concentration throughout', () => {
    const s = fresh((d) => d.effects.push({ id: 'x', name: 'Detect Magic', kind: 'spell', targetIds: [], casterId: d.characters[0].id, concentration: true, shelter: false, startedAt: E.absNow(d), endsAt: E.absNow(d) + 10, notes: '' }));
    const n = E.castSpell(s, ctx(), ids(s, 'Lead')[0], 'Warding Glyphwork', 'slot');
    expect(n.effects.some((e) => e.name === 'Detect Magic')).toBe(false);
    expect(cur(n, 'Lead')).toEqual([1]);
  });
});
