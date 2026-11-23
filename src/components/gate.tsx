import { useState, type ReactNode } from 'react';
import { goTo } from './nav';

/**
 * Cards for optional rules that are switched off and hold nothing yet stay out of the way.
 * A tab lists which cards are idle; they are left out, and one line at the bottom says so and can show them anyway.
 */
export function useGate(cards: { name: string; idle: boolean }[]): { show: (name: string) => boolean; note: ReactNode } {
  const [all, setAll] = useState(false);
  const idle = cards.filter((c) => c.idle).map((c) => c.name);
  const show = (name: string) => all || !idle.includes(name);
  const note = idle.length ? (
    <p className="hidden-note muted small">
      {all ? 'Shown although switched off' : 'Hidden while switched off'}: {idle.join(', ')}.{' '}
      <button className="ghost tiny" onClick={() => setAll(!all)}>
        {all ? 'Hide them' : 'Show anyway'}
      </button>{' '}
      <button className="ghost tiny" onClick={() => goTo('settings')}>
        Level of detail
      </button>
    </p>
  ) : null;
  return { show, note };
}
