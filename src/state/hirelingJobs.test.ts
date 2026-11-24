import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { Hireling, InventoryItem, State } from './types';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
const item = (name: string, extra: Partial<InventoryItem> = {}): InventoryItem => ({ id: name, name, qty: 1, weight: 0, source: 'manual', container: null, ammo: null, ...extra });
const hire = (role: Hireling['role'], id: string = role): Hireling => ({ id, name: `${role} ${id}`, role, bonus: 4, passivePerception: 10, skilled: true, wageGp: 0, payer: 'party', active: true });

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.settings.sleepDeprivation = false;
  s.settings.encounters = false;
  s.settings.chargeCosts = false;
  s.minutes = 10 * 60;
  s.characters = [newCharacter({ name: 'Ada', needsFood: false, needsWater: false, inventory: [] })];
  s.log = [];
  patch(s);
  return s;
}

describe('hirelings who pull their weight', () => {
  it('a porter carries a 150 lb load of their own, left behind if let go', () => {
    let s = fresh((d) => (d.hirelings = [hire('porter', 'p')]));
    s = E.advance(s, ctx(), 10);
    const load = s.stashes.find((x) => x.porterId === 'p')!;
    expect(load).toMatchObject({ capacityLb: 150, location: 'With the party' });
    s.hirelings[0].active = false;
    s = E.advance(s, ctx(), 10);
    expect(s.stashes.find((x) => x.porterId === 'p')!.location).not.toBe('With the party');
  });

  it('an interpreter reads a foreign text with no check', () => {
    const s = fresh((d) => (d.hirelings = [hire('interpreter')]));
    const n = E.decipherText(s, ctx(0.01), s.characters[0].id, -5, 'Giant', 'a warning');
    expect(n.log.some((l) => l.text.includes('reads the text') && l.text.includes('a warning'))).toBe(true);
  });

  it('a scribe copies a Book without taking the party’s time', () => {
    const s = fresh((d) => {
      d.characters[0].inventory = [item('Paper', { qty: 50 }), item('Ink', { uses: 500 }), item('Ink Pen')];
      d.hirelings = [hire('scribe', 's')];
    });
    const t0 = E.absNow(s);
    const n = E.copyBook(s, ctx(), s.characters[0].id, 'Herbal', true);
    expect(E.absNow(n)).toBe(t0);
    expect(n.characters[0].inventory.some((i) => i.name === 'Book (copy of Herbal)')).toBe(true);
    expect(n.hirelings[0].busyUntil).toBe(t0 + 500);
  });

  it('a teamster tends the mounts like a groom', () => {
    let s = fresh((d) => (d.hirelings = [hire('teamster')]));
    s = E.addMount(s, ctx(), { name: 'Draft Horse', size: 'Large', speed: 40, gp: 50 }, 'Bess', null);
    s.characters[1].rationsLb = 20;
    s = E.advance(s, ctx(), 15 * 60);
    expect(s.log.some((l) => l.text.includes('feeds and waters the animals'))).toBe(true);
  });

  it('sailors help hold a ship through a storm', () => {
    const storm = (crew: number) =>
      fresh((d) => {
        d.weather = { ...d.weather, wind: 'strong', precip: 'heavy' };
        d.stashes = [{ id: 'v', name: 'Keelboat', kind: 'vehicle', speedMph: 1, location: '', capacityLb: null, items: [], purse: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }, notes: '' }];
        d.hirelings = Array.from({ length: crew }, (_, i) => hire('sailor', `s${i}`));
      });
    const alone = E.travel(storm(0), ctx(0.3), { hours: 1, pace: 'normal', difficult: false, foragerIds: [], vesselId: 'v' });
    expect(alone.log.some((l) => l.text.includes('drives her off course'))).toBe(true);
    const crewed = E.travel(storm(5), ctx(0.3), { hours: 1, pace: 'normal', difficult: false, foragerIds: [], vesselId: 'v' });
    expect(crewed.log.some((l) => l.text.includes('keeps her on course') && l.text.includes('+10 from the hired sailors'))).toBe(true);
  });
});
