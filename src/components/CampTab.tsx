import { useState } from 'react';
import { useGame, dispatch, edit } from '../state/store';
import * as E from '../state/engine';
import { fireThreat } from '../rules/weather';
import { DIG_LABEL, HUNTING_TRAP, MAGNIFYING_GLASS, POT_ALARM_DC, SHOVEL, SNARE, SNARE_LINE, TRAP_CATCH_ON, type DigKind } from '../rules/gear';
import { COOK_RAW_MINUTES, DEFAULT_FIRE_COLD_LIMIT_F, FIRE_LIGHT_DC, FIRE_METHODS, fireColdLimit, fireLighting, type FireMethod } from '../rules/campfire';
import { GAME_ANIMALS, MEAT_LB, BUTCHER_MINUTES, BUTCHER_DC, isEdible, yieldsHide, STRANGE_TYPES } from '../rules/hunting';
import { CURE_DC, CURE_LB_PER_RATION, CURE_MAX_LB, FEAST_FEAR_RELIEF, FEAST_MARGIN, FEAST_STRESS_RELIEF, MEAL_STRESS_RELIEF } from '../rules/cooking';
import { DIG_FIND_ON, FIND_MARGIN, poisonYield, trophyFor } from '../rules/chorePayoffs';
import { fmtGp } from '../rules/money';
import { formatClock, formatDuration, lightAt } from '../rules/calendar';
import { autoAssign, maxWatchMinutes, WATCH_COUNTS, watchCapacity, watchMinutes } from '../rules/watch';
import { TERRAIN } from '../rules/terrain';
import { foodNeedLb, fmtLb, fmtWater, proficiencyBonus, ARMOR_LABEL, armorTime, BOIL_MINUTES, PURIFY_SPELL, TAINTED_DC } from '../rules/survival';
import { Card, Num, Pill, Select, Text, Toggle, Rule } from './common';
import { POISON_HARVEST_DC } from '../rules/potions';
import { ALCHEMIST, ALCHEMIST_FIRE_DC, IMPROVISED_COOK_DC, IMPROVISED_HARVEST_DC, IMPROVISED_TESTS, TEST_KIND_LABEL, toolTestsFor, type TestKind } from '../rules/tools';
import { WaysAround } from './WaysAround';
import { SRD_POOL } from '../rules/encounters';
import { AID_LABEL, bigEnoughToRide, canBeSidekick, canTame, charmSpellsFor, currentDC, NO_AIDS, TAME_MIN_DC, TRUST_PER_DAY_MAX, sessionAttitude, STABLE_DAYS, TAMED_RULES, tameCheck, tameDC, TAME_MAX_FAILS, TAME_MAX_INT, TAMEABLE_TYPES, TRAINING_LABEL, trainingNeeded, trustCue, trustNeeded, type Attitude, type TameAids, type TameTraining } from '../rules/taming';

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
      <TameCard />
      <CampGearCard />
      <PoisonHarvestCard />
      <TestCard />
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
  const pcs = s.characters.filter((c) => c.kind === 'pc');
  const [gatherer, setGatherer] = useState(opts[0]?.value ?? '');
  const casters = E.fireSpellCasters(s);
  const tinderbox = E.partyHasTinderbox(s);
  const [lighter, setLighter] = useState('');
  const [method, setMethod] = useState<FireMethod | ''>('');
  const [intBonus, setIntBonus] = useState(0);
  const alchemists = pcs.filter((c) => c.inventory.some((i) => ALCHEMIST.test(i.name)));
  const temp = E.tempNow(s);
  const indoors = s.place.shelter === 'building' || s.place.shelter === 'cave';
  const threat = fireThreat(s.weather, temp);
  const how = fireLighting(s.weather, temp, s.fire.sheltered, indoors);
  const m: FireMethod = method || (casters.length ? 'spell' : tinderbox === false ? 'friction' : 'tinderbox');
  const best = [...pcs].sort((a, b) => b.survival - 2 * b.exhaustion - (a.survival - 2 * a.exhaustion))[0];
  const lighterId =
    m === 'spell'
      ? (casters.find((x) => x.c.id === lighter)?.c.id ?? casters[0]?.c.id ?? '')
      : m === 'alchemist'
        ? (alchemists.find((c) => c.id === lighter)?.id ?? alchemists[0]?.id ?? '')
        : (pcs.find((c) => c.id === lighter)?.id ?? best?.id ?? '');
  const dc = m === 'alchemist' ? ALCHEMIST_FIRE_DC + (s.settings.fireLightingCheck ? how.dc - FIRE_LIGHT_DC : 0) : how.dc + FIRE_METHODS[m].dcMod;
  const limit = fireColdLimit(s.settings.fireColdLimitF ?? DEFAULT_FIRE_COLD_LIMIT_F, s.fire.sheltered);
  const warms = E.campfireWarms(s, temp);
  const night = lightAt(s.minutes % 1440, E.seasonOf(s)).phase === 'Night';
  const rawFood = s.stores.foodRawLb;
  const dirty = s.stores.waterUnsafeGal + s.characters.filter((c) => c.waterUnsafe).length;
  const methodOpts = [
    ...(casters.length ? [{ value: 'spell' as const, label: `A spell (${casters.map((x) => `${x.c.name}: ${x.spell}`).join(', ')})` }] : []),
    { value: 'tinderbox' as const, label: `Tinderbox (1 min a try)${tinderbox === false ? ' — nobody carries one' : ''}` },
    { value: 'friction' as const, label: 'No tinderbox (10 min a try, DC +5)' },
    ...(alchemists.length ? [{ value: 'alchemist' as const, label: `Alchemist's Supplies (Int, DC ${ALCHEMIST_FIRE_DC})` }] : []),
    ...(pcs.some((c) => c.inventory.some((i) => MAGNIFYING_GLASS.test(i.name)))
      ? [{ value: 'magnifier' as const, label: `Magnifying Glass (5 min, no roll${E.sunBright(s) ? '' : ' — needs bright sunlight'})` }]
      : []),
  ];
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

      <h3>What the fire gives the camp</h3>
      <ul className="plain small fire-gives">
        <li>
          🌡{' '}
          {!s.settings.fireWarmsCamp ? (
            <span className="muted">Warmth: off in Settings (the campfire doesn&apos;t count against extreme cold).</span>
          ) : s.fire.lit ? (
            warms && temp > (s.settings.coldNights ? s.settings.coldNightF : 0) ? (
              <span>
                Warmth: no cold to fend off at {temp}°F. If it turns cold, it protects the camp down to {limit}°F{s.fire.sheltered ? ' in this sheltered pit' : ''}.
              </span>
            ) : warms ? (
              <span className="good-text">
                Warmth: keeps the camp safe from extreme cold and cold nights at {temp}°F (down to {limit}°F{s.fire.sheltered ? ' in this sheltered pit' : ''}).
              </span>
            ) : (
              <span className="bad-text">
                Warmth: too cold for the fire to help at {temp}°F; it protects only down to {limit}°F{s.fire.sheltered ? '' : ' (a sheltered pit adds 10°F)'}. Extreme cold saves still apply.
              </span>
            )
          ) : (
            <span>Warmth: once lit, keeps the camp safe from extreme cold and cold nights down to {limit}°F{s.fire.sheltered ? ' (sheltered pit)' : ' (10°F lower in a sheltered pit)'}. Travelers on the move don&apos;t benefit.</span>
          )}
        </li>
        <li>
          🔦{' '}
          {s.fire.lit ? (
            <span className={night ? 'good-text' : ''}>
              Light: night watchers see the camp clearly for the next {s.fire.fuelHours} h of fuel (until {formatClock((s.minutes + s.fire.fuelHours * 60) % 1440)}). A watch counts as lit only if the fuel lasts all of it.
            </span>
          ) : (
            <span>Light: unlit, watchers face Dim Light (twilight or a full moon) or Darkness: −5 to passive Perception, whether they see by Darkvision or can only listen. Darkvision lets them see in Dim Light as normal. Heavy rain or snow gives −5 whatever the light (it doesn&apos;t stack).</span>
          )}
          {night && s.fire.lit && <span className="warn-text"> At night it can also be seen from far off: +1 on the encounter check.</span>}
        </li>
        <li>
          🍲 Cooking: makes raw food safe to eat and boils water safe to drink. Raw food in the stores: {fmtLb(rawFood)}; unpurified water: {s.stores.waterUnsafeGal} gal
          {s.characters.some((c) => c.waterUnsafe) ? ` and ${s.characters.filter((c) => c.waterUnsafe).length} waterskin(s)` : ''}.
        </li>
      </ul>
      <div className="btn-row">
        <button disabled={!s.fire.lit || rawFood <= 0} onClick={() => dispatch(E.cookRawFood)} title={s.fire.lit ? '' : 'Light the fire first'}>
          Cook raw food ({COOK_RAW_MINUTES} min)
        </button>
        <button disabled={!s.fire.lit || dirty <= 0} onClick={() => dispatch(E.boilWater)} title={s.fire.lit ? '' : 'Light the fire first'}>
          {E.partyHasPot(s) === false ? `Boil with hot stones, no pot (${BOIL_MINUTES * 2} min, half the water)` : `Boil water (${BOIL_MINUTES} min)`}
        </button>
        <span className="muted small">A hot meal for everyone is on the Meals card.</span>
      </div>

      {s.fire.lit ? (
        <div className="btn-row">
          <button onClick={() => dispatch(E.douseFire)}>Put out the fire</button>
        </div>
      ) : (
        <>
          <h3>Light it</h3>
          {!how.possible ? (
            <Rule>
              <b>{threat === 'strong wind' ? 'Strong wind' : 'Heavy rain'}</b> puts out open flames. Shelter the fire pit, or move to a cave or building, to keep a fire going.
            </Rule>
          ) : (
            <>
              <div className="form-row">
                <Select label="Method" value={m} onChange={(v) => setMethod(v as FireMethod)} options={methodOpts} />
                {m === 'spell' ? (
                  <Select label="Caster" value={lighterId} onChange={setLighter} options={casters.map((x) => ({ value: x.c.id, label: `${x.c.name} (${x.spell})` }))} />
                ) : m === 'alchemist' ? (
                  <>
                    <Select label="Who" value={lighterId} onChange={setLighter} options={alchemists.map((c) => ({ value: c.id, label: c.name }))} />
                    <Num label="Int bonus" value={intBonus} onChange={(v) => setIntBonus(Math.round(v))} width={2} />
                  </>
                ) : (
                  <Select label="Who" value={lighterId} onChange={setLighter} options={pcs.map((c) => ({ value: c.id, label: `${c.name} (Survival ${c.survival - 2 * c.exhaustion >= 0 ? '+' : ''}${c.survival - 2 * c.exhaustion})` }))} />
                )}
              </div>
              <div className="btn-row">
                <button className="primary" disabled={s.fire.fuelHours <= 0} title={s.fire.fuelHours <= 0 ? 'Gather firewood first' : ''} onClick={() => dispatch((st, c) => E.lightFire(st, c, lighterId || undefined, m, intBonus))}>
                  {m === 'spell' ? 'Light it with the spell' : m === 'alchemist' || s.settings.fireLightingCheck ? `Try to light it (DC ${dc}, ${FIRE_METHODS[m].minutes} min)` : `Light it (${FIRE_METHODS[m].minutes} min)`}
                </button>
                {s.fire.fuelHours <= 0 && <span className="warn-text small">No fuel: gather firewood below.</span>}
              </div>
              <Rule>
                {m === 'spell' || m === 'alchemist'
                  ? `${FIRE_METHODS[m].note}${m === 'alchemist' && s.settings.fireLightingCheck && how.why.length ? ` Table rule: raised because ${how.why.join(' and ')}.` : ''}`
                  : s.settings.fireLightingCheck
                    ? `Table rule: a Wisdom (Survival) check, DC ${FIRE_LIGHT_DC}${how.why.length ? `, raised because ${how.why.join(' and ')}` : ' with dry fuel'}. ${FIRE_METHODS[m].note} A failed try costs the time; try again.`
                    : `${FIRE_METHODS[m].note} The lighting check is off in Settings, so it always catches.`}
              </Rule>
            </>
          )}
        </>
      )}

      <h3>Fuel</h3>
      <div className="btn-row">
        <button onClick={() => edit((d) => void (d.fire.fuelHours += 1))}>+1 h fuel</button>
        <button onClick={() => edit((d) => void (d.fire.fuelHours += 4))}>+4 h fuel</button>
        <Select value={gatherer} onChange={setGatherer} options={opts} />
        <button disabled={!gatherer} onClick={() => dispatch((st, c) => E.gatherWood(st, c, gatherer))}>
          Gather firewood (1 h, Survival DC {TERRAIN[s.place.terrain].forageDC})
        </button>
      </div>
      <p className="small muted">Table rule: a natural 20, or beating the DC by {FIND_MARGIN} or more, turns up resin knots, honey, prized burl wood or something hidden in a hollow tree.</p>
      {threat && s.fire.lit && !s.fire.sheltered && !indoors && <Rule>The {threat} will put this fire out at the end of the hour unless the pit is sheltered.</Rule>}
      <WaysAround topic={'fire'} />
    </Card>
  );
}

function StoresCard() {
  const s = useGame();
  const cap = E.waterContainers(s);
  const stored = Math.round((s.stores.waterGal + s.stores.waterUnsafeGal) * 10) / 10;
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
          Fill 5 gal
        </button>
        {cap > 0 && (
          <button disabled={!s.place.waterSource || stored >= cap} onClick={() => dispatch((st, c) => E.fillBarrel(st, c, Math.round((cap - stored) * 10) / 10))}>
            Fill every barrel and jug ({Math.max(0, Math.round((cap - stored) * 10) / 10)} gal)
          </button>
        )}
      </div>
      {cap > 0 ? (
        <p className={`small ${stored > cap ? 'warn-text' : 'muted'}`}>
          Barrels, jugs and pots the party carries or stores hold {cap} gal (2024 PHB: a Barrel holds 40 gallons, a Jug or Iron Pot 1). {stored > cap ? `The ${stored} gal in the stores needs more containers.` : ''}
        </p>
      ) : stored > 0 ? (
        <p className="small muted">No Barrels or Jugs listed in any inventory or stash to hold the stored water (a Barrel holds 40 gallons).</p>
      ) : null}
      <WaysAround topic={['food', 'water']} />
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
  const pcs = s.characters.filter((c) => c.kind === 'pc');
  const [drinker, setDrinker] = useState('');
  const drinkerId = pcs.find((c) => c.id === drinker)?.id ?? pcs[0]?.id ?? '';
  return (
    <Card title={<span>Raw food and dirty water {dirty ? <Pill tone="warn">Needs purifying</Pill> : <Pill tone="good">All safe</Pill>}</span>}>
      <ul className="plain small">
        <li>Raw food: {fmtLb(s.stores.foodRawLb)}</li>
        {s.characters
          .filter((c) => c.sick)
          .map((c) => (
            <li key={c.id} className="bad-text">
              {c.name} is Sick from {c.sickFrom || 'raw food or unpurified water'}: Poisoned until a Long Rest.{' '}
              <button className="ghost tiny" title="Lesser Restoration, Protection from Poison, Lay on Hands (5 points), Heal and the like. Antitoxin doesn't end it." onClick={() => dispatch((st, cx) => E.curePoison(st, cx, c.id))}>
                Cured by magic
              </button>
            </li>
          ))}
        <li>Unpurified water: {s.stores.waterUnsafeGal} gal</li>
        <li>Tainted waterskins: {skins.length ? skins.map((c) => c.name).join(', ') : 'none'}</li>
        <li>
          Water source here: {s.place.waterSource ? (s.place.waterQuality === 'clean' ? 'clean' : 'questionable') : 'none'}
        </li>
      </ul>
      {!s.settings.wildNeedsPurifying && <Rule>Water purifying is switched off in Settings, so wild water is treated as safe.</Rule>}
      <div className="btn-row tight">
        <Select value={drinkerId} onChange={setDrinker} options={pcs.map((c) => ({ value: c.id, label: c.name }))} />
        <button className="small" disabled={!drinkerId} onClick={() => dispatch((st, cx) => E.drinkAntitoxin(st, cx, drinkerId))}>
          Drink Antitoxin first
        </button>
        {pcs.filter((c) => E.antitoxinActive(s, c)).map((c) => (
          <Pill key={c.id} tone="good">
            {c.name}: Antitoxin, {formatDuration(Math.max(1, (c.antitoxinUntil ?? 0) - E.absNow(s)))} left
          </Pill>
        ))}
      </div>
      <Rule>Antitoxin gives Advantage on the save for an hour, so drink it before a doubtful meal or drink. It doesn&apos;t cure someone who is already Sick.</Rule>
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
          {E.partyHasPot(s) === false ? `Boil with hot stones, no pot (${BOIL_MINUTES * 2} min, half the water)` : `Boil water (${BOIL_MINUTES} min)`}
        </button>
      </div>
      <Rule>
        Table rules: boiling over a lit campfire makes all water safe, and cooking a hot meal uses up raw food first and makes it safe. Eating <b>raw food</b> means a DC {s.settings.rawFoodDC} Con save, or you
        are <b>Sick</b>: Poisoned (Disadvantage on attack rolls and ability checks) until you finish a Long Rest. Drinking <b>unpurified water</b> means a DC {TAINTED_DC} Con save, or you are <b>Sick</b> the same way. Lesser Restoration, Lay on Hands (5 points) or any other cure for Poisoned ends it sooner.
      </Rule>
      <WaysAround topic={'tainted'} />
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
      <WaysAround topic={'armor'} />
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
      {s.settings.encounters ? (
        <p className="small muted">Random encounter checks during the rest follow this location&apos;s danger (Encounters tab) and name who is on watch.</p>
      ) : (
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
      )}
      <Rule>
        Each watch is {formatDuration(len)}. A Long Rest allows up to 2 hours of light activity such as standing watch (4 hours for characters who Trance). In Dim Light passive Perception takes −5. In Darkness,
        anyone without Darkvision relies on hearing alone (👂), unless the campfire or a light source lasts the whole watch.
      </Rule>
      <WaysAround topic="watch" />
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
        {cook && !cook.startsWith('h:') && !s.characters.find((x) => x.id === cook)?.cooksUtensils && E.partyHasCooksUtensils(s) === false && (
          <span className="small muted">
            {s.settings.improvised ? `No Cook's Utensils: Wisdom (Survival) at DC ${IMPROVISED_COOK_DC} for a tasty meal (table rule).` : "No Cook's Utensils: plain fare, no check."}
          </span>
        )}
        <button onClick={() => dispatch((st, c) => E.partyEat(st, c, 'meal'))}>Cold meal for everyone</button>
        <button onClick={() => dispatch((st, c) => E.partyDrink(st, c, 'meal'))}>Everyone drinks</button>
      </div>
      <p className="small muted">
        Table rule. <b>Any hot meal</b> warms everyone who ate for 8 hours: Advantage on saves against extreme cold and cold nights. <b>A tasty meal</b> (the cook&apos;s check succeeds) also gives Advantage on forced-march saves, Stress −{MEAL_STRESS_RELIEF} and Temporary HP equal to the cook&apos;s Proficiency Bonus. <b>A feast</b> (a natural 20, or beating the DC by {FEAST_MARGIN}) gives Temporary HP equal to the cook&apos;s level plus Wisdom modifier, Stress −{FEAST_STRESS_RELIEF} and Fear −{FEAST_FEAR_RELIEF}.
      </p>
      <div className="btn-row">
        <button
          disabled={!s.fire.lit || !cook || cook.startsWith('h:') || s.stores.foodRawLb + s.stores.foodLb < CURE_LB_PER_RATION}
          title={!s.fire.lit ? 'Light the fire first' : !cook || cook.startsWith('h:') ? 'Pick a party member as the cook' : ''}
          onClick={() => dispatch((st, c) => E.cureRations(st, c, cook))}
        >
          Smoke meat into Rations (4 h)
        </button>
        <span className="small muted">
          Table rule: Survival or Cook&apos;s Utensils, DC {CURE_DC}. Every {CURE_LB_PER_RATION} lb of meat from the stores (up to {CURE_MAX_LB} lb a batch) becomes a day of Rations that keeps and sells for 5 SP; half on a failure.
        </span>
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
        Cooking uses Cook&apos;s Utensils with Wisdom: a DC 10 check improves the food&apos;s flavor, which is flavor only (2024 PHB). Anyone in the party&apos;s utensils will do; proficiency adds the Proficiency Bonus.{' '}
        {s.settings.improvised ? `Table rule: with no utensils at all, Wisdom (Survival) at DC ${IMPROVISED_COOK_DC}. ` : ''}Chefs:{' '}
        {s.characters
          .filter((c) => c.chef)
          .map((c) => `${c.name} +${proficiencyBonus(c.level)}`)
          .join(', ') || 'none in the party'}
        .
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
        {TERRAIN[s.place.terrain].label} terrain: <b>DC {TERRAIN[s.place.terrain].forageDC}</b> Wisdom (Survival).
      </p>
      <Rule>On a success you find 1d6 + Wisdom modifier pounds of food and the same roll again in gallons of water. Spend an hour in camp, or forage while you travel (Slow pace gives Advantage, Fast gives Disadvantage).{` Table rule: a natural 20, or beating the DC by ${FIND_MARGIN} or more, also turns up a find: healing herbs, honey, rare mushrooms, a lost purse or a stone worth appraising.`}</Rule>
      <div className="btn-row">
        <Select value={who} onChange={setWho} options={opts} />
        <button className="primary" disabled={!who} onClick={() => dispatch((st, c) => E.forage(st, c, who))}>
          Forage (1 h)
        </button>
      </div>
      <WaysAround topic={'foraging'} />
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
                {yieldsHide(cr) ? `, plus ${count} hide${count > 1 ? 's' : ''} for crafting` : ''}
                {trophyFor(cr) ? `, and on a clean job ${count > 1 ? `${count} trophies` : 'a trophy'} (${trophyFor(cr)!.parts}) worth ${fmtGp(trophyFor(cr)!.valueGp)} each` : ''}.{STRANGE_TYPES.includes(cr.type.toLowerCase()) ? ' Strange meat: ask your DM.' : ''}
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
        (Survival) check stops half the meat going to waste. Constructs, elementals, oozes and undead give nothing.{' Table rule: a clean job on a Medium or bigger beast, monstrosity or dragon keeps its trophy parts, worth 2 GP (Medium), 10 (Large), 50 (Huge) or 200 (Gargantuan) times its Challenge Rating (at least 1). Sell them, or keep them to mount.'}
      </Rule>
      <WaysAround topic={'hunting'} />
    </Card>
  );
}

/** Taming a wild Beast or Monstrosity of low Intelligence (table rule built on the 2024 Influence action). */
function TameCard() {
  const s = useGame();
  const tamers = s.characters.filter((c) => c.kind !== 'mount' && E.alive(c));
  const pool = [...SRD_POOL.map((c) => ({ name: c.name, size: c.size, type: c.type, cr: c.cr, flags: c.flags ?? '', source: c.source ?? '' })), ...s.bestiary.map((c) => ({ name: c.name, size: c.size, type: c.type, cr: c.cr ?? '0', flags: c.flags ?? '', source: c.source ?? '' }))].filter((c) => TAMEABLE_TYPES.includes(c.type.toLowerCase()));
  const [query, setQuery] = useState('');
  const [pick, setPick] = useState('');
  const list = pool.filter((c) => !query || c.name.toLowerCase().includes(query.toLowerCase()));
  const cr = list.find((c) => `${c.name}|${c.source}` === pick) ?? list[0];
  const [name, setName] = useState('');
  const [int, setInt] = useState(2);
  const [speed, setSpeed] = useState(40);
  const [who, setWho] = useState('');
  const [helper, setHelper] = useState('');
  const [aids, setAids] = useState<TameAids>({ ...NO_AIDS, food: true });
  const [team, setTeam] = useState<Record<string, string[]>>({});
  const tamer = tamers.find((c) => c.id === who) ?? tamers[0];
  const helpers = tamer ? E.tameHelpers(s, tamer.id) : [];
  const targets = s.taming ?? [];
  if (!s.settings.taming)
    return (
      <Card title="Taming a wild creature">
        <p className="small muted">Taming is switched off in Settings (table rule).</p>
      </Card>
    );
  const movement: 'land' | 'fly' | 'swim' = cr?.flags.includes('f') ? 'fly' : cr?.flags.includes('s') ? 'swim' : 'land';
  const ok = cr ? canTame(cr.type, int) : null;
  const a: TameAids = { ...aids, helped: !!helper && helpers.some((h) => h.id === helper) };
  const creature = cr ? { type: cr.type, int, movement } : null;
  const chk = tamer && creature ? tameCheck(E.tamerFacts(tamer), creature, a) : null;
  const flag = (k: Exclude<keyof TameAids, 'attitude' | 'helped'>) => <Toggle key={k} checked={aids[k]} onChange={(v) => setAids({ ...aids, [k]: v })} label={AID_LABEL[k]} />;
  const newTame = cr ? { name, creature: cr.name, type: cr.type.toLowerCase(), size: cr.size, int, cr: cr.cr, speed, movement } : null;
  const modeTxt = (m: string) => (m === 'advantage' ? ' with Advantage' : m === 'disadvantage' ? ' with Disadvantage' : '');
  return (
    <Card title="Taming a wild creature">
      {targets.map((t) => {
        const tm = s.characters.find((c) => c.id === t.tamerId);
        const now = E.absNow(s);
        const doneToday = t.lastSessionDay === s.dayIndex;
        const sessionAids = { charmed: aids.charmed, speaking: aids.speaking, threatened: aids.threatened, stable: aids.stable, enhance: aids.enhance, guidance: aids.guidance, helped: a.helped };
        const att = sessionAttitude(t.trust, t.needed, t.stage === 'tamed');
        const shared = { attitude: att, food: true, unwilling: false, stable: aids.stable, threatened: aids.threatened };
        const sc = tm ? tameCheck(E.tamerFacts(tm), t, { ...sessionAids, ...shared }) : null;
        const others = tamers.filter((c) => c.id !== t.tamerId && c.id !== helper);
        const crew = (team[t.id] ?? []).filter((cid) => others.some((c) => c.id === cid));
        const dcNow = currentDC(t.int, t.cr, t.trust, t.training?.progress ?? 0);
        const dcStart = tameDC(t.int, t.cr);
        const rollTxt = (c: { skill: string; mode: string; bonus: number; dice: number[] }) => `${c.skill}${modeTxt(c.mode)} ${c.bonus >= 0 ? '+' : ''}${c.bonus}${c.dice.map((n) => ` +1d${n}`).join('')}`;
        return (
          <div key={t.id} className="calc">
            <b>{t.name}</b> ({t.size} {t.creature}, CR {t.cr}, Int {t.int}
            {t.raised ? ', raised from young' : ''}) with {tm?.name ?? 'nobody'}: {t.stage === 'wary' && <Pill tone="warn">wary</Pill>}
            {t.stage === 'bonding' && (
              <Pill tone="info">
                bonding {t.trust}/{t.needed}
              </Pill>
            )}
            {t.stage === 'bonding' && att === 'friendly' && <Pill tone="good">Friendly</Pill>}
            {t.stage === 'tamed' && <Pill tone="good">tamed</Pill>}
            {t.trained.map((k) => (
              <Pill key={k} tone="good">
                trained {TRAINING_LABEL[k]}
              </Pill>
            ))}
            {t.stage === 'tamed' && canBeSidekick(t.cr) && <Pill tone="info">can be a sidekick (Tasha's)</Pill>}
            {t.fails > 0 && (
              <Pill tone="bad">
                {t.fails} bad day{t.fails > 1 ? 's' : ''} in a row
              </Pill>
            )}
            <p className="small">
              {t.stage === 'wary' && (t.retryAt && t.retryAt > now ? `It keeps its distance. Try the same way again in ${formatDuration(t.retryAt - now)}, or try another way (charm it, talk to it).` : 'It may let you near now: try the approach again below.')}
              {t.stage === 'bonding' && trustCue(t.creature, t.trust, t.needed)}
              {t.training && ` Training ${TRAINING_LABEL[t.training.kind]}: ${t.training.progress}/${t.training.needed}.`}
            </p>
            {(t.stage === 'bonding' || t.training) && (
              <>
                <p className="small">
                  <b>DC {dcNow}</b>
                  {dcNow < dcStart ? ` (down from ${dcStart})` : ''}
                  {dcNow > TAME_MIN_DC ? `: each trust point${t.training ? ' or training session' : ''} lowers it by 1, to DC ${TAME_MIN_DC}.` : ': as low as it goes.'}
                  {t.stage === 'bonding' && att !== 'friendly' && ` At ${Math.ceil(t.needed / 2)} trust it turns Friendly: Advantage.`}
                  {sc?.ok && ` ${tm?.name}: ${rollTxt(sc)}.`}
                  {crew.map((cid) => {
                    const c = others.find((o) => o.id === cid)!;
                    const k = tameCheck(E.tamerFacts(c), t, { ...NO_AIDS, ...shared });
                    return k.ok ? ` ${c.name}: ${rollTxt(k)}.` : '';
                  })}
                </p>
                {others.length > 0 && (
                  <div className="btn-row small">
                    Also working with it:
                    {others.map((c) => (
                      <Toggle key={c.id} checked={crew.includes(c.id)} onChange={(v) => setTeam({ ...team, [t.id]: v ? [...crew, c.id] : crew.filter((x) => x !== c.id) })} label={c.name} />
                    ))}
                  </div>
                )}
              </>
            )}
            <div className="btn-row">
              {(t.stage === 'bonding' || t.training) && (
                <button className="primary" disabled={doneToday} title={doneToday ? 'One session a day' : undefined} onClick={() => dispatch((st, cx) => E.tameSession(st, cx, t.id, sessionAids, crew))}>
                  {t.training ? 'Train' : 'Work with it'} (1 h){doneToday ? ': done today' : ''}
                </button>
              )}
              {t.stage === 'tamed' &&
                !t.training &&
                (['mount', 'commands'] as TameTraining[])
                  .filter((k) => !t.trained.includes(k))
                  .map((k) => (
                    <button key={k} disabled={k === 'mount' && !!tm && !bigEnoughToRide(t.size, tm.size)} title={k === 'mount' && tm && !bigEnoughToRide(t.size, tm.size) ? `Too small to carry ${tm.name}` : undefined} onClick={() => dispatch((st, cx) => E.startTraining(st, cx, t.id, k))}>
                      Train {TRAINING_LABEL[k]} ({trainingNeeded(t.cr, t.int)} sessions)
                    </button>
                  ))}
              <button onClick={() => dispatch((st, cx) => E.releaseTame(st, cx, t.id))}>{t.stage === 'tamed' ? 'Done tracking' : 'Let it go'}</button>
            </div>
          </div>
        );
      })}
      <div className="form-row">
        <Text label="Search" value={query} onChange={setQuery} placeholder="e.g. wolf, griffon" />
        {cr && (
          <Select
            label="Creature"
            value={`${cr.name}|${cr.source}`}
            onChange={setPick}
            options={list.slice(0, 300).map((c) => ({ value: `${c.name}|${c.source}`, label: `${c.name} (${c.size} ${c.type}, CR ${c.cr}${c.source ? `, ${c.source}` : ''})` }))}
          />
        )}
      </div>
      {cr && newTame && creature && (
        <>
          <div className="form-row">
            <Text label="Call it" value={name} onChange={setName} placeholder={cr.name} />
            <Num label="Intelligence" value={int} onChange={(v) => setInt(Math.max(1, Math.round(v)))} min={1} max={30} width={3} />
            <Num label="Speed" value={speed} onChange={(v) => setSpeed(Math.max(0, Math.round(v)))} min={0} suffix="ft" width={3} />
            <Select label="Tamer" value={tamer?.id ?? ''} onChange={setWho} options={tamers.map((c) => ({ value: c.id, label: c.name }))} />
            <Select
              label="Its attitude"
              value={aids.attitude}
              onChange={(v: Attitude) => setAids({ ...aids, attitude: v })}
              options={[
                { value: 'hostile', label: 'Hostile (Disadvantage)' },
                { value: 'indifferent', label: 'Indifferent' },
                { value: 'friendly', label: 'Friendly (Advantage)' },
              ]}
            />
            <Select label="Help action" value={helper} onChange={setHelper} options={[{ value: '', label: helpers.length ? 'Nobody helps' : 'Nobody proficient' }, ...helpers.map((h) => ({ value: h.id, label: h.name }))]} />
          </div>
          <div className="btn-row">
            {flag('food')}
            {flag('charmed')}
            {flag('speaking')}
            {flag('enhance')}
            {flag('guidance')}
            {flag('threatened')}
            {flag('unwilling')}
            {flag('stable')}
          </div>
          <p className="calc small">
            {ok && !ok.ok ? (
              <span className="bad-text">Can't be tamed: {ok.why}.</span>
            ) : chk && !chk.ok ? (
              <span className="bad-text">It won't be coaxed: {chk.why}.</span>
            ) : (
              <>
                {chk && tamer && (
                  <>
                    {tamer.name}: <b>{chk.skill}</b>
                    {modeTxt(chk.mode)} {chk.bonus >= 0 ? '+' : ''}
                    {chk.bonus}
                    {chk.dice.map((n) => ` +1d${n}`).join('')} against <b>DC {tameDC(int, cr.cr)}</b>
                    {chk.notes.length ? ` (${chk.notes.join('; ')})` : ''}.{' '}
                  </>
                )}
                About <b>{trustNeeded(cr.cr, int)}</b> good days to tame ({trustNeeded(cr.cr, int, true)} if raised from young), then {trainingNeeded(cr.cr, int)} more for each kind of training.
                {movement !== 'land' ? ` As a ${movement === 'fly' ? 'flying' : 'swimming'} mount it needs an Exotic Saddle.` : ''}
                {canBeSidekick(cr.cr) ? " Once tamed it can be a Tasha's sidekick." : ''} Charm spells that work on it: {charmSpellsFor(creature, tamer ? E.tamerFacts(tamer) : { feats: [], level: 1 }).join('; ')}.
              </>
            )}
          </p>
          <div className="btn-row">
            <button className="primary" disabled={!tamer || !ok?.ok || !chk?.ok} onClick={() => tamer && dispatch((st, cx) => E.approachCreature(st, cx, newTame, tamer.id, a))}>
              Approach it (10 min)
            </button>
            <button disabled={!tamer || !ok?.ok} onClick={() => tamer && dispatch((st, cx) => E.raiseYoung(st, cx, newTame, tamer.id))}>
              Raise one from an egg or newborn
            </button>
          </div>
        </>
      )}
      <Rule>
        No D&amp;D book has taming rules, so this is a table rule built on the 2024 PHB. <b>Approach:</b> the Influence action, Wisdom (Animal Handling) to gently coax a Beast or Monstrosity, DC 15 or its Intelligence, whichever is higher (+2 at CR 2–4, +5 at CR 5+, table
        rule). An Unwilling creature refuses without a check; a Hostile one gives Disadvantage and a Friendly one Advantage; Charmed gives Advantage; with Speak with Animals any Influence skill works on a Beast. A failure means waiting 24 hours before trying the same way (all 2024
        PHB). Food gives Advantage; a hurt, cornered or hunted creature gives Disadvantage; fail by 5 or more and it attacks or flees for good (table rules). Only Intelligence {TAME_MAX_INT} or lower.
      </Rule>
      <Rule>
        <b>Bonding:</b> one hour a day, the same check, feeding it a day's food from the camp stores (raw meat first). Success +1 trust, a natural 20 +2, failing by 5 or more −1. Each trust point lowers the DC by 1 (never below {TAME_MIN_DC}), and halfway there it counts as Friendly (Advantage). Others can work with it in the same hour: each rolls (the tamer's own spells and helper don't carry over), the results add up to at most +{TRUST_PER_DAY_MAX} a day, and a day is bad only if nobody succeeds. Each day skipped costs 1 trust, and after {TAME_MAX_FAILS} bad
        days in a row it slips away. At full trust (3 days for CR ¼ or lower, 5 to CR 1, 7 to CR 3, 10 to CR 5, 14 above; +2 for Intelligence 4–5; half if raised from young) it joins the party as a mount. A Beast kept {STABLE_DAYS} days in a Bastion Stable gives Advantage (2024 DMG).
      </Rule>
      <Rule>
        {TAMED_RULES.map((r) => (
          <span key={r}>{r} </span>
        ))}
        Training takes half the taming time again, starting from the tamed creature's low DC and dropping 1 per session learned; bad days never undo taming, but {TAME_MAX_FAILS} in a row lose a session of training. Optional rule (Tasha's Cauldron): a tamed creature of CR ½ or lower can join as a sidekick with the Warrior or Expert class at the party's
        average level.
      </Rule>
      <WaysAround topic={'taming'} />
    </Card>
  );
}

/** Testing food, drink, objects, containers and plants with the 2024 PHB tools, or improvised at DC +5. */
function TestCard() {
  const s = useGame();
  const people = s.characters.filter((c) => c.kind !== 'mount' && E.alive(c));
  const [who, setWho] = useState('');
  const [kind, setKind] = useState<TestKind>('food');
  const [method, setMethod] = useState('');
  const [bonus, setBonus] = useState(0);
  const [adv, setAdv] = useState(false);
  const [tainted, setTainted] = useState(false);
  const [what, setWhat] = useState('');
  const whoId = people.find((c) => c.id === who)?.id ?? people[0]?.id ?? '';
  const tester = people.find((c) => c.id === whoId);
  const tools = toolTestsFor(kind).filter((t) => tester?.inventory.some((i) => t.match.test(i.name)));
  const opts = [...tools.map((t) => ({ value: t.id, label: `${t.tool}: ${t.ability}, DC ${t.dc}` })), ...(s.settings.improvised ? [{ value: 'improvised', label: `No tool: ${IMPROVISED_TESTS[kind].check}, DC ${IMPROVISED_TESTS[kind].dc}` }] : [])];
  const pick = opts.find((o) => o.value === method)?.value ?? opts[0]?.value ?? '';
  return (
    <Card title="Is it safe? Testing food, drink and plants">
      <div className="form-row">
        <Select label="Tester" value={whoId} onChange={setWho} options={people.map((c) => ({ value: c.id, label: c.name }))} />
        <Select label="What" value={kind} onChange={(v) => (setKind(v as TestKind), setMethod(''))} options={(Object.keys(TEST_KIND_LABEL) as TestKind[]).map((k) => ({ value: k, label: TEST_KIND_LABEL[k] }))} />
        <Text label="Name it" value={what} onChange={setWhat} placeholder="e.g. the innkeeper's stew" />
      </div>
      {opts.length === 0 ? (
        <p className="small muted">{tester?.name ?? 'They'} carries no tool for this, and improvised attempts are off in Settings.</p>
      ) : (
        <>
          <div className="form-row">
            <Select label="How" value={pick} onChange={setMethod} options={opts} />
            <Num label="Bonus" value={bonus} onChange={(v) => setBonus(Math.round(v))} width={2} />
          </div>
          <div className="btn-row tight">
            {pick !== 'improvised' && <Toggle checked={adv} onChange={setAdv} label="Also proficient in a skill that applies (Advantage)" />}
            <Toggle checked={tainted} onChange={setTainted} label={kind === 'plant' ? 'DM: it is poisonous' : kind === 'container' ? 'DM: it held something harmful' : 'DM: it is spoiled or poisoned'} />
          </div>
          <button className="small" disabled={!whoId} onClick={() => dispatch((st, cx) => E.testSubstance(st, cx, whoId, kind, pick, bonus, tainted, what, adv))}>
            Test it
          </button>
        </>
      )}
      <Rule>
        2024 PHB tools: Cook&apos;s Utensils detect spoiled or poisoned food (Wis, DC 15); Brewer&apos;s Supplies detect poisoned drink (Int, DC 15); a Poisoner&apos;s Kit detects a poisoned object (Int, DC 10); Alchemist&apos;s
        Supplies identify a substance (Int, DC 15); Glassblower&apos;s or Potter&apos;s Tools discern what a container held in the past 24 hours (Int, DC 15); an Herbalism Kit identifies a plant (Int, DC 10). Proficiency with the
        tool adds your Proficiency Bonus, and Advantage if a skill also applies. {s.settings.improvised ? 'Table rule: without a tool, anyone can try at DC +5 by smell, taste and sight. ' : ''}The tester learns the truth only on a
        success; a failure tells them nothing.
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

function PoisonHarvestCard() {
  const s = useGame();
  const people = s.characters.filter((c) => c.kind !== 'mount' && E.alive(c));
  const [who, setWho] = useState('');
  const [bonus, setBonus] = useState(0);
  const [creature, setCreature] = useState('');
  const whoId = people.find((c) => c.id === who)?.id ?? people[0]?.id ?? '';
  const carries = !!people.find((c) => c.id === whoId)?.inventory.some((i) => /poisoner'?s kit/i.test(i.name));
  const [kit, setKit] = useState<boolean | null>(null);
  const hasKit = kit ?? carries;
  const dc = hasKit ? POISON_HARVEST_DC : IMPROVISED_HARVEST_DC;
  return (
    <Card title="Harvesting poison">
      <div className="form-row">
        <Select label="Harvester" value={whoId} onChange={setWho} options={people.map((c) => ({ value: c.id, label: c.name }))} />
        <Num label="Int (Nature) bonus" value={bonus} onChange={setBonus} width={3} />
        <Text label="Creature" value={creature} onChange={setCreature} placeholder="e.g. Giant Spider" />
      </div>
      <Toggle checked={hasKit} onChange={setKit} label="Has a Poisoner's Kit" />
      <button className="small" disabled={!whoId || (!hasKit && !s.settings.improvised)} onClick={() => dispatch((st, cx) => E.harvestPoison(st, cx, whoId, bonus, creature, hasKit))}>
        Harvest ({hasKit ? '1d6' : '2d6'} min, DC {dc})
      </button>
      {creature.trim() && <p className="small calc">Yields: {poisonYield(creature).note}</p>}
      {!hasKit && <span className="small muted"> {s.settings.improvised ? 'Without the kit: DC +5 and twice as long (table rule).' : 'Needs a Poisoner’s Kit.'}</span>}
      <Rule>
        2024 DMG: from a venomous creature that is dead or Incapacitated, using a Poisoner&apos;s Kit. Success yields one dose, and nothing more can be taken from that creature. Failing by 5 or more exposes the harvester to the poison. A wyvern gives Wyvern Poison (1,200 GP a dose), a purple worm Purple Worm Poison (2,000 GP), a carrion crawler Carrion Crawler Mucus (200 GP) and a venomous snake Serpent Venom (200 GP). Table rule: any other venom works as Basic Poison (100 GP). Buying poison is often illegal: it means criminal contacts, inquiries and bribes.
      </Rule>
      <WaysAround topic={'poisonHarvest'} />
    </Card>
  );
}

/** Tents, shovels, hunting traps, an alarm line and anything spread on the ground. */
function CampGearCard() {
  const s = useGame();
  const pcs = s.characters.filter((c) => c.kind !== 'mount' && E.alive(c));
  const [diggers, setDiggers] = useState<string[]>([]);
  const [kind, setKind] = useState<DigKind>('firePit');
  const [trapper, setTrapper] = useState('');
  const [traps, setTraps] = useState(1);
  const [rigger, setRigger] = useState('');
  const spaces = E.tentSpaces(s);
  const outside = E.tentShortfall(s);
  const shovels = s.characters.reduce((a, c) => a + c.inventory.filter((i) => SHOVEL.test(i.name.trim())).reduce((n, i) => n + i.qty, 0), 0);
  const trappers = pcs.filter((c) => c.inventory.some((i) => HUNTING_TRAP.test(i.name) && i.qty > 0));
  const trapperId = trappers.find((c) => c.id === trapper)?.id ?? trappers[0]?.id ?? '';
  const set = s.place.trapsSet ?? [];
  const scattered = s.characters.flatMap((c) => c.inventory.filter((i) => i.scattered).map((i) => `${c.name}'s ${i.name}`));
  const who = diggers.length ? diggers : pcs[0] ? [pcs[0].id] : [];
  const riggerId = pcs.find((c) => c.id === rigger)?.id ?? pcs[0]?.id ?? '';
  const [maker, setMaker] = useState('');
  const makerC = pcs.find((c) => c.id === maker) ?? [...pcs].sort((a, b) => b.survival - a.survival)[0];
  const [makerBonus, setMakerBonus] = useState<number | null>(null);
  const mb = makerBonus ?? makerC?.survival ?? 0;
  const snarers = pcs.filter((c) => c.inventory.some((i) => SNARE_LINE.test(i.name.trim())));
  const snarerId = snarers.find((c) => c.id === trapper)?.id ?? snarers[0]?.id ?? '';
  return (
    <Card title="Camp gear">
      <h3>Tents</h3>
      <p className="small">
        {spaces ? `Room for ${spaces}${s.place.leanTos ? ` (${s.place.leanTos} lean-to${s.place.leanTos > 1 ? 's' : ''} built here)` : ''}.` : 'No Tents in anyone\'s inventory.'}{' '}
        {s.place.shelter === 'tent'
          ? outside.length
            ? <span className="warn-text">Not enough room: {outside.map((c) => c.name).join(', ')} sleep{outside.length > 1 ? '' : 's'} in the open.</span>
            : <span className="good-text">Everyone has a place.</span>
          : <span className="muted">Set the shelter to Tents (Overview) to camp in them.</span>}
      </p>
      <h3>Digging</h3>
      <div className="form-row">
        <Select label="Dig" value={kind} onChange={setKind} options={(Object.keys(DIG_LABEL) as DigKind[]).map((k) => ({ value: k, label: DIG_LABEL[k].label }))} />
      </div>
      <div className="chips">
        {pcs.map((c) => (
          <Toggle key={c.id} checked={who.includes(c.id)} onChange={(v) => setDiggers(v ? [...who, c.id] : who.filter((x) => x !== c.id))} label={c.name} />
        ))}
      </div>
      <div className="btn-row tight">
        <button className="small" disabled={!who.length || (!shovels && !s.settings.improvised)} onClick={() => dispatch((st, cx) => E.dig(st, cx, who, kind))}>
          Dig ({shovels ? `${Math.min(shovels, who.length)} Shovel${Math.min(shovels, who.length) > 1 ? 's' : ''}` : 'by hand'})
        </button>
        {(s.place.dug ?? []).length > 0 && <span className="small muted">Dug here: {(s.place.dug ?? []).join(', ')}.</span>}
      </div>
      <p className="small muted">{DIG_LABEL[kind].note}{` Table rule: on a d20 roll of ${DIG_FIND_ON} or higher, the spade turns up old coins, flint, clay, a fossil or a buried relic.`}</p>
      <h3>Hunting Traps</h3>
      {set.length > 0 && (
        <div className="btn-row tight">
          <span className="small">{set.reduce((a, t) => a + t.qty, 0)} set near camp since {formatClock(set[0].setAt % 1440)}.</span>
          <button className="small" onClick={() => dispatch((st, cx) => E.checkTraps(st, cx))}>
            Check and collect (10 min)
          </button>
        </div>
      )}
      {s.settings.improvised && snarers.length > 0 && (
        <div className="btn-row tight">
          <span className="small muted">No trap? </span>
          <button className="small ghost" onClick={() => dispatch((st, cx) => E.setTraps(st, cx, snarerId, traps, true, s.characters.find((c) => c.id === snarerId)?.survival ?? 0))}>
            {snarers.find((c) => c.id === snarerId)?.name} rigs {traps > 1 ? `${traps} snares` : 'a snare'} (Survival DC {SNARE.dc}, catch on {SNARE.catchOn}+)
          </button>
        </div>
      )}
      {trappers.length ? (
        <div className="btn-row tight">
          <Select value={trapperId} onChange={setTrapper} options={trappers.map((c) => ({ value: c.id, label: c.name }))} />
          <Num value={traps} onChange={(v) => setTraps(Math.max(1, Math.round(v)))} min={1} width={2} />
          <button className="small" onClick={() => dispatch((st, cx) => E.setTraps(st, cx, trapperId, traps))}>
            Set traps (10 min each)
          </button>
        </div>
      ) : (
        set.length === 0 && <p className="small muted">Nobody carries a Hunting Trap.</p>
      )}
      <h3>Alarm line</h3>
      {s.place.alarm ? (
        <p className="small good-text">
          {s.place.alarm === 'pots'
            ? `Pots and cans hang on a line around the camp: anything careless crossing it wakes everyone (a careful intruder needs Stealth ${POT_ALARM_DC}+ to slip past).`
            : 'A Bell hangs on a line around the camp: anything crossing it wakes everyone, so the camp can\'t be surprised while resting.'}
        </p>
      ) : (
        <div className="btn-row tight">
          <Select value={riggerId} onChange={setRigger} options={pcs.map((c) => ({ value: c.id, label: c.name }))} />
          <button className="small" disabled={!riggerId} onClick={() => dispatch((st, cx) => E.rigAlarm(st, cx, riggerId))}>
            Rig an alarm line (10 min): a Bell, or pots and cans
          </button>
        </div>
      )}
      {s.settings.improvised && makerC && (
        <>
          <h3>Making do</h3>
          <div className="btn-row tight">
            <Select value={makerC.id} onChange={(v) => (setMaker(v), setMakerBonus(null))} options={pcs.map((c) => ({ value: c.id, label: c.name }))} />
            <Num label="Survival" value={mb} onChange={(v) => setMakerBonus(Math.round(v))} width={2} />
          </div>
          <div className="btn-row tight">
            {(['torch', 'leanTo', 'bedding', 'waterskin', 'cord'] as E.MakeshiftKind[]).map((k) => {
              const job = E.makeshiftJob(s, k);
              const name = { torch: 'Makeshift torch', leanTo: 'Lean-to', bedding: 'Bed of boughs', waterskin: 'Hide waterskin', cord: 'Vine cord' }[k];
              return 'why' in job ? (
                <button key={k} className="small ghost" disabled title={job.why}>
                  {name}
                </button>
              ) : (
                <button key={k} className="small ghost" title={`Make ${job.label}`} onClick={() => dispatch((st, cx) => E.makeshift(st, cx, makerC.id, k, mb))}>
                  {name} (DC {job.dc}, {job.minutes} min)
                </button>
              );
            })}
          </div>
          <p className="small muted">
            Table rules for doing without: a makeshift torch burns about 30 minutes; a lean-to (or a snow trench in deep snow) sleeps two like a Tent; a bed of boughs counts as a Blanket tonight; a hide waterskin holds 4 pints; vine cord
            bursts at DC 15. Lean-tos and bedding stay behind when the party moves on. Bare terrain (desert, arctic without snow, underground, at sea, in town) has nothing to work with.
          </p>
        </>
      )}
      {scattered.length > 0 && (
        <>
          <h3>On the ground</h3>
          <div className="btn-row tight">
            <span className="small warn-text">{scattered.join(', ')}</span>
            <button className="small" onClick={() => dispatch((st, cx) => E.gatherScattered(st, cx, []))}>
              Gather up (10 min)
            </button>
          </div>
        </>
      )}
      <Rule>
        2024 PHB: a Tent sleeps two Small or Medium creatures; a Shovel digs a 5-foot hole in an hour; a Hunting Trap holds whatever steps on it (DC 13 Dexterity save); Caltrops and Ball Bearings take 10 minutes to gather up. Table rules: digging by
        hand takes four times as long; a trap left out overnight catches small game on a d20 roll of {TRAP_CATCH_ON}+ (1d4 + 1 lb of raw meat, and a pelt worth 2 SP, or 1 time in 6 a fine fur worth 2 GP); a Bell on a String or Rope rings when crossed. Traps and the alarm are packed up when the party moves
        on, and anything still on the ground is left behind.
      </Rule>
    </Card>
  );
}
