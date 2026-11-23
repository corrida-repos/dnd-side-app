import { useSyncExternalStore } from 'react';
import { useGame } from '../state/store';
import type { Character } from '../state/types';
import { goTo } from './nav';

/**
 * Which character the Party tabs are looking at. One choice shared by Checklists, Characters, Gear and Spells,
 * so a DM can follow one person from tab to tab instead of scrolling past everyone else each time.
 */
const KEY = 'wayfarers-ledger:focus';
let focus = 'all';
try {
  focus = localStorage.getItem(KEY) || 'all';
} catch {
  /* ignore */
}
const subs = new Set<() => void>();

export function setFocus(id: string): void {
  focus = id;
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* ignore */
  }
  subs.forEach((f) => f());
}

/** Look at one character on a Party tab: e.g. from a name on the Dashboard. */
export function focusOn(id: string, tab = 'party'): void {
  setFocus(id);
  goTo(tab);
}

export function useFocus(): string {
  return useSyncExternalStore(
    (f) => (subs.add(f), () => void subs.delete(f)),
    () => focus,
  );
}

/** The characters a Party tab should show: everyone, or just the one in focus (falling back to everyone if they're gone). */
export function useFocused(filter: (c: Character) => boolean = () => true): Character[] {
  const s = useGame();
  const f = useFocus();
  const list = s.characters.filter(filter);
  const one = list.filter((c) => c.id === f);
  return f === 'all' || !one.length ? list : one;
}

/** Everyone, or one character: shared by every Party tab. */
export function FocusBar({ filter = () => true }: { filter?: (c: Character) => boolean }) {
  const s = useGame();
  const f = useFocus();
  const list = s.characters.filter(filter);
  if (list.length < 2) return null;
  const active = f === 'all' || !list.some((c) => c.id === f) ? 'all' : f;
  return (
    <div className="focus-bar" role="radiogroup" aria-label="Show which character">
      <button role="radio" aria-checked={active === 'all'} className={active === 'all' ? 'active' : ''} onClick={() => setFocus('all')}>
        Everyone
      </button>
      {list.map((c) => (
        <button key={c.id} role="radio" aria-checked={active === c.id} className={active === c.id ? 'active' : ''} onClick={() => setFocus(c.id)}>
          {c.name}
          {c.kind === 'mount' && <small> (mount)</small>}
        </button>
      ))}
      <span className="muted small">Stays picked across Checklists, Characters, Gear and Spells.</span>
    </div>
  );
}
