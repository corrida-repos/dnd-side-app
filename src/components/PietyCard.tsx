import { useState } from 'react';
import { useGame, dispatch, edit } from '../state/store';
import * as E from '../state/engine';
import { Card, Pill, Select, Text, Rule } from './common';
import { fmtGp } from '../rules/money';
import {
  ATONED_PIETY,
  DEEDS,
  MISSED_TITHE_PIETY,
  NEGLECT_DAYS,
  RANK_GIFT,
  SERVICE_INVOLVEMENT_DAYS_PER_WEEK,
  OFFERING_EVERY_DAYS,
  OFFERING_GP_PER_LEVEL,
  OFFERING_PIETY_CAP,
  PIETY_RANKS,
  SERVICE_PIETY_CAP,
  SERVICE_PIETY_PER_WEEK,
  TIE_LABEL,
  TIE_STAKES,
  divineTie,
  offeringGp,
  pietyRank,
  startingPiety,
  type DeedKind,
  type GiftRank,
} from '../rules/piety';
import type { Character } from '../state/types';

const rankTone = (score: number): 'bad' | 'muted' | 'info' | 'good' => (score < 0 ? 'bad' : score < 3 ? 'muted' : score < 10 ? 'info' : 'good');

/** Piety (table rule): each character's standing with the god they serve. */
export function PietyCard() {
  const s = useGame();
  const pcs = s.characters.filter((c) => c.kind === 'pc');
  const devout = pcs.filter((c) => c.devotion);
  const others = pcs.filter((c) => !c.devotion);
  // Divine classes, subclasses and acolytes come first in the list.
  const suggested = [...others].sort((a, b) => Number(!divineTie(a)) - Number(!divineTie(b)));
  const [who, setWho] = useState('');
  const [deity, setDeity] = useState('');
  const [ideals, setIdeals] = useState('');
  const pick = suggested.find((c) => c.id === who) ?? suggested[0];
  return (
    <Card title="Piety and the gods">
      {devout.length === 0 && <p className="muted small">No one&apos;s standing with a god is tracked yet. Clerics, Paladins, divine patrons and acolytes are listed first below.</p>}
      <ul className="plain">
        {devout.map((c) => (
          <DevotionRow key={c.id} c={c} />
        ))}
      </ul>
      {pick && (
        <div className="form-row">
          <Select
            label="Who"
            value={pick.id}
            onChange={setWho}
            options={suggested.map((c) => {
              const tie = divineTie(c);
              return { value: c.id, label: tie ? `${c.name} (${TIE_LABEL[tie]})` : c.name };
            })}
          />
          <Text label="God" value={deity} onChange={setDeity} placeholder="e.g. Lathander, god of dawn" />
          <Text label="What pleases them" value={ideals} onChange={setIdeals} placeholder="e.g. healing, new beginnings, driving back the undead" wide />
          <button
            disabled={!deity.trim()}
            onClick={() => {
              dispatch((st, cx) => E.setDevotion(st, cx, pick.id, { deity, ideals }));
              setDeity('');
              setIdeals('');
              setWho('');
            }}
          >
            Track piety (starts at {startingPiety(divineTie(pick))})
          </button>
        </div>
      )}
      <Rule>
        Table rule ({s.settings.piety ? 'on' : 'off'}, Settings). The 2024 books leave faith to roleplay; this measures a character&apos;s standing with their god the way the DMG measures renown. Ranks: {PIETY_RANKS.slice(1).map((r) => `${r.label} ${r.min}+`).join(', ')}; below 0, Estranged. Deeds (the DM&apos;s call): {Object.values(DEEDS).map((x) => `${x.label.toLowerCase()} ${x.delta > 0 ? '+' : ''}${x.delta}`).join(', ')}. Religious Service downtime adds +{SERVICE_PIETY_PER_WEEK} a week, up to {SERVICE_PIETY_CAP}. A costly offering ({OFFERING_GP_PER_LEVEL} GP per level, once each {OFFERING_EVERY_DAYS} days) adds +1, up to {OFFERING_PIETY_CAP}. Beyond those, only deeds raise it. A missed tithe costs {MISSED_TITHE_PIETY}, and {NEGLECT_DAYS} days with nothing done for the god costs 1 (never below 0); paying a tithe, an offering, temple service or any deed counts. An Estranged character who atones (a penance or quest the DM sets) returns to {ATONED_PIETY}. Clerics, Paladins and acolytes start at 3, everyone else at 0. Gifts: the first time a character becomes Favored the god grants a Charm with one use, Exalted a Blessing, and Chosen a second Blessing or one guaranteed Divine Intervention; they appear under Supernatural gifts, and an Estranged character may lose them until they atone. Faith renown: tie the devotion to a faction for the god&apos;s church, and good deeds earn the same renown with it (the deed scale is the DMG&apos;s renown awards), sins and grave sins are serious offenses that cost as much renown, lapses cost none, and each week of Religious Service counts as {SERVICE_INVOLVEMENT_DAYS_PER_WEEK} days among its members (DMG group involvement, renown 1+). Boons are guidance for the DM: class features work as the PHB says whatever the score.
      </Rule>
    </Card>
  );
}

function DevotionRow({ c }: { c: Character }) {
  const s = useGame();
  const dv = c.devotion!;
  const rank = pietyRank(dv.piety);
  const next = PIETY_RANKS.find((r) => r.min > dv.piety);
  const tie = divineTie(c);
  const [kind, setKind] = useState<DeedKind>('small');
  const [why, setWhy] = useState('');
  const [open, setOpen] = useState(false);
  const blocked = E.offeringBlocked(s, c);
  const sinceDevotion = s.dayIndex - dv.lastDevotionDay;
  const gifts = s.effects.filter((e) => (dv.giftIds ?? []).includes(e.id));
  const faith = dv.factionId ? s.factions.find((f) => f.id === dv.factionId) : undefined;
  return (
    <li className="facility">
      <div className="armor-row">
        <span>
          <b>{c.name}</b> <span className="muted small">serves {dv.deity}</span>{' '}
          <Pill tone={rankTone(dv.piety)} title={rank.boon}>
            {rank.label} · {dv.piety}
          </Pill>
          {tie && <span className="muted small"> {TIE_LABEL[tie]}</span>}
        </span>
        <span className="btn-row tight">
          <button className="ghost tiny" onClick={() => setOpen(!open)}>
            {open ? 'Less' : 'More'}
          </button>
          <button className="ghost tiny" aria-label={`Stop tracking ${c.name}'s piety`} onClick={() => dispatch((st, cx) => E.removeDevotion(st, cx, c.id))}>
            ✕
          </button>
        </span>
      </div>
      <p className="small">
        <b>Boon:</b> {rank.boon}
        {next && <span className="muted"> Next: {next.label} at {next.min}.</span>}
      </p>
      <p className="small muted">
        <i>What {c.name} notices:</i> {rank.feel}
      </p>
      {dv.piety < 0 && tie && <p className="small warn-text">{TIE_STAKES[tie]}</p>}
      {s.settings.piety && dv.piety > 0 && sinceDevotion >= NEGLECT_DAYS - 14 && (
        <p className="small warn-text">
          {sinceDevotion} days since anything was done for {dv.deity}: at {NEGLECT_DAYS}, piety drifts down by 1.
        </p>
      )}
      {(dv.giftsDue ?? []).map((r) => (
        <GiftOffer key={r} c={c} rank={r} />
      ))}
      {gifts.length > 0 && (
        <p className="small">
          <b>Gifts from {dv.deity}:</b> {gifts.map((e) => e.name).join(', ')}
        </p>
      )}
      <div className="btn-row">
        <Select
          label="The faith (renown)"
          value={faith?.id ?? ''}
          onChange={(v) => dispatch((st, cx) => E.linkFaith(st, cx, c.id, v || null))}
          options={[{ value: '', label: 'Not tracked as a faction' }, ...s.factions.map((f) => ({ value: f.id, label: `${f.name} (renown ${f.renown})` }))]}
        />
        {!faith && (
          <button className="small" onClick={() => dispatch((st, cx) => E.trackFaith(st, cx, c.id, ''))}>
            Track the faith of {dv.deity} as a faction
          </button>
        )}
      </div>
      <div className="btn-row">
        <Select label="Deed" value={kind} onChange={setKind} options={(Object.keys(DEEDS) as DeedKind[]).map((k) => ({ value: k, label: `${DEEDS[k].label} (${DEEDS[k].delta > 0 ? '+' : ''}${DEEDS[k].delta})` }))} />
        <Text label="What happened" value={why} onChange={setWhy} placeholder={DEEDS[kind].examples} wide />
        <button className={DEEDS[kind].delta > 0 ? 'good' : 'bad'} onClick={() => (dispatch((st, cx) => E.pietyDeed(st, cx, c.id, DEEDS[kind].delta, why || DEEDS[kind].label.toLowerCase())), setWhy(''))}>
          Record
        </button>
      </div>
      <div className="btn-row">
        <button className="small" disabled={!!blocked} title={blocked ?? ''} onClick={() => dispatch((st, cx) => E.makeOffering(st, cx, c.id))}>
          Costly offering ({fmtGp(offeringGp(c.level))})
        </button>
        {dv.piety < 0 && (
          <button className="small good" onClick={() => dispatch((st, cx) => E.atone(st, cx, c.id, ''))}>
            Atonement done
          </button>
        )}
      </div>
      {open && (
        <div className="small">
          <Text label="What pleases them" value={dv.ideals} onChange={(v) => edit((d) => void (d.characters.find((x) => x.id === c.id)!.devotion!.ideals = v))} wide />
          <Text label="What angers them" value={dv.anathema} onChange={(v) => edit((d) => void (d.characters.find((x) => x.id === c.id)!.devotion!.anathema = v))} wide />
          <p className="muted">Highest piety reached: {dv.best}.</p>
          {dv.history.length > 0 && (
            <ul className="plain muted">
              {dv.history.slice(0, 10).map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

/** A gift the god offers for a rank reached: the DM names it (2024 DMG Blessings and Charms) and grants it. */
function GiftOffer({ c, rank }: { c: Character; rank: GiftRank }) {
  const s = useGame();
  const g = RANK_GIFT[rank];
  const [type, setType] = useState<'Charm' | 'Blessing'>(g.type);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const listId = `piety-gift-${c.id}-${rank}`;
  return (
    <div className="facility small">
      <p>
        <Pill tone="good">Gift</Pill> {c.devotion!.deity} offers {c.name} {g.text}.
      </p>
      <div className="form-row">
        <Select label="Type" value={type} onChange={setType} options={['Blessing', 'Charm']} />
        <label className="field">
          <span className="field-label">Name</span>
          <input list={listId} value={name} onChange={(e) => setName(e.target.value)} placeholder="from the DMG, or your own" />
          <datalist id={listId}>
            {s.giftLibrary.filter((x) => x.type === type).map((x) => (
              <option key={x.name} value={x.name} />
            ))}
          </datalist>
        </label>
        <Text label="What it does" value={notes} onChange={setNotes} wide />
      </div>
      <div className="btn-row">
        <button className="good" disabled={!name.trim()} onClick={() => dispatch((st, cx) => E.grantPietyGift(st, cx, c.id, rank, name, notes, type))}>
          Grant {type}
        </button>
        {rank === 'chosen' && (
          <button onClick={() => dispatch((st, cx) => E.settlePietyGift(st, cx, c.id, rank, ''))}>A guaranteed Divine Intervention instead</button>
        )}
      </div>
    </div>
  );
}
