import type { Character } from '../state/types';
import { exhaustionBreakdown, exhaustionSummary } from '../rules/survival';
import { formatDuration } from '../rules/calendar';
import { Pill } from './common';
import { LOAD_LABEL } from '../rules/encumbrance';
import type { Load } from '../state/engine';

/** Every debuff on a character, each labelled with what caused it. */
export function Debuffs({ c, now, empty = true, load }: { c: Character; now: number; empty?: boolean; load?: Load }) {
  const parts = exhaustionBreakdown(c);
  const items: JSX.Element[] = [];
  if (c.diedAt != null || c.exhaustion >= 6) items.push(<Pill key="dead" tone="bad">{c.exhaustion >= 6 ? 'Dead (Exhaustion 6)' : 'Dead'}</Pill>);
  else if (c.exhaustion > 0)
    items.push(
      <Pill key="exh" tone={c.exhaustion >= 4 ? 'bad' : 'warn'} title={exhaustionSummary(c.exhaustion)}>
        Exhaustion {c.exhaustion}
      </Pill>,
    );
  if (c.diedAt == null && c.dying)
    items.push(
      <Pill key="dying" tone="bad" title="At 0 HP and making death saves">
        Unconscious · dying ({c.deathSuccesses}✓ {c.deathFailures}✗)
      </Pill>,
    );
  if (c.diedAt == null && c.stable)
    items.push(
      <Pill key="stable" tone="warn" title="Stable at 0 HP: regains 1 HP after 1d4 hours">
        Unconscious · stable{c.wakesAt != null ? `, wakes in ${formatDuration(Math.max(0, c.wakesAt - now))}` : ''}
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
  if (load && load.level !== 'light')
    items.push(
      <Pill key="load" tone={load.level === 'encumbered' ? 'warn' : 'bad'} title={`${load.total} of ${load.capacity} lb carried`}>
        {LOAD_LABEL[load.level].split(' (')[0]}
      </Pill>,
    );
  if (c.stress > 0)
    items.push(
      <Pill key="stress" tone={c.stress >= 5 ? 'bad' : 'warn'} title="Stress points">
        Stress {c.stress}
      </Pill>,
    );
  if (c.fear > 0)
    items.push(
      <Pill key="fear" tone={c.fear >= 5 ? 'bad' : 'warn'} title="Fear points">
        Fear {c.fear}
      </Pill>,
    );
  if (!items.length) return empty ? <Pill tone="muted">No debuffs</Pill> : null;
  return <span className="debuffs">{items}</span>;
}
