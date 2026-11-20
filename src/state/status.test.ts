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
    expect(SENSES.dehydration).toContain(dehydration!.sense);
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
