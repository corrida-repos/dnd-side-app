import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { encounterHandoffJson } from '../rules/encounterHandoff';
import { createDefaultState, newCharacter } from './defaults';
import type { State } from './types';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
const LOW = ctx(0);
const HIGH = ctx(0.999);

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.settings.sleepDeprivation = false;
  s.characters = [newCharacter({ name: 'A', level: 3, needsFood: false, needsWater: false }), newCharacter({ name: 'B', level: 5, needsFood: false, needsWater: false })];
  s.minutes = 10 * 60;
  s.log = [];
  patch(s);
  return s;
}
const encounters = (s: State) => s.log.filter((l) => l.text.startsWith('Random encounter'));

describe('random encounters by location danger', () => {
  it('works out the party and builds a table for the current place', () => {
    const s = fresh((d) => (d.place.terrain = 'swamp'));
    expect(E.encounterParty(s)).toEqual({ level: 4, size: 2 });
    const t = E.encounterTable(s);
    expect(t.terrain).toBe('swamp');
    expect(t.rows[t.rows.length - 1].to).toBe(100);
  });

  it('checks every few hours of travel, by danger', () => {
    const s = fresh((d) => (d.place.danger = 'moderate'));
    const n = E.travel(s, HIGH, { hours: 8, pace: 'normal', difficult: false, foragerIds: [] });
    expect(encounters(n)).toHaveLength(2); // every 4 hours
    expect(encounters(E.travel(s, LOW, { hours: 8, pace: 'normal', difficult: false, foragerIds: [] }))).toHaveLength(0);
    const deadly = E.travel(fresh((d) => (d.place.danger = 'deadly')), HIGH, { hours: 3, pace: 'normal', difficult: false, foragerIds: [] });
    expect(encounters(deadly)).toHaveLength(1); // moving in a Deadly area checks every 2 hours
  });

  it('carries partial time over to the next check', () => {
    let s = fresh((d) => (d.place.danger = 'high'));
    s = E.advance(s, HIGH, 60, 'camp');
    expect(encounters(s)).toHaveLength(0);
    s = E.advance(s, HIGH, 60, 'camp');
    expect(encounters(s)).toHaveLength(1);
  });

  it('skips downtime work and can be turned off', () => {
    const s = fresh((d) => (d.place.danger = 'deadly'));
    expect(encounters(E.advance(s, HIGH, 240, 'work'))).toHaveLength(0);
    const off = fresh((d) => {
      d.place.danger = 'deadly';
      d.settings.encounters = false;
    });
    expect(encounters(E.advance(off, HIGH, 240, 'camp'))).toHaveLength(0);
  });

  it('names who is on watch when something comes in the night', () => {
    const s = fresh((d) => {
      d.place.danger = 'high';
      d.watchPlan = { count: 4, slots: [[d.characters[0].id], [d.characters[1].id], [d.characters[0].id], [d.characters[1].id]] };
    });
    const n = E.longRest(s, HIGH, true);
    const hits = encounters(n);
    expect(hits).toHaveLength(4);
    expect(hits.every((l) => /On watch: (A|B)/.test(l.text))).toBe(true);
    expect(n.restStart).toBeNull();
  });

  it('checks a Moderate exposed rest four times, a sheltered rest twice, and a stranded camp sooner', () => {
    const exposed = fresh((d) => { d.place.danger = 'moderate'; d.place.shelter = 'none'; });
    expect(encounters(E.longRest(exposed, HIGH, true))).toHaveLength(4);
    const sheltered = { ...exposed, place: { ...exposed.place, shelter: 'building' as const } };
    expect(encounters(E.longRest(sheltered, HIGH, true))).toHaveLength(2);
    const stuck = { ...sheltered, encounterClock: 110, place: { ...sheltered.place, encounterStuck: true } };
    expect(encounters(E.advance(stuck, HIGH, 9, 'camp'))).toHaveLength(0);
    expect(encounters(E.advance(stuck, HIGH, 10, 'camp'))).toHaveLength(1);
  });

  it('uses an open cave as exposed and does not make a downed companion easier to discover', () => {
    const s = fresh((d) => {
      d.place.danger = 'moderate';
      d.place.shelter = 'cave';
      d.restStart = E.absNow(d);
      d.watchPlan = { count: 4, slots: [[d.characters[0].id], [], [], []] };
    });
    const d = structuredClone(s);
    Object.assign(d.characters[0], { hp: 0, stable: true, passivePerception: 30 });
    expect(E.encounterConditions(d, 'rest')).toEqual(E.encounterConditions(s, 'rest'));
    expect(E.encounterConditions(d, 'rest').sheltered).toBe(false);
    expect(E.planWatches(d)[0].watchers).toHaveLength(0);
    expect(E.watchLoad(d)).toEqual({});
    expect(E.rollRandomEncounter(d, LOW, 'rest').encounterHandoffs?.[0]?.surprise).toMatchObject({ partySurprised: true });
    d.place.encounterConcealedCave = true;
    d.place.encounterObviousSigns = true;
    expect(E.encounterConditions(d, 'rest')).toMatchObject({ sheltered: true, obviousSigns: true });
  });

  it('uses the danger level for exploration turns', () => {
    let s = fresh((d) => (d.place.danger = 'moderate'));
    s = E.explorationTurn(s, HIGH, '');
    s = E.explorationTurn(s, HIGH, '');
    expect(encounters(s)).toHaveLength(0);
    s = E.explorationTurn(s, HIGH, '');
    expect(encounters(s)).toHaveLength(1);
    expect(s.exploreTurns).toBe(0);
  });

  it('logs manual checks, with the conditions that applied', () => {
    const s = fresh((d) => {
      d.minutes = 23 * 60;
      d.fire.lit = true;
      d.fire.fuelHours = 4;
    });
    const miss = E.checkForEncounter(s, LOW, 'camp');
    expect(miss.log[0].text).toMatch(/Night \+1, Light in the dark \+1/);
    expect(miss.log[0].text).toMatch(/Nothing comes/);
    const hit = E.checkForEncounter(s, HIGH, 'camp');
    expect(encounters(hit)).toHaveLength(1);
  });

  it('describes what the party notices for a creature encounter', () => {
    const n = E.rollRandomEncounter(fresh(), LOW, 'travel');
    const l = encounters(n)[0];
    expect(l.text).toMatch(/CR /);
    expect(l.text).toMatch(/feet away/);
    expect(l.sense).toBeTruthy();
  });

  it('leaves out excluded creatures and adds imported ones', () => {
    const s = fresh((d) => {
      d.settings.srdEncounters = false;
      d.settings.encounterBooks = [];
      d.bestiary = [{ name: 'Mire Lurker', size: 'Large', type: 'monstrosity', cr: '2', env: ['forest'], align: 'U' }];
    });
    const t = E.encounterTable(s);
    expect(t.rows.find((r) => r.creature)?.creature?.name).toBe('Mire Lurker');
    const out = E.encounterTable({ ...s, encounterExclude: ['Mire Lurker'] });
    expect(out.rows.every((r) => r.kind === 'peaceful')).toBe(true);
  });
});

describe('book switches', () => {
  it('leaves switched-off books out of the tables', () => {
    const s = fresh((d) => {
      d.settings.srdEncounters = false;
      d.settings.encounterBooks = [];
      d.bestiary = [{ name: 'Mi-Go', size: 'Medium', type: 'plant', cr: '1', env: ['forest'], align: 'E', source: 'RHW' }];
    });
    expect(E.encounterTable(s).rows.some((r) => r.creature?.name === 'Mi-Go')).toBe(true);
    expect(E.encounterTable({ ...s, encounterSourcesOff: ['RHW'] }).rows.some((r) => r.creature)).toBe(false);
  });
});

describe('built-in books', () => {
  it('adds the core books by default, and the campaign books on request', () => {
    const s = fresh((d) => (d.place.terrain = 'underdark'));
    expect(s.settings.encounterBooks).toEqual(['XMM', 'MPMM', 'FRAiF']);
    const names = new Set(E.encounterPool(s).map((c) => c.name));
    expect(names.has('Drow House Captain')).toBe(true); // Monsters of the Multiverse
    expect(names.has('Mi-Go')).toBe(false); // Ravenloft, off by default
    const horror = new Set(E.encounterPool({ ...s, settings: { ...s.settings, encounterBooks: [...s.settings.encounterBooks, 'RHW'] } }).map((c) => c.name));
    expect(horror.has('Mi-Go')).toBe(true);
    const srdOnly = E.encounterPool({ ...s, settings: { ...s.settings, encounterBooks: [] } });
    expect(srdOnly.every((c) => c.source === 'SRD 5.2')).toBe(true);
  });

  it('fills high-level tables', () => {
    const s = fresh((d) => {
      d.place.terrain = 'grassland';
      d.place.danger = 'moderate';
      d.characters = d.characters.map((c) => ({ ...c, level: 15 }));
    });
    const fights = E.encounterTable(s).rows.filter((r) => r.creature);
    expect(fights.length).toBeGreaterThanOrEqual(6);
  });
});

it('uses underwater distance instead of doubling it for a spyglass', () => {
  const state = fresh((s) => {
    s.place.underwaterVisibility = 'murky';
    s.characters[0].inventory.push({ id: 'spyglass', name: 'Spyglass', qty: 1, weight: 1, source: 'manual' });
  });
  const encounter = encounters(E.rollRandomEncounter(state, LOW, 'travel'))[0];
  expect(encounter.text).toContain('10 feet away (Underwater Encounter Distance)');
  expect(encounter.text).toContain('Personality:');
  expect(encounter.text).not.toContain('Spyglass');
  expect(E.rollAudibleDistance(state, HIGH, 'loud').log[0].text).toContain('600 feet');
});

it('preserves rolled night encounter participants, distance and the alarm ruling in an export', () => {
  const s = fresh((d) => {
    d.minutes = 23 * 60;
    d.place.alarm = true;
    d.restStart = E.absNow(d) - 60;
    d.watchPlan = { count: 4, slots: [[d.characters[0].id], [], [], []] };
    d.characters[0].ddbId = 42;
    d.characters[0].tempHp = 3;
    d.characters[1].mountBoarding = { place: 'Greyport', provider: 'Stable', providerId: 'stable', nights: 0, owedGp: 0 };
  });
  const n = E.rollRandomEncounter(s, LOW, 'rest');
  const handoff = n.encounterHandoffs?.[0];
  expect(handoff).toMatchObject({
    format: 'life-manager.encounter', version: 1, minute: E.absNow(s), rulesEdition: '2024',
    environment: { activity: 'rest', distanceFt: expect.any(Number) },
    surprise: { alarm: 'bell', partySurprised: false, partyNoticed: true },
  });
  expect(handoff!.participants.find((p) => p.id === s.characters[0].id)).toMatchObject({ ddbId: 42, tempHp: 3, watching: true });
  expect(handoff!.participants.some((p) => p.id === s.characters[1].id)).toBe(false);
  const creatures = handoff!.participants.filter((p) => p.side === 'encounter');
  expect(creatures.length).toBeGreaterThan(0);
  expect(new Set(creatures.map((p) => p.id)).size).toBe(creatures.length);
  const saved = JSON.parse(JSON.stringify(n)) as State;
  expect(saved.encounterHandoffs?.[0]).toMatchObject({ campaignId: n.campaignId, encounterId: handoff!.encounterId });
  const selected = new Set([creatures[0].id]);
  expect(JSON.parse(encounterHandoffJson(handoff!, selected)).participants).toHaveLength(1);
});

it('does not create a tactical export for a peaceful discovery', () => {
  const s = fresh((d) => {
    d.settings.srdEncounters = false;
    d.settings.encounterBooks = [];
  });
  expect(E.rollRandomEncounter(s, HIGH, 'travel').encounterHandoffs).toBeUndefined();
});

describe('Encounter Butler handoff', () => {
  it('pauses a long rest, applies the matching result, and rejects a second application', async () => {
    const { parseTacticalEncounter, parseTacticalResult } = await import('../rules/butler');
    const s = fresh((d) => {
      d.pauseForButler = true;
      d.place.danger = 'deadly';
    });
    let rolls = 0;
    const paused = E.longRest(s, { rng: () => rolls++ % 2 === 0 ? 0.999 : 0.1 }, true);
    const encounter = parseTacticalEncounter(JSON.stringify(paused.tacticalEncounter));
    expect(encounter.activity).toBe('rest');
    expect(encounter.at).toBe(E.absNow(paused));
    expect(paused.tacticalRemainingMinutes).toBe(480 - (E.absNow(paused) - E.absNow(s)));
    expect(paused.tacticalRemainingMinutes).toBeGreaterThan(0);
    expect(paused.lastLongRestEnd).toBe(s.lastLongRestEnd);
    const member = encounter.participants.find((p) => p.side === 'party')!;
    const result = parseTacticalResult(JSON.stringify({
      schema: 'life-manager/result@1', id: 'test-result', encounterId: encounter.id, elapsedSeconds: 66, disposition: 'Creatures fled',
      participants: [{ id: member.id, vitals: { ...member.vitals, hp: 0, status: 'stable', conditions: [] } }],
    }));
    const after = E.applyTacticalResult(paused, HIGH, result);
    expect(after.tacticalEncounter).toBeUndefined();
    expect(E.absNow(after)).toBe(encounter.at + 1);
    expect(after.tacticalSeconds).toBe(6);
    expect(after.log.some((entry) => entry.text.includes('Creatures fled'))).toBe(true);
    expect(after.characters.find((c) => c.id === member.id)).toMatchObject({ hp: 0, stable: true });
    expect(E.tacticalResultProblem(after, result)).toMatch(/already applied/);
    expect(E.applyTacticalResult(after, HIGH, result)).toEqual(after);
  });
});


it('rolls opening Fight or Flight once and retains it when reopening the encounter', () => {
  const pending = E.rollRandomEncounter(fresh(), LOW, 'camp');
  const encounter = pending.tacticalEncounter!;
  const leader = encounter.participants.find((p) => p.side === 'encounter')!;
  const choice = { kind: 'save', leaderId: leader.id, modifier: 2, dc: 12 } as const;
  const decided = E.decideFightOrFlight(pending, LOW, encounter.id, choice);
  const decision = { kind: 'save', leader: leader.name, roll: 1, modifier: 2, dc: 12 };
  expect(decided.tacticalEncounter?.fightOrFlight).toEqual(decision);
  expect(decided.log[0].text).toContain('vs. DC 12. They flee or try to parley.');
  expect(E.decideFightOrFlight(decided, HIGH, encounter.id, choice)).toEqual(decided);
  const reopened = E.selectTacticalEncounter(E.dismissTacticalEncounter(decided, LOW), LOW, encounter.id);
  expect(reopened.tacticalEncounter?.fightOrFlight).toEqual(decision);
  expect(reopened.tacticalEncounter?.attitude).toEqual(encounter.attitude);
  const closed = E.dismissTacticalEncounter(reopened, LOW, 'Parleyed');
  expect(closed.tacticalEncounter).toBeUndefined();
  expect(closed.resolvedTacticalEncounters).toContain(encounter.id);
});
