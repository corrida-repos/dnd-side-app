import { useState } from 'react';
import { useGame, dispatch, edit } from '../state/store';
import * as E from '../state/engine';
import { uid } from '../state/defaults';
import { fmtGp, HIRELING_WAGE, LIFESTYLE_GP, LIFESTYLE_LABEL, MOUNT_PRESETS, FEED_GP_PER_DAY, type Lifestyle } from '../rules/money';
import { foodNeedLb, fmtLb, WATER_GAL_PER_DAY } from '../rules/survival';
import { Card, Num, Pill, Select, Text, Toggle, Rule } from './common';
import { HIRELING_ROLES, MESSENGER_GP_PER_MILE, type HirelingRole } from '../rules/hirelings';
import { coinCount, DENOMS, purseValue, type Denom } from '../rules/coins';
import type { Hireling } from '../state/types';

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
              <th>Coins (pp · gp · ep · sp · cp)</th>
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
                  <span className="purse">
                    {DENOMS.map((dn) => (
                      <Num key={dn} value={c.purse[dn]} onChange={(v) => dispatch((st, cx) => E.setPurse(st, cx, c.id, { ...c.purse, [dn]: Math.max(0, Math.round(v)) }))} min={0} suffix={dn} width={3} />
                    ))}
                  </span>
                  <div className="small">
                    Worth {fmtGp(purseValue(c.purse))}
                    {c.gp < purseValue(c.purse) - 0.001 && <span className="bad-text"> · owes {fmtGp(purseValue(c.purse) - c.gp)}</span>}
                    {s.settings.coinWeight && <span className="muted"> · {Math.round((coinCount(c.purse) / 50) * 10) / 10} lb of coins</span>}
                  </div>
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
      <ExchangeRow />
      <Rule>
        In town, lifestyle is charged every midnight, and everything except Wretched covers food, water and lodging, so nobody goes hungry. Lifestyle per day: Wretched free, Squalid 1 SP, Poor 2 SP, Modest 1 GP,
        Comfortable 2 GP, Wealthy 4 GP, Aristocratic 10 GP. Crafting materials and Bastion construction are charged when the work starts.
      </Rule>
    </Card>
  );
}

function ExchangeRow() {
  const s = useGame();
  const pcs = s.characters.filter((c) => c.kind !== 'mount');
  const [who, setWho] = useState(pcs[0]?.id ?? '');
  const [from, setFrom] = useState<Denom>('cp');
  const [to, setTo] = useState<Denom>('gp');
  const [count, setCount] = useState(100);
  return (
    <div className="btn-row">
      <span className="small">Moneychanger:</span>
      <Select value={who} onChange={setWho} options={pcs.map((c) => ({ value: c.id, label: c.name }))} />
      <Num value={count} onChange={(v) => setCount(Math.max(1, Math.round(v)))} min={1} width={5} />
      <Select value={from} onChange={setFrom} options={DENOMS.map((d) => ({ value: d, label: d }))} />
      <span className="small">into</span>
      <Select value={to} onChange={setTo} options={DENOMS.map((d) => ({ value: d, label: d }))} />
      <button className="small" onClick={() => dispatch((st, cx) => E.exchangeCoins(st, cx, who, from, to, count))}>
        Exchange
      </button>
      <Num label="Fee %" value={s.settings.moneychangerFee} onChange={(v) => edit((d) => void (d.settings.moneychangerFee = Math.max(0, v)))} min={0} step={0.5} width={3} />
    </div>
  );
}

function HirelingsCard() {
  const s = useGame();
  const pcs = s.characters.filter((c) => c.kind !== 'mount');
  const [role, setRole] = useState<HirelingRole>('guard');
  const [name, setName] = useState('');
  const [payer, setPayer] = useState('party');
  const [miles, setMiles] = useState(10);
  const info = HIRELING_ROLES[role];
  const set = (id: string, patch: Partial<Hireling>) => edit((d) => void Object.assign(d.hirelings.find((x) => x.id === id)!, patch));
  return (
    <Card title="Hirelings" className="span-2">
      {s.hirelings.length === 0 && <p className="muted small">Nobody on the payroll.</p>}
      <ul className="plain">
        {s.hirelings.map((h) => {
          const r = HIRELING_ROLES[h.role] ?? HIRELING_ROLES.other;
          return (
            <li key={h.id} className="facility">
              <div className="armor-row">
                <span>
                  <b>{h.name}</b> <Pill tone="muted">{r.label}</Pill>{' '}
                  <span className="muted small">
                    {fmtGp(h.wageGp)}/day, paid by {h.payer === 'party' ? 'the party' : E.charById(s, h.payer)?.name ?? '?'}
                  </span>
                </span>
                <span className="btn-row tight">
                  <Toggle checked={h.active} onChange={(v) => set(h.id, { active: v })} label="Employed" />
                  <button className="ghost small bad" aria-label={`Dismiss ${h.name}`} onClick={() => edit((d) => void (d.hirelings = d.hirelings.filter((x) => x.id !== h.id)))}>
                    ✕
                  </button>
                </span>
              </div>
              <p className="small muted">
                {r.does}
                {r.hook ? ` ${r.hook}` : ''}
              </p>
              <div className="btn-row tight">
                {r.skill && <Num label={`${r.skill} bonus`} value={h.bonus} onChange={(v) => set(h.id, { bonus: Math.round(v) })} width={2} />}
                <Num label="Passive Perception" value={h.passivePerception} onChange={(v) => set(h.id, { passivePerception: Math.round(v) })} width={2} />
                {h.role === 'torchbearer' && h.active && (
                  <button className="small" onClick={() => dispatch((st, cx) => E.torchbearerLights(st, cx, h.id))}>
                    Light a torch (1 h)
                  </button>
                )}
                {h.role === 'messenger' && h.active && (
                  <>
                    <Num value={miles} onChange={(v) => setMiles(Math.max(1, Math.round(v)))} min={1} suffix="miles" width={4} />
                    <button className="small" onClick={() => dispatch((st, cx) => E.sendMessage(st, cx, h.id, miles, h.payer))}>
                      Send a message ({fmtGp(miles * MESSENGER_GP_PER_MILE)})
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <h3>Hire someone</h3>
      <div className="form-row">
        <Select label="Job" value={role} onChange={setRole} options={(Object.keys(HIRELING_ROLES) as HirelingRole[]).map((k) => ({ value: k, label: `${HIRELING_ROLES[k].label} (${HIRELING_ROLES[k].skilled ? 'skilled' : 'untrained'})` }))} />
        <Text label="Name" value={name} onChange={setName} placeholder={info.label} />
        <Select label="Paid by" value={payer} onChange={setPayer} options={[{ value: 'party', label: 'Party (split)' }, ...pcs.map((c) => ({ value: c.id, label: c.name }))]} />
      </div>
      <p className="small">
        {info.does} {info.hook && <span className="good-text">{info.hook}</span>}
      </p>
      <button
        onClick={() => {
          edit(
            (d) =>
              void d.hirelings.push({
                id: uid(),
                name: name.trim() || info.label,
                role,
                bonus: info.skilled ? 4 : 0,
                passivePerception: role === 'guard' ? 12 : 10,
                skilled: info.skilled,
                wageGp: role === 'messenger' ? 0 : info.skilled ? HIRELING_WAGE.skilled : HIRELING_WAGE.untrained,
                payer,
                active: true,
              }),
          );
          setName('');
        }}
      >
        Hire {name.trim() || info.label} ({role === 'messenger' ? '2 CP per mile' : `${fmtGp(info.skilled ? HIRELING_WAGE.skilled : HIRELING_WAGE.untrained)}/day`})
      </button>
      <Rule>Skilled hirelings cost 2 GP a day and untrained ones 2 SP, charged at midnight. Messengers charge 2 CP per mile instead.</Rule>
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
