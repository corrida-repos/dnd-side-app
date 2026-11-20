import { useEffect, useState } from 'react';
import { useGame } from './state/store';
import * as E from './state/engine';
import { formatClock, formatDate, formatDuration, lightAt } from './rules/calendar';
import { weatherSummary, CLIMATES } from './rules/weather';
import { readSky } from './rules/skyclock';
import { Overview } from './components/Overview';
import { PartyTab } from './components/PartyTab';
import { CampTab } from './components/CampTab';
import { EncountersTab } from './components/EncountersTab';
import { MorningTab } from './components/MorningTab';
import { DowntimeTab } from './components/DowntimeTab';
import { BastionTab } from './components/BastionTab';
import { GearTab } from './components/GearTab';
import { EffectsTab } from './components/EffectsTab';
import { MoneyTab } from './components/MoneyTab';
import { WorldTab } from './components/WorldTab';
import { StorageTab } from './components/StorageTab';
import { LogTab } from './components/LogTab';
import { SettingsTab } from './components/SettingsTab';

const TABS = [
  { id: 'overview', label: 'Overview', el: Overview },
  { id: 'party', label: 'Party', el: PartyTab },
  { id: 'gear', label: 'Gear & Resources', el: GearTab },
  { id: 'effects', label: 'Effects & Lights', el: EffectsTab },
  { id: 'camp', label: 'Camp & Survival', el: CampTab },
  { id: 'encounters', label: 'Encounters', el: EncountersTab },
  { id: 'morning', label: 'Morning & Spells', el: MorningTab },
  { id: 'money', label: 'Money & Mounts', el: MoneyTab },
  { id: 'storage', label: 'Storage', el: StorageTab },
  { id: 'downtime', label: 'Downtime', el: DowntimeTab },
  { id: 'bastions', label: 'Bastions', el: BastionTab },
  { id: 'world', label: 'World', el: WorldTab },
  { id: 'log', label: 'Chronicle', el: LogTab },
  { id: 'settings', label: 'Settings', el: SettingsTab },
] as const;

type TabId = (typeof TABS)[number]['id'];

function readTab(): TabId {
  try {
    const t = localStorage.getItem('wayfarers-ledger:tab');
    if (t && TABS.some((x) => x.id === t)) return t as TabId;
  } catch {
    /* ignore */
  }
  return 'overview';
}

export function App() {
  const s = useGame();
  const [tab, setTab] = useState<TabId>(readTab);
  useEffect(() => {
    try {
      localStorage.setItem('wayfarers-ledger:tab', tab);
    } catch {
      /* ignore */
    }
  }, [tab]);
  const t = E.tempNow(s);
  const light = lightAt(s.minutes, E.seasonOf(s));
  const sky = readSky(s.minutes % 1440, E.seasonOf(s), s.weather, !!CLIMATES[s.weather.climate].noWeather);
  const Active = TABS.find((x) => x.id === tab)!.el;
  const pending = s.pending.length;
  const restWait = E.minutesUntilLongRest(s);
  const now = E.absNow(s);
  const nextEffect = [...s.effects].filter((e) => e.endsAt != null).sort((a, b) => a.endsAt! - b.endsAt!)[0];
  const debuffed = s.characters.filter((c) => c.exhaustion > 0 || c.sick || c.dying || c.stable || (c.poisonedUntil != null && c.poisonedUntil > now)).length;
  const danger = s.characters.filter((c) => c.exhaustion >= 3).length;
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">🔥</span>
          <span>
            <b>Wayfarer&apos;s Ledger</b>
            <small>{s.place.name}</small>
          </span>
        </div>
        <div className="status">
          <span className="status-item" title={s.settings.noTimepiece ? 'No timepiece: the sky is the only clock' : undefined}>
            {s.settings.noTimepiece ? (
              <b>{sky.phase}</b>
            ) : (
              <>
                <b>{formatClock(s.minutes)}</b> {light.phase}
              </>
            )}
          </span>
          <span className="status-item">{formatDate(s.calendar, s.startYear, s.dayIndex)}</span>
          <span className={`status-item ${t <= 0 ? 'cold' : t >= 100 ? 'hot' : ''}`}>
            <b>{t}°F</b> {weatherSummary(s.weather, t)}
          </span>
          {s.fire.lit && <span className="status-item good-text">🔥 {s.fire.fuelHours} h</span>}
          {nextEffect && (
            <button className="status-item status-link" onClick={() => setTab('effects')} title="Soonest-ending effect">
              {nextEffect.kind === 'light' ? '🕯' : '✨'} {nextEffect.name} {formatDuration(Math.max(0, nextEffect.endsAt! - now))}
            </button>
          )}
          <span className={`status-item ${restWait ? '' : 'good-text'}`} title="Only one Long Rest per 24 hours">
            🛏 {restWait ? `Long Rest in ${formatDuration(restWait)}` : 'Long Rest ready'}
          </span>
          {danger > 0 && <span className="status-item bad-text">⚠ {danger} badly exhausted</span>}
          {debuffed > 0 && (
            <button className="status-item status-link bad-text" onClick={() => setTab('overview')} title="See the Party status table on the Overview">
              ⚕ {debuffed} with debuffs
            </button>
          )}
        </div>
      </header>
      <nav className="tabs" role="tablist">
        {TABS.map((x) => (
          <button key={x.id} role="tab" aria-selected={tab === x.id} className={tab === x.id ? 'active' : ''} onClick={() => setTab(x.id)}>
            {x.label}
            {x.id === 'overview' && pending > 0 && <span className="badge">{pending}</span>}
          </button>
        ))}
      </nav>
      <main>
        <Active />
      </main>
      <footer className="foot muted small">
        Rules follow the 2024 Player&apos;s Handbook and Dungeon Master&apos;s Guide. Includes material from the System Reference Document 5.2 by Wizards of the Coast LLC, under the{' '}
        <a href="https://creativecommons.org/licenses/by/4.0/legalcode" target="_blank" rel="noreferrer">
          CC BY 4.0
        </a>{' '}
        license. Not affiliated with Wizards of the Coast or 5etools.
      </footer>
    </div>
  );
}
