import { useRef, useState } from 'react';
import { useGame, edit, getState, importState, resetState } from '../state/store';
import { CALENDARS, dateFromIndex, indexFromDate, formatClock } from '../rules/calendar';
import { parse5eToolsSpells } from '../rules/spells';
import { countReprinted, parse5eToolsBestiary, type Creature } from '../rules/hunting';
import { RECOMMENDED_BESTIARIES } from '../rules/encounters';
import { parse5eToolsItems, parse5eToolsRecipes, parse5eToolsRewards, parse5eToolsSpellClasses } from '../rules/hazards';
import { Card, Num, Select, Toggle, Rule } from './common';
import { log } from '../state/engine';

export function SettingsTab() {
  return (
    <div className="grid">
      <DateCard />
      <RulesCard />
      <SpellLibraryCard />
      <BestiaryCard />
      <LibrariesCard />
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
  const set = (k: Exclude<keyof typeof s.settings, 'rawFoodDC' | 'coldNightF' | 'encounterOn' | 'exploreEncounterOn' | 'moonOffset' | 'stressPerLongRest' | 'fearPerLongRest' | 'lifestylePeriod' | 'moneychangerFee'>, v: boolean) => edit((d) => void (d.settings[k] = v));
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
        <Toggle checked={s.settings.trackComponents} onChange={(v) => set('trackComponents', v)} label="Costly spell components must be carried and are used up (2024 PHB)" />
        <Toggle checked={s.settings.downtimeOutcomes} onChange={(v) => set('downtimeOutcomes', v)} label="Downtime activities roll their outcomes (optional Xanathar's rules)" />
        <Toggle checked={s.settings.runningBusiness} onChange={(v) => set('runningBusiness', v)} label="Running a business as a downtime activity (optional 2014 DMG rule)" />
        <Toggle checked={s.settings.sleepDeprivation} onChange={(v) => set('sleepDeprivation', v)} label="Staying awake too long causes Exhaustion (optional Xanathar's rule)" />
        <Rule>
          Each time the party passes another 24 hours without finishing a Long Rest, everyone makes a Con save or gains 1 Exhaustion level from Sleep deprivation. The DC is 10, plus 5 for every
          further 24 hours, and it resets after a Long Rest.
        </Rule>
        <Toggle checked={s.settings.chargeCosts} onChange={(v) => set('chargeCosts', v)} label="Charge costs to characters' gold (crafting, construction, lifestyle, wages, feed)" />
        <div className="form-row">
          <Num label="Stress removed per Long Rest" value={s.settings.stressPerLongRest} onChange={(v) => edit((d) => void (d.settings.stressPerLongRest = Math.max(0, Math.round(v))))} min={0} width={2} />
          <Num label="Fear removed per Long Rest" value={s.settings.fearPerLongRest} onChange={(v) => edit((d) => void (d.settings.fearPerLongRest = Math.max(0, Math.round(v))))} min={0} width={2} />
        </div>
        <Toggle checked={s.settings.weatherDamage} onChange={(v) => set('weatherDamage', v)} label="Weather favors or hinders some damage types (table rule)" />
        <Rule>
          Outdoors: heavy rain favors Lightning and hinders Fire, and a thunderstorm also favors Thunder. Falling snow and extreme cold favor Cold and hinder Fire. Extreme heat favors Fire and hinders Cold. Clear
          daylight favors Radiant, night favors Necrotic, and humid swamp air favors Poison. The Underdark favors Necrotic and hinders Radiant. Favored means +1 damage per damage die, hindered means −1 per die
          (minimum 1).
        </Rule>
        <Toggle checked={s.settings.noTimepiece} onChange={(v) => set('noTimepiece', v)} label="Nobody has a timepiece: show the time as nature's cues" />
        <Rule>The header and the Time card show the part of the day (Dawn, Mid-morning, Dusk and so on) instead of the exact clock. The DM can peek at the exact time on the Time card.</Rule>
        <Toggle checked={s.settings.poorVisibilityNav} onChange={(v) => set('poorVisibilityNav', v)} label="Heavy rain or snow, and darkness, each make navigating harder (+5 DC, table rule)" />
        <Toggle checked={s.settings.coinWeight} onChange={(v) => set('coinWeight', v)} label="Coins count toward carried weight (50 per pound)" />
        <Toggle checked={s.settings.coldGear2014} onChange={(v) => set('coldGear2014', v)} label="Cold weather gear protects against extreme cold (2014 rule; 2024 only counts Cold Resistance or Immunity)" />
        <Toggle checked={s.settings.heavyClothing2014} onChange={(v) => set('heavyClothing2014', v)} label="Heavy clothing gives Disadvantage on extreme heat saves (2014 rule; 2024 only counts Medium or Heavy armor)" />
        <Toggle checked={s.settings.extraCraftHelpers} onChange={(v) => set('extraCraftHelpers', v)} label="Allow more than one helper on a crafting project (normally only one other character can help)" />
        <Select
          label="Lifestyle is paid"
          value={s.settings.lifestylePeriod}
          onChange={(v) => edit((d) => void (d.settings.lifestylePeriod = v))}
          options={[
            { value: 'day', label: 'Every day' },
            { value: 'week', label: 'At the start of each week' },
            { value: 'month', label: 'At the start of each month' },
          ]}
        />
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
        Load spell data you have access to, such as a 5etools <code>spells-xphb.json</code> file. Only the name, level, school, source, ritual and concentration tags, casting time and duration are kept, which is enough to time ritual casting. No book text is stored, and the app ships with no
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

function BestiaryCard() {
  const s = useGame();
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const load = (files: { name: string; raw: string }[]) => {
    const found: Creature[] = [];
    const notes: string[] = [];
    for (const f of files) {
      try {
        const json = JSON.parse(f.raw);
        const got = parse5eToolsBestiary(json);
        const reprinted = countReprinted(json);
        found.push(...got);
        const forTables = got.filter((x) => x.cr && x.env?.length && !x.flags?.includes('N')).length;
        notes.push(`${f.name}: ${got.length} creatures, ${forTables} usable in encounter tables${reprinted ? `, ${reprinted} skipped as reprinted in a newer book` : ''}${forTables === 0 && got.length ? ' (no environment tags: adventure books usually have none)' : ''}`);
      } catch (e) {
        notes.push(`${f.name}: couldn't read it (${(e as Error).message})`);
      }
    }
    if (found.length) {
      edit((d) => {
        const keyOf = (x: { name: string; source?: string }) => `${x.name}|${x.source ?? ''}`.toLowerCase();
        // Re-importing refreshes entries saved before Challenge Ratings and environments were kept.
        const fresh = new Map(found.map((x) => [keyOf(x), x]));
        const have = new Set(d.bestiary.map(keyOf));
        const added = [...fresh.values()].filter((x) => !have.has(keyOf(x)));
        d.bestiary = [...d.bestiary.map((x) => fresh.get(keyOf(x)) ?? x), ...added].sort((a, b) => a.name.localeCompare(b.name));
        log(d, `Imported ${added.length} new creatures into the bestiary from ${files.length} file${files.length === 1 ? '' : 's'}.`);
      });
    }
    setMsg(notes.length ? notes.join(' · ') : 'No creatures found. Expected 5etools format: { "monster": [ { "name", "size", "type", "source" } ] }.');
  };
  const sources = [...new Set(s.bestiary.map((c) => c.source ?? '?'))].sort();
  return (
    <Card title={`Bestiary for hunting and encounters (${s.bestiary.length})`}>
      <Rule>
        Load 5etools bestiary files you have access to (several at once is fine) to hunt any creature from them on the Camp tab and add them to the random encounter tables on the Encounters tab. Only the name, size, creature
        type, source, Challenge Rating, environments, alignment and a few flags (legendary, named, swims, flies) are kept. Entries replaced by a newer printing, and named individuals, stay out of the encounter tables.
      </Rule>
      <BookAdvice />
      <input
        ref={fileRef}
        type="file"
        multiple
        accept=".json,application/json"
        onChange={async (e) => {
          const list = [...(e.target.files ?? [])];
          if (list.length) load(await Promise.all(list.map(async (f) => ({ name: f.name, raw: await f.text() }))));
          if (fileRef.current) fileRef.current.value = '';
        }}
      />
      {s.bestiary.length > 0 && (
        <>
          <p className="small muted">Loaded from: {sources.join(', ')}.</p>
          <div className="btn-row">
            <button className="ghost bad" onClick={() => confirm('Empty the bestiary?') && edit((d) => void (d.bestiary = []))}>
              Empty bestiary
            </button>
          </div>
        </>
      )}
      {msg && <p className="small">{msg}</p>}
    </Card>
  );
}

/** Which 5etools bestiary files are worth loading for random encounters. */
export function BookAdvice() {
  return (
    <details className="small">
      <summary>Which bestiary files help the encounter tables?</summary>
      <ul className="plain">
        {RECOMMENDED_BESTIARIES.map((b) => (
          <li key={b.file}>
            <strong>{b.kind === 'core' ? '★ ' : b.kind === 'skip' ? '✕ ' : '◇ '}</strong>
            <code>{b.file}</code> {b.name}: {b.why}
          </li>
        ))}
      </ul>
    </details>
  );
}

function LibrariesCard() {
  const s = useGame();
  const [msg, setMsg] = useState('');
  const load = async (f: File | undefined, kind: 'items' | 'classes' | 'gifts' | 'recipes') => {
    if (!f) return;
    try {
      const json = JSON.parse(await f.text());
      if (kind === 'items') {
        const items = parse5eToolsItems(json);
        edit((d) => void (d.itemLibrary = items));
        setMsg(`Loaded ${items.length} magic items.`);
      } else if (kind === 'classes') {
        const map = parse5eToolsSpellClasses(json);
        edit((d) => void (d.spellClasses = map));
        setMsg(`Loaded class lists for ${Object.keys(map).length} spells.`);
      } else if (kind === 'gifts') {
        const g = parse5eToolsRewards(json);
        edit((d) => void (d.giftLibrary = g));
        setMsg(`Loaded ${g.length} supernatural gifts.`);
      } else {
        const r = parse5eToolsRecipes(json);
        edit((d) => void (d.recipeNames = r));
        setMsg(`Loaded ${r.length} recipe names.`);
      }
    } catch (e) {
      setMsg(`Couldn't read that file: ${(e as Error).message}`);
    }
  };
  const row = (label: string, file: string, kind: 'items' | 'classes' | 'gifts' | 'recipes', count: number) => (
    <div className="armor-row">
      <span className="small">
        <b>{label}</b> <span className="muted">({file}) · {count ? `${count} loaded` : 'not loaded'}</span>
      </span>
      <input type="file" accept=".json,application/json" onChange={(e) => (load(e.target.files?.[0], kind), (e.target.value = ''))} />
    </div>
  );
  return (
    <Card title="More 5etools libraries (optional)">
      {row('Magic items', 'items.json', 'items', s.itemLibrary.length)}
      {row('Spell class lists', 'generated/gendata-spell-source-lookup.json', 'classes', Object.keys(s.spellClasses).length)}
      {row('Supernatural gifts', 'rewards.json', 'gifts', s.giftLibrary.length)}
      {row('Recipes', 'recipes.json', 'recipes', s.recipeNames.length)}
      {msg && <p className="small">{msg}</p>}
      <Rule>Only names and numbers are kept: rarity, attunement, charges and recharge for magic items; which classes get each spell; gift names and types; dish names. No rules text is stored.</Rule>
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
