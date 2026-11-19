import { useState } from 'react';
import { useGame, edit } from '../state/store';
import { Card, Select } from './common';
import type { Tone } from '../state/types';

export function LogTab() {
  const s = useGame();
  const [tone, setTone] = useState<'all' | Tone>('all');
  const [q, setQ] = useState('');
  const rows = s.log.filter((l) => (tone === 'all' || l.tone === tone) && (!q || l.text.toLowerCase().includes(q.toLowerCase())));
  return (
    <Card
      title={`Chronicle (${s.log.length})`}
      actions={
        <button className="ghost bad" onClick={() => confirm('Clear the whole log?') && edit((d) => void (d.log = []))}>
          Clear
        </button>
      }
    >
      <div className="form-row">
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
        <label className="field grow">
          <span className="field-label">Search</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>
      <ul className="log full">
        {rows.map((l) => (
          <li key={l.id} className={`log-${l.tone}`}>
            <span className="muted small">{l.stamp}</span> {l.text}
          </li>
        ))}
      </ul>
    </Card>
  );
}
