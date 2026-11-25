import { useState } from 'react';
import { formatClock, formatDate } from '../rules/calendar';
import { fmtGp } from '../rules/money';
import * as E from '../state/engine';
import { dispatch, edit, useGame } from '../state/store';
import type { State } from '../state/types';
import { Card, Num, Select, Text, Toggle } from './common';

function campaignTime(s: State, at: number): string {
  return `${formatDate(s.calendar, s.startYear, Math.floor(at / E.MIN_PER_DAY))} · ${formatClock(at % E.MIN_PER_DAY)}`;
}

export function TimeAdvancePreview({ until, downtime }: { until: number; downtime?: ReturnType<typeof E.downtimePreview> }) {
  const s = useGame();
  const deadlines = E.campaignDeadlines(s).filter((item) => item.at <= until);
  const stop = deadlines.find((item) => item.pause);
  const projected = { dayIndex: Math.floor(until / E.MIN_PER_DAY) };
  const turns = s.bastions.map((b) => ({ name: b.name, count: E.turnsDue(projected, b) })).filter((b) => b.count > 0);
  return (
    <div className="small">
      <p>Target date: {campaignTime(s, until)}</p>
      {downtime && (
        <p>
          Estimated lifestyle and hireling costs: {fmtGp(downtime.upkeep + downtime.wages)}.
          {' '}{downtime.finishes.length ? `Could finish: ${downtime.finishes.map((p) => p.name).join(', ')}.` : 'No selected projects finish in this span.'}
        </p>
      )}
      {turns.length > 0 && <p>Bastion turns due by then: {turns.map((b) => `${b.name} (${b.count})`).join(', ')}.</p>}
      {deadlines.length > 0 && <ul>{deadlines.map((item) => <li key={item.id}>{campaignTime(s, item.at)} — {item.warning}</li>)}</ul>}
      {stop && <p><b>Stops for a DM decision on {campaignTime(s, Math.max(stop.at, E.absNow(s)))}.</b></p>}
    </div>
  );
}

export function CampaignDeadlinesCard() {
  const s = useGame();
  const [warning, setWarning] = useState('');
  const [outcome, setOutcome] = useState('');
  const [days, setDays] = useState(4);
  const [hours, setHours] = useState(0);
  const [rivalId, setRivalId] = useState('');
  const [pause, setPause] = useState(true);
  const [deferHours, setDeferHours] = useState(24);
  const now = E.absNow(s);
  const at = now + Math.round(days * E.MIN_PER_DAY + hours * 60);
  const deadlines = E.campaignDeadlines(s);
  const resolved = (s.campaignDeadlines ?? []).filter((item) => item.ruling);
  return (
    <Card title="Campaign deadlines">
      <p className="small muted">Optional table rule (Gritty). Deadlines follow the campaign clock during adventures and downtime.</p>
      {deadlines.length > 0 && (
        <ul className="plain">
          {deadlines.map((item) => (
            <li key={item.id} className="facility">
              <b>{item.warning}</b> · {campaignTime(s, item.at)} {item.at <= now && <b>· Due</b>}
              {item.outcome && <details><summary>DM-only outcome</summary><p>{item.outcome}</p></details>}
              {item.at <= now && (
                <div className="btn-row">
                  <button onClick={() => dispatch((st, cx) => E.resolveCampaignDeadline(st, cx, item.id, 'scene'), 'opening the live scene')}>Play the scene</button>
                  <button onClick={() => dispatch((st, cx) => E.resolveCampaignDeadline(st, cx, item.id, 'offscreen'), 'accepting the offscreen outcome')}>Accept offscreen outcome</button>
                  <Num label="Defer by" suffix="h" value={deferHours} onChange={setDeferHours} min={1} width={3} />
                  <button onClick={() => dispatch((st, cx) => E.resolveCampaignDeadline(st, cx, item.id, 'defer', Math.round(deferHours * 60)), 'deferring the deadline')}>Defer</button>
                </div>
              )}
              {item.at > now && <button className="ghost small" onClick={() => edit((d) => { d.campaignDeadlines = d.campaignDeadlines?.filter((entry) => entry.id !== item.id); })}>Remove deadline</button>}
            </li>
          ))}
        </ul>
      )}
      {resolved.length > 0 && (
        <details>
          <summary>Resolved deadlines (DM)</summary>
          <ul>
            {resolved.map((item) => (
              <li key={item.id}>
                {item.warning} · {item.ruling === 'scene' ? 'Live scene' : 'Offscreen outcome'}
                {item.outcome && <p>{item.outcome}</p>}
              </li>
            ))}
          </ul>
        </details>
      )}
      <form onSubmit={(event) => {
        event.preventDefault();
        dispatch((st, cx) => E.addCampaignDeadline(st, cx, { warning, outcome, at, pause, rivalId }), 'scheduling a campaign deadline');
        setWarning('');
        setOutcome('');
      }}>
        <div className="form-row">
          <Text label="Public warning" value={warning} onChange={setWarning} placeholder="Last ferry leaves town" />
          <Text label="Private DM note" value={outcome} onChange={setOutcome} />
          <Select label="Rival" value={rivalId} onChange={setRivalId} options={[{ value: '', label: 'None' }, ...s.rivals.filter((r) => r.active).map((r) => ({ value: r.id, label: r.name }))]} />
        </div>
        <div className="form-row">
          <Num label="Days from now" value={days} onChange={setDays} min={0} max={366} width={3} />
          <Num label="Additional hours" value={hours} onChange={setHours} min={0} max={23} width={3} />
          <Toggle label="Pause for a DM decision" checked={pause} onChange={setPause} />
          <button className="small" disabled={!warning.trim() || at <= now}>Schedule deadline</button>
        </div>
      </form>
    </Card>
  );
}

export function DowntimeSkipControls({ projectIds }: { projectIds: string[] }) {
  const s = useGame();
  const [days, setDays] = useState(7);
  const saved = s.downtimeSkip;
  const blocked = E.waitingForDeadline(s);
  if (!s.place.settlement && !saved) return null;
  const span = Math.round(days);
  const preview = E.downtimePreview(s, span, saved?.projectIds ?? projectIds, !!saved);
  return (
    <details open={saved ? true : undefined}>
      <summary>{saved ? 'Paused downtime skip' : 'Plan a downtime skip'}</summary>
      {!saved && <Num label="Days in town" value={days} onChange={setDays} min={1} max={366} width={3} />}
      <TimeAdvancePreview until={preview.until} downtime={preview} />
      <div className="btn-row">
        {saved ? (
          <>
            <button disabled={blocked || !s.place.settlement} onClick={() => dispatch(E.resumeDowntimeSkip, 'resuming downtime')}>Resume downtime</button>
            <button className="ghost" onClick={() => edit((d) => { d.downtimeSkip = undefined; })}>Clear saved skip</button>
          </>
        ) : (
          <button disabled={blocked} onClick={() => dispatch((st, cx) => E.startDowntimeSkip(st, cx, span, projectIds), 'advancing downtime')}>Start downtime skip</button>
        )}
      </div>
    </details>
  );
}
