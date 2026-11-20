import { useState } from 'react';
import { useGame, dispatch, edit } from '../state/store';
import * as E from '../state/engine';
import { CLIMATES, environmentEffects, temperatureAt, weatherSummary, type ClimateId, type Weather } from '../rules/weather';
import { formatClock, formatDate, formatDuration } from '../rules/calendar';
import { ABUNDANCE_LABEL, PACES, foodNeedLb, waterNeedPints, fmtLb, fmtWater } from '../rules/survival';
import { Card, Meter, Num, Pill, Select, Text, Toggle } from './common';
import { Debuffs } from './Debuffs';
import type { Abundance, Pace, Shelter, WaterQuality } from '../state/types';

export function Overview() {
  return (
    <div className="grid">
      <ClockCard />
      <WeatherCard />
      <EffectsCard />
      <PendingCard />
      <PartyStatusCard />
      <TravelCard />
      <PlaceCard />
      <RecentLog />
    </div>
  );
}

function ClockCard() {
  const s = useGame();
  const [custom, setCustom] = useState(30);
  const lr = E.canLongRest(s);
  const adv = (m: number) => dispatch((st, c) => E.advance(st, c, m, 'camp'));
  return (
    <Card title="Time" className="span-2">
      <div className="clock">
        <div className="clock-time">{formatClock(s.minutes)}</div>
        <div className="clock-date">{formatDate(s.calendar, s.startYear, s.dayIndex)}</div>
      </div>
      <div className="btn-row">
        <button onClick={() => adv(10)}>+10 min</button>
        <button onClick={() => adv(60)}>+1 hour</button>
        <button onClick={() => adv(240)}>+4 hours</button>
        <span className="inline-group">
          <Num value={custom} onChange={setCustom} min={1} max={10080} suffix="min" width={4} />
          <button onClick={() => adv(custom)}>Advance</button>
        </span>
      </div>
      <div className="btn-row">
        <button onClick={() => dispatch((st, c) => E.advanceTo(st, c, 6 * 60, 'camp'))}>Skip to 06:00</button>
        <button onClick={() => dispatch((st, c) => E.advanceTo(st, c, 12 * 60, 'camp'))}>Skip to noon</button>
        <button onClick={() => dispatch((st, c) => E.advanceTo(st, c, 18 * 60, 'camp'))}>Skip to 18:00</button>
      </div>
      <div className="btn-row">
        <button className="primary" onClick={() => dispatch(E.shortRest)}>
          Short Rest (1 h)
        </button>
        <button className="primary" disabled={!lr.ok} title={lr.reason} onClick={() => dispatch((st, c) => E.longRest(st, c, false))}>
          Long Rest (8 h)
        </button>
      </div>
      <LongRestTracker />
      <RestPlans />
    </Card>
  );
}

function RestPlans() {
  const s = useGame();
  const plans = s.characters
    .filter((c) => c.restFocus)
    .map((c) => {
      const it = c.items.find((i) => i.id === c.restFocus!.itemId);
      const verb = c.restFocus!.action === 'attune' ? 'attunes to' : c.restFocus!.action === 'identify' ? 'identifies' : 'ends attunement to';
      return it ? `${c.name} ${verb} the ${it.name}` : null;
    })
    .filter(Boolean);
  if (!plans.length) return null;
  return <p className="small good-text">During the next rest: {plans.join('; ')}.</p>;
}

function LongRestTracker() {
  const s = useGame();
  const wait = E.minutesUntilLongRest(s);
  const since = E.minutesSinceLongRest(s);
  const pct = since == null ? 100 : Math.min(100, (since / E.LONG_REST_COOLDOWN) * 100);
  return (
    <div className="rest-tracker">
      <div className="rest-tracker-head">
        {wait > 0 ? (
          <>
            <b>Long Rest in {formatDuration(wait)}</b>
            <span className="muted small"> · possible from {formatClock((s.minutes + wait) % E.MIN_PER_DAY)}{s.minutes + wait >= E.MIN_PER_DAY ? ' tomorrow' : ''}</span>
          </>
        ) : (
          <b className="good-text">Long Rest available</b>
        )}
        <span className="muted small"> · {since == null ? 'no Long Rest tracked yet' : `${formatDuration(since)} since the last one ended`}</span>
      </div>
      {s.settings.sleepDeprivation && <SleepLine />}
      <span className="meter wide-meter" role="meter" aria-valuenow={Math.round(pct)} aria-valuemax={100}>
        <span className={`meter-fill ${wait > 0 ? 'meter-warn' : 'meter-good'}`} style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}

function SleepLine() {
  const s = useGame();
  const awake = E.minutesAwake(s);
  const next = E.nextSleepCheck(s);
  const tone = next.inMinutes <= 4 * 60 || awake >= E.MIN_PER_DAY ? 'bad-text' : next.inMinutes <= 8 * 60 ? 'warn-text' : 'muted';
  return (
    <div className={`small ${tone}`}>
      Awake for {formatDuration(awake)}. Sleep deprivation save (DC {next.dc}) in {formatDuration(next.inMinutes)} unless the party finishes a Long Rest.
    </div>
  );
}

function WeatherCard() {
  const s = useGame();
  const w = s.weather;
  const t = E.tempNow(s);
  const clim = CLIMATES[w.climate];
  const setW = (patch: Partial<Weather>) =>
    edit((d) => {
      d.weather = { ...d.weather, ...patch, edited: true };
      d.weatherHistory = [d.weather, ...d.weatherHistory.filter((x) => x.dayIndex !== d.dayIndex)];
    });
  const curve = [0, 3, 6, 9, 12, 15, 18, 21].map((h) => ({ h, t: temperatureAt(w, h * 60) }));
  return (
    <Card
      title="Weather today"
      actions={
        <button className="ghost" onClick={() => dispatch(E.rerollWeather)} title="Roll today's weather again">
          Reroll
        </button>
      }
    >
      <div className="weather-now">
        <span className="temp">{t}°F</span>
        <span>
          {weatherSummary(w, t)}
          <br />
          <span className="muted small">
            High {w.high}°F · Low {w.low}°F · {clim.label}, {w.season}
          </span>
        </span>
      </div>
      <div className="curve">
        {curve.map((p) => (
          <span key={p.h} className={p.t <= 0 ? 'cold' : p.t >= 100 ? 'hot' : ''}>
            <b>{p.t}°</b>
            <small>{String(p.h).padStart(2, '0')}h</small>
          </span>
        ))}
      </div>
      {!clim.noWeather && (
        <details>
          <summary>Rolls and manual override</summary>
          <ul className="rolls">
            <li>
              Temperature d20: <b>{w.tempRoll}</b>{' '}
              {w.tempShift === 0 ? '(normal for the season)' : `(${w.tempShift > 0 ? 'warmer' : 'colder'} by ${Math.abs(w.tempShift)}°F)`}. Base {w.baseHigh}/{w.baseLow}°F
              {w.altitudeAdj ? `, altitude ${w.altitudeAdj}°F` : ''}.
            </li>
            <li>
              Wind d20: <b>{w.windRoll}</b> → {w.wind}
            </li>
            <li>
              Precipitation d20: <b>{w.precipRoll}</b>
              {w.precipAdj ? ` ${w.precipAdj > 0 ? '+' : ''}${w.precipAdj} climate` : ''} → {w.precip}
            </li>
          </ul>
          <div className="form-row">
            <Num label="High °F" value={w.high} onChange={(v) => setW({ high: v })} />
            <Num label="Low °F" value={w.low} onChange={(v) => setW({ low: v })} />
            <Select label="Wind" value={w.wind} options={['none', 'light', 'strong'] as const} onChange={(v) => setW({ wind: v })} />
            <Select label="Precipitation" value={w.precip} options={['none', 'light', 'heavy'] as const} onChange={(v) => setW({ precip: v })} />
          </div>
        </details>
      )}
      {s.weatherHistory.length > 1 && (
        <div className="history">
          {s.weatherHistory.slice(1, 7).map((h) => (
            <span key={h.dayIndex} title={formatDate(s.calendar, s.startYear, h.dayIndex)}>
              {h.high}/{h.low}° {h.precip !== 'none' ? (h.precip === 'heavy' ? '⛈' : '🌧') : h.wind === 'strong' ? '💨' : '☀'}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

function EffectsCard() {
  const s = useGame();
  const uncovered = s.characters.filter((c) => c.exhaustion < 6 && !E.hasWarmCover(c)).map((c) => c.name);
  const effects = environmentEffects({
    weather: s.weather,
    tempNow: E.tempNow(s),
    place: s.place,
    fire: s.fire,
    minutes: s.minutes,
    coldNightF: s.settings.coldNights && !(s.fire.lit && s.settings.fireWarmsCamp) ? s.settings.coldNightF : null,
    uncovered,
  });
  return (
    <Card title="Conditions right now">
      <ul className="effects">
        {effects.map((e) => (
          <li key={e.id} className={`effect effect-${e.tone}`}>
            <b>{e.title}</b>
            <span>{e.detail}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function PendingCard() {
  const s = useGame();
  if (!s.pending.length) return null;
  return (
    <Card title={`Saving throws to resolve (${s.pending.length})`} className="span-2 attention">
      <ul className="pending">
        {s.pending.map((p) => {
          const c = E.charById(s, p.charId);
          return (
            <li key={p.id}>
              <span>
                <b>{c?.name ?? '?'}</b>: Con save DC {p.dc} vs {p.reason}
                {p.mode !== 'normal' && <Pill tone="warn">{p.mode}</Pill>} <span className="muted small">{p.stamp}</span>
              </span>
              <span className="btn-row tight">
                <button onClick={() => dispatch((st, cx) => E.resolvePending(st, cx, p.id, 'roll'))}>Roll</button>
                <button className="good" onClick={() => dispatch((st, cx) => E.resolvePending(st, cx, p.id, 'pass'))}>
                  Pass
                </button>
                <button className="bad" onClick={() => dispatch((st, cx) => E.resolvePending(st, cx, p.id, 'fail'))}>
                  Fail
                </button>
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function PartyStatusCard() {
  const s = useGame();
  const exp = E.exposure(s, 'camp');
  const t = E.tempNow(s);
  const hot = s.weather.high >= 100;
  return (
    <Card title="Party status" className="span-2">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Debuffs</th>
              <th>Food today</th>
              <th>Water today</th>
              <th>Carrying</th>
              <th>Temperature</th>
            </tr>
          </thead>
          <tbody>
            {s.characters.map((c) => {
              const fNeed = foodNeedLb(c);
              const wNeed = waterNeedPints(c, hot, s.settings.doubleWaterInHeat);
              let tempStatus = 'Comfortable';
              let tone: 'good' | 'warn' | 'bad' | 'muted' = 'muted';
              if (t <= 0) {
                const prot = E.coldProtection(c);
                tempStatus = !exp.cold ? exp.reason : prot ? prot : 'Exposed to the cold';
                tone = !exp.cold || prot ? 'good' : 'bad';
              } else if (t >= 100) {
                const prot = E.heatProtection(c, E.hasDrinkableWater(s, c, 'camp'));
                tempStatus = !exp.heat ? exp.reason : prot ? prot : `Exposed to the heat (hour ${c.heatHours})`;
                tone = !exp.heat || prot ? 'good' : 'bad';
              }
              return (
                <tr key={c.id}>
                  <td>
                    <b>{c.name}</b>
                    <div className="muted small">
                      {c.className} {c.level} · {c.size}
                    </div>
                  </td>
                  <td>
                    <Debuffs c={c} now={E.absNow(s)} />
                    {c.armorKind !== 'none' && !c.armorWorn && <Pill tone="warn">Armor off</Pill>}
                    {s.settings.coldNights && s.weather.low <= s.settings.coldNightF && !E.hasWarmCover(c) && <Pill tone="warn" title="No Bedroll, Blanket or cold weather gear for tonight">No warm cover</Pill>}
                  </td>
                  <td>
                    {c.needsFood ? (
                      <>
                        <Meter value={c.ateLbToday} max={fNeed} /> {fmtLb(c.ateLbToday)} / {fmtLb(fNeed)}
                      </>
                    ) : (
                      <span className="muted">Doesn't eat</span>
                    )}
                  </td>
                  <td>
                    {c.needsWater ? (
                      <>
                        <Meter value={c.drankPintsToday} max={wNeed} /> {fmtWater(c.drankPintsToday)} / {fmtWater(wNeed)}
                      </>
                    ) : (
                      <span className="muted">Doesn't drink</span>
                    )}
                  </td>
                  <td className="small">
                    {fmtLb(c.rationsLb)} rations
                    <br />
                    {fmtWater(c.waterPints)} water{c.waterUnsafe && <span className="bad-text"> (unpurified)</span>}
                  </td>
                  <td>
                    <Pill tone={tone}>{tempStatus}</Pill>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="btn-row">
        <button onClick={() => dispatch((st, c) => E.partyEat(st, c, 'meal'))}>Everyone eats a meal</button>
        <button onClick={() => dispatch((st, c) => E.partyDrink(st, c, 'meal'))}>Everyone drinks half a day's water</button>
        <button onClick={() => dispatch((st, c) => E.partyEat(st, c, 'topup'))}>Top up today's food</button>
        <button onClick={() => dispatch((st, c) => E.partyDrink(st, c, 'topup'))}>Top up today's water</button>
      </div>
      <p className="muted small">
        Camp stores: {fmtLb(s.stores.foodLb)} food, {s.stores.waterGal} gal water{s.stores.foodRawLb + s.stores.waterUnsafeGal > 0 ? `, plus ${fmtLb(s.stores.foodRawLb)} raw food and ${s.stores.waterUnsafeGal} gal water still to cook or purify` : ''}. Survival is checked at midnight: drinking less than half your water gives 1 Exhaustion level. Eating less than half your food
        means a DC 10 Con save. After 5 days with no food you gain a level every day.
      </p>
    </Card>
  );
}

function TravelCard() {
  const s = useGame();
  const [hours, setHours] = useState(4);
  const [pace, setPace] = useState<Pace>(s.travel.pace);
  const [difficult, setDifficult] = useState(false);
  const [foragers, setForagers] = useState<string[]>([]);
  const p = PACES[pace];
  const miles = hours * p.mph * (difficult ? 0.5 : 1);
  const counted = s.travel.hoursToday + hours * (s.place.altitudeFt >= 10000 ? 2 : 1);
  return (
    <Card title="Travel">
      <div className="form-row">
        <Num label="Hours" value={hours} onChange={(v) => setHours(Math.round(v))} min={1} max={24} />
        <Select
          label="Pace"
          value={pace}
          onChange={setPace}
          options={[
            { value: 'slow', label: 'Slow (2 mph)' },
            { value: 'normal', label: 'Normal (3 mph)' },
            { value: 'fast', label: 'Fast (4 mph)' },
          ]}
        />
        <Toggle checked={difficult} onChange={setDifficult} label="Difficult Terrain (half speed)" />
      </div>
      <p className="small">
        {p.note}. About <b>{+miles.toFixed(1)} miles</b>. {s.travel.hoursToday} travel hour(s) since the last Long Rest
        {counted > 8 && (
          <span className="bad-text">
            {' '}
            · forced march: {counted - Math.max(8, s.travel.hoursToday)} hour(s) past 8, each needing a Con save (DC {11 + Math.max(0, s.travel.hoursToday - 8)}
            {counted - Math.max(8, s.travel.hoursToday) > 1 ? ` to ${10 + (counted - 8)}` : ''}) or 1 Exhaustion level from Forced march
          </span>
        )}
        .
      </p>
      <div className="field">
        <span className="field-label">Forage along the way (Wisdom (Survival), DC {({ abundant: 10, limited: 15, scarce: 20 } as const)[s.place.forage]})</span>
        <div className="chips">
          {s.characters.map((c) => (
            <Toggle
              key={c.id}
              checked={foragers.includes(c.id)}
              onChange={(v) => setForagers(v ? [...foragers, c.id] : foragers.filter((x) => x !== c.id))}
              label={c.name}
            />
          ))}
        </div>
      </div>
      <div className="btn-row">
        <button className="primary" onClick={() => dispatch((st, c) => E.travel(st, c, { hours, pace, difficult, foragerIds: foragers }))}>
          Travel {hours} h
        </button>
        <button className="ghost" onClick={() => edit((d) => ((d.travel.hoursToday = 0), (d.travel.milesToday = 0)))}>
          Reset travel day
        </button>
      </div>
    </Card>
  );
}

function PlaceCard() {
  const s = useGame();
  const set = (patch: Partial<typeof s.place>) => edit((d) => void (d.place = { ...d.place, ...patch }));
  return (
    <Card
      title="Place"
      actions={
        <button className="ghost" onClick={() => dispatch(E.rerollWeather)} title="Roll today's weather again for the new climate">
          Roll weather for here
        </button>
      }
    >
      <div className="form-row">
        <Text label="Location" value={s.place.name} onChange={(v) => set({ name: v })} wide />
        <Text label="Terrain" value={s.place.terrain} onChange={(v) => set({ terrain: v })} />
      </div>
      <div className="form-row">
        <Select
          label="Climate"
          value={s.place.climate}
          onChange={(v: ClimateId) => set({ climate: v })}
          options={(Object.keys(CLIMATES) as ClimateId[]).map((k) => ({ value: k, label: CLIMATES[k].label }))}
        />
        <Num label="Altitude" value={s.place.altitudeFt} onChange={(v) => set({ altitudeFt: v })} step={500} suffix="ft" width={6} />
        <Select
          label="Shelter"
          value={s.place.shelter}
          onChange={(v: Shelter) => set({ shelter: v })}
          options={[
            { value: 'none', label: 'Open sky' },
            { value: 'tent', label: 'Tents' },
            { value: 'building', label: 'Building / inn' },
            { value: 'cave', label: 'Cave' },
          ]}
        />
      </div>
      <div className="form-row">
        <Select
          label="Foraging"
          value={s.place.forage}
          onChange={(v: Abundance) => set({ forage: v })}
          options={(['abundant', 'limited', 'scarce'] as Abundance[]).map((k) => ({ value: k, label: ABUNDANCE_LABEL[k] }))}
        />
        <Toggle checked={s.place.settlement} onChange={(v) => set({ settlement: v })} label="Town or city (lifestyle covers meals)" />
        <Toggle checked={s.place.waterSource} onChange={(v) => set({ waterSource: v })} label="Water source nearby" />
        {s.place.waterSource && (
          <Select
            label="Water quality"
            value={s.place.waterQuality}
            onChange={(v: WaterQuality) => set({ waterQuality: v })}
            options={[
              { value: 'clean', label: 'Clean (well, spring, town)' },
              { value: 'questionable', label: 'Questionable (needs purifying)' },
            ]}
          />
        )}
      </div>
    </Card>
  );
}

function RecentLog() {
  const s = useGame();
  return (
    <Card title="Recent events" className="span-2">
      <ul className="log">
        {s.log.slice(0, 12).map((l) => (
          <li key={l.id} className={`log-${l.tone}`}>
            <span className="muted small">{l.stamp}</span> {l.text}
          </li>
        ))}
        {!s.log.length && <li className="muted">Nothing has happened yet. Advance time, travel or rest to begin.</li>}
      </ul>
    </Card>
  );
}
