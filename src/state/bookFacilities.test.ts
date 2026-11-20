import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { Facility, State } from './types';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
function keep(level = 17): State {
  let s = createDefaultState(() => 0);
  s.settings.sleepDeprivation = false;
  s.characters = [newCharacter({ name: 'Lord', gp: 50000, level, needsFood: false, needsWater: false })];
  s = E.foundBastion(s, ctx(), s.characters[0].id, 'Keep');
  return s;
}
const fac = (name: string, extra: Partial<Facility> = {}): Facility => ({ id: name, name, kind: 'special', size: 'vast', order: 'Recruit', orderNote: '', building: null, built: true, ...extra });
const turn = (s: State, rng = 0.5) => {
  s.bastions[0].lastTurnDay = s.dayIndex - 7;
  return E.resolveBastionTurn(s, ctx(rng), s.bastions[0].id);
};

describe('Forgotten Realms and Eberron facilities', () => {
  it('a Red Wizard Necropolis raises undead defenders that come back 14 days after being destroyed', () => {
    let s = keep();
    s.bastions[0].facilities.push(fac('Red Wizard Necropolis', { size: 'roomy', plan: { option: 'undead' } }));
    s = turn(s);
    s = turn(s);
    expect(s.bastions[0].undead).toBe(4);
    s.bastions[0].undead = 2;
    s.bastions[0].undeadReturning = [s.dayIndex + 1, s.dayIndex + 1];
    s = E.advance(s, ctx(), 2 * 24 * 60);
    expect(s.bastions[0].undead).toBe(4);
  });

  it('a Construct Forge builds a construct over its listed time and it defends', () => {
    let s = keep();
    s.bastions[0].facilities.push(fac('Construct Forge', { plan: { option: 'construct', choice: 'Animated Armor (14 days, 1,000 GP)' } }));
    s = turn(s);
    expect(s.characters[0].gp).toBe(49000);
    s = turn(s);
    s = turn(s);
    expect(E.bastionDefenders(s.bastions[0])).toBe(1);
  });

  it('Zhentarim reconnaissance grants Advantage until the journey ends, and a Long Rest there speeds travel', () => {
    let s = keep();
    s.bastions[0].facilities.push(fac('Zhentarim Travel Station', { order: 'Research', plan: { option: 'recon', text: 'to Neverwinter' } }));
    s = turn(s);
    s = turn(s);
    expect(s.travel.reconAdvantage).toBe(true);
    s.minutes = 22 * 60;
    s = E.longRest(s, ctx(), true);
    expect(s.travel.paceBoost).toBe(true);
  });
});
