import type { ReactNode } from 'react';
import { useGame, edit, dispatch } from '../state/store';
import * as E from '../state/engine';
import { ALWAYS_ON, MECHANICS, ON_DEMAND, TIERS, closestTier, matchTier, tierName, type SwitchKey, type TierId } from '../rules/detailTiers';
import type { Settings } from '../state/types';
import { Card, Num, Toggle, Rule } from './common';

/** Numbers and fuller rule text that go with some switches, shown under them. */
function extras(s: Settings): Partial<Record<SwitchKey, { inline?: ReactNode; more?: ReactNode }>> {
  return {
    fireWarmsCamp: {
      inline: <Num label="Campfire protects down to" value={s.fireColdLimitF ?? -20} onChange={(v) => edit((d) => void (d.settings.fireColdLimitF = Math.round(v)))} min={-60} max={0} suffix="°F" width={3} />,
      more: 'Below that temperature even people beside the fire make the hourly extreme cold saves. A sheltered pit (windbreak and roof) protects 10 °F lower. It covers the camp while resting or camping, not while traveling, and also counts as warm cover on a cold night.',
    },
    fireLightingCheck: {
      more: 'DC 10 with dry fuel, +5 when rain or snow has dampened it, +5 in strong wind or heavy rain (only possible in a sheltered pit) and +5 without a Tinderbox (10 minutes a try instead of 1). Prestidigitation, Druidcraft or Fire Bolt light it with no roll. Off, the PHB applies: a Tinderbox lights it in 1 minute.',
    },
    coldNights: {
      inline: <Num label="Cold night at or below" value={s.coldNightF} onChange={(v) => edit((d) => void (d.settings.coldNightF = Math.round(v)))} min={-20} max={60} suffix="°F" width={3} />,
      more: 'If the temperature drops to this point during a Long Rest, anyone sleeping in the open without a Bedroll, Blanket, cold weather gear, a lit campfire (when that rule is on) or a building or cave makes a DC 10 Con save when they wake, or gains 1 Exhaustion level. At 0 °F or below, the hourly extreme cold saves apply instead while Extreme weather is on.',
    },
    rawFoodRisk: {
      inline: <Num label="Raw food save DC" value={s.rawFoodDC} onChange={(v) => edit((d) => void (d.settings.rawFoodDC = Math.round(v)))} min={1} max={30} width={3} />,
      more: 'Eating raw food means a Con save, or the character is Sick: Poisoned until they finish a Long Rest. Cooking it or casting Purify Food and Drink makes it safe.',
    },
    wildNeedsPurifying: { more: 'Drinking unpurified water means a DC 10 Con save, or the character is Sick: Poisoned until they finish a Long Rest. Purify Food and Drink or boiling makes it safe.' },
    sleepDeprivation: { more: 'Each time the party passes another 24 hours without finishing a Long Rest, everyone makes a Con save or gains 1 Exhaustion level from Sleep deprivation. The DC is 10, plus 5 for every further 24 hours, and it resets after a Long Rest.' },
    nightTravelSlow: { more: 'A Torch, Lantern or Candle in anyone’s inventory, or an active light effect, counts as light.' },
    hirelingsEat: { more: '1 lb of food and 1 gallon of water each per day. In a settlement their wages cover their keep. Needs Food and water on.' },
    foodAndWater: { more: 'Off, characters and mounts never go hungry or thirsty: nothing is checked at midnight and the checklists stop asking for meals. Rations and water can still be tracked by hand.' },
    extremeWeather: { more: 'Off, the weather is still rolled and described, but nobody saves against cold or heat. Cold nights (if on) then apply at any temperature at or below their threshold.' },
    navigation: { more: 'Off, the party always finds its way, whatever the terrain.' },
    encumbrance: { more: 'Off, weight is still added up and shown, but no load slows anyone down or forces a Slow pace. The 5 × and 10 × Strength thresholds also need this on.' },
    weatherDamage: {
      more: 'Outdoors: heavy rain favors Lightning and hinders Fire, and a thunderstorm also favors Thunder. Falling snow and extreme cold favor Cold and hinder Fire. Extreme heat favors Fire and hinders Cold. Clear daylight favors Radiant, night favors Necrotic, and humid swamp air favors Poison. The Underdark favors Necrotic and hinders Radiant. Favored means +1 damage per damage die, hindered means −1 per die (minimum 1).',
    },
    improvised: {
      more: 'Covers testing food, drink and plants without a tool, cooking without Cook’s Utensils (Wisdom (Survival), DC 15), harvesting poison without a Poisoner’s Kit (DC 25) and Sight Rot ointment without an Herbalism Kit (2 hours, DC 15). Lighting a fire without a Tinderbox and judging value by eye have their own switches and follow the same +5 step.',
    },
    appraiseMisjudge: {
      more: 'The 2024 PHB only says Jeweler’s Tools discern a gem’s value (Intelligence, DC 15), with Advantage if the appraiser is also proficient in a skill that applies. A misjudged value is one treasure tier off (10, 50, 100, 500, 1,000 or 5,000 GP for gems; 25, 250, 750, 2,500 or 7,500 GP for art), and the party can’t tell from the log. Selling, a merchant or the DM reveals the truth, and spells always use the true value.',
    },
  };
}

const TIER_BLURB: Record<TierId, string> = {
  1: 'Always kept: these rules take work away.',
  2: 'The 2024 rules as written.',
  3: 'Table and optional rules that add chores and saves.',
  4: 'The fiddliest rules: work in combat and at every sale.',
};

/** Pick how much detail the app tracks, and see every switchable mechanic ranked by how much it slows play. */
export function DetailCard() {
  const s = useGame();
  const current = matchTier(s.settings);
  const near = closestTier(s.settings);
  const ex = extras(s.settings);
  const set = (k: SwitchKey, v: boolean) => edit((d) => void (d.settings[k] = v));
  return (
    <Card title="Level of detail" className="span-all">
      <Rule>
        Every switchable mechanic is ranked by how much it slows the game down: how often it asks for a roll, a decision or an entry, and how much it interrupts the scene. Pick a tier to set them all at once, then change any
        single rule below. Rule variants and numbers in Rules options are left alone. Choosing a tier can be undone.
      </Rule>
      <div className="tier-picker" role="radiogroup" aria-label="Level of detail">
        {TIERS.map((t) => (
          <button
            key={t.id}
            role="radio"
            aria-checked={current === t.id}
            className={`tier-option ${current === t.id ? 'active' : ''}`}
            onClick={() => current !== t.id && dispatch((st, c) => E.setDetailTier(st, c, t.id), `the ${t.name} level of detail`)}
          >
            <b>
              {t.id}. {t.name}
            </b>
            <span>{t.tagline}</span>
            <small>{t.load}</small>
          </button>
        ))}
      </div>
      <p className="small">
        {current ? (
          <>
            Playing at <b>{tierName(current)}</b>.
          </>
        ) : (
          <>
            <b>Custom</b> mix: closest to {tierName(near.tier)} ({near.differences} rule{near.differences === 1 ? '' : 's'} changed by hand).
          </>
        )}{' '}
        <span className="muted">“Roll saving throws for me” (Rules options) keeps any tier quick.</span>
      </p>
      {TIERS.map((t) => (
        <section key={t.id} className="tier-group">
          <h3>
            Tier {t.id} · {t.name} <span className="muted small">{TIER_BLURB[t.id]}</span>
          </h3>
          <ul className="plain tier-list">
            {MECHANICS.filter((m) => m.tier === t.id).map((m) => {
              const x = ex[m.key];
              const on = !!s.settings[m.key];
              return (
                <li key={m.key} className={on ? '' : 'tier-off'}>
                  <Toggle checked={on} onChange={(v) => set(m.key, v)} label={m.label} />
                  <span className="pill pill-info">{m.source}</span>
                  <div className="small muted tier-cost">{m.cost}</div>
                  {on && x?.inline && <div className="form-row">{x.inline}</div>}
                  {x?.more && (
                    <details className="small">
                      <summary>Rule details</summary>
                      <p className="rule">{x.more}</p>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <div className="grid tier-notes">
        <div>
          <h3>Built in at every tier</h3>
          <ul className="small">
            {ALWAYS_ON.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Only when you use them</h3>
          <ul className="small">
            {ON_DEMAND.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
