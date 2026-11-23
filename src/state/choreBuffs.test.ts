import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { InventoryItem, Project, State } from './types';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
const item = (name: string, extra: Partial<InventoryItem> = {}): InventoryItem => ({ id: name, name, qty: 1, weight: 1, source: 'manual', container: null, ammo: null, ...extra });
const project = (p: Partial<Project>): Project => ({ id: 'p', name: 'Job', kind: 'activity', charIds: [], daysRequired: 5, daysDone: 0, costGp: 0, notes: '', done: false, ...p });

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.settings.sleepDeprivation = false;
  s.settings.encounters = false;
  s.settings.coldNights = false;
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.characters = [newCharacter({ name: 'Ada', survival: 5, stress: 4, fear: 3, lifestyle: 'comfortable', needsFood: false, needsWater: false, inventory: [] })];
  s.log = [];
  patch(s);
  return s;
}

describe('chores that restore and pay', () => {
  it('a week of Relaxation clears Stress and Fear', () => {
    let s = fresh((d) => (d.projects = [project({ name: 'Relaxation', charIds: [d.characters[0].id], daysDone: 4 })]));
    s = E.workOnProjects(s, ctx(), ['p']);
    expect(s.characters[0]).toMatchObject({ stress: 0, fear: 0 });
  });

  it('carousing eases Stress each week, and religious service Fear', () => {
    let s = fresh((d) => (d.projects = [project({ name: 'Carousing', charIds: [d.characters[0].id], done: true, awaitingOutcome: true })]));
    s = E.resolveActivityProject(s, ctx(0.99), 'p', { bonuses: [5], circle: 'lower' });
    expect(s.characters[0].stress).toBe(2);
    s.projects = [project({ id: 'r', name: 'Religious service', charIds: [s.characters[0].id], done: true, awaitingOutcome: true })];
    s = E.resolveActivityProject(s, ctx(0.99), 'r', { bonuses: [5] });
    expect(s.characters[0]).toMatchObject({ stress: 1, fear: 2 });
  });

  it('every trap catch leaves a pelt worth selling', () => {
    let s = fresh((d) => (d.characters[0].inventory = [item('Hunting Trap', { qty: 2 })]));
    s = E.setTraps(s, ctx(), s.characters[0].id, 2);
    s = E.advance(s, ctx(), 8 * 60, 'camp');
    s = E.checkTraps(s, ctx(0.999));
    const pelts = s.characters[0].inventory.filter((i) => /pelt|fur/i.test(i.name)).reduce((a, i) => a + i.qty, 0);
    expect(pelts).toBe(2);
  });

  it('hides are worth real money and sell at full value from the stash', () => {
    let s = fresh();
    s = E.butcher(s, ctx(0.99), { creature: { name: 'Elk', size: 'Large', type: 'beast' }, count: 1, butcherId: s.characters[0].id });
    const hide = s.materials.find((m) => m.name === 'Hide (Elk)')!;
    expect(hide.valueGp).toBe(15);
    const gp = s.characters[0].gp;
    s = E.sellMaterial(s, ctx(), hide.id, 1);
    expect(s.characters[0].gp - gp).toBe(15);
    expect(s.materials.find((m) => m.name === 'Hide (Elk)')).toBeUndefined();
  });

  it('a quiet watch at a wild camp brings in food', () => {
    const s = fresh((d) => {
      d.minutes = 22 * 60;
      d.place.settlement = false;
      d.place.shelter = 'none';
      d.watchPlan = { count: 2, slots: [[d.characters[0].id], [d.characters[0].id]] };
    });
    const raw = s.stores.foodRawLb + s.stores.foodLb;
    const n = E.longRest(s, ctx(0.99), false);
    expect(n.stores.foodRawLb + n.stores.foodLb).toBeGreaterThan(raw);
    expect(n.log.some((l) => l.text.includes('brings in'))).toBe(true);
  });

  it('kept gear gives an edge for a day', () => {
    const s0 = fresh();
    const s = E.maintainGear(s0, ctx(), [s0.characters[0].id]);
    expect(s.effects.some((e) => e.name === 'Well-kept gear' && e.endsAt === E.absNow(s) + 24 * 60)).toBe(true);
  });

  it('a fine reading of the sky tells tomorrow’s weather, and tomorrow keeps to it', () => {
    let s = fresh((d) => (d.minutes = 20 * 60));
    s = E.readTheSky(s, ctx(0.99), s.characters[0].id);
    const f = s.forecast!;
    expect(f.dayIndex).toBe(s.dayIndex + 1);
    expect(s.log.some((l) => l.text.includes('reads tomorrow'))).toBe(true);
    s = E.advance(s, ctx(0.1), 6 * 60);
    expect(s.weather).toMatchObject({ dayIndex: f.dayIndex, high: f.high, precip: f.precip });
    expect(s.forecast).toBeNull();
  });

  it('an expert mend clears wear and reinforces the item', () => {
    let s = fresh((d) => (d.characters[0].inventory = [item('Cloak', { damaged: true, wear: 2 }), item("Weaver's Tools")]));
    s = E.mendItem(s, ctx(0.99), s.characters[0].id, 'Cloak', s.characters[0].id, 'tools', 5);
    expect(s.characters[0].inventory[0]).toMatchObject({ reinforced: true });
    expect(s.characters[0].inventory[0].damaged).toBeUndefined();
    expect(s.characters[0].inventory[0].wear).toBeUndefined();
  });
});
