import { useRef, useState } from 'react';
import { dispatch, useGame } from '../state/store';
import * as E from '../state/engine';
import { ddbJsonUrl, parseDdbCharacter, type DdbImport } from '../rules/ddb';
import { fmtPurse } from '../rules/coins';
import { Card, Text, Toggle, Rule } from './common';

export function DdbImportCard() {
  const s = useGame();
  const [link, setLink] = useState('');
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<DdbImport | null>(null);
  const [error, setError] = useState('');
  const [parts, setParts] = useState<E.DdbParts>({ stats: true, inventory: true, spells: true, resources: true, conditions: false });
  const fileRef = useRef<HTMLInputElement>(null);
  const url = ddbJsonUrl(link);
  const synced = s.characters.filter((c) => c.ddbId);

  const read = (raw: string) => {
    setError('');
    try {
      setPreview(parseDdbCharacter(JSON.parse(raw)));
    } catch (e) {
      setPreview(null);
      setError((e as Error).message.startsWith('This') ? (e as Error).message : `Couldn't read that: ${(e as Error).message}`);
    }
  };

  return (
    <Card title="Import from D&D Beyond">
      <ol className="small steps">
        <li>On D&amp;D Beyond, set the character&apos;s privacy to <b>Public</b> (Character Settings → Privacy).</li>
        <li>
          Paste the character sheet link or ID here, then open the data link it gives you:
          <div className="btn-row tight">
            <Text value={link} onChange={setLink} placeholder="https://www.dndbeyond.com/characters/12345678" />
            {url && (
              <a className="button-link" href={url} target="_blank" rel="noreferrer">
                Open character data
              </a>
            )}
          </div>
        </li>
        <li>Select everything on that page (Ctrl+A or Cmd+A), copy it, and paste it below, or save the page and upload the file.</li>
      </ol>
      <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} onBlur={() => text.trim() && read(text)} placeholder='{"success":true,"data":{"id":12345678,"name":"…"}}' />
      <div className="btn-row tight">
        <button className="small" disabled={!text.trim()} onClick={() => read(text)}>
          Read pasted data
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json,text/plain"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) read(await f.text());
            if (fileRef.current) fileRef.current.value = '';
          }}
        />
      </div>
      {error && <p className="small bad-text">{error}</p>}
      {preview && (
        <div className="calc small">
          <b>{preview.name}</b>: {preview.className} {preview.level}, {preview.size}, {preview.hp}/{preview.maxHp} HP · {preview.inventory.length} inventory lines, {preview.items.length} magic items ·{' '}
          {fmtPurse(preview.purse)} · {preview.spells.length} spells · {preview.resources.length} limited uses and slots
          {preview.warnings.map((w) => (
            <div key={w} className="warn-text">
              {w}
            </div>
          ))}
          <div className="chips">
            <Toggle checked={parts.stats} onChange={(v) => setParts({ ...parts, stats: v })} label="Stats, HP and senses" />
            <Toggle checked={parts.inventory} onChange={(v) => setParts({ ...parts, inventory: v })} label="Inventory, containers, coins and magic items" />
            <Toggle checked={parts.spells} onChange={(v) => setParts({ ...parts, spells: v })} label="Spells" />
            <Toggle checked={parts.resources} onChange={(v) => setParts({ ...parts, resources: v })} label="Spell slots and limited uses" />
            <Toggle checked={parts.conditions} onChange={(v) => setParts({ ...parts, conditions: v })} label="Exhaustion and death saves" />
          </div>
          <button
            className="primary"
            onClick={() => {
              dispatch((st, cx) => E.importDdb(st, cx, preview, parts));
              setPreview(null);
              setText('');
            }}
          >
            {s.characters.some((c) => (preview.ddbId && c.ddbId === preview.ddbId) || c.name.toLowerCase() === preview.name.toLowerCase()) ? `Sync ${preview.name}` : `Add ${preview.name}`}
          </button>
        </div>
      )}
      {synced.length > 0 && (
        <p className="small muted">
          Synced: {synced.map((c) => `${c.name} (${c.ddbSyncedAt ?? 'earlier'})`).join(', ')}. Import again any time to update them; food, water, item knowledge and history stay as they are.
        </p>
      )}
      <Rule>
        D&amp;D Beyond doesn&apos;t let other websites read character sheets directly, so the data is copied by hand. It stays in this browser. Items added by hand in the tracker are kept when you sync, and items from D&amp;D
        Beyond are replaced with the latest version.
      </Rule>
    </Card>
  );
}
