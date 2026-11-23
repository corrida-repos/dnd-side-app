import { DANGER, DANGERS, type Danger } from '../rules/encounters';
import { useState } from 'react';
import { useGame, dispatch, edit } from '../state/store';
import * as E from '../state/engine';
import { attentionItems } from './attention';
import { PlayerSummaryCard } from './PlayerTodos';
import { PartyJobsCard } from './PartyJobs';
import { goTo } from './nav';
import { CLIMATES, environmentEffects, temperatureAt, weatherSummary, type ClimateId, type Weather } from '../rules/weather';
import { formatClock, formatDate, formatDuration } from '../rules/calendar';
import { PACES, foodNeedLb, waterNeedPints, fmtLb, fmtWater } from '../rules/survival';
import { Card, Meter, Num, Pill, Rule, Select, Text, Toggle } from './common';
import { Debuffs } from './Debuffs';
import { focusOn } from './focus';
import { groupLog, senseText } from './senseView';
import type { Pace, Shelter, WaterQuality } from '../state/types';
import { TERRAIN, TERRAIN_FOR_CLIMATE, maxPaceFor, type TerrainType } from '../rules/terrain';
import { readSky, rangeLabel } from '../rules/skyclock';
import { DEEP_SNOW_IN, groundDifficulty, OBSTACLES } from '../rules/ground';
import { WaysAround } from './WaysAround';
import type { TopicId } from '../rules/shortcuts';
import { CARTOGRAPHER, IMPROVISED_MAP_DC, IMPROVISED_STARGAZE_DC, MAP_DC, NAVIGATOR, STARGAZE_DC, mapName } from '../rules/tools';
import { CHART_DC } from '../rules/uncharted';

/**
 * The DM's dashboard, in the order play needs it: what is waiting on you, how the party is doing,
 * what the world is doing to them, then the clock and who does which job.
 */
export function Overview() {
  return (
    <div className="grid">
      <AttentionCard />
      <PlayerSummaryCard />
      <PendingCard />
      <PartyStatusCard />
      <EffectsCard />
      <WeatherCard />
      <ClockCard />
      <PartyJobsCard />
      <RecentLog />
    </div>
  );
}

/** Getting from place to place: the travel controls, journey stages and where the party is. */
export function TravelTab() {
  return (
    <div className="grid">
      <TravelCard />
      <PlaceCard />
      <JourneyCard />
    </div>
  );
}

function AttentionCard() {
  const s = useGame();
  const [showSecret, setShowSecret] = useState(true);
  const items = attentionItems(s).filter((i) => showSecret || !i.dmOnly);
  const secrets = attentionItems(s).some((i) => i.dmOnly);
  return (
    <Card title={<>Needs attention {items.length > 0 && <Pill tone={items.some((i) => i.tone === 'bad') ? 'bad' : 'warn'}>{items.length}</Pill>}</>} className={`attention ${items.length ? 'span-2' : 'quiet'}`}>
      {items.length === 0 ? (
        <p className="muted small">Nothing waiting on you.</p>
      ) : (
        <ul className="plain attention-list">
          {items.map((i) => (
            <li key={i.id} className={`attention-item ${i.tone}`}>
              <span>
                {i.dmOnly && <Pill tone="muted">DM only</Pill>} {i.text}
              </span>
              {i.tab !== 'overview' && (
                <button className="ghost small" onClick={() => (i.charId ? focusOn(i.charId, i.tab) : goTo(i.tab))}>
                  Open
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {secrets && (
        <button className="ghost tiny" onClick={() => setShowSecret(!showSecret)} title="Hide secrets when players can see the screen">
          {showSecret ? 'Hide DM-only items' : 'Show DM-only items'}
        </button>
      )}
    </Card>
  );
}

function ClockCard() {
  const s = useGame();
  const [custom, setCustom] = useState(30);
  const lr = E.canLongRest(s);
  const adv = (m: number) => dispatch((st, c) => E.advance(st, c, m, 'camp'));
  const [peek, setPeek] = useState(false);
  const sky = readSky(s.minutes % 1440, E.seasonOf(s), s.weather, !!CLIMATES[s.weather.climate].noWeather);
  const hidden = s.settings.noTimepiece && !peek;
  return (
    <Card title="Time" className="span-2">
      <div className="clock">
        <div className="clock-time">{hidden ? sky.phase : formatClock(s.minutes)}</div>
        <div className="clock-date">{formatDate(s.calendar, s.startYear, s.dayIndex)}</div>
        {s.settings.noTimepiece && (
          <button className="ghost small" onClick={() => setPeek(!peek)} title="For the DM: show or hide the exact clock">
            {peek ? 'Hide exact time' : 'DM: show exact time'}
          </button>
        )}
      </div>
      <SkyLine />
      <div className="btn-row">
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
      <InterruptPanel />
      <RestPlans />
      <WaysAround topic={s.settings.noTimepiece ? ['timekeeping', 'shortRest', 'longRest'] : ['shortRest', 'longRest', 'timekeeping']} />
    </Card>
  );
}

function InterruptPanel() {
  const s = useGame();
  const [kind, setKind] = useState<'long' | 'short'>('long');
  const [after, setAfter] = useState(180);
  const [reason, setReason] = useState<E.InterruptReason>('combat');
  const [noise, setNoise] = useState<'loud' | 'quiet'>('quiet');
  const [dc, setDc] = useState(12);
  const [resume, setResume] = useState(true);
  const total = kind === 'long' ? 480 : 60;
  const breaks = reason !== 'disturbance';
  let outcome: string;
  if (!breaks) outcome = 'Sleepers may wake, then everyone goes back to sleep. The rest still counts.';
  else if (kind === 'short') outcome = 'An interrupted Short Rest gives no benefits.';
  else if (resume) outcome = `The party resumes afterwards: ${formatDuration(total - after + 60)} more (1 extra hour), then full Long Rest benefits.`;
  else outcome = after >= 60 ? 'The Long Rest is abandoned, with Short Rest benefits because at least 1 hour had passed.' : 'The Long Rest is abandoned less than an hour in, with no benefits.';
  return (
    <details className="interrupt">
      <summary>Interrupt a rest</summary>
      <div className="form-row">
        <Select
          label="Rest"
          value={kind}
          onChange={(v) => (setKind(v), setAfter(Math.min(after, v === 'long' ? 479 : 59)))}
          options={[
            { value: 'long', label: 'Long Rest (8 h)' },
            { value: 'short', label: 'Short Rest (1 h)' },
          ]}
        />
        <Num label="Interrupted after" value={after} onChange={(v) => setAfter(Math.max(0, Math.min(total - 1, Math.round(v))))} min={0} max={total - 1} step={kind === 'long' ? 30 : 10} suffix="min" width={4} />
        <Select label="What happens" value={reason} onChange={setReason} options={(Object.keys(E.INTERRUPT_LABEL) as E.InterruptReason[]).map((k) => ({ value: k, label: E.INTERRUPT_LABEL[k] }))} />
      </div>
      {kind === 'long' && (
        <div className="form-row">
          {reason === 'disturbance' ? (
            <>
              <Select
                label="How loud"
                value={noise}
                onChange={setNoise}
                options={[
                  { value: 'quiet', label: 'Quiet (sleepers make a passive Perception check)' },
                  { value: 'loud', label: 'Loud (wakes everyone)' },
                ]}
              />
              {noise === 'quiet' && <Num label="DC to notice" value={dc} onChange={(v) => setDc(Math.round(v))} width={2} />}
            </>
          ) : (
            <Toggle checked={resume} onChange={setResume} label="Resume the rest afterwards (+1 hour)" />
          )}
        </div>
      )}
      <p className="small">{outcome}</p>
      <button
        className="primary"
        onClick={() => dispatch((st, cx) => E.interruptedRest(st, cx, { kind, after, reason, noise: breaks ? 'loud' : noise, dc, resume }))}
        disabled={kind === 'long' && !E.canLongRest(s).ok}
      >
        Rest, interrupted after {formatDuration(Math.max(1, after))}
      </button>
      <Rule>
        In 2024, a rest is broken by rolling Initiative, casting a spell other than a cantrip, taking damage, or 1 hour of walking or exertion. Whoever is on watch is awake. Sleepers notice a quiet threat if their passive Perception
        − 5 (asleep, table rule) meets the DC, a loud one wakes everyone, and anyone still asleep needs someone to use an action to shake them awake. Characters unconscious from wounds can&apos;t be shaken awake.
      </Rule>
    </details>
  );
}

function SkyLine() {
  const s = useGame();
  const sky = readSky(s.minutes % 1440, E.seasonOf(s), s.weather, !!CLIMATES[s.weather.climate].noWeather);
  const pcs = s.characters.filter((c) => c.kind !== 'mount' && c.diedAt == null);
  const [who, setWho] = useState(pcs[0]?.id ?? '');
  return (
    <div className="sky">
      <p className="small">
        <b>
          {sky.phase} ({rangeLabel(sky)})
        </b>
        : {sky.cue}
      </p>
      <div className="btn-row tight">
        <Select value={who} onChange={setWho} options={pcs.map((c) => ({ value: c.id, label: c.name }))} />
        <button className="small" disabled={!who} onClick={() => dispatch((st, cx) => E.readTheSky(st, cx, who))}>
          Read the sky (Survival DC {({ clear: 10, overcast: 15, none: 20 } as const)[sky.view]})
        </button>
      </div>
      <p className="small muted">Table rule: a success also hints at tomorrow&apos;s weather; beating the DC by 5 reads it exactly, and tomorrow holds to it.</p>
    </div>
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

/** The weather topics, most pressing first: heat or cold when extreme, then storms, then altitude. */
function conditionTopics(temp: number, w: { wind: string; precip: string }, altitudeFt: number): TopicId[] {
  const score: Record<'cold' | 'heat' | 'weather' | 'altitude', number> = {
    cold: temp <= 0 ? 4 : temp <= 32 ? 1 : 0,
    heat: temp >= 100 ? 4 : temp >= 90 ? 1 : 0,
    weather: w.wind === 'strong' || w.precip === 'heavy' ? 3 : 0,
    altitude: altitudeFt >= 10000 ? 2 : 0,
  };
  return (['cold', 'heat', 'weather', 'altitude'] as const).slice().sort((a, b) => score[b] - score[a]);
}

function EffectsCard() {
  const s = useGame();
  const aff = E.currentAffinities(s);
  const uncovered = s.characters.filter((c) => c.exhaustion < 6 && !E.hasWarmCover(c)).map((c) => c.name);
  const effects = environmentEffects({
    weather: s.weather,
    tempNow: E.tempNow(s),
    place: s.place,
    fire: s.fire,
    minutes: s.minutes,
    coldNightF: s.settings.coldNights && !E.campfireWarms(s) ? s.settings.coldNightF : null,
    uncovered,
  });
  return (
    <Card title="Conditions right now">
      <ul className="effects">
        {aff.length > 0 && (
          <li className="effect effect-info">
            <b>Weather and damage (table rule)</b>
            <span className="affinities">
              {aff.map((a) => (
                <Pill key={a.type} tone={a.dir > 0 ? 'good' : 'bad'} title={a.why}>
                  {a.type} {a.dir > 0 ? '+1' : '−1'} per die
                </Pill>
              ))}
            </span>
            <span>
              {aff.map((a) => `${a.type} ${a.dir > 0 ? 'favored' : 'hindered'} by ${a.why}`).join('; ')}. Favored damage deals +1 per damage die. Hindered damage deals −1 per die, minimum 1 per die.
            </span>
          </li>
        )}
        {effects.map((e) => (
          <li key={e.id} className={`effect effect-${e.tone}`}>
            <b>{e.title}</b>
            <span>{e.detail}</span>
          </li>
        ))}
      </ul>
      <WaysAround topic={conditionTopics(E.tempNow(s), s.weather, s.place.altitudeFt)} />
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
              <th>HP</th>
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
                const prot = E.coldProtection(c, 'camp', s.settings.coldGear2014);
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
                    <button className="link" onClick={() => focusOn(c.id)} title={`Open ${c.name}'s character sheet`}>
                      <b>{c.name}</b>
                    </button>
                    <div className="muted small">
                      {c.className} {c.level} · {c.size}
                    </div>
                  </td>
                  <td className="nowrap">
                    <button className="link" onClick={() => focusOn(c.id, 'gear')} title={`Damage, heal and Hit Point Dice for ${c.name}`}>
                      <b className={c.hp === 0 ? 'bad-text' : c.hp * 2 < c.maxHp ? 'warn-text' : ''}>
                        {c.hp}/{c.maxHp}
                      </b>
                    </button>
                    {c.tempHp > 0 && <span className="muted small"> +{c.tempHp}</span>}
                    <br />
                    <Meter value={c.hp} max={c.maxHp} tone={c.hp * 2 >= c.maxHp ? 'good' : c.hp > 0 ? 'warn' : 'bad'} />
                  </td>
                  <td>
                    <Debuffs c={c} now={E.absNow(s)} load={E.carriedLoad(s, c)} />
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
      <WaysAround topic={['exhaustion', 'saves', 'dying', 'fear']} />
    </Card>
  );
}

function TravelCard() {
  const s = useGame();
  const [hours, setHours] = useState(4);
  const [pace, setPace] = useState<Pace>(s.travel.pace);
  const [difficult, setDifficult] = useState(false);
  const [foragers, setForagers] = useState<string[]>(s.travel.foragerIds ?? []);
  const [navigator, setNavigator] = useState<string>(s.travel.navigatorId ?? s.characters.filter((c) => c.kind !== 'mount').sort((a, b) => b.survival - a.survival)[0]?.id ?? '');
  const nav = E.currentNavigationDC(s);
  const [gallop, setGallop] = useState(false);
  const [flying, setFlying] = useState(false);
  const [againstWind, setAgainstWind] = useState(false);
  const [downstream, setDownstream] = useState(false);
  const slow = E.slowTravelers(s);
  const vessels = s.stashes.filter((x) => x.speedMph);
  const [vesselId, setVesselId] = useState('');
  const [seeker, setSeeker] = useState(s.characters[0]?.id ?? '');
  const [seekBonus, setSeekBonus] = useState(0);
  const [starBonus, setStarBonus] = useState(0);
  const navChar = s.characters.find((c) => c.id === navigator);
  const navHasTools = !!navChar?.inventory.some((i) => NAVIGATOR.test(i.name));
  const hasMap = E.partyHasMapHere(s);
  const stars = E.starsVisible(s);
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
        {s.characters.some((c) => c.kind === 'mount') && (
          <Toggle checked={gallop} onChange={setGallop} label={s.travel.gallopUsed ? 'Gallop (mounts need a rest first)' : 'Gallop: double distance for 1 hour'} />
        )}
        <Toggle checked={flying} onChange={setFlying} label="Flying, or ignoring Difficult Terrain (Fast pace anywhere)" />
        {vesselId && <Toggle checked={againstWind} onChange={setAgainstWind} label="Sailing into the wind" />}
        {vesselId && <Toggle checked={downstream} onChange={setDownstream} label="Downstream on a river" />}
        {vessels.length > 0 && (
          <Select
            label="Aboard"
            value={vesselId}
            onChange={setVesselId}
            options={[{ value: '', label: 'On foot or mounted' }, ...vessels.map((v) => ({ value: v.id, label: `${v.name} (${v.speedMph} mph)` }))]}
          />
        )}
      </div>
      {groundDifficulty(s.place.ground, s.place.goodRoad) && !vesselId && !flying && <p className="small warn-text">The ground ({groundDifficulty(s.place.ground, s.place.goodRoad)}) makes this Difficult Terrain: half speed (table rule).</p>}
      {(s.place.ground?.snowIn ?? 0) > 0 && !groundDifficulty(s.place.ground, s.place.goodRoad) && <p className="small muted">{s.place.ground!.snowIn} inches of snow on the ground (Difficult Terrain at {DEEP_SNOW_IN}).</p>}
      {slow.length > 0 && !vesselId && <p className="small warn-text">{slow.join(', ')} {slow.length > 1 ? 'are' : 'is'} at half Speed or less (load or Exhaustion): the party must travel at a Slow pace.</p>}
      <p className="small">
        {p.note}. About <b>{+miles.toFixed(1)} miles</b>. {s.travel.hoursToday} travel hour(s) since the last Long Rest
        {s.settings.forcedMarch && counted > 8 && (
          <span className="bad-text">
            {' '}
            · forced march: {counted - Math.max(8, s.travel.hoursToday)} hour(s) past 8, each needing a Con save (DC {11 + Math.max(0, s.travel.hoursToday - 8)}
            {counted - Math.max(8, s.travel.hoursToday) > 1 ? ` to ${10 + (counted - 8)}` : ''}) or 1 Exhaustion level from Forced march
          </span>
        )}
        .
      </p>
      <div className="form-row">
        <Select
          label="Navigator"
          value={navigator}
          onChange={setNavigator}
          options={[
            { value: '', label: 'Nobody (no check)' },
            ...s.characters.filter((c) => c.kind !== 'mount').map((c) => ({ value: c.id, label: `${c.name} (Survival ${c.survival >= 0 ? '+' : ''}${c.survival})` })),
            ...s.hirelings.filter((h) => h.active && h.role === 'guide').map((h) => ({ value: `h:${h.id}`, label: `${h.name}, hired guide (Survival +${h.bonus})` })),
          ]}
        />
        <span className="small">
          {nav.dc == null ? (
            <span className="muted">Following a road, river or coast: no check needed.</span>
          ) : (
            <>
              Navigation: <b>DC {nav.dc}</b> <span className="muted">({nav.reasons.join(', ')})</span>
            </>
          )}
        </span>
      </div>
      {(navHasTools || hasMap) && nav.dc != null && (
        <div className="btn-row tight">
          {navHasTools && <Toggle checked={!!s.travel.navTools} onChange={(v) => edit((d) => void (d.travel.navTools = v))} label="Navigator uses Navigator's Tools (Advantage if proficient in Survival and the tools)" />}
          {hasMap && <span className="small good-text">The party has a {mapName(s.place.name)}: +5 to Survival checks to find the way here (2024 PHB).</span>}
        </div>
      )}
      {s.travel.lost && (
        <>
          <p className="small bad-text">
            The party is lost: {+s.travel.milesOffCourse.toFixed(1)} miles off course so far. The navigator can try again in {Math.max(0, s.travel.lostRecheckIn)} travel hour(s).{' '}
            <button className="ghost small" onClick={() => dispatch(E.foundTheWay)}>
              Found the way
            </button>
          </p>
          <div className="btn-row tight">
            {stars ? (
              <>
                {navHasTools && (
                  <>
                    <Num label="Wis + tools bonus" value={starBonus} onChange={(v) => setStarBonus(Math.round(v))} width={2} />
                    <button className="small" onClick={() => dispatch((st, cx) => E.stargaze(st, cx, navigator, true, starBonus))}>
                      Stargaze with Navigator&apos;s Tools (DC {STARGAZE_DC}, 10 min)
                    </button>
                  </>
                )}
                {s.settings.improvised && (
                  <button className="small ghost" onClick={() => dispatch((st, cx) => E.stargaze(st, cx, navigator, false, 0))}>
                    Read the stars by eye (Survival DC {IMPROVISED_STARGAZE_DC}, 20 min)
                  </button>
                )}
              </>
            ) : (
              <span className="small muted">A clear night above ground would let the navigator fix the party&apos;s position by the stars.</span>
            )}
          </div>
        </>
      )}
      <div className="field">
        <span className="field-label">Forage along the way (Wisdom (Survival), DC {TERRAIN[s.place.terrain].forageDC}; finds food and water for each day of the trip)</span>
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
        <button className="primary" onClick={() => dispatch((st, c) => E.travel(st, c, { hours, pace, difficult, foragerIds: foragers, navigatorId: navigator || null, gallop, vesselId: vesselId || null, flying, againstWind, downstream }))}>
          Travel {hours} h
        </button>
        <button className="ghost" onClick={() => edit((d) => ((d.travel.hoursToday = 0), (d.travel.milesToday = 0)))}>
          Reset travel day
        </button>
      </div>
      <div className="btn-row tight">
        <span className="small">Search or track (DC {TERRAIN[s.place.terrain].searchDC}):</span>
        <Select value={seeker} onChange={setSeeker} options={s.characters.filter((c) => c.kind !== 'mount').map((c) => ({ value: c.id, label: c.name }))} />
        <Num value={seekBonus} onChange={(v) => setSeekBonus(Math.round(v))} width={2} />
        <button className="small" onClick={() => dispatch((st, cx) => E.searchCheck(st, cx, seeker, 'search', seekBonus))}>
          Search (Perception)
        </button>
        <button className="small" onClick={() => dispatch((st, cx) => E.searchCheck(st, cx, seeker, 'track', seekBonus))}>
          Track (Survival)
        </button>
      </div>
      <WaysAround topic={['march', 'lost']} />
    </Card>
  );
}

function JourneyCard() {
  const s = useGame();
  const [name, setName] = useState('');
  const [miles, setMiles] = useState(24);
  const [terrain, setTerrain] = useState<TerrainType>(s.place.terrain);
  const [onRoute, setOnRoute] = useState(true);
  const [goodRoad, setGoodRoad] = useState(true);
  const [difficult, setDifficult] = useState(false);
  const [uncharted, setUncharted] = useState(false);
  const [pace, setPace] = useState<Pace>('normal');
  const [camp, setCamp] = useState(true);
  const [vesselId, setVesselId] = useState('');
  const [mapperId, setMapperId] = useState('');
  const unchartedOn = s.settings.unchartedLand;
  const cartographers = s.characters.filter((c) => c.kind !== 'mount' && E.alive(c) && c.inventory.some((i) => CARTOGRAPHER.test(i.name)));
  const vessels = s.stashes.filter((x) => x.speedMph);
  const left = s.journey.filter((x) => !x.done);
  return (
    <Card title="Journey">
      {s.journey.length === 0 && <p className="muted small">Plan a trip in stages: each has a distance and a terrain, and runs day by day until it&apos;s done.</p>}
      <ul className="plain">
        {s.journey.map((st) => (
          <li key={st.id} className="facility">
            <div className="armor-row">
              <span>
                <b>{st.name}</b>{' '}
                <span className="muted small">
                  {unchartedOn && st.uncharted && !st.done ? `about ${st.miles}` : unchartedOn && st.uncharted && st.trueMiles ? st.trueMiles : st.miles} mi · {TERRAIN[st.terrain].label}
                  {unchartedOn && st.uncharted ? (E.partyHasMapOf(s, st.name) ? ', charted' : ', uncharted') : ''}
                  {st.onRoute ? ', on a road or river' : ''}
                  {st.goodRoad ? ', good road' : ''}
                  {st.difficult ? ', difficult' : ''}
                </span>{' '}
                {st.done ? <Pill tone="good">Done</Pill> : null}
              </span>
              <span className="btn-row tight">
                {!st.done && (
                  <button className="small primary" onClick={() => dispatch((st2, cx) => E.runStage(st2, cx, st.id, { pace, foragerIds: s.travel.foragerIds ?? [], navigatorId: s.travel.navigatorId, vesselId: vesselId || null, mapperId: mapperId || null }, camp))}>
                    Run stage
                  </button>
                )}
                <button className="ghost tiny" aria-label={`Remove ${st.name}`} onClick={() => edit((d) => void (d.journey = d.journey.filter((x) => x.id !== st.id)))}>
                  ✕
                </button>
              </span>
            </div>
            {!st.done && st.milesDone > 0 && (
              <div className="small">
                {unchartedOn && st.uncharted ? (
                  <>
                    {st.milesDone} miles so far of about {st.miles}
                    {st.milesDone >= st.miles ? ' (further than the party guessed)' : ''}
                  </>
                ) : (
                  <>
                    <Meter value={st.milesDone} max={st.miles} tone="good" /> {st.milesDone}/{st.miles} miles
                  </>
                )}
              </div>
            )}
            {!st.done && <StageObstacles stageId={st.id} />}
          </li>
        ))}
      </ul>
      {left.length > 0 && (
        <div className="form-row">
          <Select
            label="Pace"
            value={pace}
            onChange={setPace}
            options={[
              { value: 'slow', label: 'Slow' },
              { value: 'normal', label: 'Normal' },
              { value: 'fast', label: 'Fast' },
            ]}
          />
          {vessels.length > 0 && <Select label="Aboard" value={vesselId} onChange={setVesselId} options={[{ value: '', label: 'On foot or mounted' }, ...vessels.map((v) => ({ value: v.id, label: v.name }))]} />}
          <Toggle checked={camp} onChange={setCamp} label="Camp each night (eat, drink, Long Rest)" />
          {unchartedOn && left.some((x) => x.uncharted) && (
            <Select
              label="Charts the way"
              value={mapperId}
              onChange={setMapperId}
              options={[{ value: '', label: 'Nobody' }, ...cartographers.map((c) => ({ value: c.id, label: `${c.name} (Cartographer's Tools)` }))]}
            />
          )}
        </div>
      )}
      <details>
        <summary>Add a stage</summary>
        <div className="form-row">
          <Text label="Stage" value={name} onChange={setName} placeholder="e.g. Through the Mournland edge" />
          <Num label="Miles" value={miles} onChange={(v) => setMiles(Math.max(1, Math.round(v)))} min={1} width={4} />
          <Select label="Terrain" value={terrain} onChange={setTerrain} options={(Object.keys(TERRAIN) as TerrainType[]).map((k) => ({ value: k, label: TERRAIN[k].label }))} />
        </div>
        <div className="chips">
          <Toggle checked={onRoute} onChange={setOnRoute} label="On a road, river or landmark" />
          <Toggle checked={goodRoad} onChange={setGoodRoad} label="Good road" />
          <Toggle checked={difficult} onChange={setDifficult} label="Difficult Terrain" />
          {unchartedOn && <Toggle checked={uncharted} onChange={setUncharted} label="Uncharted (the miles are only a guess)" />}
        </div>
        <button
          onClick={() => {
            edit((d) => void d.journey.push({ id: Math.random().toString(36).slice(2), name: name.trim() || `Stage ${d.journey.length + 1}`, miles, terrain, onRoute, goodRoad, difficult, milesDone: 0, done: false, notes: '', ...(unchartedOn && uncharted ? { uncharted: true } : {}) }));
            setName('');
          }}
        >
          Add stage
        </button>
      </details>
      <Rule>Each day of a stage the party travels up to 8 hours (vessels sail around the clock), with one navigation check, then camps if you choose. Food and water are used each day, and the weather, hazards and Exhaustion all apply.</Rule>
      {unchartedOn && (
        <Rule>
          Table rule: on an uncharted stage the miles are the party&apos;s guess. The real distance is rolled when they set out (it can be up to half as far again) and learned on arrival, so pack spare food. A mapper with Cartographer&apos;s Tools, not travelling at a Fast pace, makes a Wisdom check (DC {CHART_DC}) on arrival to chart the way: the Map gives +5 to find it next time (2024 PHB).
        </Rule>
      )}
      <WaysAround topic={['tracking', 'march']} />
    </Card>
  );
}

function MapLine() {
  const s = useGame();
  const pcs = s.characters.filter((c) => c.kind !== 'mount' && E.alive(c));
  const [who, setWho] = useState('');
  const [bonus, setBonus] = useState(0);
  const tooled = pcs.filter((c) => c.inventory.some((i) => CARTOGRAPHER.test(i.name)));
  const whoId = pcs.find((c) => c.id === who)?.id ?? tooled[0]?.id ?? pcs[0]?.id ?? '';
  const hasTools = tooled.some((c) => c.id === whoId);
  if (E.partyHasMapHere(s)) return <p className="small good-text">The party carries a {mapName(s.place.name)}: +5 to Survival checks to find the way here (2024 PHB).</p>;
  if (!hasTools && !s.settings.improvised) return null;
  return (
    <div className="btn-row tight">
      <Select label="Map maker" value={whoId} onChange={setWho} options={pcs.map((c) => ({ value: c.id, label: `${c.name}${tooled.includes(c) ? " (Cartographer's Tools)" : ''}` }))} />
      <Num label="Wis bonus" value={bonus} onChange={(v) => setBonus(Math.round(v))} width={2} />
      <button className="small" onClick={() => dispatch((st, cx) => E.draftMap(st, cx, whoId, hasTools, bonus))}>
        Draft a {mapName(s.place.name)} ({hasTools ? `Cartographer's Tools, DC ${MAP_DC}, 1 h` : `paper and charcoal, DC ${IMPROVISED_MAP_DC}, 2 h`})
      </button>
    </div>
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
        <Select
          label="Terrain"
          value={s.place.terrain}
          onChange={(v: TerrainType) => set({ terrain: v })}
          options={(Object.keys(TERRAIN) as TerrainType[]).map((k) => ({ value: k, label: TERRAIN[k].label }))}
        />
        <Select label="Danger" value={s.place.danger} onChange={(v: Danger) => set({ danger: v })} options={DANGERS.map((d) => ({ value: d, label: DANGER[d].label }))} />
      </div>
      <p className="small muted">
        {TERRAIN[s.place.terrain].label}: fastest pace {maxPaceFor(s.place.terrain, s.place.goodRoad)}, foraging DC {TERRAIN[s.place.terrain].forageDC}, navigation DC {TERRAIN[s.place.terrain].navigationDC}, search DC{' '}
        {TERRAIN[s.place.terrain].searchDC}, encounters at {TERRAIN[s.place.terrain].encounterDistance}. {DANGER[s.place.danger].label} danger: random encounter check every {DANGER[s.place.danger].everyHours} h on {DANGER[s.place.danger].on}+ (see the Encounters tab).
      </p>
      <MapLine />
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
        <Toggle checked={s.place.onRoute} onChange={(v) => set({ onRoute: v })} label="Following a road, river or landmark (no navigation check)" />
        <Toggle checked={s.place.goodRoad} onChange={(v) => set({ goodRoad: v })} label="Good road (fastest pace one step faster)" />
        {s.place.terrain !== TERRAIN_FOR_CLIMATE[s.place.climate] && (
          <button className="ghost small" onClick={() => set({ terrain: TERRAIN_FOR_CLIMATE[s.place.climate] })}>
            Typical for {CLIMATES[s.place.climate].label}: {TERRAIN[TERRAIN_FOR_CLIMATE[s.place.climate]].label}
          </button>
        )}
        <Toggle checked={s.place.settlement} onChange={(v) => set({ settlement: v })} label="Town or city (lifestyle covers meals during downtime)" />
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
        {groupLog(s.log.slice(0, 16)).slice(0, 12).map((l) => (
          <li key={l.id} className={`log-${l.tone}`}>
            <span className="muted small">{l.stamp}</span> {l.text}
            {l.sense && <span className="sense">{senseText(s, l.charIds ?? [], l.sense)}</span>}
          </li>
        ))}
        {!s.log.length && <li className="muted">Nothing has happened yet. Advance time, travel or rest to begin.</li>}
      </ul>
    </Card>
  );
}

function StageObstacles({ stageId }: { stageId: string }) {
  const s = useGame();
  const st = s.journey.find((x) => x.id === stageId)!;
  const [preset, setPreset] = useState(OBSTACLES[0].name);
  const [bonus, setBonus] = useState(0);
  const [leader, setLeader] = useState('');
  const people = s.characters.filter((c) => E.alive(c));
  const leaderId = people.find((c) => c.id === leader)?.id ?? people[0]?.id ?? '';
  const obs = st.obstacles ?? [];
  const p = OBSTACLES.find((x) => x.name === preset)!;
  return (
    <details className="add-facility">
      <summary className="small">Obstacles{obs.length ? ` (${obs.filter((o) => !o.resolved).length} to resolve)` : ''}</summary>
      <ul className="plain small">
        {obs.map((o) => (
          <li key={o.id} className="btn-row tight">
            <b>{o.name}</b> · {o.check} DC {o.dc}
            {o.group ? ' (group)' : ''}
            {o.resolved ? (
              <Pill tone={o.resolved === 'passed' ? 'good' : 'bad'}>{o.resolved === 'passed' ? 'Passed' : 'Failed'}</Pill>
            ) : (
              <>
                {!o.group && <Select value={leaderId} onChange={setLeader} options={people.map((c) => ({ value: c.id, label: c.name }))} />}
                <Num value={bonus} onChange={setBonus} width={3} label="Bonus" />
                <button className="small" onClick={() => dispatch((st2, cx) => E.resolveObstacle(st2, cx, st.id, o.id, bonus, leaderId))}>
                  Attempt
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      <div className="btn-row tight">
        <Select value={preset} onChange={setPreset} options={OBSTACLES.map((x) => x.name)} />
        <button className="small" onClick={() => dispatch((st2, cx) => E.addObstacle(st2, cx, st.id, { name: p.name, check: p.check, dc: p.dc, group: p.group, consequence: p.consequence, amount: p.amount, condition: p.condition, minutes: p.minutes }))}>
          Add obstacle
        </button>
      </div>
      <p className="small muted">
        {p.note} Failure: {p.consequence === 'delay' ? `${p.amount} hours lost` : p.consequence === 'exhaustion' ? `${p.amount} Exhaustion level(s) each` : p.consequence === 'damage' ? `${p.amount} damage each` : `${p.condition}${p.minutes ? '' : ' until removed by magic'}`}.
      </p>
      <Rule>2024 DMG journey challenges: get past an obstacle with a good plan or a check; failure costs time, Exhaustion, damage or a condition. Group checks pass when at least half succeed. DCs and consequences are table rules.</Rule>
    </details>
  );
}
