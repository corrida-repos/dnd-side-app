import { useState } from 'react';
import { useGame, edit } from '../state/store';
import { Card, Pill } from './common';
import { goTo } from './nav';
import { JOB_GROUP_LABEL, jobBoard, type PartyJob } from './partyJobs';
import type { State } from '../state/types';

const STATUS_PILL: Record<PartyJob['status'], { tone: 'bad' | 'good' | 'muted'; label: string }> = {
  open: { tone: 'bad', label: 'Needs someone' },
  covered: { tone: 'good', label: 'Covered' },
  optional: { tone: 'muted', label: 'If hands are free' },
};

/** Jobs the board can hand out directly; the rest open the tab where they're done. */
function assign(job: PartyJob, id: string): ((d: State) => void) | null {
  if (job.id === 'navigate') return (d) => void (d.travel.navigatorId = id);
  if (job.id === 'forage') return (d) => void (d.travel.foragerIds = [...(d.travel.foragerIds ?? []).filter((x) => x !== id), id]);
  if (job.id === 'watch')
    return (d) => {
      const n = d.watchPlan.count;
      while (d.watchPlan.slots.length < n) d.watchPlan.slots.push([]);
      const i = d.watchPlan.slots.slice(0, n).findIndex((sl) => !sl.some((x) => d.characters.some((c) => c.id === x)));
      if (i >= 0) d.watchPlan.slots[i] = [...d.watchPlan.slots[i], id];
    };
  return null;
}

function release(job: PartyJob, id: string): ((d: State) => void) | null {
  if (job.id === 'navigate') return (d) => void (d.travel.navigatorId = null);
  if (job.id === 'forage') return (d) => void (d.travel.foragerIds = (d.travel.foragerIds ?? []).filter((x) => x !== id));
  return null;
}

/** Who is doing what, and which jobs the party can still split up between them. */
export function PartyJobsCard() {
  const s = useGame();
  const [showOptional, setShowOptional] = useState(true);
  const board = jobBoard(s);
  const jobs = board.jobs.filter((j) => showOptional || j.status !== 'optional');
  const open = board.jobs.filter((j) => j.status === 'open').length;
  return (
    <Card
      title={
        <>
          Party jobs {open > 0 ? <Pill tone="warn">{open} need someone</Pill> : <Pill tone="good">All covered</Pill>}
        </>
      }
      className="span-2"
      actions={
        <button className="ghost small" onClick={() => setShowOptional(!showOptional)}>
          {showOptional ? 'Only what matters' : 'Show optional jobs'}
        </button>
      }
    >
      <p className="small muted">Now: {board.groups.map((g) => JOB_GROUP_LABEL[g]).join(', then ')}.</p>
      <ul className="plain jobs-hands">
        {board.hands.map((h) => (
          <li key={h.id}>
            <b>{h.name}</b>{' '}
            {h.unable ? <Pill tone="bad">Can’t help: {h.unable}</Pill> : h.duties.length ? <span className="small">{h.duties.join(' · ')}</span> : <Pill tone="good">Free</Pill>}
          </li>
        ))}
      </ul>
      {board.groups.map((g) => {
        const list = jobs.filter((j) => j.group === g);
        if (!list.length) return null;
        return (
          <div key={g}>
            <h3>{JOB_GROUP_LABEL[g]}</h3>
            <ul className="plain attention-list">
              {list.map((j) => (
                <JobRow key={j.id} job={j} />
              ))}
            </ul>
          </div>
        );
      })}
      {jobs.length === 0 && <p className="muted small">No shared jobs right now.</p>}
    </Card>
  );
}

function JobRow({ job }: { job: PartyJob }) {
  const pill = STATUS_PILL[job.status];
  const tone = job.status === 'open' ? 'warn' : 'info';
  return (
    <li className={`attention-item ${tone} job-row`}>
      <div>
        <div>
          <b>{job.title}</b> <Pill tone={pill.tone}>{pill.label}</Pill> {job.shared ? <Pill tone="info" title="Several people can share this job">Can split</Pill> : <Pill tone="muted" title="Only one person does this">One person</Pill>}{' '}
          <span className="small muted">({job.source})</span>
        </div>
        {job.progress && <div className="small">{job.progress}</div>}
        <div className="small muted">{job.what}</div>
        {job.holders.length > 0 && (
          <div className="small">
            On it:{' '}
            {job.holders.map((h, i) => {
              const off = release(job, h.id);
              return (
                <span key={h.id}>
                  {i > 0 && ', '}
                  {h.name}
                  {off && (
                    <button className="ghost tiny" onClick={() => edit(off)} title={`Take ${h.name} off this job`}>
                      ×
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        )}
        {job.blocked && <div className="small warn-text">{job.blocked}</div>}
        {job.picks.length > 0 && (
          <div className="small job-picks">
            {job.holders.length ? (job.shared ? 'Could join: ' : 'Could take over: ') : 'Best fit: '}
            {job.picks.map((p) => {
              const on = assign(job, p.id);
              return (
                <span key={p.id} className="job-pick">
                  {on ? (
                    <button className="ghost tiny" onClick={() => edit(on)} title={`Give this job to ${p.name}`}>
                      {p.name}
                    </button>
                  ) : (
                    <b>{p.name}</b>
                  )}{' '}
                  <span className="muted">
                    {p.note}
                    {p.busy && ', already busy'}
                  </span>
                </span>
              );
            })}
          </div>
        )}
      </div>
      <button className="ghost small" onClick={() => goTo(job.tab)}>
        Open
      </button>
    </li>
  );
}
