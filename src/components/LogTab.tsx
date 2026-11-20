import { useState } from 'react';
import { useGame, edit } from '../state/store';
import { Card, Select, Toggle } from './common';
import type { Tone } from '../state/types';

export function LogTab() {
  const s = useGame();
  const [view, setView] = useState<'chronicle' | 'status'>('chronicle');
  const [tone, setTone] = useState<'all' | Tone>('all');
  const [who, setWho] = useState('all');
  const [q, setQ] = useState('');
  const [players, setPlayers] = useState(false);
  const name = (id: string) => s.characters.find((c) => c.id === id)?.name ?? 'Someone';
  const match = (text: string) => !q || text.toLowerCase().includes(q.toLowerCase());

  return (
    <Card
      title={view === 'chronicle' ? `Chronicle (${s.log.length})` : `Status history (${s.statusLog.length})`}
      actions={
        <button
          className="ghost bad"
          onClick={() => confirm(view === 'chronicle' ? 'Clear the whole Chronicle?' : 'Clear the whole status history?') && edit((d) => void (view === 'chronicle' ? (d.log = []) : (d.statusLog = [])))}
        >
          Clear
        </button>
      }
    >
      <div className="form-row">
        <Select
          label="View"
          value={view}
          onChange={setView}
          options={[
            { value: 'chronicle', label: 'Everything that happened' },
            { value: 'status', label: 'Status changes by character' },
          ]}
        />
        <Select label="Character" value={who} onChange={setWho} options={[{ value: 'all', label: 'Everyone' }, ...s.characters.map((c) => ({ value: c.id, label: c.name }))]} />
        {view === 'chronicle' && (
          <Select
            label="Show"
            value={tone}
            onChange={setTone}
            options={[
              { value: 'all', label: 'Everything' },
              { value: 'bad', label: 'Exhaustion and danger' },
              { value: 'warn', label: 'Warnings' },
              { value: 'good', label: 'Good news' },
              { value: 'info', label: 'Info' },
            ]}
          />
        )}
        <label className="field grow">
          <span className="field-label">Search</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <Toggle checked={players} onChange={setPlayers} label="Player view (what they feel, no numbers)" />
      </div>

      {view === 'chronicle' ? (
        <ul className="log full">
          {s.log
            .filter((l) => (tone === 'all' || l.tone === tone) && (who === 'all' || l.charIds?.includes(who)) && (!players || l.sense) && match(`${l.text} ${l.sense ?? ''}`))
            .map((l) => (
              <li key={l.id} className={`log-${l.tone}`}>
                <span className="muted small">{l.stamp}</span>{' '}
                {players ? (
                  <span className="sense-only">
                    {l.charIds?.length ? <b>{l.charIds.map(name).join(', ')}: </b> : null}
                    {l.sense}
                  </span>
                ) : (
                  <>
                    {l.text}
                    {l.sense && <span className="sense">“{l.sense}”</span>}
                  </>
                )}
              </li>
            ))}
        </ul>
      ) : (
        <ul className="log full">
          {s.statusLog
            .filter((e) => (who === 'all' || e.charId === who) && match(`${e.text} ${e.sense}`))
            .map((e) => (
              <li key={e.id} className={`log-${e.tone}`}>
                <span className="muted small">{e.stamp}</span> <b>{name(e.charId)}</b>
                {players ? <span className="sense-only"> {e.sense}</span> : <> · {e.text}<span className="sense">“{e.sense}”</span></>}
              </li>
            ))}
          {!s.statusLog.length && <li className="muted">No status changes yet.</li>}
        </ul>
      )}
    </Card>
  );
}
