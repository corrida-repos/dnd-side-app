import { useState } from 'react';
import { useGame, dispatch, getState } from '../state/store';
import * as E from '../state/engine';
import { Card, Num, Pill, Select, Text, Toggle, Rule } from './common';
import { LADDERS, LADDER_PETITION_WAIT_DAYS, LADDER_STRIKES, SOCIAL_TIER_TEXT, TOP, rungTitle, ladderAdvantage, type LadderId } from '../rules/ladders';
import { officeTitle } from '../rules/priesthood';
import { LIFESTYLE_LABEL } from '../rules/money';
import type { Character } from '../state/types';

const tierTone = (rank: number): 'muted' | 'info' | 'good' => (rank < 2 ? 'muted' : rank < 4 ? 'info' : 'good');

/** Paths to power (table rule): each character's rank at court, in the guild and in the faith, and their social standing. */
export function PowerCard() {
  const s = useGame();
  const pcs = s.characters.filter((c) => c.kind === 'pc');
  return (
    <Card title="Paths to power">
      <p className="small muted">Three ways up: noble (the court), clerical (the faith, on the Piety card) and bourgeois (the guild and the town council). Every ladder has five ranks on the same scale, so a Knight, a Senior priest and a Master stand level.</p>
      <ul className="plain">
        {pcs.map((c) => (
          <PowerRow key={c.id} c={c} />
        ))}
      </ul>
      <Rule>
        Table rule ({s.settings.pathsToPower ? 'on' : 'off'}, Settings). Each rank needs renown with the institution and a level on the DMG steps (rank 2: 3 / level 3, rank 3: 10 / 5, rank 4: 25 / 11, rank 5: 50 / 17), plus time in the rank below and the path&apos;s own measure. Court: {LADDERS.court.rungs.slice(1).map((r) => `${r.title}${r.way === 'award' ? ' (awarded only)' : r.dc ? ` (DC ${r.dc})` : ''}`).join(' → ')}; from Knight, one title (a Mark of Prestige) grows with the rank and each rank brings lands, and if the title is taken back they fall to Esquire. Guild: {LADDERS.guild.rungs.slice(1).map((r) => `${r.title}${r.civic ? ` or ${r.civic}` : ''}${r.way === 'award' ? ' (awarded only)' : r.dc ? ` (DC ${r.dc})` : ''}`).join(' → ')}; Journeyman and Master need the guild&apos;s tool, Master a business of their own, Warden or Alderman two and 5,000 GP, Guildmaster or Lord mayor 25,000 GP; masters add +5, +10 or +15 to their Running a Business rolls. Joining makes a character a member (renown 1). A petition gets Advantage when renown already meets the rank above, and a failure waits {LADDER_PETITION_WAIT_DAYS} days. Any rank can be awarded by the DM, requirements or not. Duties each month (days of downtime at court, guild or council) keep the rank; {LADDER_STRIKES} months missed in a row cost a step. Social standing comes from the highest rank on any ladder.
      </Rule>
    </Card>
  );
}

function PowerRow({ c }: { c: Character }) {
  const s = useGame();
  const [open, setOpen] = useState(false);
  const social = E.socialRank(c);
  const court = E.ladderPos(c, 'court');
  const guild = E.ladderPos(c, 'guild');
  const office = c.devotion?.office;
  const summary = [court && rungTitle('court', court.rank), office && officeTitle(office.rank, office.path), guild && rungTitle('guild', guild.rank, guild.civic)].filter(Boolean).join(' · ');
  return (
    <li className="facility">
      <div className="armor-row">
        <span>
          <b>{c.name}</b>{' '}
          <Pill tone={tierTone(social.rank)} title={SOCIAL_TIER_TEXT[social.tier]}>
            {social.tier}
          </Pill>{' '}
          <span className="muted small">{summary || 'No rank on any ladder'}</span>
        </span>
        <button className="ghost tiny" onClick={() => setOpen(!open)}>
          {open ? 'Close' : 'Manage'}
        </button>
      </div>
      <p className="small muted">{SOCIAL_TIER_TEXT[social.tier]}</p>
      {open && (
        <>
          <LadderSection c={c} ladder="court" />
          <p className="small muted">
            Clerical: {office ? officeTitle(office.rank, office.path) : c.devotion ? 'not in the hierarchy' : 'no god chosen'} (managed on the Piety card).
          </p>
          <LadderSection c={c} ladder="guild" />
        </>
      )}
      {!open && s.settings.pathsToPower && [court, guild].some((p) => p && p.strikes > 0) && <p className="small warn-text">Duties are slipping: open Manage.</p>}
    </li>
  );
}

function LadderSection({ c, ladder }: { c: Character; ladder: LadderId }) {
  const s = useGame();
  const L = LADDERS[ladder];
  const p = E.ladderPos(c, ladder);
  const [inst, setInst] = useState('');
  const [newName, setNewName] = useState('');
  const [trade, setTrade] = useState(c.toolProfs?.[0] ?? '');
  const [bonus, setBonus] = useState(E.ladderBonus(c, ladder));
  const [days, setDays] = useState(1);
  const [awardTo, setAwardTo] = useState(String(Math.min(TOP, (p?.rank ?? 0) + 1)));
  const [why, setWhy] = useState('');
  if (!p) {
    const factionId = inst;
    return (
      <div className="facility small">
        <b>{L.label}</b> <span className="muted">({ladder === 'court' ? 'start as a Courtier' : 'start as an Apprentice'})</span>
        <div className="form-row">
          {s.factions.length > 0 && <Select label={ladder === 'court' ? 'Court' : 'Guild'} value={factionId} onChange={setInst} options={[{ value: '', label: 'Choose…' }, ...s.factions.map((f) => ({ value: f.id, label: `${f.name} (renown ${f.renown})` }))]} />}
          <Text label={ladder === 'court' ? 'Or a new court' : 'Or a new guild'} value={newName} onChange={setNewName} placeholder={ladder === 'court' ? 'e.g. Court of Queen Maren' : "e.g. Smiths' Guild of Greyhawk"} />
          <button className="small" disabled={!newName.trim()} onClick={() => {
              const name = newName.trim();
              dispatch((st, cx) => E.trackInstitution(st, cx, name));
              setNewName('');
              const f = getState().factions.find((x) => x.name.trim().toLowerCase() === name.toLowerCase());
              if (f) setInst(f.id);
            }}>
            Track it
          </button>
          {ladder === 'guild' && <Text label="Trade (tool)" value={trade} onChange={setTrade} placeholder="e.g. Smith's Tools" />}
          <button className="small primary" disabled={!factionId} onClick={() => dispatch((st, cx) => E.joinLadder(st, cx, c.id, ladder, factionId, trade))}>
            {ladder === 'court' ? 'Presented at court' : 'Indentured'}
          </button>
        </div>
      </div>
    );
  }
  const here = L.rungs[p.rank];
  const next = L.rungs[p.rank + 1];
  const f = s.factions.find((x) => x.id === p.factionId);
  const blocked = E.ladderBlocked(s, c, ladder);
  const title = (r: number) => rungTitle(ladder, r, p.civic);
  return (
    <div className="facility small">
      <p>
        <b>{L.label}:</b> <Pill tone="good">{title(p.rank)}</Pill> <span className="muted">of {f?.name ?? L.institution}</span>
        {p.trade && <span className="muted"> · {p.trade}</span>}
      </p>
      <p>
        {here.does}
        {here.lifestyle && <span className="muted"> Expected to live {LIFESTYLE_LABEL[here.lifestyle]} or better.</span>}
      </p>
      {here.dutyDays > 0 && (
        <div className="btn-row">
          <span className={p.strikes ? 'warn-text' : 'muted'}>
            Duties: {p.dutyDays}/{here.dutyDays} days this month (reckoning in {Math.max(0, p.lastCheckDay + 30 - s.dayIndex)} days){p.strikes ? `, missed ${p.strikes}/${LADDER_STRIKES}` : ''}.
          </span>
          <Num label="Days" value={days} onChange={(v) => setDays(Math.max(1, Math.round(v)))} min={1} width={2} />
          <button className="small" onClick={() => dispatch((st, cx) => E.ladderDuty(st, cx, c.id, ladder, days))}>
            {ladder === 'court' ? 'Attend court' : p.civic && p.rank >= 4 ? 'Sit in council' : 'Guild business'} (downtime)
          </button>
        </div>
      )}
      {ladder === 'guild' && p.rank >= 3 && (
        <Toggle checked={!!p.civic} onChange={(v) => dispatch((st, cx) => E.setCivic(st, cx, c.id, v))} label="Seek civic office (Alderman, Lord mayor) instead of guild office" />
      )}
      {next && (
        <div className="btn-row">
          <span>
            Next: <b>{title(next.rank)}</b> <span className="muted">({next.way === 'award' ? 'awarded only' : `petition, DC ${next.dc} ${next.check}`})</span>
          </span>
          {next.way !== 'award' && (
            <>
              <Num label="Bonus" value={bonus} onChange={(v) => setBonus(Math.round(v))} width={2} />
              <button className="small primary" disabled={blocked.length > 0} title={blocked.join('; ')} onClick={() => dispatch((st, cx) => E.petitionLadder(st, cx, c.id, ladder, bonus))}>
                Petition{ladderAdvantage(ladder, p.rank + 1, f?.renown ?? 0) ? ' (Advantage)' : ''}
              </button>
            </>
          )}
          {blocked.length > 0 && <span className="muted">Needs {blocked.join('; ')}.</span>}
        </div>
      )}
      <div className="btn-row">
        <Select label="Award or set rank (DM)" value={awardTo} onChange={setAwardTo} options={L.rungs.slice(1).map((r) => ({ value: String(r.rank), label: title(r.rank) }))} />
        <Text label="For what" value={why} onChange={setWhy} placeholder={ladder === 'court' ? 'e.g. knighted on the field at Greyford' : 'e.g. an honorary mastership'} />
        <button className="small good" disabled={Number(awardTo) === p.rank} onClick={() => (dispatch((st, cx) => E.awardLadder(st, cx, c.id, ladder, Number(awardTo), why)), setWhy(''))}>
          {Number(awardTo) < p.rank ? 'Reduce' : 'Award'}
        </button>
        <button className="ghost tiny" onClick={() => dispatch((st, cx) => E.leaveLadder(st, cx, c.id, ladder))}>
          Leave
        </button>
      </div>
    </div>
  );
}
