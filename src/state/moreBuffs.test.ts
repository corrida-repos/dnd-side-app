import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { State } from './types';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.settings.sleepDeprivation = false;
  s.settings.encounters = false;
  s.settings.coldNights = false;
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.minutes = 12 * 60;
  s.characters = [newCharacter({ name: 'Ada', survival: 5, gp: 0, stress: 3, needsFood: false, needsWater: false, inventory: [] })];
  s.log = [];
  patch(s);
  return s;
}

describe('more chores that pay', () => {
  it('a sharp search turns up a find, and tracking leads to game', () => {
    const s = fresh();
    const searched = E.searchCheck(s, ctx(0.99), s.characters[0].id, 'search', 5);
    expect(searched.log.some((l) => l.text.includes('comes across'))).toBe(true);
    const tracked = E.searchCheck(s, ctx(0.99), s.characters[0].id, 'track', 5);
    expect(tracked.travel.reconAdvantage).toBe(true);
  });

  it('catching up warms a contact once a month', () => {
    let s = fresh((d) => (d.contacts = [{ id: 'k', name: 'Old Bren', role: 'Innkeeper', place: 'Here', distanceMiles: 0, bond: 0, knownBy: [], lastHeardDay: 0, owesParty: 0, partyOwes: 0, notes: '' }]));
    s = E.keepInTouch(s, ctx(), 'k');
    expect(s.contacts![0].bond).toBe(1);
    s = E.keepInTouch(s, ctx(), 'k');
    expect(s.contacts![0].bond).toBe(1);
  });

  it('recuperating also lifts Exhaustion and eases Stress', () => {
    let s = fresh((d) => Object.assign(d.characters[0], { conSave: 20, exhaustion: 2, exhaustionCauses: ['other', 'other'] }));
    s = E.recuperate(s, ctx(0.5), s.characters[0].id);
    expect(s.characters[0].exhaustion).toBeLessThan(2);
    expect(s.characters[0].stress).toBeLessThan(3);
  });

  it('laborers gather firewood and dig a fire pit before a Long Rest', () => {
    const s = fresh((d) => {
      d.minutes = 22 * 60;
      d.place.settlement = false;
      d.place.shelter = 'none';
      d.fire = { lit: false, fuelHours: 0, sheltered: false };
      d.hirelings = [{ id: 'h', name: 'Tam', role: 'laborer', bonus: 0, passivePerception: 10, skilled: false, wageGp: 0.2, payer: 'party', active: true }];
    });
    const n = E.longRest(s, ctx(0.99), true);
    expect(n.fire.sheltered).toBe(true);
    expect(n.log.some((l) => /makes? camp/.test(l.text))).toBe(true);
  });
});
