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
    // Saves made before weatherDamage defaulted off keep the value they had.
    settings: { ...base.settings, weatherDamage: true, ...parsed.settings },
    travel: { ...base.travel, ...parsed.travel },
    fire: { ...base.fire, ...parsed.fire },
    stores: { ...base.stores, ...parsed.stores, foodRawLb: parsed.stores?.foodRawLb ?? (parsed.stores as { foodUnsafeLb?: number } | undefined)?.foodUnsafeLb ?? 0 },
    place: (() => {
      // Older saves stored foraging abundance and a navigation setting; the terrain table replaces both.
      const old = (parsed.place ?? {}) as Partial<State['place']> & { forage?: string; navigation?: string; terrain?: string };
      const known = ['arctic', 'coastal', 'desert', 'forest', 'grassland', 'hill', 'mountain', 'swamp', 'underdark', 'urban', 'waterborne'];
      const terrain = known.includes(old.terrain ?? '') ? (old.terrain as State['place']['terrain']) : TERRAIN_FOR_CLIMATE[(old.climate ?? base.place.climate) as keyof typeof TERRAIN_FOR_CLIMATE];
      return { ...base.place, ...old, terrain, onRoute: old.onRoute ?? (old.navigation ? old.navigation === 'road' : base.place.onRoute), goodRoad: old.goodRoad ?? false, danger: old.danger ?? 'low', terrainNote: known.includes(old.terrain ?? '') ? old.terrainNote : old.terrain };
    })(),
    bastions: (parsed.bastions ?? []).map((b) => ({ ...b, maintain: b.maintain ?? b.facilities.filter((f) => f.kind === 'special').every((f) => f.order === 'Maintain'), distanceMiles: b.distanceMiles ?? 0, ordersArrived: b.ordersArrived ?? false, reportMethod: b.reportMethod ?? 'courier' })),
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
    journey: parsed.journey ?? [],
    itemLibrary: parsed.itemLibrary ?? [],
    spellClasses: parsed.spellClasses ?? {},
    giftLibrary: parsed.giftLibrary ?? [],
    recipeNames: parsed.recipeNames ?? [],
    dispatches: parsed.dispatches ?? [],
    businesses: parsed.businesses ?? [],
    marks: parsed.marks ?? [],
    rivals: parsed.rivals ?? [],
    debts: parsed.debts ?? [],
    encounterClock: parsed.encounterClock ?? 0,
    exploreTurns: parsed.exploreTurns ?? 0,
    encounterExclude: parsed.encounterExclude ?? [],
    encounterSourcesOff: parsed.encounterSourcesOff ?? [],
    restStart: null,
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

/** Earlier states for Undo: actions (time, rolls, purchases) are recorded; typing in fields is not. */
const history: { state: State; label: string }[] = [];
const HISTORY_MAX = 30;
let version = 0;

function commit(next: State, undoable: boolean, name?: string): void {
  if (next === state) return;
  if (undoable) {
    const label = name ?? (next.log[0] && next.log[0].id !== state.log[0]?.id ? next.log[0].text : 'the last change');
    history.push({ state, label });
    if (history.length > HISTORY_MAX) history.shift();
  }
  state = next;
  version += 1;
  persist();
  listeners.forEach((l) => l());
}

/** Runs an action; `label` names it for Undo (otherwise the newest log line does). */
export function dispatch(fn: (s: State, c: Ctx) => State, label?: string): void {
  commit(fn(state, ctx), true, label);
}

/** Convenience for simple field edits: mutate a draft copy. */
export function edit(fn: (draft: State) => void): void {
  const d = structuredClone(state);
  fn(d);
  commit(d, false);
}

/** What Undo would take back, if anything. */
export const undoLabel = (): string | null => history[history.length - 1]?.label ?? null;

export function undo(): void {
  const prev = history.pop();
  if (!prev) return;
  state = prev.state;
  version += 1;
  persist();
  listeners.forEach((l) => l());
}

/** Re-renders on every change, including Undo (for components that show undoLabel). */
export function useVersion(): number {
  return useSyncExternalStore(subscribe, () => version);
}

export function importState(raw: unknown): boolean {
  const s = migrate(raw);
  if (!s) return false;
  commit(s, true);
  return true;
}

export function resetState(): void {
  commit(createDefaultState(ctx.rng), true);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useGame(): State {
  return useSyncExternalStore(subscribe, getState);
}
