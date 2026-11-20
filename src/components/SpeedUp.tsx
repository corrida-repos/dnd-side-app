import { useState } from 'react';
import { useGame, dispatch, edit } from '../state/store';
import * as E from '../state/engine';
import { BUILD_SPELLS, CREW_COST_SHARE, CREW_SPEED, HELPER_SPEED, MAX_EXTRA_CREWS } from '../rules/business';
import { Num, Select, Toggle } from './common';

/** Ways to shorten any construction job: extra crews, party members on site, and building spells (table rules). */
export function SpeedUp({ target }: { target: E.BuildRef }) {
  const s = useGame();
  const job = E.buildJob(s, target);
  const [crews, setCrews] = useState(job?.crews ?? 0);
  const [spell, setSpell] = useState(BUILD_SPELLS[0].name);
  const [caster, setCaster] = useState('');
  if (!job) return null;
  const left = 1 - job.doneDays / job.totalDays;
  const added = Math.max(0, crews - job.crews);
  const crewCost = Math.round(job.costGp * CREW_COST_SHARE * left * added);
  const people = s.characters.filter((c) => c.kind !== 'mount' && E.alive(c));
  const helpers = job.helpers;
  const setHelpers = (h: { charId: string; skilled: boolean }[]) => edit((d) => E.buildJob(d, target)?.setHelpers(h));
  const sp = BUILD_SPELLS.find((x) => x.name === spell)!;
  const casters = people.filter((c) => c.spells.some((x) => x.name.toLowerCase() === sp.name.toLowerCase()));
  const casterId = casters.find((c) => c.id === caster)?.id ?? casters[0]?.id ?? '';
  return (
    <details className="add-facility">
      <summary>
        Speed up construction (table rules) · pace ×{Math.round(E.jobPace(s, job) * 100) / 100} · about {E.jobDaysLeft(s, target)} day(s) left
      </summary>
      <div className="btn-row tight">
        <Num label="Extra crews" value={crews} onChange={(v) => setCrews(Math.max(0, Math.min(MAX_EXTRA_CREWS, Math.round(v))))} min={0} max={MAX_EXTRA_CREWS} width={2} />
        <button className="small" disabled={crews === job.crews} onClick={() => dispatch((st, cx) => E.hireBuildCrews(st, cx, target, crews))}>
          {added > 0 ? `Hire (${crewCost.toLocaleString()} GP)` : 'Set crews'}
        </button>
      </div>
      <p className="small muted">
        Each extra crew adds {CREW_SPEED * 100}% to the pace and costs {CREW_COST_SHARE * 100}% of the construction price for the work still left. At most {MAX_EXTRA_CREWS}.
      </p>
      <div className="small">
        <b>Party members working on site</b>
        {job.awayPenalty && <span className="muted"> (they only help while the owner oversees)</span>}:
        {people.map((c) => {
          const h = helpers.find((x) => x.charId === c.id);
          return (
            <div key={c.id} className="btn-row tight">
              <Toggle checked={!!h} onChange={(v) => setHelpers(v ? [...helpers, { charId: c.id, skilled: false }] : helpers.filter((x) => x.charId !== c.id))} label={c.name} />
              {h && <Toggle checked={h.skilled} onChange={(v) => setHelpers(helpers.map((x) => (x.charId === c.id ? { ...x, skilled: v } : x)))} label="Carpenter's or mason's tools" />}
            </div>
          );
        })}
        <span className="muted">
          Each adds {HELPER_SPEED.untrained * 100}% to the pace, or {HELPER_SPEED.skilled * 100}% with carpenter&apos;s or mason&apos;s tools. Their days go to the building, not other downtime.
        </span>
      </div>
      <div className="btn-row tight">
        <Select label="Spell" value={spell} onChange={setSpell} options={BUILD_SPELLS.map((x) => ({ value: x.name, label: `${x.name} (level ${x.level}, −${x.days} d)` }))} />
        <Select label="Caster" value={casterId} onChange={setCaster} options={casters.length ? casters.map((c) => ({ value: c.id, label: c.name })) : [{ value: '', label: `Nobody knows ${sp.name}` }]} />
        <button className="small" disabled={!casterId} onClick={() => dispatch((st, cx) => E.castBuildSpell(st, cx, target, casterId, spell))}>
          Cast on site
        </button>
      </div>
      <p className="small muted">
        {sp.note} Uses a level {sp.level}+ slot and saves about {sp.days} day(s) of work.
      </p>
    </details>
  );
}
