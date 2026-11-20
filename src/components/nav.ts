/** Moving between tabs from inside a tab, e.g. from a "Ways around this" panel to the full reference. */

const EVENT = 'wayfarers-ledger:goto';
let pendingTopic: string | null = null;

/** Switch to a tab, optionally opening a topic on the Ways Around tab. */
export function goTo(tab: string, topic?: string): void {
  pendingTopic = topic ?? null;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: tab }));
}

/** The topic a "go to" asked for, cleared once read. */
export function takePendingTopic(): string | null {
  const t = pendingTopic;
  pendingTopic = null;
  return t;
}

export function onGoTo(fn: (tab: string) => void): () => void {
  const h = (e: Event) => fn((e as CustomEvent<string>).detail);
  window.addEventListener(EVENT, h);
  return () => window.removeEventListener(EVENT, h);
}
