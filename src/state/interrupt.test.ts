import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { State } from './types';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.settings.sleepDeprivation = false;
  s.settings.coldNights = false;
  s.characters = [
    newCharacter({ name: 'Watcher', passivePerception: 14, needsFood: false, needsWater: false, exhaustion: 1, exhaustionCauses: ['other'] }),
    newCharacter({ name: 'Light sleeper', passivePerception: 18, needsFood: false, needsWater: false, exhaustion: 1, exhaustionCauses: ['other'] }),
    newCharacter({ name: 'Heavy sleeper', passivePerception: 9, needsFood: false, needsWater: false, exhaustion: 1, exhaustionCauses: ['other'], resources: [{ id: 'r', name: 'Action Surge', max: 1, current: 0, recharge: 'short' }] }),
  ];
  s.watchPlan = { count: 4, slots: [[s.characters[0].id], [], [], []] };
  s.minutes = 22 * 60;
  s.log = [];
  patch(s);
  return s;
}
const ex = (s: State) => s.characters.map((c) => c.exhaustion);

describe('interrupted rests', () => {
  it('gives Short Rest benefits after at least an hour, none before', () => {
    const s = fresh();
    const late = E.interruptedRest(s, ctx(), { kind: 'long', after: 90, reason: 'combat', noise: 'loud', dc: 0, resume: false });
    expect(ex(late)).toEqual([1, 1, 1]);
    expect(late.characters[2].resources[0].current).toBe(1);
    expect(late.lastLongRestEnd).toBeNull();
    const early = E.interruptedRest(s, ctx(), { kind: 'long', after: 30, reason: 'combat', noise: 'loud', dc: 0, resume: false });
    expect(early.characters[2].resources[0].current).toBe(0);
  });

  it('can resume for one extra hour and still count as a Long Rest', () => {
    const s = fresh();
    const n = E.interruptedRest(s, ctx(), { kind: 'long', after: 180, reason: 'damage', noise: 'loud', dc: 0, resume: true });
    expect(ex(n)).toEqual([0, 0, 0]);
    expect(E.absNow(n) - E.absNow(s)).toBe(9 * 60);
  });

  it('lets a disturbance wake light sleepers without breaking the rest', () => {
    const s = fresh();
    const n = E.interruptedRest(s, ctx(), { kind: 'long', after: 60, reason: 'disturbance', noise: 'quiet', dc: 12, resume: false });
    expect(ex(n)).toEqual([0, 0, 0]);
    const kinds = n.statusLog.map((e) => `${n.characters.find((c) => c.id === e.charId)!.name}:${e.kind}`);
    expect(kinds).toContain('Light sleeper:wokenByNoise');
    expect(kinds).toContain('Heavy sleeper:shakenAwake');
    expect(kinds.some((k) => k === 'Watcher:wokenByNoise' || k === 'Watcher:shakenAwake')).toBe(false); // already awake on watch
  });

  it('gives nothing for an interrupted Short Rest, and a Short Rest needs 1 HP', () => {
    const s = fresh((d) => (d.minutes = 12 * 60));
    expect(E.interruptedRest(s, ctx(), { kind: 'short', after: 40, reason: 'combat', noise: 'loud', dc: 0, resume: false }).characters[2].resources[0].current).toBe(0);
    s.characters[2].hp = 0;
    expect(E.shortRest(s, ctx()).characters[2].resources[0].current).toBe(0);
  });
});

describe('hirelings at work', () => {
  it('lets a hired guide navigate and a groom tend the mounts', () => {
    const s = fresh((d) => {
      d.minutes = 8 * 60;
      (d.place.terrain = 'forest'), (d.place.onRoute = false);
      d.hirelings = [
        { id: 'g', name: 'Tam', role: 'guide', bonus: 20, passivePerception: 12, skilled: true, wageGp: 2, payer: 'party', active: true },
        { id: 'o', name: 'Wil', role: 'groom', bonus: 4, passivePerception: 10, skilled: true, wageGp: 2, payer: 'party', active: true },
      ];
      d.place.waterSource = true;
      d.characters.push(newCharacter({ name: 'Horse', kind: 'mount', size: 'Large', rationsLb: 10, tasks: [] }));
    });
    const trip = E.travel(s, ctx(0), { hours: 1, pace: 'normal', difficult: false, foragerIds: [], navigatorId: 'h:g' });
    expect(trip.travel.lost).toBe(false); // 1 + 20 beats DC 15
    const night = E.advance({ ...s, minutes: 23 * 60 }, ctx(), 60);
    const horse = night.characters.find((c) => c.name === 'Horse')!;
    expect(horse.exhaustion).toBe(0);
    expect(horse.rationsLb).toBe(6);
  });

  it('charges messengers by the mile and lets hirelings stand watch', () => {
    const s = fresh((d) => {
      d.hirelings = [
        { id: 'm', name: 'Kit', role: 'messenger', bonus: 0, passivePerception: 10, skilled: false, wageGp: 0, payer: 'party', active: true },
        { id: 'w', name: 'Brannoc', role: 'guard', bonus: 4, passivePerception: 15, skilled: true, wageGp: 2, payer: 'party', active: true },
      ];
      d.characters.forEach((c) => (c.gp = 10));
      d.watchPlan = { count: 4, slots: [['h:w'], ['h:w'], [], []] };
    });
    const sent = E.sendMessage(s, ctx(), 'm', 30, 'party');
    expect(sent.characters.map((c) => c.gp)).toEqual([9.8, 9.8, 9.8]);
    expect(E.planWatches(s)[0].watchers[0]).toMatchObject({ passive: 10 }); // in the dark, hearing only (−5)
  });
});
