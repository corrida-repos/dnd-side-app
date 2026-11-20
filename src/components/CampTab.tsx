import { useState } from 'react';
import { useGame, dispatch, edit } from '../state/store';
import * as E from '../state/engine';
import { fireThreat } from '../rules/weather';
import { GAME_ANIMALS, MEAT_LB, BUTCHER_MINUTES, BUTCHER_DC, isEdible, yieldsHide, STRANGE_TYPES } from '../rules/hunting';
import { formatClock, formatDuration } from '../rules/calendar';
import { autoAssign, maxWatchMinutes, WATCH_COUNTS, watchCapacity, watchMinutes } from '../rules/watch';
import { FORAGE_DC, ABUNDANCE_LABEL, foodNeedLb, fmtLb, fmtWater, proficiencyBonus, ARMOR_LABEL, armorTime, BOIL_MINUTES, PURIFY_SPELL, TAINTED_DC } from '../rules/survival';
import { Card, Num, Pill, Select, Text, Toggle, Rule } from './common';

export function CampTab() {
  return (
    <div className="grid">
      <FireCard />
      <StoresCard />
      <PurifyCard />
      <ArmorCard />
      <WatchCard />
      <MealsCard />
      <ForageCard />
      <HuntCard />
      <RulesCard />
    </div>
  );
}

function useCharOptions() {
  const s = useGame();
  return s.characters.map((c) => ({ value: c.id, label: c.name }));
}

function FireCard() {
  const s = useGame();
  const opts = useCharOptions();
  const [gatherer, setGatherer] = useState(opts[0]?.value ?? '');
  const threat = fireThreat(s.weather, E.tempNow(s));
  const indoors = s.place.shelter === 'building' || s.place.shelter === 'cave';
  return (
    <Card title={<span>Campfire {s.fire.lit ? <Pill tone="good">Burning</Pill> : <Pill tone="muted">Out</Pill>}</span>} className="span-2 fire-card">
      <div className={`fire-visual ${s.fire.lit ? 'lit' : ''}`} aria-hidden>
        <span className="flame f1" />
        <span className="flame f2" />
        <span className="flame f3" />
        <span className="logs" />
      </div>
      <div className="form-row">
        <Num label="Fuel" value={s.fire.fuelHours} onChange={(v) => edit((d) => void (d.fire.fuelHours = Math.max(0, Math.round(v))))} min={0} suffix="hours" width={3} />
        <Toggle checked={s.fire.sheltered} onChange={(v) => edit((d) => void (d.fire.sheltered = v))} label="Sheltered fire pit (windbreak and roof)" />
      </div>
      {threat && !s.fire.sheltered && !indoors && (
        <Rule>
          <b>{threat === 'strong wind' ? 'Strong wind' : 'Heavy rain'}</b> puts out open flames. Shelter the fire pit, or move to a cave or building, to keep a fire going.
        </Rule>
      )}
      {s.settings.fireWarmsCamp && <Rule>Table rule (on): while the fire burns, people resting in camp aren't exposed to extreme cold.</Rule>}
      <div className="btn-row">
        {s.fire.lit ? (
          <button onClick={() => dispatch(E.douseFire)}>Put out the fire</button>
        ) : (
          <button className="primary" onClick={() => dispatch(E.lightFire)}>
            Light fire (Tinderbox, 1 min)
          </button>
        )}
        <button onClick={() => edit((d) => void (d.fire.fuelHours += 1))}>+1 h fuel</button>
        <button onClick={() => edit((d) => void (d.fire.fuelHours += 4))}>+4 h fuel</button>
      </div>
      <div className="btn-row">
        <Select value={gatherer} onChange={setGatherer} options={opts} />
        <button disabled={!gatherer} onClick={() => dispatch((st, c) => E.gatherWood(st, c, gatherer))}>
          Gather firewood (1 h, Survival DC {FORAGE_DC[s.place.forage]})
        </button>
      </div>
    </Card>
  );
}

function StoresCard() {
  const s = useGame();
  return (
    <Card title="Camp stores">
      <div className="form-row">
        <Num label="Food" value={s.stores.foodLb} onChange={(v) => edit((d) => void (d.stores.foodLb = v))} min={0} step={0.5} suffix="lb" width={4} />
        <Num label="Water" value={s.stores.waterGal} onChange={(v) => edit((d) => void (d.stores.waterGal = v))} min={0} step={0.5} suffix="gal" width={4} />
      </div>
      <div className="form-row">
        <Num label="Raw food" value={s.stores.foodRawLb} onChange={(v) => edit((d) => void (d.stores.foodRawLb = v))} min={0} step={0.5} suffix="lb" width={4} />
        <Num label="Unpurified water" value={s.stores.waterUnsafeGal} onChange={(v) => edit((d) => void (d.stores.waterUnsafeGal = v))} min={0} step={0.5} suffix="gal" width={4} />
      </div>
      <Rule>Shared supplies. Foraged food arrives raw and foraged water unpurified. Party meals use safe stores first, then each person's rations or waterskin, and raw or unpurified supplies only as a last resort.</Rule>
      <div className="btn-row">
        <button disabled={!s.place.waterSource} onClick={() => dispatch(E.refillWater)} title={s.place.waterSource ? '' : 'No water source at this place'}>
          Refill all waterskins
        </button>
        <button disabled={!s.place.waterSource} onClick={() => dispatch((st, c) => E.fillBarrel(st, c, 5))}>
          Fill a 5 gal barrel
        </button>
      </div>
    </Card>
  );
}

function PurifyCard() {
  const s = useGame();
  const [caster, setCaster] = useState<string>(() => s.characters.find((c) => c.spells.some((x) => x.name.toLowerCase() === PURIFY_SPELL.toLowerCase()))?.id ?? '');
  const [mode, setMode] = useState<'ritual' | 'slot'>('ritual');
  const skins = s.characters.filter((c) => c.waterUnsafe);
  const dirty = s.stores.foodRawLb > 0 || s.stores.waterUnsafeGal > 0 || skins.length > 0;
  const casterChar = s.characters.find((c) => c.id === caster);
  const check = casterChar ? E.canCastPurify(casterChar, mode) : { ok: true, reason: '' };
  return (
    <Card title={<span>Raw food and dirty water {dirty ? <Pill tone="warn">Needs purifying</Pill> : <Pill tone="good">All safe</Pill>}</span>}>
      <ul className="plain small">
        <li>Raw food: {fmtLb(s.stores.foodRawLb)}</li>
        {s.characters.some((c) => c.sick) && <li className="bad-text">Food poisoning: {s.characters.filter((c) => c.sick).map((c) => c.name).join(', ')}</li>}
        <li>Unpurified water: {s.stores.waterUnsafeGal} gal</li>
        <li>Tainted waterskins: {skins.length ? skins.map((c) => c.name).join(', ') : 'none'}</li>
        <li>
          Water source here: {s.place.waterSource ? (s.place.waterQuality === 'clean' ? 'clean' : 'questionable') : 'none'}
        </li>
      </ul>
      {!s.settings.wildNeedsPurifying && <Rule>Water purifying is switched off in Settings, so wild water is treated as safe.</Rule>}
      {!s.settings.rawFoodRisk && <Rule>The raw food risk is switched off in Settings, so foraged food is safe to eat as it is.</Rule>}

      <h3>Magical: {PURIFY_SPELL}</h3>
      <div className="form-row">
        <Select
          label="Caster"
          value={caster}
          onChange={setCaster}
          options={[{ value: '', label: 'Scroll or other source' }, ...s.characters.map((c) => ({ value: c.id, label: c.name }))]}
        />
        <Select
          label="Cast"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'ritual', label: 'As a ritual (10 min)' },
            { value: 'slot', label: 'With a level 1 slot (action)' },
          ]}
        />
      </div>
      {!check.ok && <p className="small bad-text">{check.reason} Add it to their spells on the Morning tab.</p>}
      <button className="primary" disabled={!dirty || !check.ok} onClick={() => dispatch((st, c) => E.purifySpell(st, c, caster || null, mode))}>
        Cast {PURIFY_SPELL}
      </button>
      <Rule>Level 1 Transmutation ritual: removes poison and rot from nonmagical food and drink in a 5-foot-radius Sphere. This covers all camp stores and waterskins gathered together.</Rule>

      <h3>Nonmagical</h3>
      <div className="btn-row">
        <button disabled={!s.fire.lit || !(s.stores.waterUnsafeGal > 0 || skins.length > 0)} onClick={() => dispatch(E.boilWater)} title={s.fire.lit ? '' : 'Light the fire first'}>
          Boil water ({BOIL_MINUTES} min)
        </button>
      </div>
      <Rule>
        Table rules: boiling over a lit campfire makes all water safe, and cooking a hot meal uses up raw food first and makes it safe. Eating <b>raw food</b> means a DC {s.settings.rawFoodDC} Con save, or you
        are <b>Sick</b>: Poisoned (Disadvantage on attack rolls and ability checks) until you finish a Long Rest. Drinking <b>unpurified water</b> means a DC {TAINTED_DC} Con save, or you are Poisoned for 1 hour.
      </Rule>
    </Card>
  );
}

function ArmorCard() {
  const s = useGame();
  const armored = s.characters.filter((c) => c.armorKind !== 'none' || c.hasShield);
  const anyOn = armored.some((c) => c.armorWorn);
  const anyOff = armored.some((c) => c.armorKind !== 'none' && !c.armorWorn);
  return (
    <Card title="Armor">
      {armored.length === 0 && <p className="muted small">Nobody has armor set up. Add it on the Party tab.</p>}
      <ul className="plain">
        {armored.map((c) => (
          <li key={c.id} className="armor-row">
            <span>
              <b>{c.name}</b>{' '}
              <span className="muted small">
                {c.armorName || ARMOR_LABEL[c.armorKind]}
                {c.hasShield ? ' + shield' : ''}
              </span>{' '}
              {c.armorKind !== 'none' && (c.armorWorn ? <Pill tone="good">On</Pill> : <Pill tone="warn">Off</Pill>)}
            </span>
            {c.armorKind !== 'none' && (
              <button className="small" onClick={() => dispatch((st, cx) => E.setArmor(st, cx, c.id, c.armorWorn ? 'doff' : 'don'))}>
                {c.armorWorn ? `Take off (${armorTime(c, 'doff')} min)` : `Put on (${armorTime(c, 'don')} min)`}
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="btn-row">
        <button disabled={!anyOn} onClick={() => dispatch((st, c) => E.partyArmor(st, c, 'doff'))}>
          Everyone takes armor off
        </button>
        <button disabled={!anyOff} onClick={() => dispatch((st, c) => E.partyArmor(st, c, 'don'))}>
          Everyone suits up
        </button>
      </div>
      <Rule>
        Light: 1 min on, 1 min off. Medium: 5 on, 1 off. Heavy: 10 on, 5 off. A shield takes the Utilize action. Everyone works at the same time, so the clock moves by the slowest person.
        {s.settings.sleepInArmorPenalty
          ? ' Optional rule on: sleeping in Medium or Heavy armor means the Long Rest brings back only a quarter of spent Hit Point Dice and removes no Exhaustion.'
          : ' The 2024 rules have no penalty for sleeping in armor. You can switch on the optional Xanathar’s rule in Settings.'}
      </Rule>
    </Card>
  );
}

function WatchCard() {
  const s = useGame();
  const pcs = [
    ...s.characters.filter((c) => c.kind !== 'mount' && c.diedAt == null).map((c) => ({ id: c.id, name: c.name, hireling: false, trance: c.trance })),
    ...s.hirelings.filter((h) => h.active).map((h) => ({ id: `h:${h.id}`, name: h.name, hireling: true, trance: false })),
  ];
  const plan = E.planWatches(s);
  const load = E.watchLoad(s);
  const [perWatch, setPerWatch] = useState(1);
  const [pool, setPool] = useState<string[]>(() => pcs.map((c) => c.id));
  const setCount = (count: number) =>
    edit((d) => {
      const ids = pool.filter((id) => d.characters.some((c) => c.id === id) || d.hirelings.some((h) => `h:${h.id}` === id && h.active));
      const cap = Object.fromEntries(d.characters.map((c) => [c.id, watchCapacity(count, c.trance)]));
      d.watchPlan = { count, slots: autoAssign(ids, count, perWatch, cap) };
    });
  const toggle = (slot: number, id: string) =>
    edit((d) => {
      const slots = Array.from({ length: d.watchPlan.count }, (_, i) => [...(d.watchPlan.slots[i] ?? [])]);
      slots[slot] = slots[slot].includes(id) ? slots[slot].filter((x) => x !== id) : [...slots[slot], id];
      d.watchPlan = { ...d.watchPlan, slots };
    });
  const overloaded = pcs.filter((c) => !c.hireling && (load[c.id] ?? 0) > maxWatchMinutes(c.trance));
  const len = watchMinutes(s.watchPlan.count);
  return (
    <Card title="Night watch" className="span-2">
      <div className="form-row">
        <Select
          label="Split the night into"
          value={String(s.watchPlan.count)}
          onChange={(v) => setCount(Number(v))}
          options={WATCH_COUNTS.map((n) => ({ value: String(n), label: `${n} watches of ${formatDuration(watchMinutes(n))}` }))}
        />
        <Select
          label="People per watch"
          value={String(perWatch)}
          onChange={(v) => setPerWatch(Number(v))}
          options={[
            { value: '1', label: 'One at a time' },
            { value: '2', label: 'Pairs' },
          ]}
        />
        <button onClick={() => setCount(s.watchPlan.count)}>Share out evenly</button>
        <button className="ghost" onClick={() => edit((d) => void (d.watchPlan = { ...d.watchPlan, slots: d.watchPlan.slots.map(() => []) }))}>
          Clear
        </button>
      </div>
      <div className="chips">
        <span className="small muted">Share among:</span>
        {pcs.map((c) => (
          <Toggle key={c.id} checked={pool.includes(c.id)} onChange={(v) => setPool(v ? [...pool, c.id] : pool.filter((x) => x !== c.id))} label={c.hireling ? `${c.name} (hireling)` : c.name} />
        ))}
      </div>
      <p className="small muted">Times assume the Long Rest starts now, at {formatClock(s.minutes % 1440)}.</p>
      <div className="table-wrap">
        <table className="watch-table">
          <thead>
            <tr>
              <th>Watch</th>
              {pcs.map((c) => (
                <th key={c.id}>
                  {c.name}
                  {c.hireling && <div className="muted small">hireling</div>}
                </th>
              ))}
              <th>Best passive Perception</th>
            </tr>
          </thead>
          <tbody>
            {plan.map((p, i) => {
              const best = p.watchers.length ? Math.max(...p.watchers.map((w) => w.passive)) : null;
              return (
                <tr key={i}>
                  <td>
                    <b>{i + 1}</b> <span className="small">
                      {formatClock(p.from % 1440)}–{formatClock(p.to % 1440)}
                    </span>
                  </td>
                  {pcs.map((c) => {
                    const w = p.watchers.find((x) => x.c.id === c.id);
                    return (
                      <td key={c.id}>
                        <label className="toggle">
                          <input type="checkbox" checked={(s.watchPlan.slots[i] ?? []).includes(c.id)} onChange={() => toggle(i, c.id)} aria-label={`${c.name} on watch ${i + 1}`} />
                          {w && (
                            <span className={`small ${w.sight.blind ? 'bad-text' : w.sight.penalty ? 'warn-text' : ''}`} title={w.sight.note}>
                              {w.passive}
                              {w.sight.blind ? ' 👂' : w.sight.penalty ? ' (dim)' : ''}
                            </span>
                          )}
                        </label>
                      </td>
                    );
                  })}
                  <td>{best == null ? <Pill tone="bad">Unwatched</Pill> : <b>{best}</b>}</td>
                </tr>
              );
            })}
            <tr>
              <td className="small muted">On watch</td>
              {pcs.map((c) => {
                const mins = load[c.id] ?? 0;
                const over = !c.hireling && mins > maxWatchMinutes(c.trance);
                return (
                  <td key={c.id} className={`small ${over ? 'bad-text' : ''}`}>
                    {mins ? formatDuration(mins) : '—'}
                    {over && ' ⚠'}
                  </td>
                );
              })}
              <td />
            </tr>
          </tbody>
        </table>
      </div>
      {overloaded.length > 0 && (
        <p className="small bad-text">
          {overloaded.map((c) => c.name).join(', ')} would watch longer than a Long Rest allows ({formatDuration(maxWatchMinutes(false))}, or {formatDuration(maxWatchMinutes(true))} for those who Trance) and
          would get no Long Rest benefits. Add more watchers or use shorter watches.
        </p>
      )}
      <div className="form-row">
        {s.characters.filter((c) => c.kind !== 'mount' && c.diedAt == null).map((c) => (
          <span key={c.id} className="field">
            <span className="field-label">{c.name}</span>
            <span className="inline-group">
              <Num value={c.passivePerception} onChange={(v) => edit((d) => void (d.characters.find((x) => x.id === c.id)!.passivePerception = Math.round(v)))} width={2} label="Passive" />
              <Num value={c.darkvision} onChange={(v) => edit((d) => void (d.characters.find((x) => x.id === c.id)!.darkvision = Math.max(0, Math.round(v))))} step={30} width={3} label="Darkvision ft" />
              <Toggle checked={c.trance} onChange={(v) => edit((d) => void (d.characters.find((x) => x.id === c.id)!.trance = v))} label="Trance" />
            </span>
          </span>
        ))}
      </div>
      <div className="form-row">
        <Num
          label="Encounter on d20 of (0 = off)"
          value={s.settings.encounterOn}
          onChange={(v) => edit((d) => void (d.settings.encounterOn = Math.max(0, Math.min(20, Math.round(v)))))}
          min={0}
          max={20}
          width={2}
        />
      </div>
      <Rule>
        Each watch is {formatDuration(len)}. A Long Rest allows up to 2 hours of light activity such as standing watch (4 hours for characters who Trance). In Dim Light passive Perception takes −5. In Darkness,
        anyone without Darkvision relies on hearing alone (👂), unless the campfire or a light source lasts the whole watch.
      </Rule>
    </Card>
  );
}

function MealsCard() {
  const s = useGame();
  const opts = useCharOptions();
  const [cook, setCook] = useState<string>('');
  return (
    <Card title="Meals" className="span-2">
      <div className="btn-row">
        <Select
          value={cook}
          onChange={setCook}
          options={[{ value: '', label: 'No cook check' }, ...opts, ...s.hirelings.filter((h) => h.active && h.role === 'cook').map((h) => ({ value: `h:${h.id}`, label: `${h.name} (hired cook, +${h.bonus})` }))]}
        />
        <button className="primary" disabled={!s.fire.lit} onClick={() => dispatch((st, c) => E.cookMeal(st, c, cook || null))} title={s.fire.lit ? '' : 'Light the fire first'}>
          Cook a hot meal (1 h)
        </button>
        <button onClick={() => dispatch((st, c) => E.partyEat(st, c, 'meal'))}>Cold meal for everyone</button>
        <button onClick={() => dispatch((st, c) => E.partyDrink(st, c, 'meal'))}>Everyone drinks</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Who</th>
              <th>Eaten today</th>
              <th>Rations</th>
              <th>Drunk today</th>
              <th>Waterskin</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {s.characters.map((c) => {
              const half = foodNeedLb(c) / 2;
              return (
                <tr key={c.id}>
                  <td>
                    <b>{c.name}</b>
                    {c.chef && c.treats > 0 && (
                      <button className="ghost small" onClick={() => dispatch((st, cx) => E.eatTreat(st, cx, c.id))}>
                        🍪 treat ({c.treats})
                      </button>
                    )}
                  </td>
                  <td>{fmtLb(c.ateLbToday)}</td>
                  <td>{fmtLb(c.rationsLb)}</td>
                  <td>{fmtWater(c.drankPintsToday)}</td>
                  <td>
                    {fmtWater(c.waterPints)} / {fmtWater(c.waterCapacityPints)}
                  </td>
                  <td className="btn-row tight">
                    <button onClick={() => dispatch((st, cx) => E.eat(st, cx, c.id, half, 'rations'))}>Eat ration ({fmtLb(half)})</button>
                    <button onClick={() => dispatch((st, cx) => E.eat(st, cx, c.id, half, 'stores'))}>Eat from stores</button>
                    <button onClick={() => dispatch((st, cx) => E.drink(st, cx, c.id, 2, 'personal'))}>Drink 2 pt</button>
                    <button onClick={() => dispatch((st, cx) => E.drink(st, cx, c.id, 2, 'stores'))}>Drink from stores</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Rule>
        Cooking uses Cook&apos;s Utensils with Wisdom. A DC 10 check makes the food taste better, which is flavor only. A Chef with Cook&apos;s Utensils adds their Proficiency Bonus (
        {s.characters
          .filter((c) => c.chef)
          .map((c) => `${c.name} +${proficiencyBonus(c.level)}`)
          .join(', ') || 'no Chefs in the party'}
        ).
      </Rule>
    </Card>
  );
}

function ForageCard() {
  const s = useGame();
  const opts = useCharOptions();
  const [who, setWho] = useState(opts[0]?.value ?? '');
  return (
    <Card title="Foraging">
      <p>
        {ABUNDANCE_LABEL[s.place.forage]}: <b>DC {FORAGE_DC[s.place.forage]}</b> Wisdom (Survival).
      </p>
      <Rule>On a success you find 1d6 + Wisdom modifier pounds of food and the same roll again in gallons of water. Spend an hour in camp, or forage while you travel (Slow pace gives Advantage, Fast gives Disadvantage).</Rule>
      <div className="btn-row">
        <Select value={who} onChange={setWho} options={opts} />
        <button className="primary" disabled={!who} onClick={() => dispatch((st, c) => E.forage(st, c, who))}>
          Forage (1 h)
        </button>
      </div>
    </Card>
  );
}

function HuntCard() {
  const s = useGame();
  const [source, setSource] = useState<'game' | 'bestiary'>('game');
  const [query, setQuery] = useState('');
  const list = (source === 'game' ? GAME_ANIMALS : s.bestiary).filter((c) => !query || c.name.toLowerCase().includes(query.toLowerCase()));
  const [pick, setPick] = useState('');
  const [count, setCount] = useState(1);
  const [who, setWho] = useState('');
  const cr = list.find((c) => `${c.name}|${c.source ?? ''}` === pick) ?? list[0];
  return (
    <Card title="Hunting and butchering">
      <div className="form-row">
        <Select
          label="From"
          value={source}
          onChange={(v) => (setSource(v), setPick(''))}
          options={[
            { value: 'game', label: `Common game (${GAME_ANIMALS.length})` },
            { value: 'bestiary', label: `Imported bestiary (${s.bestiary.length})` },
          ]}
        />
        <Text label="Search" value={query} onChange={setQuery} placeholder="e.g. boar" />
      </div>
      {source === 'bestiary' && s.bestiary.length === 0 && <p className="small muted">Import a 5etools bestiary JSON in Settings to hunt any creature.</p>}
      {cr && (
        <>
          <div className="form-row">
            <Select
              label="Kill"
              value={`${cr.name}|${cr.source ?? ''}`}
              onChange={setPick}
              options={list.slice(0, 300).map((c) => ({ value: `${c.name}|${c.source ?? ''}`, label: `${c.name} (${c.size} ${c.type}${c.source ? `, ${c.source}` : ''})` }))}
            />
            <Num label="How many" value={count} onChange={(v) => setCount(Math.max(1, Math.round(v)))} min={1} width={3} />
            <Select label="Butcher" value={who} onChange={setWho} options={[{ value: '', label: 'No check' }, ...s.characters.filter((c) => c.kind !== 'mount').map((c) => ({ value: c.id, label: c.name }))]} />
          </div>
          <p className="calc small">
            {isEdible(cr) ? (
              <>
                About <b>{MEAT_LB[cr.size] * count} lb</b> of raw meat in {formatDuration(BUTCHER_MINUTES[cr.size] * count)}
                {yieldsHide(cr) ? `, plus ${count} hide${count > 1 ? 's' : ''} for crafting` : ''}.{STRANGE_TYPES.includes(cr.type.toLowerCase()) ? ' Strange meat: ask your DM.' : ''}
              </>
            ) : (
              <span className="bad-text">A {cr.type} has no edible meat.</span>
            )}
          </p>
          <button className="primary" disabled={!isEdible(cr)} onClick={() => dispatch((st, cx) => E.butcher(st, cx, { creature: cr, count, butcherId: who || null }))}>
            Butcher
          </button>
        </>
      )}
      <Rule>
        Table rule: meat by size is Tiny 1 lb, Small 10, Medium 50, Large 200, Huge 1,000, Gargantuan 4,000. It lands in the camp stores as <b>raw food</b>, so cook it before eating. With a butcher, a DC {BUTCHER_DC} Wisdom
        (Survival) check stops half the meat going to waste. Constructs, elementals, oozes and undead give nothing.
      </Rule>
    </Card>
  );
}

function RulesCard() {
  return (
    <Card title="Survival rules at a glance" className="span-2">
      <div className="rules-grid">
        <div>
          <h3>Dehydration</h3>
          <p>Each day a creature needs water by size: Tiny ¼ gal, Small or Medium 1 gal, Large 4, Huge 16, Gargantuan 64. Drinking less than half gives 1 Exhaustion level at the end of the day. That Exhaustion can&apos;t be removed until the creature drinks a full day&apos;s water.</p>
        </div>
        <div>
          <h3>Malnutrition</h3>
          <p>Each day a creature needs food by size: Tiny ¼ lb, Small or Medium 1 lb, Large 4, Huge 16, Gargantuan 64. Eating something but less than half means a DC 10 Con save, or 1 Exhaustion level. After 5 days with nothing, the creature gains 1 level at the end of that day and every day after.</p>
        </div>
        <div>
          <h3>Exhaustion</h3>
          <p>Each level: −2 to D20 Tests and −5 ft Speed. Level 6 is death. Finishing a Long Rest removes 1 level.</p>
        </div>
        <div>
          <h3>Extreme temperatures</h3>
          <p>At 0 °F or below: DC 10 Con save each hour. At 100 °F or above with no water: Con save each hour, starting at DC 5 and going up by 1 each hour. A failure means 1 Exhaustion level.</p>
        </div>
      </div>
    </Card>
  );
}
