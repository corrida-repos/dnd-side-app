import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGame, dispatch, undo, undoLabel, useVersion } from './state/store';
import { attentionItems } from './components/attention';
import * as E from './state/engine';
import { formatClock, formatDate, formatDuration } from './rules/calendar';
import { weatherSummary, CLIMATES } from './rules/weather';
import { readSky } from './rules/skyclock';
import { Overview, TravelTab } from './components/Overview';
import { PlayerTodosTab } from './components/PlayerTodos';
import { CampTab } from './components/CampTab';
import { EncountersTab } from './components/EncountersTab';
import { DowntimeTab } from './components/DowntimeTab';
import { BastionTab } from './components/BastionTab';
import { EffectsTab } from './components/EffectsTab';
import { MoneyTab } from './components/MoneyTab';
import { WorldTab } from './components/WorldTab';
import { StorageTab } from './components/StorageTab';
import { LogTab } from './components/LogTab';
import { SettingsTab } from './components/SettingsTab';
import { WaysTab } from './components/WaysAround';
import { goTo, onGoTo } from './components/nav';
import { Num } from './components/common';
import { JumpBar } from './components/JumpBar';
import { CharactersTab } from './components/CharactersTab';
import { SHEET_ALIASES, setSection } from './components/focus';

const TABS = [
  { id: 'overview', label: 'Dashboard', el: Overview },
  { id: 'travel', label: 'Travel', el: TravelTab },
  { id: 'camp', label: 'Camp & Survival', el: CampTab },
  { id: 'encounters', label: 'Encounters', el: EncountersTab },
  { id: 'effects', label: 'Effects & Ailments', el: EffectsTab },
  { id: 'todos', label: 'Player checklists', el: PlayerTodosTab },
  { id: 'party', label: 'Characters', el: CharactersTab },
  { id: 'downtime', label: 'Downtime', el: DowntimeTab },
  { id: 'bastions', label: 'Bastions', el: BastionTab },
  { id: 'money', label: 'Town & Money', el: MoneyTab },
  { id: 'storage', label: 'Transport & Storage', el: StorageTab },
  { id: 'world', label: 'World', el: WorldTab },
  { id: 'log', label: 'Chronicle', el: LogTab },
  { id: 'ways', label: 'Ways Around', el: WaysTab },
  { id: 'settings', label: 'Settings', el: SettingsTab },
] as const;

type TabId = (typeof TABS)[number]['id'];

/** Tabs grouped the way a session runs: at the table, the party, between adventures, the wider world. */
const SECTIONS: { id: string; label: string; key: string; tabs: TabId[] }[] = [
  { id: 'table', label: 'At the table', key: '1', tabs: ['overview', 'travel', 'camp', 'encounters', 'effects'] },
  { id: 'party', label: 'Party', key: '2', tabs: ['todos', 'party'] },
  { id: 'between', label: 'Between adventures', key: '3', tabs: ['downtime', 'bastions', 'money', 'storage'] },
  { id: 'world', label: 'World', key: '4', tabs: ['world', 'log', 'ways', 'settings'] },
];
const sectionOf = (t: TabId) => SECTIONS.find((x) => x.tabs.includes(t))!;

function readTab(): TabId {
  try {
    const t = localStorage.getItem('wayfarers-ledger:tab');
    if (t && TABS.some((x) => x.id === t)) return t as TabId;
    if (t && t in SHEET_ALIASES) {
      setSection(SHEET_ALIASES[t]);
      return 'party';
    }
  } catch {
    /* ignore */
  }
  return 'overview';
}

const typing = (e: KeyboardEvent) => {
  const el = e.target as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
};

/**
 * The rarer time moves, folded under the bar: any number of minutes, skipping to a time of day, or setting the date.
 * The panel is drawn on the page body, under its button, because the bar scrolls sideways on phones and would clip it.
 */
function MoreTime() {
  const [at, setAt] = useState<{ top: number; left: number } | null>(null);
  const [mins, setMins] = useState(30);
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const done = () => setAt(null);
  useEffect(() => {
    if (!at) return;
    const away = (e: Event) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !btn.current?.contains(t)) done();
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && done();
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    window.addEventListener('scroll', done, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', esc);
      window.removeEventListener('scroll', done);
    };
  }, [at]);
  const toggle = () => {
    if (at) return done();
    const r = btn.current!.getBoundingClientRect();
    setAt({ top: r.bottom + 6, left: Math.max(16, Math.min(r.left, window.innerWidth - 300)) });
  };
  const to = (m: number, label: string) => (dispatch((st, c) => E.advanceTo(st, c, m, 'camp'), `skipping to ${label}`), done());
  return (
    <>
      <button ref={btn} className={`small dm-more-btn ${at ? 'open' : ''}`} aria-expanded={!!at} aria-haspopup="true" onClick={toggle} title="Advance by any amount, or skip to a time of day">
        More time ▾
      </button>
      {at &&
        createPortal(
          <div ref={panel} className="dm-more-panel" role="dialog" aria-label="More time" style={{ top: at.top, left: at.left }}>
            <span className="inline-group">
              <Num value={mins} onChange={setMins} min={1} max={10080} suffix="min" width={4} />
              <button className="small" onClick={() => (dispatch((st, c) => E.advance(st, c, mins, 'camp'), `${mins} minutes passing`), done())}>
                Advance
              </button>
            </span>
            <span className="btn-row tight">
              <button className="small" onClick={() => to(6 * 60, '06:00')}>To 06:00</button>
              <button className="small" onClick={() => to(12 * 60, 'noon')}>To noon</button>
              <button className="small" onClick={() => to(18 * 60, '18:00')}>To 18:00</button>
            </span>
            <button className="ghost small" onClick={() => (goTo('world'), done())} title="Calendar, date and time setup on the World tab">
              Set the date or time…
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}

/** Always-visible DM controls: the clock, quick time steps, rests, Undo and what needs attention. */
function DmBar({ onAttention }: { onAttention: () => void }) {
  const s = useGame();
  useVersion();
  const label = undoLabel();
  const lr = E.canLongRest(s);
  const adv = (m: number) => dispatch((st, c) => E.advance(st, c, m, 'camp'), `${m < 60 ? `${m} minutes` : `${m / 60} hour${m > 60 ? 's' : ''}`} passing`);
  const items = attentionItems(s);
  const urgent = items.some((i) => i.tone === 'bad');
  return (
    <div className="dm-bar" role="toolbar" aria-label="Time and quick actions">
      <span className="dm-clock">
        <b>{s.settings.noTimepiece ? readSky(s.minutes % 1440, E.seasonOf(s), s.weather, !!CLIMATES[s.weather.climate].noWeather).phase : formatClock(s.minutes)}</b>
      </span>
      <button className="small" onClick={() => adv(10)} title="Advance 10 minutes">+10m</button>
      <button className="small" onClick={() => adv(60)} title="Advance 1 hour">+1h</button>
      <button className="small" onClick={() => adv(240)} title="Advance 4 hours">+4h</button>
      <MoreTime />
      <button className="small" onClick={() => dispatch((st, c) => E.shortRest(st, c), 'the Short Rest')} title="Short Rest: 1 hour">Short Rest</button>
      <button className="small" disabled={!lr.ok} onClick={() => dispatch((st, c) => E.longRest(st, c), 'the Long Rest')} title={lr.ok ? 'Long Rest: 8 hours' : lr.reason}>
        Long Rest
      </button>
      <button className="small ghost" disabled={!label} onClick={undo} title={label ? `Undo: ${label}` : 'Nothing to undo'}>
        ↶ Undo
      </button>
      <button className={`small attention-btn ${items.length ? (urgent ? 'bad' : 'warn') : ''}`} onClick={onAttention} title="What needs your attention">
        {items.length ? `⚑ ${items.length} to handle` : '✓ All clear'}
      </button>
    </div>
  );
}

export function App() {
  const s = useGame();
  const [tab, setTab] = useState<TabId>(readTab);
  useEffect(
    () =>
      onGoTo((t) => {
        // The Characters tab took in Gear & Resources and Spells & Morning: their old names open those sections.
        if (t in SHEET_ALIASES) {
          setSection(SHEET_ALIASES[t]);
          t = 'party';
        }
        if (TABS.some((x) => x.id === t)) {
          setTab(t as TabId);
          window.scrollTo(0, 0);
        }
      }),
    [],
  );
  useEffect(() => {
    try {
      localStorage.setItem('wayfarers-ledger:tab', tab);
    } catch {
      /* ignore */
    }
  }, [tab]);
  const mainRef = useRef<HTMLElement>(null);
  const t = E.tempNow(s);
  const Active = TABS.find((x) => x.id === tab)!.el;
  const section = sectionOf(tab);
  const [lastInSection, setLastInSection] = useState<Record<string, TabId>>({});
  useEffect(() => setLastInSection((m) => ({ ...m, [section.id]: tab })), [tab, section.id]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typing(e)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const sec = SECTIONS.find((x) => x.key === e.key);
      if (sec) setTab(lastInSection[sec.id] ?? sec.tabs[0]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lastInSection]);
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
          <span className="brand-mark">🎲</span>
          <span>
            <b>D&amp;D Life Manager</b>
            <small>{s.place.name}</small>
          </span>
        </div>
        <div className="status">
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
          <span className={`status-item hide-phone ${restWait ? '' : 'good-text'}`} title="Only one Long Rest per 24 hours">
            🛏 {restWait ? `Long Rest in ${formatDuration(restWait)}` : 'Long Rest ready'}
          </span>
          {danger > 0 && <span className="status-item bad-text hide-phone">⚠ {danger} badly exhausted</span>}
          {debuffed > 0 && (
            <button className="status-item status-link bad-text hide-phone" onClick={() => setTab('overview')} title="See the Party status table on the Dashboard">
              ⚕ {debuffed} with debuffs
            </button>
          )}
        </div>
      </header>
      <DmBar
        onAttention={() => {
          setTab('overview');
          window.scrollTo(0, 0);
        }}
      />
      <nav className="sections" aria-label="Sections">
        {SECTIONS.map((x) => (
          <button key={x.id} className={section.id === x.id ? 'active' : ''} onClick={() => setTab(lastInSection[x.id] ?? x.tabs[0])} title={`Shortcut: ${x.key}`}>
            {x.label}
          </button>
        ))}
      </nav>
      <nav className="tabs" role="tablist">
        {section.tabs.map((id) => {
          const x = TABS.find((t) => t.id === id)!;
          return (
            <button key={x.id} role="tab" aria-selected={tab === x.id} className={tab === x.id ? 'active' : ''} onClick={() => setTab(x.id)}>
              {x.label}
              {x.id === 'overview' && pending > 0 && <span className="badge">{pending}</span>}
            </button>
          );
        })}
      </nav>
      {tab !== 'ways' && <JumpBar root={mainRef} tab={tab} />}
      <main ref={mainRef}>
        {s.tacticalEncounter && tab !== 'encounters' && <div className="btn-row">
          <button onClick={() => setTab('encounters')}>Review encounter · {s.tacticalEncounter.title}</button>
        </div>}
        <Active />
      </main>
      <footer className="foot muted small">
        Rules follow the 2024 Player&apos;s Handbook and Dungeon Master&apos;s Guide. Includes material from the System Reference Document 5.2 by Wizards of the Coast LLC, under the{' '}
        <a href="https://creativecommons.org/licenses/by/4.0/legalcode" target="_blank" rel="noreferrer">
          CC BY 4.0
        </a>{' '}
        license. Random encounter tables also list creatures from other Dungeons &amp; Dragons books by name and Challenge Rating only, as a reference for owners of those books. Not affiliated with Wizards of the Coast or 5etools.
      </footer>
    </div>
  );
}
