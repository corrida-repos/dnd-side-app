import { useEffect, useState, type RefObject } from 'react';

/** The plain title of a card, without the pills (counts, states) that sit in its heading. */
function titleOf(h: HTMLElement): string {
  const copy = h.cloneNode(true) as HTMLElement;
  copy.querySelectorAll('.pill, .badge').forEach((x) => x.remove());
  return (copy.textContent ?? '').replace(/\s+/g, ' ').trim();
}

const headings = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLElement>(':scope .card > .card-head > h2'));

/**
 * Chips naming every card on the current tab, for tabs long enough to need scrolling.
 * Reads the cards straight off the page, so it follows whatever a tab shows without each tab listing its own.
 */
export function JumpBar({ root, tab, min = 6 }: { root: RefObject<HTMLElement>; tab: string; min?: number }) {
  const [titles, setTitles] = useState<string[]>([]);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const read = () => {
      const next = headings(el).map(titleOf);
      setTitles((prev) => (prev.length === next.length && prev.every((t, i) => t === next[i]) ? prev : next));
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { childList: true, subtree: true, characterData: true });
    return () => obs.disconnect();
  }, [root, tab]);
  if (titles.length < min) return null;
  const jump = (i: number) => {
    const card = headings(root.current!)[i]?.closest('.card') as HTMLElement | null;
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    card.classList.add('jumped');
    window.setTimeout(() => card.classList.remove('jumped'), 1400);
  };
  return (
    <nav className="jump-bar" aria-label="Jump to a card on this tab">
      <span className="muted small">Jump to:</span>
      {titles.map((t, i) => (
        <button key={`${i}-${t}`} onClick={() => jump(i)}>
          {t}
        </button>
      ))}
    </nav>
  );
}
