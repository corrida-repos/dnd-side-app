import { useState } from 'react';
import { useGame, dispatch, edit } from '../state/store';
import * as E from '../state/engine';
import { fireThreat } from '../rules/weather';
import { FORAGE_DC, ABUNDANCE_LABEL, foodNeedLb, fmtLb, fmtWater, proficiencyBonus } from '../rules/survival';
import { Card, Num, Pill, Select, Toggle, Rule } from './common';

export function CampTab() {
  return (
    <div className="grid">
      <FireCard />
      <StoresCard />
      <MealsCard />
      <ForageCard />
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
      <Rule>Shared supplies: foraged food and water land here. Party meals use the stores first, then each person's own rations or waterskin.</Rule>
      <div className="btn-row">
        <button disabled={!s.place.waterSource} onClick={() => dispatch(E.refillWater)} title={s.place.waterSource ? '' : 'No water source at this place'}>
          Refill all waterskins
        </button>
        <button disabled={!s.place.waterSource} onClick={() => edit((d) => void (d.stores.waterGal += 5))}>
          Fill a 5 gal barrel
        </button>
      </div>
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
        <Select value={cook} onChange={setCook} options={[{ value: '', label: 'No cook check' }, ...opts]} />
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
