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
import { TARGET_SPELLS } from '../rules/components';
import { PATRONS } from '../rules/patrons';
import { CREDITOR_LABEL, DUE_DAYS, ESCALATION, LENIENT_GP, WEEKLY_INTEREST, type CreditorKind } from '../rules/debts';
import { ITEM_PRICES } from '../rules/itemPrices';
import { valueUnknown, inStock, priceOf, RENOWN_DISCOUNT, saleRate, STOCK_LIMIT } from '../rules/shop';
import { COMMON_SPELL_REQUESTS, PASSAGE, SPELL_SERVICES, spellServiceAvailable, type Settlement } from '../rules/services';
import { WaysAround } from './WaysAround';
import { SADDLE_LABEL, STABLING_GP_PER_DAY, needsExoticSaddle, type Saddle } from '../rules/gear';

export function MoneyTab() {
  return (
    <div className="grid">
      <PurseCard />
      <HirelingsCard />
      <MountsCard />
      <ShopCard />
      <DebtsCard />
      <ServicesCard />
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
      <WaysAround topic={'lifestyle'} />
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
      <WaysAround topic={'hirelings'} />
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
              {needsExoticSaddle(m) && <Pill tone="bad">needs an Exotic Saddle</Pill>}{' '}
              {m.saddle === 'none' && !needsExoticSaddle(m) && <Pill tone="warn" title="Table rule: Disadvantage on checks to stay mounted, and no galloping">bareback</Pill>}{' '}
              <Select
                value={m.saddle ?? 'riding'}
                onChange={(v: Saddle) => edit((d) => void (d.characters.find((x) => x.id === m.id)!.saddle = v))}
                options={(Object.keys(SADDLE_LABEL) as Saddle[]).map((k) => ({ value: k, label: SADDLE_LABEL[k].split(' (')[0] }))}
              />
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
      <Rule>
        Mounts follow the same food, water, temperature and Exhaustion rules as everyone else. Party meals feed them from their feed.{' '}
        {s.settings.stabling
          ? `In a settlement they're stabled and fed each day for ${fmtGp(STABLING_GP_PER_DAY + FEED_GP_PER_DAY)} each (2024 PHB: Stabling 5 SP, Feed 5 CP).`
          : "Town lifestyle doesn't cover them, so water them every day (for example with \"Top up today's water\")."}{' '}
        Saddles (2024 PHB): a Military Saddle gives Advantage on checks to stay mounted; flying and swimming mounts need an Exotic Saddle. Table rule: riding bareback means Disadvantage on checks to stay mounted, and no galloping. Set how a mount moves on the Party tab.
      </Rule>
      <WaysAround topic={'mounts'} />
    </Card>
  );
}

function ServicesCard() {
  const s = useGame();
  const pcs = s.characters.filter((c) => c.kind !== 'mount' && E.alive(c));
  const [payer, setPayer] = useState('party');
  const [fare, setFare] = useState(PASSAGE[0].id);
  const [amount, setAmount] = useState(20);
  const [people, setPeople] = useState(pcs.length || 1);
  const [here, setHere] = useState<Settlement>('town');
  const [spell, setSpell] = useState(COMMON_SPELL_REQUESTS[0].name);
  const [custom, setCustom] = useState(1);
  const [target, setTarget] = useState('');
  const payers = payer === 'party' ? pcs.map((c) => c.id) : [payer];
  const f = PASSAGE.find((x) => x.id === fare)!;
  const fareGp = ((f.gpPerMile ?? 0) * amount + (f.gpPerDay ?? 0) * amount + (f.gpFlat ?? 0)) * people;
  const req = COMMON_SPELL_REQUESTS.find((x) => x.name === spell);
  const level = req ? req.level : custom;
  const tier = [...SPELL_SERVICES].reverse().find((t) => level >= t.minLevel)!;
  const available = spellServiceAvailable(tier.where, here);
  const freeByPatron = !!s.patron && level <= (PATRONS[s.patron.kind].freeSpellLevel ?? -1);
  const spellGp = freeByPatron ? 0 : tier.gp + (req?.componentGp ?? 0);
  return (
    <Card title="Services: passage and spellcasting">
      <Select label="Who pays" value={payer} onChange={setPayer} options={[{ value: 'party', label: 'Split across the party' }, ...pcs.map((c) => ({ value: c.id, label: c.name }))]} />
      <h3>Passage and tolls</h3>
      <div className="form-row">
        <Select label="Fare" value={fare} onChange={setFare} options={PASSAGE.map((x) => ({ value: x.id, label: x.label }))} />
        {!f.gpFlat && <Num label={f.gpPerDay ? 'Days' : 'Miles'} value={amount} onChange={(v) => setAmount(Math.max(0, Math.round(v)))} min={0} width={5} />}
        <Num label="Passengers" value={people} onChange={(v) => setPeople(Math.max(1, Math.round(v)))} min={1} width={3} />
      </div>
      <button className="small" onClick={() => dispatch((st, cx) => E.payForService(st, cx, payers, fareGp, `${f.label.replace(/ \(.*\)/, '')} for ${people}`))}>
        Pay {fmtGp(fareGp)}
      </button>
      <h3>Spellcasting</h3>
      <div className="form-row">
        <Select label="Settlement" value={here} onChange={setHere} options={[{ value: 'village', label: 'Village' }, { value: 'town', label: 'Town' }, { value: 'city', label: 'City' }]} />
        <Select label="Spell" value={spell} onChange={setSpell} options={[...COMMON_SPELL_REQUESTS.map((x) => ({ value: x.name, label: `${x.name} (level ${x.level})` })), { value: '', label: 'Another spell…' }]} />
        {!req && <Num label="Spell level" value={custom} onChange={(v) => setCustom(Math.max(0, Math.min(9, Math.round(v))))} min={0} max={9} width={2} />}
      </div>
      <p className="small">
        {tier.level}: {fmtGp(tier.gp)}
        {req?.componentGp ? ` + ${fmtGp(req.componentGp)} components` : ''}. {available ? 'A caster can be found here.' : `Only found in a ${tier.where === 'city' ? 'city' : 'town or city'}.`}
        {req && <span className="muted"> {req.note}</span>}
        {freeByPatron && <span className="good-text"> Free through {s.patron!.name} (components included), if the cause serves the faith.</span>}
      </p>
      {req && TARGET_SPELLS[req.name] && (
        <Select label="Cast on" value={target} onChange={setTarget} options={[{ value: '', label: 'Choose…' }, ...s.characters.map((c) => ({ value: c.id, label: `${c.name}${c.diedAt != null ? ' (dead)' : ''}` }))]} />
      )}
      <button
        className="small"
        disabled={!available || (!!req && !!TARGET_SPELLS[req.name] && !target)}
        onClick={() =>
          dispatch((st, cx) => {
            let next = E.payForService(st, cx, payers, spellGp, `having ${req ? req.name : `a level ${custom} spell`} cast`);
            if (req && TARGET_SPELLS[req.name] && target) next = E.spellOnTarget(next, cx, req.name, target);
            if (req?.name === 'Purify Food and Drink') next = E.purifySpell(next, cx, null, 'slot');
            return next;
          })
        }
      >
        Pay {fmtGp(spellGp)}
        {req && TARGET_SPELLS[req.name] ? ' and cast' : ''}
      </button>
      <Rule>2024 PHB services. Higher-level casters are harder to find: level 3+ only in towns and cities, level 6+ only in cities. Spells with costly components add their cost. Daily food and lodging are already part of lifestyle expenses.</Rule>
      <WaysAround topic={'services'} />
    </Card>
  );
}

function ShopCard() {
  const s = useGame();
  const pcs = s.characters.filter((c) => c.kind !== 'mount' && E.alive(c));
  const [who, setWho] = useState('');
  const [here, setHere] = useState<Settlement>('town');
  const [group, setGroup] = useState('Gear');
  const [item, setItem] = useState('');
  const [qty, setQty] = useState(1);
  const [faction, setFaction] = useState('');
  const [sellId, setSellId] = useState('');
  const [sellQty, setSellQty] = useState(1);
  const [loot, setLoot] = useState(100);
  const [lootWhat, setLootWhat] = useState('');
  const [lootIds, setLootIds] = useState<string[]>([]);
  const whoId = pcs.find((c) => c.id === who)?.id ?? pcs[0]?.id ?? '';
  const buyer = pcs.find((c) => c.id === whoId);
  const groups = [...new Set(ITEM_PRICES.map((p) => p.group))];
  const list = ITEM_PRICES.filter((p) => p.group === group);
  const pick = list.find((p) => p.name === item) ?? list[0];
  const friends = s.factions.filter((f) => f.renown >= 3);
  const patron = s.patron ? PATRONS[s.patron.kind] : null;
  const discount = Math.max(
    friends.some((f) => f.id === faction) && pick && pick.group !== 'Vehicles' && pick.group !== 'Mounts' ? RENOWN_DISCOUNT : 0,
    patron?.discountAll ?? 0,
    pick && (pick.group === 'Weapons' || pick.group === 'Armor') ? (patron?.discountArms ?? 0) : 0,
  );
  const stocked = pick ? inStock(pick.gp, here) : false;
  const sellable = buyer?.inventory ?? [];
  const sell = sellable.find((i) => i.id === sellId) ?? sellable[0];
  const sellUnit = sell ? (sell.valueGp ?? priceOf(sell.name)) : undefined;
  const payees = lootIds.length ? lootIds : pcs.map((c) => c.id);
  return (
    <Card title="Shop and loot">
      <div className="form-row">
        <Select label="Who" value={whoId} onChange={setWho} options={pcs.map((c) => ({ value: c.id, label: `${c.name} (${fmtGp(c.gp)})` }))} />
        <Select label="Settlement" value={here} onChange={setHere} options={[{ value: 'village', label: 'Village' }, { value: 'town', label: 'Town' }, { value: 'city', label: 'City' }]} />
        {friends.length > 0 && <Select label="Faction contact" value={faction} onChange={setFaction} options={[{ value: '', label: 'None' }, ...friends.map((f) => ({ value: f.id, label: `${f.name} (renown ${f.renown})` }))]} />}
      </div>
      <h3>Buy</h3>
      <div className="form-row">
        <Select label="Category" value={group} onChange={(v) => (setGroup(v), setItem(''))} options={groups} />
        <Select label="Item" value={pick?.name ?? ''} onChange={setItem} options={list.map((p) => ({ value: p.name, label: `${p.name} (${fmtGp(p.gp)})` }))} />
        <Num label="Qty" value={qty} onChange={(v) => setQty(Math.max(1, Math.round(v)))} min={1} width={3} />
      </div>
      <button className="small" disabled={!pick || !stocked || !buyer} onClick={() => dispatch((st, cx) => E.buyItem(st, cx, whoId, pick!.name, qty, pick!.gp, discount))}>
        Buy for {fmtGp(Math.round((pick?.gp ?? 0) * qty * (1 - discount) * 100) / 100)}
      </button>
      {!stocked && <span className="small warn-text"> Not sold in a {here} (table rule: up to {STOCK_LIMIT[here] === Infinity ? 'any price' : `${STOCK_LIMIT[here]} GP`}).</span>}
      <h3>Sell</h3>
      {sellable.length === 0 ? (
        <p className="small muted">Nothing in {buyer?.name ?? 'their'} inventory.</p>
      ) : (
        <>
          <div className="form-row">
            <Select label="Item" value={sell?.id ?? ''} onChange={setSellId} options={sellable.map((i) => ({ value: i.id, label: `${i.name} ×${i.qty}${valueUnknown(i) ? ' (value unknown)' : ''}` }))} />
            <Num label="Qty" value={sellQty} onChange={(v) => setSellQty(Math.max(1, Math.round(v)))} min={1} width={3} />
          </div>
          <button className="small" disabled={sellUnit == null} onClick={() => dispatch((st, cx) => E.sellItem(st, cx, whoId, sell!.id, sellQty))}>
            {sellUnit == null ? 'Value unknown' : valueUnknown(sell!) ? 'Sell (value unknown: the buyer names a price)' : `Sell for ${fmtGp(Math.round(sellUnit * Math.min(sellQty, sell!.qty) * saleRate(sell!.name) * 100) / 100)}`}
          </button>
        </>
      )}
      {Math.max(0, ...s.factions.map((f) => f.renown)) >= 10 && <FactionSupply buyerId={whoId} />}
      <h3>Split loot</h3>
      <div className="form-row">
        <Num label="Coin" value={loot} onChange={(v) => setLoot(Math.max(0, v))} min={0} suffix="GP" width={6} />
        <Text label="From" value={lootWhat} onChange={setLootWhat} placeholder="e.g. the ogre's hoard" />
      </div>
      <div className="btn-row tight">
        {pcs.map((c) => (
          <Toggle key={c.id} checked={payees.includes(c.id)} onChange={(v) => setLootIds(v ? [...payees.filter((x) => x !== c.id), c.id] : payees.filter((x) => x !== c.id))} label={c.name} />
        ))}
      </div>
      <button className="small" disabled={!loot || !payees.length} onClick={() => dispatch((st, cx) => E.splitLoot(st, cx, loot, payees, lootWhat))}>
        Split {fmtGp(loot)} {payees.length} ways
      </button>
      <Rule>
        2024 PHB prices. Selling: equipment in good condition fetches half its price; gems, jewelry, art objects and trade goods keep their full value. Magic items are sold as downtime deals (Downtime tab). Table rules: what each settlement stocks, and a {Math.round(RENOWN_DISCOUNT * 100)}% discount through a faction where you have Renown 3+.
      </Rule>
      <WaysAround topic={'shopping'} />
    </Card>
  );
}

function FactionSupply({ buyerId }: { buyerId: string }) {
  const [name, setName] = useState('Potion of Greater Healing');
  const [rarity, setRarity] = useState<'common' | 'uncommon'>('uncommon');
  return (
    <>
      <h3>Faction supply (Renown 10+)</h3>
      <div className="form-row">
        <Text label="Potion or scroll" value={name} onChange={setName} />
        <Select label="Rarity" value={rarity} onChange={setRarity} options={[{ value: 'common', label: 'Common (50 GP)' }, { value: 'uncommon', label: 'Uncommon (200 GP)' }]} />
      </div>
      <button className="small" disabled={!name.trim() || !buyerId} onClick={() => dispatch((st, cx) => E.factionSupply(st, cx, buyerId, name.trim(), rarity))}>
        Get it through contacts
      </button>
      <p className="small muted">DMG: Renown 10+ can open access to potions and scrolls. Priced at half the 2024 DMG value for consumables (table rule).</p>
    </>
  );
}

function DebtsCard() {
  const s = useGame();
  const pcs = s.characters.filter((c) => c.kind !== 'mount');
  const [who, setWho] = useState('');
  const [kind, setKind] = useState<CreditorKind>('lawful');
  const [creditor, setCreditor] = useState('');
  const [amount, setAmount] = useState(100);
  const [rate, setRate] = useState(WEEKLY_INTEREST.lawful * 100);
  const [due, setDue] = useState(DUE_DAYS.lawful);
  const [pay, setPay] = useState<Record<string, number>>({});
  const whoId = pcs.find((c) => c.id === who)?.id ?? pcs[0]?.id ?? '';
  return (
    <Card title="Debts">
      {s.debts.length === 0 && <p className="muted small">Nobody owes anything.</p>}
      <ul className="plain">
        {s.debts.map((d) => {
          const c = E.charById(s, d.debtorId);
          const overdue = s.dayIndex - d.dueDay;
          const next = ESCALATION[d.kind].find((x) => !d.steps.includes(x.label));
          return (
            <li key={d.id} className="facility">
              <div className="armor-row">
                <span>
                  <b>{c?.name}</b> owes <b>{d.creditor}</b> {fmtGp(d.owed)} <span className="small muted">({CREDITOR_LABEL[d.kind].split(' (')[0]}{d.rate ? `, ${Math.round(d.rate * 100)}%/week` : ''})</span>{' '}
                  {d.imprisoned ? <Pill tone="bad">In debtors&apos; prison</Pill> : overdue >= 0 ? <Pill tone="bad">{Math.floor(overdue / 7) + 1} week(s) overdue</Pill> : <Pill tone="muted">Due in {-overdue} day(s)</Pill>}
                </span>
              </div>
              {d.steps.length > 0 && <p className="small">Already: {d.steps.join(', ')}.</p>}
              {next && !d.imprisoned && <p className="small muted">Next if unpaid: week {next.week} overdue, {next.text}{d.owed < LENIENT_GP && next.action !== 'warn' ? ' (not for a debt this small)' : ''}.</p>}
              <div className="btn-row tight">
                <Num value={pay[d.id] ?? Math.min(d.owed, Math.max(0, c?.gp ?? 0))} onChange={(v) => setPay({ ...pay, [d.id]: Math.max(0, v) })} min={0} suffix="GP" width={6} />
                <button className="small" onClick={() => dispatch((st, cx) => E.payDebt(st, cx, d.id, pay[d.id] ?? d.owed))}>
                  Pay
                </button>
                {d.kind === 'criminal' && d.steps.includes('Forced service') && (
                  <button className="small ghost" onClick={() => dispatch((st, cx) => E.serveCreditor(st, cx, d.id))}>
                    Do their job (−25%)
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <h3>Borrow</h3>
      <div className="form-row">
        <Select label="Who" value={whoId} onChange={setWho} options={pcs.map((c) => ({ value: c.id, label: c.name }))} />
        <Select
          label="Lender"
          value={kind}
          onChange={(v) => {
            setKind(v);
            setRate(WEEKLY_INTEREST[v] * 100);
            setDue(DUE_DAYS[v]);
          }}
          options={(Object.keys(CREDITOR_LABEL) as CreditorKind[]).map((k) => ({ value: k, label: CREDITOR_LABEL[k] }))}
        />
        <Text label="Name" value={creditor} onChange={setCreditor} placeholder="e.g. Kundarak Bank, Mother Yellowtooth" />
        <Num label="Amount" value={amount} onChange={(v) => setAmount(Math.max(1, v))} min={1} suffix="GP" width={6} />
        <Num label="Interest" value={rate} onChange={(v) => setRate(Math.max(0, v))} min={0} suffix="%/week" width={3} />
        <Num label="Due in" value={due} onChange={(v) => setDue(Math.max(1, Math.round(v)))} min={1} suffix="days" width={3} />
      </div>
      <button className="small" disabled={!whoId} onClick={() => dispatch((st, cx) => E.borrow(st, cx, whoId, creditor.trim(), kind, amount, rate / 100, due))}>
        Borrow {fmtGp(amount)}
      </button>
      <Rule>
        Table rule: neither 2024 book covers debt. Interest compounds weekly. Overdue debts escalate by creditor: lawful lenders send a notice, then bailiffs seize coin and goods at half value, then debtors&apos; prison (working off a laborer&apos;s wage); criminals threaten, send enforcers, demand an unpaid job, then turn violent and become a rival; noble houses blacken your name (renown −1) and seize property; temples ask penance, then a quest. Debts under {LENIENT_GP} GP never go past a warning. A purse that goes negative becomes a debt at the day&apos;s end.
      </Rule>
    </Card>
  );
}
