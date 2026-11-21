import { useState } from 'react';
import { useGame } from '../state/store';
import { Card, Pill, Select, Toggle, Rule } from './common';
import { playerItems, type PlayerItem } from './playerChecklist';
import { goTo } from './nav';
import type { Character } from '../state/types';

const players = (cs: Character[]) => cs.filter((c) => c.kind !== 'mount');

/** A checklist per player: what they suffer and need to fix, and the routine upkeep they should do. */
export function PlayerTodosTab() {
  const s = useGame();
  const [who, setWho] = useState('all');
  const [hideSecrets, setHideSecrets] = useState(false);
  const [copied, setCopied] = useState('');
  const list = players(s.characters).filter((c) => who === 'all' || c.id === who);
  const copy = (c: Character) => {
    const items = playerItems(s, c).filter((i) => !i.dmOnly);
    const text = `${c.name}\n${items.map((i) => `- ${i.text}${i.fix ? ` (${i.fix})` : ''}`).join('\n') || '- Nothing to do.'}`;
    navigator.clipboard?.writeText(text).then(
      () => setCopied(c.id),
      () => setCopied(''),
    );
  };
  return (
    <div className="grid">
      <Card title="Player checklists" className="span-all">
        <div className="btn-row tight">
          <Select value={who} onChange={setWho} options={[{ value: 'all', label: 'Everyone' }, ...players(s.characters).map((c) => ({ value: c.id, label: c.name }))]} />
          <Toggle checked={hideSecrets} onChange={setHideSecrets} label="Player view (hide DM-only items)" />
        </div>
        <Rule>Conditions a character is suffering, each with what fixes it, and routine upkeep outside the adventure itself: food and water, gear, spells, attunement, ammunition, debts and downtime. Copy a list to send it to that player; DM-only items are never copied.</Rule>
      </Card>
      {list.map((c) => {
        const items = playerItems(s, c).filter((i) => !hideSecrets || !i.dmOnly);
        const statuses = items.filter((i) => i.kind === 'status');
        const upkeep = items.filter((i) => i.kind === 'upkeep');
        return (
          <Card
            key={c.id}
            title={
              <>
                {c.name} <CountPill items={items} />
              </>
            }
            actions={
              <button className="ghost small" onClick={() => copy(c)}>
                {copied === c.id ? 'Copied' : 'Copy for player'}
              </button>
            }
          >
            {items.length === 0 && <p className="muted small">All good: nothing to fix or look after.</p>}
            {statuses.length > 0 && <ItemList title="Needs action" items={statuses} />}
            {upkeep.length > 0 && <ItemList title="Upkeep" items={upkeep} />}
          </Card>
        );
      })}
    </div>
  );
}

function CountPill({ items }: { items: PlayerItem[] }) {
  const bad = items.filter((i) => i.tone === 'bad').length;
  const warn = items.filter((i) => i.tone === 'warn').length;
  if (!bad && !warn) return items.length ? <Pill tone="muted">{items.length}</Pill> : <Pill tone="good">OK</Pill>;
  return <Pill tone={bad ? 'bad' : 'warn'}>{bad + warn} to act on</Pill>;
}

function ItemList({ title, items }: { title: string; items: PlayerItem[] }) {
  return (
    <>
      <h3>{title}</h3>
      <ul className="plain attention-list">
        {items.map((i) => (
          <li key={i.id} className={`attention-item ${i.tone}`}>
            <span>
              {i.dmOnly && <Pill tone="muted">DM only</Pill>} {i.text}
              {i.fix && <span className="small muted"> · {i.fix}</span>}
            </span>
            <button className="ghost small" onClick={() => goTo(i.tab)}>
              Open
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Dashboard summary: one line per player with their most pressing items. */
export function PlayerSummaryCard() {
  const s = useGame();
  const rows = players(s.characters).map((c) => ({ c, items: playerItems(s, c) }));
  return (
    <Card
      title="Players"
      actions={
        <button className="ghost small" onClick={() => goTo('todos')}>
          All checklists
        </button>
      }
    >
      <ul className="plain">
        {rows.map(({ c, items }) => {
          const top = items.filter((i) => i.tone !== 'info').slice(0, 2);
          return (
            <li key={c.id} className="armor-row">
              <span>
                <b>{c.name}</b> <CountPill items={items} />
                {top.length > 0 && <span className="small muted"> {top.map((i) => i.text).join(' · ')}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
