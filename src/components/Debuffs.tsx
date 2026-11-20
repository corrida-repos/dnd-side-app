import type { Character } from '../state/types';
import { exhaustionBreakdown, exhaustionSummary } from '../rules/survival';
import { formatDuration } from '../rules/calendar';
import { Pill } from './common';

/** Every debuff on a character, each labelled with what caused it. */
export function Debuffs({ c, now, empty = true }: { c: Character; now: number; empty?: boolean }) {
  const parts = exhaustionBreakdown(c);
  const items: JSX.Element[] = [];
  if (c.diedAt != null || c.exhaustion >= 6) items.push(<Pill key="dead" tone="bad">{c.exhaustion >= 6 ? 'Dead (Exhaustion 6)' : 'Dead'}</Pill>);
  else if (c.exhaustion > 0)
    items.push(
      <Pill key="exh" tone={c.exhaustion >= 4 ? 'bad' : 'warn'} title={exhaustionSummary(c.exhaustion)}>
        Exhaustion {c.exhaustion}
      </Pill>,
    );
  for (const p of parts) {
    items.push(
      <Pill
        key={`cause-${p.cause}`}
        tone={p.locked ? 'bad' : 'warn'}
        title={`${p.count} Exhaustion level${p.count > 1 ? 's' : ''} from ${p.label}${p.locked ? '. Can’t be removed until the need is met in full.' : ''}`}
      >
        {p.locked ? '🔒 ' : ''}
        {p.label}
        {p.count > 1 ? ` ×${p.count}` : ''}
      </Pill>,
    );
  }
  if (c.sick)
    items.push(
      <Pill key="sick" tone="bad" title="Ate raw food and failed the save: Poisoned (Disadvantage on attack rolls and ability checks) until the next Long Rest">
        Food poisoning · Poisoned until Long Rest
      </Pill>,
    );
  if (c.poisonedUntil != null && c.poisonedUntil > now)
    items.push(
      <Pill key="water" tone="bad" title="Drank unpurified water and failed the save: Poisoned (Disadvantage on attack rolls and ability checks)">
        Waterborne illness · Poisoned {formatDuration(c.poisonedUntil - now)}
      </Pill>,
    );
  if (c.malnourished && !parts.some((p) => p.cause === 'malnutrition'))
    items.push(
      <Pill key="maln" tone="warn" title="Needs a full day's food before Malnutrition Exhaustion can be removed">
        Malnourished
      </Pill>,
    );
  if (c.dehydrated && !parts.some((p) => p.cause === 'dehydration'))
    items.push(
      <Pill key="dehy" tone="warn" title="Needs a full day's water before Dehydration Exhaustion can be removed">
        Dehydrated
      </Pill>,
    );
  if (c.daysWithoutFood > 0)
    items.push(
      <Pill key="starve" tone={c.daysWithoutFood >= 4 ? 'bad' : 'warn'} title="From the 5th day without food, 1 Exhaustion level is gained every day">
        Starving: {c.daysWithoutFood} day{c.daysWithoutFood > 1 ? 's' : ''} without food
      </Pill>,
    );
  if (!items.length) return empty ? <Pill tone="muted">No debuffs</Pill> : null;
  return <span className="debuffs">{items}</span>;
}
