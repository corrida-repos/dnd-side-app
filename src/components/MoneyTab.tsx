import { useState } from 'react';
import { useGame, dispatch, edit } from '../state/store';
import * as E from '../state/engine';
import { uid } from '../state/defaults';
import { fmtGp, HIRELING_WAGE, LIFESTYLE_GP, LIFESTYLE_LABEL, MOUNT_PRESETS, FEED_GP_PER_DAY, type Lifestyle } from '../rules/money';
import { foodNeedLb, fmtLb, WATER_GAL_PER_DAY } from '../rules/survival';
import { Card, Num, Pill, Select, Text, Toggle, Rule } from './common';

export function MoneyTab() {
  return (
    <div className="grid">
      <PurseCard />
      <HirelingsCard />
      <MountsCard />
    </div>
  );
}

function PurseCard() {
  const s = useGame();
  const pcs = s.characters.filter((c) => c.kind !== 'mount');
  const [amt, setAmt] = useState(10);
  const [reason, setReason] = useState('');
  const daily = s.place.settlement ? pcs.reduce((a, c) => a + LIFESTYLE_GP[c.lifestyle], 0) : 0;
  const wages = s.hirelings.filter((h) => h.active).reduce((a, h) => a + h.wageGp, 0);
  return (
    <Card title="Gold and lifestyle" className="span-2">
      <div className="form-row">
        <Toggle checked={s.place.settlement} onChange={(v) => edit((d) => void (d.place.settlement = v))} label={`In a town or city (${s.place.name})`} />
        {!s.settings.chargeCosts && <Pill tone="warn">Charging costs is off in Settings</Pill>}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Who</th>
              <th>Gold</th>
              <th>Lifestyle</th>
              <th>Per day</th>
            </tr>
          </thead>
          <tbody>
            {pcs.map((c) => (
              <tr key={c.id}>
                <td>
                  <b>{c.name}</b>
                </td>
                <td className={c.gp < 0 ? 'bad-text' : ''}>
                  <Num value={c.gp} onChange={(v) => edit((d) => void (d.characters.find((x) => x.id === c.id)!.gp = v))} step={1} suffix="GP" width={6} />
                </td>
                <td>
                  <Select
                    value={c.lifestyle}
                    onChange={(v: Lifestyle) => edit((d) => void (d.characters.find((x) => x.id === c.id)!.lifestyle = v))}
                    options={(Object.keys(LIFESTYLE_LABEL) as Lifestyle[]).map((k) => ({ value: k, label: `${LIFESTYLE_LABEL[k]} (${fmtGp(LIFESTYLE_GP[k])})` }))}
                  />
                </td>
                <td className="small">{s.place.settlement ? fmtGp(LIFESTYLE_GP[c.lifestyle]) : <span className="muted">only in town</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small">
        Daily costs right now: {fmtGp(daily)} lifestyle + {fmtGp(wages)} wages, charged at midnight.
      </p>
      <div className="btn-row">
        <Num value={amt} onChange={setAmt} min={0} suffix="GP" width={6} />
        <Text value={reason} onChange={setReason} placeholder="What for (optional)" />
        {pcs.map((c) => (
          <span key={c.id} className="inline-group">
            <span className="small">{c.name}:</span>
            <button className="small good" onClick={() => dispatch((st, cx) => E.adjustGold(st, cx, c.id, amt, reason))}>
              +
            </button>
            <button className="small bad" onClick={() => dispatch((st, cx) => E.adjustGold(st, cx, c.id, -amt, reason))}>
              −
            </button>
          </span>
        ))}
      </div>
      <Rule>
        In town, lifestyle is charged every midnight, and everything except Wretched covers food, water and lodging, so nobody goes hungry. Lifestyle per day: Wretched free, Squalid 1 SP, Poor 2 SP, Modest 1 GP,
        Comfortable 2 GP, Wealthy 4 GP, Aristocratic 10 GP. Crafting materials and Bastion construction are charged when the work starts.
      </Rule>
    </Card>
  );
}

function HirelingsCard() {
  const s = useGame();
  const pcs = s.characters.filter((c) => c.kind !== 'mount');
  const [name, setName] = useState('');
  const [skilled, setSkilled] = useState(true);
  const [payer, setPayer] = useState('party');
  return (
    <Card title="Hirelings">
      {s.hirelings.length === 0 && <p className="muted small">Nobody on the payroll.</p>}
      <ul className="plain">
        {s.hirelings.map((h) => (
          <li key={h.id} className="armor-row">
            <span>
              <b>{h.name}</b> <span className="muted small">
                {h.skilled ? 'skilled' : 'untrained'}, {fmtGp(h.wageGp)}/day, paid by {h.payer === 'party' ? 'the party' : E.charById(s, h.payer)?.name ?? '?'}
              </span>
            </span>
            <span className="btn-row tight">
              <Toggle checked={h.active} onChange={(v) => edit((d) => void (d.hirelings.find((x) => x.id === h.id)!.active = v))} label="Employed" />
              <button className="ghost small bad" aria-label={`Dismiss ${h.name}`} onClick={() => edit((d) => void (d.hirelings = d.hirelings.filter((x) => x.id !== h.id)))}>
                ✕
              </button>
            </span>
          </li>
        ))}
      </ul>
      <div className="form-row">
        <Text label="Name or job" value={name} onChange={setName} placeholder="e.g. Torchbearer, Guide" />
        <Select
          label="Type"
          value={skilled ? 'skilled' : 'untrained'}
          onChange={(v) => setSkilled(v === 'skilled')}
          options={[
            { value: 'skilled', label: `Skilled (${fmtGp(HIRELING_WAGE.skilled)}/day)` },
            { value: 'untrained', label: `Untrained (${fmtGp(HIRELING_WAGE.untrained)}/day)` },
          ]}
        />
        <Select label="Paid by" value={payer} onChange={setPayer} options={[{ value: 'party', label: 'Party (split)' }, ...pcs.map((c) => ({ value: c.id, label: c.name }))]} />
      </div>
      <button
        disabled={!name.trim()}
        onClick={() => (
          edit(
            (d) =>
              void d.hirelings.push({ id: uid(), name: name.trim(), skilled, wageGp: skilled ? HIRELING_WAGE.skilled : HIRELING_WAGE.untrained, payer, active: true }),
          ),
          setName('')
        )}
      >
        Hire
      </button>
      <Rule>Wages are charged every midnight while a hireling is employed.</Rule>
    </Card>
  );
}

function MountsCard() {
  const s = useGame();
  const mounts = s.characters.filter((c) => c.kind === 'mount');
  const pcs = s.characters.filter((c) => c.kind !== 'mount');
  const [preset, setPreset] = useState(MOUNT_PRESETS[0].name);
  const [name, setName] = useState('');
  const [buyer, setBuyer] = useState<string>('free');
  const [days, setDays] = useState(5);
  const p = MOUNT_PRESETS.find((x) => x.name === preset)!;
  return (
    <Card title="Mounts and animals">
      {mounts.length === 0 && <p className="muted small">No mounts yet.</p>}
      <ul className="plain">
        {mounts.map((m) => (
          <li key={m.id} className="armor-row">
            <span>
              <b>{m.name}</b>{' '}
              <span className="muted small">
                {m.size}, Speed {m.speed} ft · needs {fmtLb(foodNeedLb(m))} food and {WATER_GAL_PER_DAY[m.size]} gal water a day · carrying {fmtLb(m.rationsLb)} feed (
                {(m.rationsLb / foodNeedLb(m)).toFixed(1)} days)
              </span>{' '}
              {m.exhaustion > 0 && <Pill tone="warn">Exhaustion {m.exhaustion}</Pill>}
            </span>
            <button className="ghost small bad" aria-label={`Remove ${m.name}`} onClick={() => confirm(`Remove ${m.name}?`) && edit((d) => void (d.characters = d.characters.filter((x) => x.id !== m.id)))}>
              ✕
            </button>
          </li>
        ))}
      </ul>
      {mounts.length > 0 && (
        <div className="btn-row">
          <Num value={days} onChange={(v) => setDays(Math.max(1, Math.round(v)))} min={1} suffix="days" width={3} />
          <button onClick={() => dispatch((st, cx) => E.buyFeed(st, cx, days))}>
            Buy feed ({fmtGp(FEED_GP_PER_DAY * days * mounts.length)})
          </button>
        </div>
      )}
      <h3>Add a mount</h3>
      <div className="form-row">
        <Select label="Animal" value={preset} onChange={setPreset} options={MOUNT_PRESETS.map((x) => ({ value: x.name, label: `${x.name} (${x.size}, ${fmtGp(x.gp)})` }))} />
        <Text label="Name" value={name} onChange={setName} placeholder={p.name} />
        <Select
          label="Paid by"
          value={buyer}
          onChange={setBuyer}
          options={[{ value: 'free', label: 'Already owned' }, { value: '', label: 'Party (split)' }, ...pcs.map((c) => ({ value: c.id, label: c.name }))]}
        />
      </div>
      <button className="primary" onClick={() => (dispatch((st, cx) => E.addMount(st, cx, p, name.trim(), buyer === 'free' ? null : buyer)), setName(''))}>
        Add {name.trim() || p.name}
      </button>
      <Rule>Mounts follow the same food, water, temperature and Exhaustion rules as everyone else. Party meals feed them from their feed, and town lifestyle doesn&apos;t cover them, so water them every day (for example with &quot;Top up today&apos;s water&quot;).</Rule>
    </Card>
  );
}
