import { describe, expect, it } from 'vitest';
import { createDefaultState, newCharacter } from '../state/defaults';
import { jobBoard } from './partyJobs';

const party = () => {
  const s = createDefaultState(() => 0);
  s.place = { ...s.place, settlement: false, onRoute: false, terrain: 'forest' };
  s.settings.navigation = true;
  s.settings.foodAndWater = true;
  const a = newCharacter({ name: 'Ranger', survival: 7, passivePerception: 15, darkvision: 60 });
  const b = newCharacter({ name: 'Bard', survival: 1, passivePerception: 11 });
  const c = newCharacter({ name: 'Fighter', survival: 2, passivePerception: 12, dying: true, hp: 0 });
  s.characters = [a, b, c];
  s.watchPlan = { count: 4, slots: [[a.id], [], [], []] };
  return { s, a, b, c };
};

describe('party jobs', () => {
  it('shows who is free, who is busy and who cannot help', () => {
    const { s, a, b, c } = party();
    s.travel.navigatorId = a.id;
    const board = jobBoard(s);
    const hand = (id: string) => board.hands.find((h) => h.id === id)!;
    expect(hand(a.id).duties).toEqual(expect.arrayContaining(['Navigating', '1 watch tonight']));
    expect(hand(b.id).duties).toEqual([]);
    expect(hand(c.id).unable).toBe('dying');
  });

  it('marks one-person and shared jobs and ranks free hands first', () => {
    const { s, a, b, c } = party();
    s.travel.navigatorId = a.id;
    const board = jobBoard(s);
    const nav = board.jobs.find((j) => j.id === 'navigate')!;
    expect(nav.status).toBe('covered');
    expect(nav.shared).toBe(false);
    expect(nav.picks[0].id).toBe(b.id);
    expect(nav.picks.some((p) => p.id === c.id)).toBe(false);
    const watch = board.jobs.find((j) => j.id === 'watch')!;
    expect(watch.shared).toBe(true);
    expect(watch.status).toBe('open');
    expect(watch.progress).toBe('1 of 4 watches covered');
    expect(board.jobs.find((j) => j.id === 'forage')!.shared).toBe(true);
  });

  it('leaves the navigator open off the road and lists downtime projects in town', () => {
    const { s, a, b } = party();
    expect(jobBoard(s).jobs.find((j) => j.id === 'navigate')!.status).toBe('open');
    s.place.settlement = true;
    s.townMode = 'downtime';
    s.projects = [{ id: 'p', name: 'Longsword', kind: 'nonmagical', charIds: [a.id], daysRequired: 10, daysDone: 2, costGp: 7, notes: '', done: false }];
    const board = jobBoard(s);
    expect(board.groups).toEqual(['town']);
    const proj = board.jobs.find((j) => j.id === 'proj-p')!;
    expect(proj.holders.map((h) => h.id)).toEqual([a.id]);
    expect(proj.picks.map((p) => p.id)).toEqual([b.id]);
    expect(board.jobs.find((j) => j.id === 'idle')!.picks.map((p) => p.id)).toEqual([b.id]);
    expect(board.jobs.some((j) => j.group === 'camp')).toBe(false);
  });
});
