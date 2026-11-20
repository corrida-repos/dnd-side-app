import type { LogEntry, State, StatusEntry } from '../state/types';
import { senseLine } from '../rules/senses';

/** "Rook feels …", "Rook and Pip feel …", or "The party feels …" when it covers every living adventurer. */
export function senseText(s: State, charIds: string[], predicate: string): string {
  const pcs = s.characters.filter((c) => c.kind !== 'mount' && c.diedAt == null);
  const whole = charIds.length > 1 && pcs.length > 1 && pcs.every((c) => charIds.includes(c.id));
  const names = charIds.map((id) => s.characters.find((c) => c.id === id)?.name ?? 'Someone');
  return senseLine(names, whole, predicate);
}

/** Merges Chronicle entries that describe the same change at the same moment, even if other entries sit between them. */
export function groupLog(entries: LogEntry[]): LogEntry[] {
  const out: LogEntry[] = [];
  const seen = new Map<string, number>();
  for (const e of entries) {
    const key = e.sense ? `${e.stamp}|${e.sense}` : '';
    const at = key ? seen.get(key) : undefined;
    if (at != null) {
      const prev = out[at];
      out[at] = { ...prev, charIds: [...(prev.charIds ?? []), ...(e.charIds ?? [])], text: `${prev.text} ${e.text}` };
    } else {
      if (key) seen.set(key, out.length);
      out.push(e);
    }
  }
  return out;
}

/** The same grouping for the status history. */
export function groupStatus(entries: StatusEntry[]): (StatusEntry & { charIds: string[] })[] {
  const out: (StatusEntry & { charIds: string[] })[] = [];
  const seen = new Map<string, number>();
  for (const e of entries) {
    const key = `${e.stamp}|${e.kind}|${e.sense}`;
    const at = seen.get(key);
    if (at != null) out[at].charIds.push(e.charId);
    else {
      seen.set(key, out.length);
      out.push({ ...e, charIds: [e.charId] });
    }
  }
  return out;
}
