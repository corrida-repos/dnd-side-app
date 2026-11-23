import { describe, expect, it } from 'vitest';
import { marchWork } from './marchWork';
import type { Project } from '../state/types';

const proj = (p: Partial<Project>) => marchWork({ kind: 'nonmagical', name: '', ...p });

describe('which work can go on while marching (table rule)', () => {
  it('allows small hand work and refuses bench, forge and fire work', () => {
    expect(proj({ name: 'Arrows (20)' }).ok).toBe(true);
    expect(proj({ name: 'My blanket', product: { name: 'Blanket', qty: 1 } }).ok).toBe(true);
    expect(proj({ name: 'Bedroll' }).ok).toBe(false);
    expect(proj({ name: 'Longsword' }).ok).toBe(false);
    expect(proj({ name: 'Something odd' }).ok).toBe(false);
    expect(proj({ kind: 'scroll', name: 'Spell Scroll' })).toMatchObject({ ok: true, concentration: true });
    expect(proj({ kind: 'spellcopy', name: 'Copy Fireball' })).toMatchObject({ ok: true, concentration: true });
    expect(proj({ name: 'Ink' }).ok).toBe(false);
    expect(proj({ kind: 'potion', name: 'Potions' }).ok).toBe(false);
  });

  it('allows practising languages and instruments but not place-bound activities', () => {
    expect(proj({ kind: 'activity', name: 'Training: Elvish', learn: 'Elvish' })).toMatchObject({ ok: true, talk: true });
    expect(proj({ kind: 'activity', name: 'Training: Flute', learn: 'Flute' }).ok).toBe(true);
    expect(proj({ kind: 'activity', name: "Training: Smith's Tools", learn: "Smith's Tools" }).ok).toBe(false);
    expect(proj({ kind: 'activity', name: 'Special training: Dwarvish', learn: 'Dwarvish', learnKind: 'language' }).ok).toBe(true);
    expect(proj({ kind: 'activity', name: 'Carousing' }).ok).toBe(false);
  });
});
