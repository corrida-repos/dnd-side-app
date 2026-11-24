import { useState } from 'react';
import { DISPOSITIONS, parseTacticalResult, type Disposition, type TacticalResult } from '../rules/butler';
import { dispatch, edit, useGame } from '../state/store';
import { absNow, applyTacticalResult, dismissTacticalEncounter, selectTacticalEncounter, tacticalResultProblem } from '../state/engine';
import { formatClock, formatDate } from '../rules/calendar';
import { Card, Select, Toggle } from './common';

function download(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ButlerHandoff() {
  const s = useGame();
  const encounter = s.tacticalEncounter;
  const [text, setText] = useState('');
  const [snapshotId, setSnapshotId] = useState('');
  const [selection, setSelection] = useState<{ id: string; excluded: string[] }>();
  const snapshots = s.encounterHandoffs?.filter((entry) => !s.resolvedTacticalEncounters?.includes(entry.encounterId)) ?? [];
  const snapshot = snapshots.find((entry) => entry.encounterId === snapshotId) ?? snapshots[0];
  const excluded = selection?.id === encounter?.id ? selection?.excluded ?? [] : [];
  const exported = encounter?.participants.filter((p) => !excluded.includes(p.id)) ?? [];
  const [notice, setNotice] = useState('');
  const [disposition, setDisposition] = useState<Disposition>();
  const [result, setResult] = useState<TacticalResult>();
  const currentResult = result?.encounterId === encounter?.id ? result : undefined;
  const problem = currentResult && tacticalResultProblem(s, currentResult);
  const json = encounter ? JSON.stringify({ ...encounter, participants: exported }, null, 2) : '';
  const preview = (input: string) => {
    setNotice('');
    setResult(undefined);
    try {
      const parsed = parseTacticalResult(input);
      const error = tacticalResultProblem(s, parsed);
      if (error) setNotice(error);
      else setResult(parsed);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
    }
  };
  return (
    <Card title="Encounter Butler" className="span-2">
      <Toggle checked={!!s.pauseForButler} onChange={(enabled) => edit((d) => { d.pauseForButler = enabled; })}
        label="Pause travel, rests and time skips for creature encounters" />
      {!encounter ? (snapshot ? <>
        <Select label="Encounter" value={snapshot.encounterId} onChange={setSnapshotId} options={snapshots.map((entry) => ({
          value: entry.encounterId,
          label: `${entry.summary} · ${formatDate(s.calendar, s.startYear, Math.floor(entry.minute / 1440))} ${formatClock(entry.minute % 1440)}`,
        }))} />
        <button onClick={() => {
          setSelection(undefined);
          setNotice('');
          dispatch((d, c) => selectTacticalEncounter(d, c, snapshot.encounterId));
        }}>Review recorded encounter</button>
      </> : <p className="small muted">Roll a creature encounter here to prepare a handoff.</p>) : <>
        <p><strong>{encounter.title}</strong> near {encounter.place}, {encounter.distanceFt} ft away.</p>
        {encounter.attitude && <p className="small">Starting attitude: {encounter.attitude}. Decide whether to approach, parley, withdraw, or take the encounter into rounds.</p>}
        <details>
          <summary>Review participants</summary>
          {encounter.participants.map((p) => <Toggle key={p.id} checked={!excluded.includes(p.id)}
            label={p.name + (p.surprised ? ' (surprised)' : '')}
            onChange={(included) => setSelection({ id: encounter.id, excluded: included
              ? excluded.filter((id) => id !== p.id) : [...excluded, p.id] })} />)}
        </details>
        {!!s.tacticalRemainingMinutes && <p className="small">Paused with {s.tacticalRemainingMinutes} minutes left. Choose how to continue after the encounter.</p>}
        {encounter.at !== absNow(s) && <p className="small">The campaign clock has moved. Record this encounter’s outcome manually.</p>}
        <div className="btn-row">
          <button disabled={!exported.length} onClick={() => download(json, `encounter-${encounter.id}.json`)}>Download encounter</button>
          <button disabled={!exported.length} onClick={async () => {
            try { await navigator.clipboard.writeText(json); setNotice('Encounter copied.'); }
            catch { setNotice('Clipboard access is unavailable. Download the file instead.'); }
          }}>Copy encounter</button>
          <label className="small">Local outcome <select value={disposition ?? ''} onChange={(event) =>
            setDisposition((DISPOSITIONS.find((value) => value === event.target.value)))}>
            <option value="">Choose an outcome</option>
            {DISPOSITIONS.map((value) => <option key={value}>{value}</option>)}
          </select></label>
          <button onClick={() => {
            dispatch((d, c) => dismissTacticalEncounter(d, c, disposition));
            setDisposition(undefined);
            setNotice('Encounter closed locally.');
          }}>{disposition ? 'Record outcome locally' : 'Close locally'}</button>
        </div>
        <label className="small">Butler result file <input type="file" accept=".json,application/json" onChange={async (event) => {
          const file = event.currentTarget.files?.[0];
          if (!file) return;
          if (file.size > 1_000_000) { setNotice('The result file exceeds 1 MB.'); return; }
          try { const content = await file.text(); setText(content); preview(content); }
          catch { setNotice('Could not read the result file.'); }
        }} /></label>
        <textarea aria-label="Butler result JSON" placeholder="Or paste Butler’s result JSON" value={text}
          onChange={(event) => { setText(event.target.value); setResult(undefined); }} />
        <button onClick={() => preview(text)} disabled={!text.trim()}>Review result</button>
        {currentResult && <div>
          <p>{currentResult.elapsedSeconds} seconds elapsed. {currentResult.disposition}</p>
          <ul>{currentResult.participants.map(({ id, vitals }) => {
            const p = encounter.participants.find((member) => member.id === id);
            return <li key={id}>{p?.name}: {p?.vitals?.hp ?? '?'} → {vitals.hp}/{vitals.maxHp} HP, {vitals.tempHp} temporary HP,
              {' '}{vitals.status}. {vitals.conditions.map((condition) => condition.label || condition.key).join(', ')}
              {!p?.vitals && ' Review this participant manually.'}</li>;
          })}</ul>
          {problem ? <p role="alert">{problem}</p> : <button onClick={() => {
            dispatch((d, c) => applyTacticalResult(d, c, currentResult));
            setResult(undefined); setText(''); setNotice('Encounter result applied.');
          }}>Apply result</button>}
        </div>}
      </>}
      {notice && <p role="status">{notice}</p>}
    </Card>
  );
}
