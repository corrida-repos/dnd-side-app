import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { State } from './types';
import { parse5eToolsSpells, readCastTime, readDuration } from '../rules/spells';
import { spellInfo } from '../rules/rituals';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.settings.sleepDeprivation = false;
  s.characters = [
    newCharacter({
      name: 'Cleric',
      className: 'Cleric',
      needsFood: false,
      needsWater: false,
      spells: [
        { name: 'Detect Magic', level: 1, prepared: true, alwaysPrepared: false },
        { name: 'Alarm', level: 1, prepared: false, alwaysPrepared: false },
        { name: 'Bless', level: 1, prepared: true, alwaysPrepared: false },
      ],
      resources: [{ id: 's1', name: 'Spell slots (level 1)', max: 2, current: 2, recharge: 'long' }],
    }),
  ];
  s.minutes = 9 * 60;
  s.log = [];
  patch(s);
  return s;
}

describe('reading 5etools casting time and duration', () => {
  it('turns time and duration into minutes', () => {
    expect(readCastTime([{ number: 1, unit: 'action' }])).toEqual({ castTime: '1 action', castMinutes: 0 });
    expect(readCastTime([{ number: 10, unit: 'minute' }])).toEqual({ castTime: '10 minutes', castMinutes: 10 });
    expect(readDuration([{ type: 'timed', duration: { type: 'hour', amount: 8 } }])).toEqual({ durationMinutes: 480 });
    expect(readDuration([{ type: 'instant' }])).toEqual({ durationMinutes: null });
    expect(readDuration([{ type: 'permanent', ends: ['dispel'] }])).toEqual({ durationMinutes: null, permanent: true });
    const [sp] = parse5eToolsSpells({ spell: [{ name: 'Alarm', level: 1, school: 'A', meta: { ritual: true }, time: [{ number: 1, unit: 'minute' }], duration: [{ type: 'timed', duration: { type: 'hour', amount: 8 } }] }] });
    expect(sp).toMatchObject({ ritual: true, castMinutes: 1, durationMinutes: 480 });
  });

  it('knows common rituals without an import, including 2024 names', () => {
    expect(spellInfo({ name: 'Tiny Hut', level: 3 }, [])).toMatchObject({ ritual: true, castMinutes: 1, durationMinutes: 480 });
    expect(spellInfo({ name: 'Detect Magic', level: 1 }, [])).toMatchObject({ ritual: true, concentration: true });
    expect(spellInfo({ name: 'Bless', level: 1 }, []).ritual).toBeUndefined();
    expect(spellInfo({ name: 'Alarm', level: 1 }, [{ name: 'Alarm', level: 1, castMinutes: 2, ritual: true }]).castMinutes).toBe(2);
  });
});

describe('ritual casting', () => {
  it('adds 10 minutes, uses no slot and starts the timer', () => {
    const s = fresh();
    const n = E.castSpell(s, ctx(), s.characters[0].id, 'Detect Magic', 'ritual');
    expect(n.minutes).toBe(s.minutes + 10);
    expect(n.characters[0].resources[0].current).toBe(2);
    expect(n.effects[0]).toMatchObject({ name: 'Detect Magic', concentration: true, casterId: s.characters[0].id });
    expect(n.effects[0].endsAt).toBe(E.absNow(n) + 10);
  });

  it('needs the spell prepared (Wizards can use their spellbook) and the Ritual tag', () => {
    const s = fresh();
    const id = s.characters[0].id;
    expect(E.castSpell(s, ctx(), id, 'Alarm', 'ritual').minutes).toBe(s.minutes);
    expect(E.castSpell(s, ctx(), id, 'Bless', 'ritual').minutes).toBe(s.minutes);
    s.characters[0].className = 'Wizard';
    const wiz = E.castSpell(s, ctx(), id, 'Alarm', 'ritual');
    expect(wiz.minutes).toBe(s.minutes + 11);
    expect(wiz.effects[0].endsAt).toBe(E.absNow(wiz) + 480);
  });

  it('casting normally uses a slot and takes only the casting time', () => {
    const s = fresh();
    const n = E.castSpell(s, ctx(), s.characters[0].id, 'Detect Magic', 'slot');
    expect(n.minutes).toBe(s.minutes);
    expect(n.characters[0].resources[0].current).toBe(1);
    const dry = fresh((d) => (d.characters[0].resources[0].current = 0));
    expect(E.castSpell(dry, ctx(), dry.characters[0].id, 'Bless', 'slot').log[0].text).toContain('no spell slots');
  });
});
