import { useSyncExternalStore } from 'react';
import type { State } from './types';
import { createDefaultState, newCharacter, SAVE_VERSION } from './defaults';
import { coinsFor } from '../rules/coins';
import { ensureWeather, type Ctx } from './engine';
import { TERRAIN_FOR_CLIMATE } from '../rules/terrain';

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
    place: (() => {
      // Older saves stored foraging abundance and a navigation setting; the terrain table replaces both.
      const old = (parsed.place ?? {}) as Partial<State['place']> & { forage?: string; navigation?: string; terrain?: string };
      const known = ['arctic', 'coastal', 'desert', 'forest', 'grassland', 'hill', 'mountain', 'swamp', 'underdark', 'urban', 'waterborne'];
      const terrain = known.includes(old.terrain ?? '') ? (old.terrain as State['place']['terrain']) : TERRAIN_FOR_CLIMATE[(old.climate ?? base.place.climate) as keyof typeof TERRAIN_FOR_CLIMATE];
      return { ...base.place, ...old, terrain, onRoute: old.onRoute ?? (old.navigation ? old.navigation === 'road' : base.place.onRoute), goodRoad: old.goodRoad ?? false, terrainNote: known.includes(old.terrain ?? '') ? old.terrainNote : old.terrain };
    })(),
    bastions: (parsed.bastions ?? []).map((b) => ({ ...b, maintain: b.maintain ?? b.facilities.filter((f) => f.kind === 'special').every((f) => f.order === 'Maintain') })),
    watchOrder: parsed.watchOrder ?? [],
    watchPlan:
      parsed.watchPlan ??
      (() => {
        const order = parsed.watchOrder ?? [];
        return { count: 4, slots: [0, 1, 2, 3].map((i) => (order.length ? [order[i % order.length]] : [])) };
      })(),
    effects: parsed.effects ?? [],
    hirelings: (parsed.hirelings ?? []).map((h) => ({ ...{ role: 'other' as const, bonus: 0, passivePerception: 10 }, ...(h as Partial<State['hirelings'][number]>) }) as State['hirelings'][number]),
    rituals: parsed.rituals ?? [],
    factions: parsed.factions ?? [],
    holidays: parsed.holidays ?? [],
    materials: parsed.materials ?? [],
    bestiary: parsed.bestiary ?? [],
    statusLog: parsed.statusLog ?? [],
    stashes: parsed.stashes ?? [],
    trackingStart: parsed.trackingStart ?? (parsed.dayIndex ?? base.dayIndex) * 1440 + (parsed.minutes ?? 0),
  } as State;
  // Characters saved by older versions pick up any newly added fields.
  s.characters = s.characters.map((c) => {
    const merged = { ...newCharacter(), ...c };
    // Older saves only had a gold total: turn it into coins.
    if (!c.purse) merged.purse = coinsFor(Math.max(0, c.gp ?? 0));
    return merged;
  });
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
