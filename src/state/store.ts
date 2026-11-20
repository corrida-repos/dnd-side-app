import { useSyncExternalStore } from 'react';
import type { State } from './types';
import { createDefaultState, newCharacter, SAVE_VERSION } from './defaults';
import { ensureWeather, type Ctx } from './engine';

const KEY = 'wayfarers-ledger:v1';
export const ctx: Ctx = { rng: Math.random };

function migrate(raw: unknown): State | null {
  if (!raw || typeof raw !== 'object') return null;
  const parsed = raw as Partial<State>;
  if (!Array.isArray(parsed.characters) || !parsed.calendar) return null;
  const base = createDefaultState(ctx.rng);
  const s: State = {
    ...base,
    ...parsed,
    version: SAVE_VERSION,
    settings: { ...base.settings, ...parsed.settings },
    travel: { ...base.travel, ...parsed.travel },
    fire: { ...base.fire, ...parsed.fire },
    stores: { ...base.stores, ...parsed.stores, foodRawLb: parsed.stores?.foodRawLb ?? (parsed.stores as { foodUnsafeLb?: number } | undefined)?.foodUnsafeLb ?? 0 },
    place: { ...base.place, ...parsed.place },
    bastions: parsed.bastions ?? [],
    watchOrder: parsed.watchOrder ?? [],
    watchPlan:
      parsed.watchPlan ??
      (() => {
        const order = parsed.watchOrder ?? [];
        return { count: 4, slots: [0, 1, 2, 3].map((i) => (order.length ? [order[i % order.length]] : [])) };
      })(),
    effects: parsed.effects ?? [],
    hirelings: parsed.hirelings ?? [],
    rituals: parsed.rituals ?? [],
    factions: parsed.factions ?? [],
    holidays: parsed.holidays ?? [],
    materials: parsed.materials ?? [],
    bestiary: parsed.bestiary ?? [],
    statusLog: parsed.statusLog ?? [],
    trackingStart: parsed.trackingStart ?? (parsed.dayIndex ?? base.dayIndex) * 1440 + (parsed.minutes ?? 0),
  } as State;
  // Characters saved by older versions pick up any newly added fields.
  s.characters = s.characters.map((c) => ({ ...newCharacter(), ...c }));
  ensureWeather(s, ctx);
  return s;
}

function load(): State | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? migrate(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

let state: State = load() ?? createDefaultState(ctx.rng);
const listeners = new Set<() => void>();

function persist(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage may be unavailable (private mode); the app still works for this session */
  }
}

export const getState = (): State => state;

export function dispatch(fn: (s: State, c: Ctx) => State): void {
  state = fn(state, ctx);
  persist();
  listeners.forEach((l) => l());
}

/** Convenience for simple field edits: mutate a draft copy. */
export function edit(fn: (draft: State) => void): void {
  dispatch((s) => {
    const d = structuredClone(s);
    fn(d);
    return d;
  });
}

export function importState(raw: unknown): boolean {
  const s = migrate(raw);
  if (!s) return false;
  dispatch(() => s);
  return true;
}

export function resetState(): void {
  dispatch(() => createDefaultState(ctx.rng));
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useGame(): State {
  return useSyncExternalStore(subscribe, getState);
}
