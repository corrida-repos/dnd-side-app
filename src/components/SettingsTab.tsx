import { useRef, useState } from 'react';
import { useGame, edit, getState, importState, resetState } from '../state/store';
import { CALENDARS, dateFromIndex, indexFromDate, formatClock } from '../rules/calendar';
import { parse5eToolsSpells } from '../rules/spells';
import { Card, Num, Select, Toggle, Rule } from './common';
import { log } from '../state/engine';

export function SettingsTab() {
  return (
    <div className="grid">
      <DateCard />
      <RulesCard />
      <SpellLibraryCard />
      <SaveCard />
    </div>
  );
}

function DateCard() {
  const s = useGame();
  const d = dateFromIndex(s.calendar, s.startYear, s.dayIndex);
  const setDate = (year: number, month: number, day: number) =>
    edit((st) => {
      st.dayIndex = Math.max(0, indexFromDate(st.calendar, st.startYear, year, month, day));
    });
  return (
    <Card title="Calendar and clock">
      <Select
        label="Calendar"
        value={s.calendar.id}
        onChange={(id) =>
          edit((st) => {
            const keep = dateFromIndex(st.calendar, st.startYear, st.dayIndex);
            st.calendar = structuredClone(CALENDARS[id]);
            st.dayIndex = Math.max(0, indexFromDate(st.calendar, st.startYear, keep.year, Math.min(keep.monthIndex, st.calendar.months.length - 1), keep.day));
          })
        }
        options={Object.values(CALENDARS).map((c) => ({ value: c.id, label: c.name }))}
      />
      <div className="form-row">
        <Num label="Year" value={d.year} onChange={(v) => edit((st) => void (st.startYear = Math.round(v) - Math.floor(st.dayIndex / st.calendar.months.reduce((a, m) => a + m.days, 0))))} width={5} />
        <Select label="Month" value={String(d.monthIndex)} onChange={(v) => setDate(d.year, Number(v), d.day)} options={s.calendar.months.map((m, i) => ({ value: String(i), label: m.name }))} />
        <Num label="Day" value={d.day} onChange={(v) => setDate(d.year, d.monthIndex, Math.round(v))} min={1} max={d.month.days} width={3} />
      </div>
      <div className="form-row">
        <label className="field">
          <span className="field-label">Time</span>
          <input
            type="time"
            value={formatClock(s.minutes)}
            onChange={(e) => {
              const [h, m] = e.target.value.split(':').map(Number);
              if (!Number.isNaN(h) && !Number.isNaN(m)) edit((st) => void (st.minutes = h * 60 + m));
            }}
          />
        </label>
      </div>
      <Rule>Setting the date or time directly skips the hourly and end-of-day checks. To have them run, use the time buttons.</Rule>
    </Card>
  );
}

function RulesCard() {
  const s = useGame();
  const set = (k: Exclude<keyof typeof s.settings, 'rawFoodDC' | 'coldNightF' | 'encounterOn' | 'exploreEncounterOn' | 'moonOffset'>, v: boolean) => edit((d) => void (d.settings[k] = v));
  return (
    <Card title="Rules options">
      <div className="stack tight">
        <Toggle checked={s.settings.autoRollSaves} onChange={(v) => set('autoRollSaves', v)} label="Roll saving throws for me" />
        <Rule>When this is off, saves wait on the Overview so players can roll their own dice.</Rule>
        <Toggle checked={s.settings.fireWarmsCamp} onChange={(v) => set('fireWarmsCamp', v)} label="A lit campfire protects the camp from extreme cold (table rule)" />
        <Toggle checked={s.settings.coldNights} onChange={(v) => set('coldNights', v)} label="Cold nights: sleeping out without warm cover risks Exhaustion (table rule)" />
        {s.settings.coldNights && (
          <div className="form-row">
            <Num label="Cold night at or below" value={s.settings.coldNightF} onChange={(v) => edit((d) => void (d.settings.coldNightF = Math.round(v)))} min={-20} max={60} suffix="°F" width={3} />
          </div>
        )}
        <Rule>
          If the temperature drops to this point during a Long Rest, anyone sleeping in the open without a Bedroll, Blanket, cold weather gear, a lit campfire (when that rule is on) or a building or cave makes a DC 10 Con save when they
          wake, or gains 1 Exhaustion level. At 0 °F or below, the normal hourly extreme cold saves apply instead.
        </Rule>
        <Toggle checked={s.settings.sleepDeprivation} onChange={(v) => set('sleepDeprivation', v)} label="Staying awake too long causes Exhaustion (optional Xanathar's rule)" />
        <Rule>
          Each time the party passes another 24 hours without finishing a Long Rest, everyone makes a Con save or gains 1 Exhaustion level from Sleep deprivation. The DC is 10, plus 5 for every
          further 24 hours, and it resets after a Long Rest.
        </Rule>
        <Toggle checked={s.settings.chargeCosts} onChange={(v) => set('chargeCosts', v)} label="Charge costs to characters' gold (crafting, construction, lifestyle, wages, feed)" />
        <Toggle checked={s.settings.climateAdjustedPrecip} onChange={(v) => set('climateAdjustedPrecip', v)} label="Adjust the precipitation roll for climate (deserts drier, jungles wetter)" />
        <Rule>When this is off, the plain DMG d20 table is used everywhere.</Rule>
        <Toggle checked={s.settings.doubleWaterInHeat} onChange={(v) => set('doubleWaterInHeat', v)} label="Double water needs on days of 100 °F or hotter (2014 rule)" />
        <Toggle checked={s.settings.rawFoodRisk} onChange={(v) => set('rawFoodRisk', v)} label="Raw food can make you sick (table rule)" />
        {s.settings.rawFoodRisk && (
          <div className="form-row">
            <Num label="Raw food save DC" value={s.settings.rawFoodDC} onChange={(v) => edit((d) => void (d.settings.rawFoodDC = Math.round(v)))} min={1} max={30} width={3} />
          </div>
        )}
        <Rule>Eating raw food means a Con save, or the character is Sick: Poisoned until they finish a Long Rest. Cooking it or casting Purify Food and Drink makes it safe.</Rule>
        <Toggle checked={s.settings.wildNeedsPurifying} onChange={(v) => set('wildNeedsPurifying', v)} label="Questionable and foraged water must be purified (table rule)" />
        <Rule>Drinking unpurified water means a DC 10 Con save, or the character is Poisoned for 1 hour. Purify Food and Drink or boiling makes it safe.</Rule>
        <Toggle checked={s.settings.sleepInArmorPenalty} onChange={(v) => set('sleepInArmorPenalty', v)} label="Sleeping in Medium or Heavy armor spoils the Long Rest (optional Xanathar's rule)" />
      </div>
    </Card>
  );
}

function SpellLibraryCard() {
  const s = useGame();
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const load = (raw: string) => {
    try {
      const spells = parse5eToolsSpells(JSON.parse(raw));
      if (!spells.length) {
        setMsg('No spells found. Expected 5etools format: { "spell": [ { "name", "level", "school", "source" } ] }.');
        return;
      }
      edit((d) => {
        const keyOf = (x: { name: string; source?: string }) => `${x.name}|${x.source ?? ''}`.toLowerCase();
        const have = new Set(d.spellLibrary.map(keyOf));
        const added = spells.filter((x) => !have.has(keyOf(x)));
        d.spellLibrary = [...d.spellLibrary, ...added].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
        log(d, `Imported ${added.length} spells into the spell library.`);
      });
      setMsg(`Read ${spells.length} spells.`);
      setText('');
    } catch (e) {
      setMsg(`Couldn't read that JSON: ${(e as Error).message}`);
    }
  };
  return (
    <Card title={`Spell library (${s.spellLibrary.length})`}>
      <Rule>
        Load spell data you have access to, such as a 5etools <code>spells-xphb.json</code> file. Only the name, level, school, source and ritual/concentration flags are kept. No book text is stored, and the app ships with no
        spell data.
      </Rule>
      <div className="btn-row">
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) load(await f.text());
            if (fileRef.current) fileRef.current.value = '';
          }}
        />
      </div>
      <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="…or paste JSON here" />
      <div className="btn-row">
        <button disabled={!text.trim()} onClick={() => load(text)}>
          Import pasted JSON
        </button>
        {s.spellLibrary.length > 0 && (
          <button className="ghost bad" onClick={() => confirm('Empty the spell library? Character spell lists are kept.') && edit((d) => void (d.spellLibrary = []))}>
            Empty library
          </button>
        )}
      </div>
      {msg && <p className="small">{msg}</p>}
    </Card>
  );
}

function SaveCard() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  return (
    <Card title="Save data">
      <Rule>Everything is saved in this browser automatically. Export a file to back it up or move it to another device.</Rule>
      <div className="btn-row">
        <button
          onClick={() => {
            const blob = new Blob([JSON.stringify(getState(), null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `wayfarers-ledger-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(a.href);
          }}
        >
          Export save
        </button>
        <button onClick={() => fileRef.current?.click()}>Import save</button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              setMsg(importState(JSON.parse(await f.text())) ? 'Save loaded.' : "That file doesn't look like a Wayfarer's Ledger save.");
            } catch {
              setMsg("Couldn't read that file.");
            }
            e.target.value = '';
          }}
        />
        <button className="bad" onClick={() => confirm('Erase everything and start over?') && resetState()}>
          Start over
        </button>
      </div>
      {msg && <p className="small">{msg}</p>}
    </Card>
  );
}
