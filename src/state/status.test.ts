import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { State } from './types';
import { SENSES } from '../rules/senses';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.settings.sleepDeprivation = false;
  s.characters = [newCharacter({ name: 'A' })];
  s.minutes = 23 * 60;
  s.log = [];
  patch(s);
  return s;
}

describe('sensory status log', () => {
  it('records status changes with what the character feels', () => {
    const s = fresh();
    const n = E.advance(s, ctx(), 60); // midnight: no water, no food
    const dehydration = n.statusLog.find((e) => e.kind === 'dehydration');
    expect(dehydration).toBeTruthy();
    expect(SENSES.dehydration.lines).toContain(dehydration!.sense);
    expect(n.log.find((l) => l.status && l.charIds?.includes(s.characters[0].id))?.sense).toBeTruthy();
  });

  it('keeps status history even after the Chronicle is cleared, and describes lights going out', () => {
    let s = fresh((d) => (d.minutes = 10 * 60));
    const id = s.characters[0].id;
    s = E.adjustTrack(s, ctx(), id, 'stress', 2, 'ambush');
    s = { ...s, log: [] };
    expect(s.statusLog[0]).toMatchObject({ kind: 'stressUp', charId: id });
    const torch = E.addEffect(s, ctx(), { preset: { name: 'Torch', kind: 'light', minutes: 60 }, minutes: 60, targetIds: [id], casterId: null });
    const out = E.advance(torch, ctx(), 60);
    expect(out.statusLog.some((e) => e.kind === 'lightOut' && e.charId === id)).toBe(true);
  });
});

import { senseLine } from '../rules/senses';
import { senseText, groupStatus } from '../components/senseView';

describe('status wording', () => {
  it('reads "The party / this character feels …", grouping and pluralizing', () => {
    expect(senseLine(['Rook'], false, 'feels parched')).toBe('Rook feels parched.');
    expect(senseLine(['Rook', 'Pip'], false, 'feels parched')).toBe('Rook and Pip feel parched.');
    expect(senseLine(['A', 'B', 'C'], false, 'notices the fire die')).toBe('A, B and C notice the fire die.');
    expect(senseLine([], true, 'feels parched')).toBe('The party feels parched.');
  });

  it('only uses "feels" for changes the characters would physically notice', () => {
    expect(SENSES.lightOut.how).toBe('notices');
    expect(SENSES.sleepsThrough.how).toBe('unaware');
    for (const def of Object.values(SENSES)) {
      for (const line of def.lines) expect(line.startsWith('feels')).toBe(def.how === 'feels');
    }
  });

  it('describes the whole party at once when everyone is affected together', () => {
    const s = createDefaultState(() => 0);
    s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
    s.settings.sleepDeprivation = false;
    s.minutes = 23 * 60;
    const n = E.advance(s, ctx(), 60);
    const grouped = groupStatus(n.statusLog.filter((e) => e.kind === 'dehydration'));
    expect(grouped).toHaveLength(1);
    expect(senseText(n, grouped[0].charIds, grouped[0].sense)).toMatch(/^The party feels /);
  });
});
