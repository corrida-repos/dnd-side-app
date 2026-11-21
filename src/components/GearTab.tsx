import { useState } from 'react';
import { useGame, dispatch, edit } from '../state/store';
import * as E from '../state/engine';
import { uid } from '../state/defaults';
import { abilityMod, MAX_ATTUNED, RECHARGE_LABEL, RESOURCE_PRESETS, spellSlotsFor, type Recharge } from '../rules/upkeep';
import { isCaster } from '../rules/spells';
import { formatClock, formatDuration } from '../rules/calendar';
import { Card, Meter, Num, Pill, Select, Text, Toggle, Rule } from './common';
import type { Character, InventoryItem, MagicItem, Resource } from '../state/types';
import { LOAD_LABEL, RATION_WEIGHT } from '../rules/encumbrance';
import { fmtGp, MAGIC_ITEM_VALUE } from '../rules/money';
import { misjudged, valueSecret, valueUnknown } from '../rules/shop';
import { APPRAISE_EYE_DC, APPRAISE_MINUTES, JEWELER_TOOLS, appraiseCheck } from '../rules/appraise';
import { PartyKnowledgeCard, PlayerItemView } from './ItemKnowledge';
import { ARCANA_DC, CLUE_KIND_LABEL, SCHOOLS_OF_MAGIC, STUDY_LABEL, STUDY_MINUTES, type ClueKind } from '../rules/identify';
import { RARITY_LABEL, type Rarity } from '../rules/crafting';
import { WaysAround } from './WaysAround';

const setChar = (id: string, fn: (c: Character) => void) =>
  edit((d) => {
    const c = d.characters.find((x) => x.id === id);
    if (c) fn(c);
  });

export function GearTab() {
  const s = useGame();
  return (
    <div className="stack">
      <Card>
        <WaysAround topic={['attunement', 'identify', 'ammo', 'shortRest']} />
      </Card>
      <div className="grid wide">
        <MysteryOverview />
        <AfterTheFight />
        <PartyKnowledgeCard />
        {s.characters.map((c) => (
          <Card key={c.id} title={`${c.name} · ${c.className} ${c.level}`}>
            <HpBlock c={c} />
            {c.kind !== 'mount' && <ResourcesBlock c={c} />}
            {c.kind !== 'mount' && <ItemsBlock c={c} />}
            <InventoryBlock c={c} />
            <AmmoBlock c={c} />
          </Card>
        ))}
      </div>
    </div>
  );
}

function knowledge(it: MagicItem): { known: number; total: number } {
  const clues = it.clues ?? [];
  const total = clues.length + 1;
  const known = clues.filter((c) => c.known).length + (it.magicKnown || it.identified ? 1 : 0);
  return { known: Math.min(known, total), total };
}

function MysteryOverview() {
  const s = useGame();
  const items = s.characters.flatMap((c) => c.items.filter((it) => !it.identified || (it.clues ?? []).some((x) => !x.known)).map((it) => ({ c, it })));
  if (!items.length) return null;
  return (
    <Card title={`Items not fully understood (${items.length})`} className="span-2">
      <ul className="plain">
        {items.map(({ c, it }) => {
          const k = knowledge(it);
          return (
            <li key={it.id} className="armor-row">
              <span>
                <b>{it.identified ? it.name : it.partyName || 'Unknown item'}</b> <span className="muted small">carried by {c.name}</span>{' '}
                {!it.identified && <span className="muted small">(really: {it.name})</span>}
              </span>
              <span className="small">
                <Meter value={k.known} max={k.total} tone="good" /> {k.known}/{k.total} known
              </span>
            </li>
          );
        })}
      </ul>
      <p className="small muted">Open each item on its owner&apos;s card below to study it, cast Detect Magic or Identify, or reveal facts as the DM.</p>
    </Card>
  );
}

function KnowledgePanel({ c, it }: { c: Character; it: MagicItem }) {
  const s = useGame();
  const [asPlayers, setAsPlayers] = useState(false);
  const [studier, setStudier] = useState(c.id);
  const [bonus, setBonus] = useState(0);
  const [text, setText] = useState('');
  const [kind, setKind] = useState<ClueKind>('property');
  const setItem = (fn: (x: MagicItem) => void) => setChar(c.id, (x) => fn(x.items.find((i) => i.id === it.id)!));
  const k = knowledge(it);
  const studiers = [...s.characters.filter((x) => x.kind !== 'mount' && x.diedAt == null).map((x) => ({ value: x.id, label: x.name })), ...s.hirelings.filter((h) => h.active && (h.role === 'scribe' || h.role === 'other')).map((h) => ({ value: `h:${h.id}`, label: `${h.name} (hireling)` }))];
  return (
    <details className="knowledge" open={!it.identified}>
      <summary>
        What we know <Meter value={k.known} max={k.total} tone="good" /> {k.known}/{k.total}
      </summary>
      <Toggle checked={asPlayers} onChange={setAsPlayers} label="Show as the players see it" />
      {asPlayers ? (
        <PlayerItemView c={c} it={it} />
      ) : (
        <>
      <div className="form-row">
        <Text label="The party calls it" value={it.partyName ?? ''} onChange={(v) => setItem((x) => void (x.partyName = v))} placeholder="e.g. silver ring with a blue stone" />
        <Select label="Rarity (DM)" value={it.rarity ?? ''} onChange={(v) => setItem((x) => void (x.rarity = v as MagicItem['rarity']))} options={[{ value: '', label: 'Unknown' }, ...(Object.keys(RARITY_LABEL) as Rarity[]).map((r) => ({ value: r, label: RARITY_LABEL[r] }))]} />
        <Select label="School (DM)" value={it.school ?? ''} onChange={(v) => setItem((x) => void (x.school = v))} options={[{ value: '', label: 'Unknown' }, ...SCHOOLS_OF_MAGIC]} />
      </div>
      <p className="small">
        {it.magicKnown || it.identified ? <span className="good-text">Known to be magical{it.school ? ` (${it.school})` : ''}.</span> : <span className="muted">Nobody has confirmed it&apos;s magical yet.</span>}
      </p>
      <ul className="plain small">
        {(it.clues ?? []).map((cl) => (
          <li key={cl.id} className="armor-row">
            <label className="toggle">
              <input type="checkbox" checked={cl.known} onChange={(e) => dispatch((st, cx) => E.setClueKnown(st, cx, c.id, it.id, cl.id, e.target.checked))} />
              <span className={cl.known ? '' : 'muted'}>
                <Pill tone={cl.kind === 'curse' ? 'bad' : 'muted'}>{CLUE_KIND_LABEL[cl.kind]}</Pill> {cl.text}
                {!cl.known && ' (hidden)'}
              </span>
            </label>
            <button className="ghost tiny" aria-label="Remove fact" onClick={() => setItem((x) => void (x.clues = (x.clues ?? []).filter((y) => y.id !== cl.id)))}>
              ✕
            </button>
          </li>
        ))}
      </ul>
      <form
        className="btn-row tight"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          setItem((x) => void (x.clues = [...(x.clues ?? []), { id: uid(), kind, text: text.trim(), known: false }]));
          setText('');
        }}
      >
        <Select value={kind} onChange={setKind} options={(Object.keys(CLUE_KIND_LABEL) as ClueKind[]).map((k2) => ({ value: k2, label: CLUE_KIND_LABEL[k2] }))} />
        <Text value={text} onChange={setText} placeholder="A hidden fact (DM), e.g. +1 bonus to AC and saves" />
        <button type="submit" className="small">
          Add
        </button>
      </form>
      <div className="btn-row tight">
        <Select value={studier} onChange={setStudier} options={studiers} />
        <button className="small" onClick={() => dispatch((st, cx) => E.studyItem(st, cx, c.id, it.id, 'detect', studier, 0))}>
          Detect Magic
        </button>
        <Num value={bonus} onChange={(v) => setBonus(Math.round(v))} width={2} label="Arcana bonus" />
        <button className="small" onClick={() => dispatch((st, cx) => E.studyItem(st, cx, c.id, it.id, 'arcana', studier, bonus))}>
          Arcana check (DC {ARCANA_DC[it.rarity || 'unknown']}, {STUDY_MINUTES} min)
        </button>
        <button className="small ghost" onClick={() => dispatch((st, cx) => E.studyItem(st, cx, c.id, it.id, 'experiment', studier, 0))}>
          Experiment ({STUDY_MINUTES} min)
        </button>
      </div>
      {(it.findings ?? []).length > 0 && (
        <ul className="log small">
          {(it.findings ?? []).map((f) => (
            <li key={f.id}>
              <span className="muted">{f.stamp}</span> <b>{STUDY_LABEL[f.method]}:</b> {f.text}
            </li>
          ))}
        </ul>
      )}
      <Rule>
        Detect Magic shows that an item is magical and its school. An Arcana check (table rule: DC 10/15/20/25/30 by rarity) or experimenting reveals one fact at a time. Identify, or a Short Rest spent studying it, reveals
        everything except curses. Attuning reveals a curse (table rule).
      </Rule>
        </>
      )}
    </details>
  );
}

function AfterTheFight() {
  const s = useGame();
  const spent = s.characters.flatMap((c) => c.inventory.filter((i) => (i.ammo?.spent ?? 0) > 0).map((i) => ({ c, i })));
  if (!spent.length) return null;
  return (
    <Card title="After the fight" className="span-2">
      <p className="small">
        Spent ammunition: {spent.map(({ c, i }) => `${c.name} ${i.ammo!.spent} ${i.name}`).join(', ')}. A minute of searching recovers half, rounded down.
      </p>
      <button className="primary" onClick={() => dispatch((st, cx) => E.recoverAmmo(st, cx, s.characters.map((c) => c.id)))}>
        Search the area and recover ammunition (1 min)
      </button>
    </Card>
  );
}

function AmmoBlock({ c }: { c: Character }) {
  const ammo = c.inventory.filter((i) => i.ammo);
  const [n, setN] = useState(1);
  if (!ammo.length) return null;
  return (
    <>
      <h3>Ammunition</h3>
      <ul className="plain small">
        {ammo.map((i) => (
          <li key={i.id} className="armor-row">
            <span>
              <b>{i.name}</b> {i.qty} left{i.ammo!.spent ? <span className="warn-text"> · {i.ammo!.spent} spent since the last search</span> : null}
            </span>
            <span className="btn-row tight">
              <Num value={n} onChange={(v) => setN(Math.max(1, Math.round(v)))} min={1} width={2} />
              <button className="small" disabled={i.qty <= 0} onClick={() => dispatch((st, cx) => E.fireAmmo(st, cx, c.id, i.id, n))}>
                Fire {n}
              </button>
              <button className="small ghost" disabled={!i.ammo!.spent} onClick={() => dispatch((st, cx) => E.recoverAmmo(st, cx, [c.id]))}>
                Recover half
              </button>
            </span>
          </li>
        ))}
      </ul>
      <Rule>After a fight, spending a minute searching recovers half of the ammunition used, rounded down. The rest is lost or broken.</Rule>
    </>
  );
}

function InventoryBlock({ c }: { c: Character }) {
  const s = useGame();
  const [text, setText] = useState('');
  const load = E.carriedLoad(s, c);
  const set = (iid: string, fn: (i: InventoryItem) => void) => setChar(c.id, (x) => fn(x.inventory.find((i) => i.id === iid)!));
  const tone = load.level === 'light' ? 'good' : load.level === 'over' || load.level === 'heavy' ? 'bad' : 'warn';
  const guesses = c.inventory.filter((i) => i.source === 'guess').length;
  return (
    <>
      <h3>
        Inventory and load <Pill tone={tone}>{LOAD_LABEL[load.level].split(' (')[0]}</Pill>
      </h3>
      <div className="hp-line">
        <b>
          {load.total} / {load.capacity} lb
        </b>
        <Meter value={load.total} max={load.capacity} tone={tone} />
        {c.kind !== 'mount' && <Num label="Strength" value={c.strScore} onChange={(v) => setChar(c.id, (x) => void (x.strScore = Math.max(1, Math.round(v))))} min={1} max={30} width={2} />}
        {c.kind === 'mount' && (
          <Num label="Capacity" value={load.capacity} onChange={(v) => setChar(c.id, (x) => void (x.carryCapacity = Math.max(0, Math.round(v))))} min={0} suffix="lb" width={5} />
        )}
      </div>
      <p className="small muted">
        Gear {Math.round(load.gear * 10) / 10} lb · food {load.food} lb ({RATION_WEIGHT} lb per day of Rations) · water {Math.round(load.water)} lb
        {load.coins ? ` · coins ${Math.round(load.coins * 10) / 10} lb` : ''}
        {load.magic ? ` · magic items ${load.magic} lb` : ''}. {LOAD_LABEL[load.level]}.
      </p>
      {c.inventory.length > 0 && (
        <details>
          <summary>
            {c.inventory.length} item line(s){guesses ? `, ${guesses} with guessed weights` : ''}
          </summary>
          <ul className="plain small">
            {[...c.inventory.filter((i) => !i.containerId || !c.inventory.some((x) => x.id === i.containerId))]
              .flatMap((i) => [i, ...c.inventory.filter((x) => x.containerId === i.id)])
              .map((i) => (
              <li key={i.id} className="armor-row">
                <span>
                  {i.containerId && <span className="muted">↳ </span>}
                  {i.name} {i.qty > 1 && <span className="muted">×{i.qty}</span>}{' '}
                  {i.container && (
                    <Pill tone="info" title={i.container.note}>
                      {i.container.weightless ? 'weightless inside' : 'container'}
                      {i.container.capacityLb ? `: ${E.containerLoad(c.inventory, i.id)}/${i.container.capacityLb} lb` : ''}
                    </Pill>
                  )}
                  {valueUnknown(i) ? (
                    <Pill tone="warn" title={`Nobody in the party knows what ${i.qty > 1 ? 'these are' : 'it is'} worth yet.${i.valueGp != null ? ` DM: ${fmtGp(i.valueGp)} each.` : ' No value set.'}`}>
                      value unknown
                    </Pill>
                  ) : misjudged(i) ? (
                    <span className="muted" title={`DM: misjudged. Really ${i.valueGp != null ? fmtGp(i.valueGp) : '?'} each.`}> {fmtGp(i.valueBelieved! * i.qty)}</span>
                  ) : i.valueGp ? (
                    <span className="muted"> {fmtGp(i.valueGp * i.qty)}</span>
                  ) : null}
                  <Pill tone={i.source === 'guess' ? 'warn' : 'muted'} title={i.source === 'book' ? 'From the PHB equipment list' : i.source === 'pasted' ? 'Weight from the pasted text' : i.source === 'guess' ? 'Guessed from the name' : 'Set by hand'}>
                    {i.source === 'book' ? 'PHB' : i.source}
                  </Pill>
                </span>
                <span className="btn-row tight">
                  {!i.container && c.inventory.some((x) => x.container) && (
                    <Select
                      value={i.containerId ?? ''}
                      onChange={(v) => set(i.id, (x) => void (x.containerId = v || null))}
                      options={[{ value: '', label: 'Carried' }, ...c.inventory.filter((x) => x.container).map((x) => ({ value: x.id, label: `In ${x.name}` }))]}
                    />
                  )}
                  <Num value={i.qty} onChange={(v) => set(i.id, (x) => void (x.qty = Math.max(0, Math.round(v))))} min={0} width={2} />
                  <Num value={i.weight} onChange={(v) => set(i.id, (x) => ((x.weight = Math.max(0, v)), (x.source = 'manual')))} min={0} step={0.5} suffix="lb" width={3} />
                  <button className="ghost tiny" aria-label={`Remove ${i.name}`} onClick={() => setChar(c.id, (x) => void (x.inventory = x.inventory.filter((y) => y.id !== i.id)))}>
                    ✕
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <button className="ghost small bad" onClick={() => confirm(`Clear ${c.name}'s inventory list?`) && setChar(c.id, (x) => void (x.inventory = []))}>
            Clear list
          </button>
        </details>
      )}
      <AppraiseBlock c={c} />
      <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={'Paste from D&D Beyond or type one item per line, e.g.\n2 Torches\nLongsword\nRope, hempen (50 feet)'} />
      <div className="btn-row tight">
        <button className="small" disabled={!text.trim()} onClick={() => (dispatch((st, cx) => E.addInventory(st, cx, c.id, text)), setText(''))}>
          Add to inventory
        </button>
      </div>
      <Rule>
        No weights needed: each item is looked up in the 2024 PHB equipment list, guessed from its name, or set to 1 lb. A weight in the pasted text is used as is, and you can correct any line. Rations, water and
        coins (50 to a pound) are added from the tracker. Add &quot;value unknown&quot; to a line (e.g. &quot;Diamond (300 GP, value unknown)&quot;) to keep its value from the party until it&apos;s appraised.
      </Rule>
    </>
  );
}

/** Items whose value the party doesn't know (or may have misjudged), and ways to find out. */
function AppraiseBlock({ c }: { c: Character }) {
  const s = useGame();
  const st = s.settings;
  const secret = c.inventory.filter(valueSecret);
  const hideable = c.inventory.filter((i) => !valueSecret(i) && i.valueGp != null);
  const pcs = s.characters.filter((x) => x.kind !== 'mount' && x.diedAt == null);
  const pros = s.hirelings.filter((h) => h.active && h.role === 'appraiser');
  const [itemId, setItemId] = useState('');
  const [who, setWho] = useState('');
  const [bonus, setBonus] = useState(0);
  const [adv, setAdv] = useState(false);
  const [trueGp, setTrueGp] = useState(0);
  const [hideId, setHideId] = useState('');
  const it = secret.find((i) => i.id === itemId) ?? secret[0];
  const toolsOf = (x: Character) => x.inventory.some((i) => JEWELER_TOOLS.test(i.name));
  const whoId = who || (pros[0] ? `h:${pros[0].id}` : (pcs.find(toolsOf) ?? c).id);
  const pro = pros.find((h) => `h:${h.id}` === whoId);
  const person = pcs.find((x) => x.id === whoId);
  const hasTools = pro ? true : person ? toolsOf(person) : false;
  const tried = !!(st.appraiseOneTry && it?.appraiseTried?.includes(whoId));
  const tools = it ? appraiseCheck(it.name, 'tools', st) : null;
  const eye = it ? appraiseCheck(it.name, 'eye', st) : null;
  const go = (m: E.AppraiseMethod) => dispatch((st2, cx) => E.appraiseItem(st2, cx, c.id, it!.id, m, whoId, bonus, it!.valueGp == null && trueGp > 0 ? trueGp : undefined, adv));
  if (!secret.length && !hideable.length) return null;
  const mins = st.appraiseTime ? `, ${APPRAISE_MINUTES} min` : '';
  return (
    <>
      {secret.length > 0 && (
        <>
          <h3>
            Value unknown <Pill tone="warn">{secret.length}</Pill>
          </h3>
          <p className="small muted">
            {secret.map((i) => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ''}${misjudged(i) ? ` (party thinks ${fmtGp(i.valueBelieved!)}; DM: really ${i.valueGp != null ? fmtGp(i.valueGp) : '?'})` : ''}`).join(', ')}
          </p>
          <div className="btn-row tight">
            <Select value={it?.id ?? ''} onChange={setItemId} options={secret.map((i) => ({ value: i.id, label: i.name }))} />
            {it && it.valueGp == null && <Num label="True value (DM)" value={trueGp} onChange={(v) => setTrueGp(Math.max(0, v))} min={0} suffix="GP" width={5} />}
          </div>
          {it && (
            <>
              <div className="btn-row tight">
                <Select
                  value={whoId}
                  onChange={setWho}
                  options={[
                    ...pcs.map((x) => ({ value: x.id, label: `${x.name}${toolsOf(x) ? ' (Jeweler’s Tools)' : ''}` })),
                    ...pros.map((h) => ({ value: `h:${h.id}`, label: `${h.name} (appraiser, ${h.bonus >= 0 ? '+' : ''}${h.bonus})` })),
                  ]}
                />
                {!pro && <Num label="Int bonus" value={bonus} onChange={(v) => setBonus(Math.round(v))} width={2} />}
                {(tools?.canAdvantage || eye?.canAdvantage) && <Toggle checked={adv} onChange={setAdv} label="Proficient in both the skill and a tool that apply (Advantage)" />}
              </div>
              <div className="btn-row tight">
                {tools?.ok && (
                  <button className="small" disabled={!hasTools || tried} title={hasTools ? undefined : 'Needs Jeweler’s Tools'} onClick={() => go('tools')}>
                    Jeweler&apos;s Tools (DC {tools.dc}
                    {mins})
                  </button>
                )}
                {eye?.ok && (
                  <button className="small" disabled={tried} title={eye.label} onClick={() => go('eye')}>
                    {eye.dc === APPRAISE_EYE_DC ? 'Judge by eye' : 'History'} (DC {eye.dc}
                    {mins})
                  </button>
                )}
                <button className="small ghost" disabled={!s.place.settlement} title={s.place.settlement ? undefined : 'Only in a town or city'} onClick={() => go('merchant')}>
                  Ask a merchant
                </button>
                <button className="small ghost" onClick={() => go('dm')}>
                  DM reveals
                </button>
              </div>
              {tried && <p className="small warn-text">{pro?.name ?? person?.name} already tried; they need a rest first, or someone else can try.</p>}
            </>
          )}
        </>
      )}
      {hideable.length > 0 && (
        <div className="btn-row tight">
          <Select value={hideId || hideable[0].id} onChange={setHideId} options={hideable.map((i) => ({ value: i.id, label: `${i.name} (${fmtGp(i.valueGp!)})` }))} />
          <button className="small ghost" onClick={() => hide(hideId || hideable[0].id)}>
            Hide its value from the party
          </button>
        </div>
      )}
      <Rule>
        Jeweler&apos;s Tools: Discern a gem&apos;s value, Intelligence DC 15; Advantage if also proficient in a skill that applies, such as Investigation (2024 PHB).
        {st.appraiseCrafts && ' Table rule: the tools also judge jewelry and precious metals, and Intelligence (History) values art at DC 15 (Advantage with Painter’s Supplies or another fitting tool).'}
        {st.appraiseByEye && ` Table rule: anyone can judge anything by eye, Intelligence (Investigation or History) at DC ${APPRAISE_EYE_DC}.`}
        {st.appraiseOneTry && ' Table rule: one try each until a rest.'}
        {st.appraiseMisjudge && ' Table rule: rolls are secret, and failing by 5 or more gives a confident wrong value.'} A merchant in a town or city will value anything (table rule), and selling reveals the price. A
        spell&apos;s costly component works if the item is truly worth enough, whether or not anyone knows it. Switches are on the Settings tab.
      </Rule>
    </>
  );

  function hide(iid: string) {
    setChar(c.id, (x) => {
      const i = x.inventory.find((y) => y.id === iid);
      if (i) i.valueHidden = true;
    });
    setHideId('');
  }
}

function HpBlock({ c }: { c: Character }) {
  const [amt, setAmt] = useState(5);
  const left = c.level - c.hitDiceSpent;
  return (
    <>
      <h3>Hit Points</h3>
      <div className="hp-line">
        <b className={c.hp === 0 ? 'bad-text' : ''}>
          {c.hp}/{c.maxHp} HP
        </b>
        {c.tempHp > 0 && <Pill tone="info">+{c.tempHp} temp</Pill>}
        <Meter value={c.hp} max={c.maxHp} tone={c.hp * 2 >= c.maxHp ? 'good' : c.hp > 0 ? 'warn' : 'bad'} />
      </div>
      <DyingBlock c={c} />
      <div className="btn-row">
        <Num value={amt} onChange={(v) => setAmt(Math.max(0, Math.round(v)))} min={0} width={3} />
        <button className="bad" onClick={() => dispatch((st, cx) => E.changeHp(st, cx, c.id, -amt))}>
          Damage
        </button>
        <button className="good" onClick={() => dispatch((st, cx) => E.changeHp(st, cx, c.id, amt))}>
          Heal
        </button>
        <button className="ghost small" onClick={() => setChar(c.id, (x) => void (x.tempHp = amt))}>
          Set temp HP
        </button>
      </div>
      <div className="form-row">
        <Num label="Max HP" value={c.maxHp} onChange={(v) => setChar(c.id, (x) => ((x.maxHp = Math.max(1, Math.round(v))), (x.hp = Math.min(x.hp, x.maxHp))))} min={1} width={3} />
        <Num label="Con score" value={c.conScore} onChange={(v) => setChar(c.id, (x) => void (x.conScore = Math.round(v)))} min={1} max={30} width={2} />
        <Select
          label="Hit Point Die"
          value={String(c.hitDie)}
          onChange={(v) => setChar(c.id, (x) => void (x.hitDie = Number(v)))}
          options={['6', '8', '10', '12'].map((v) => ({ value: v, label: `d${v}` }))}
        />
      </div>
      <div className="btn-row">
        <span>
          Hit Point Dice: <b>{left}</b>/{c.level} d{c.hitDie}
        </span>
        <button disabled={left <= 0 || c.hp >= c.maxHp} onClick={() => dispatch((st, cx) => E.spendHitDie(st, cx, c.id))}>
          Spend one (d{c.hitDie} {abilityMod(c.conScore) >= 0 ? '+' : ''}
          {abilityMod(c.conScore)})
        </button>
      </div>
      <Rule>Spend Hit Point Dice during a Short Rest. A Long Rest restores all HP and all spent Hit Point Dice, but only if you start it with at least 1 HP.</Rule>
    </>
  );
}

function DyingBlock({ c }: { c: Character }) {
  const s = useGame();
  const helpers = [
    ...s.characters.filter((x) => x.id !== c.id && x.kind !== 'mount' && x.hp > 0 && x.diedAt == null).map((x) => ({ id: x.id, name: x.name, wisMod: x.wisMod })),
    ...s.hirelings.filter((x) => x.active && x.role === 'healer').map((x) => ({ id: `h:${x.id}`, name: `${x.name} (hired healer)`, wisMod: x.bonus })),
  ];
  const [helper, setHelper] = useState(helpers[0]?.id ?? '');
  const h = helpers.find((x) => x.id === helper);
  const [bonus, setBonus] = useState<number | null>(null);
  const now = E.absNow(s);
  if (c.diedAt != null) return <p className="bad-text small">Dead. See the World tab for resurrection time limits.</p>;
  if (c.stable)
    return (
      <p className="small warn-text">
        Unconscious but <b>stable</b>. Regains 1 HP {c.wakesAt != null ? `in ${formatDuration(Math.max(0, c.wakesAt - now))} (at ${formatClock(c.wakesAt % 1440)})` : 'soon'}, or right away if healed. Taking damage makes them dying again.
      </p>
    );
  if (!c.dying) return null;
  const pips = (n: number, cls: string) => Array.from({ length: 3 }, (_, i) => <span key={i} className={`pip ${cls} ${i < n ? 'full' : ''}`} />);
  return (
    <div className="dying">
      <p className="small bad-text">
        <b>Unconscious and dying.</b> Successes <span className="pips">{pips(c.deathSuccesses, 'good-pip')}</span> Failures <span className="pips">{pips(c.deathFailures, 'bad-pip')}</span>
      </p>
      <div className="btn-row tight">
        <button className="small" onClick={() => dispatch((st, cx) => E.deathSave(st, cx, c.id))}>
          Roll death save
        </button>
      </div>
      <div className="btn-row tight">
        <Select value={helper} onChange={(v) => (setHelper(v), setBonus(null))} options={[{ value: '', label: 'Helper…' }, ...helpers.map((x) => ({ value: x.id, label: x.name }))]} />
        <Num value={bonus ?? h?.wisMod ?? 0} onChange={(v) => setBonus(Math.round(v))} width={2} label="Medicine bonus" />
        <button className="small" onClick={() => dispatch((st, cx) => E.stabilize(st, cx, c.id, helper || null, 'medicine', bonus ?? h?.wisMod ?? 0))}>
          Medicine check (DC 10)
        </button>
        <button className="small ghost" onClick={() => dispatch((st, cx) => E.stabilize(st, cx, c.id, helper || null, 'sure'))}>
          Healer&apos;s Kit / Spare the Dying
        </button>
      </div>
      <Rule>Death saves: 10 or higher is a success and a 1 counts as two failures. A 20 brings them back with 1 HP. Three successes make them stable, and three failures kill them. Damage at 0 HP adds a failure.</Rule>
    </div>
  );
}

function ResourcesBlock({ c }: { c: Character }) {
  const presets = RESOURCE_PRESETS.filter((p) => !p.cls || p.cls === c.className);
  const [preset, setPreset] = useState('');
  const [name, setName] = useState('');
  const [max, setMax] = useState(2);
  const [recharge, setRecharge] = useState<Recharge>('long');
  const set = (rid: string, fn: (r: Resource) => void) => setChar(c.id, (x) => fn(x.resources.find((r) => r.id === rid)!));
  return (
    <>
      <h3>Limited uses and spell slots</h3>
      {c.resources.length === 0 && <p className="muted small">Nothing tracked yet.</p>}
      <ul className="plain">
        {c.resources.map((r) => (
          <li key={r.id} className="armor-row">
            <span>
              <b>{r.name}</b>{' '}
              <span className="pips" aria-label={`${r.current} of ${r.max}`}>
                {Array.from({ length: Math.min(r.max, 30) }, (_, i) => (
                  <span key={i} className={`pip ${i < r.current ? 'full' : ''}`} />
                ))}
              </span>{' '}
              <span className="muted small">
                {r.current}/{r.max} · {RECHARGE_LABEL[r.recharge]}
              </span>
            </span>
            <span className="btn-row tight">
              <button className="small" disabled={r.current <= 0} onClick={() => set(r.id, (x) => void (x.current -= 1))}>
                Use
              </button>
              <button className="ghost small" disabled={r.current >= r.max} onClick={() => set(r.id, (x) => void (x.current += 1))}>
                +1
              </button>
              <button className="ghost small bad" aria-label={`Remove ${r.name}`} onClick={() => setChar(c.id, (x) => void (x.resources = x.resources.filter((y) => y.id !== r.id)))}>
                ✕
              </button>
            </span>
          </li>
        ))}
      </ul>
      <details>
        <summary>Add a resource</summary>
        <div className="form-row">
          <Select
            label="Preset"
            value={preset}
            onChange={(v) => {
              setPreset(v);
              const p = presets.find((x) => x.name === v);
              if (p) {
                setName(p.name);
                setRecharge(p.recharge);
              }
            }}
            options={[{ value: '', label: 'Custom…' }, ...presets.map((p) => ({ value: p.name, label: p.name }))]}
          />
          <Text label="Name" value={name} onChange={setName} />
          <Num label="Max" value={max} onChange={(v) => setMax(Math.max(1, Math.round(v)))} min={1} width={3} />
          <Select label="Comes back" value={recharge} onChange={setRecharge} options={(Object.keys(RECHARGE_LABEL) as Recharge[]).map((k) => ({ value: k, label: RECHARGE_LABEL[k] }))} />
        </div>
        {presets.find((p) => p.name === preset)?.note && <Rule>{presets.find((p) => p.name === preset)!.note}</Rule>}
        <div className="btn-row">
          <button disabled={!name.trim()} onClick={() => (setChar(c.id, (x) => void x.resources.push({ id: uid(), name: name.trim(), max, current: max, recharge })), setName(''), setPreset(''))}>
            Add
          </button>
          {isCaster(c.className) && (
            <button
              className="ghost"
              onClick={() =>
                setChar(c.id, (x) => {
                  x.resources = x.resources.filter((r) => !/spell slots|pact slots/i.test(r.name));
                  for (const row of spellSlotsFor(c.className as Parameters<typeof spellSlotsFor>[0], c.level)) {
                    const label = c.className === 'Warlock' ? `Pact slots (level ${row.spellLevel})` : `Spell slots (level ${row.spellLevel})`;
                    x.resources.push({ id: uid(), name: label, max: row.count, current: row.count, recharge: row.recharge });
                  }
                })
              }
            >
              Fill in {c.className} spell slots for level {c.level}
            </button>
          )}
        </div>
      </details>
    </>
  );
}

function ItemsBlock({ c }: { c: Character }) {
  const s = useGame();
  const now = E.absNow(s);
  const attuned = c.items.filter((i) => i.attuned).length;
  const [name, setName] = useState('');
  const [attune, setAttune] = useState(false);
  const [charges, setCharges] = useState(0);
  const [regain, setRegain] = useState('1d6+1');
  const [regainAt, setRegainAt] = useState<MagicItem['regainAt']>('dawn');
  const [identified, setIdentified] = useState(false);
  const [partyName, setPartyName] = useState('');
  const [caster, setCaster] = useState('');
  const setItem = (iid: string, fn: (it: MagicItem) => void) => setChar(c.id, (x) => fn(x.items.find((i) => i.id === iid)!));
  return (
    <>
      <h3>
        Magic items <Pill tone={attuned >= MAX_ATTUNED ? 'warn' : 'muted'}>{attuned}/{MAX_ATTUNED} attuned</Pill>
      </h3>
      {c.items.length === 0 && <p className="muted small">No magic items yet.</p>}
      <ul className="plain">
        {c.items.map((it) => {
          const focus = c.restFocus?.itemId === it.id ? c.restFocus.action : null;
          return (
            <li key={it.id} className="facility">
              <div className="armor-row">
                <span>
                  <b>{it.identified ? it.name : it.partyName || 'Unknown item'}</b>
                  {!it.identified && <span className="muted small"> (really: {it.name})</span>}{' '}
                  {it.identified && it.rarity ? (
                    <span className="muted small" title="DMG magic item value by rarity. Selling usually fetches about half.">
                      {RARITY_LABEL[it.rarity]}, worth about {fmtGp(MAGIC_ITEM_VALUE[it.rarity])}{' '}
                    </span>
                  ) : (
                    <Pill tone="warn" title={it.identified ? 'Set its rarity to see its DMG value.' : 'Identifying it reveals its rarity, and so roughly what it’s worth (DMG).'}>
                      value unknown
                    </Pill>
                  )}{' '}
                  {it.requiresAttunement && (it.attuned ? <Pill tone="good">Attuned</Pill> : <Pill tone="muted">Needs attunement</Pill>)}
                  {it.charges != null && it.maxCharges != null && (
                    <Pill tone="info">
                      {it.charges}/{it.maxCharges} charges
                    </Pill>
                  )}
                  {it.awaySince != null && (
                    <Pill tone="warn">
                      Left behind {formatDuration(now - it.awaySince)}
                      {it.attuned ? ` · attunement ends in ${formatDuration(Math.max(0, 1440 - (now - it.awaySince)))}` : ''}
                    </Pill>
                  )}
                  {focus && <Pill tone="good">Next rest: {focus === 'attune' ? 'attune' : focus === 'identify' ? 'identify' : 'end attunement'}</Pill>}
                </span>
                <button className="ghost small bad" aria-label={`Remove ${it.name}`} onClick={() => setChar(c.id, (x) => void (x.items = x.items.filter((y) => y.id !== it.id)))}>
                  ✕
                </button>
              </div>
              <div className="btn-row tight">
                {it.charges != null && (
                  <button className="small" disabled={it.charges <= 0} onClick={() => setItem(it.id, (x) => void (x.charges = (x.charges ?? 0) - 1))}>
                    Use a charge
                  </button>
                )}
                {!it.identified && (
                  <button className="small" onClick={() => dispatch((st, cx) => E.setRestFocus(st, cx, c.id, focus === 'identify' ? null : { itemId: it.id, action: 'identify' }))}>
                    {focus === 'identify' ? 'Cancel' : 'Identify during next rest'}
                  </button>
                )}
                {it.requiresAttunement && !it.attuned && (
                  <button className="small" disabled={attuned >= MAX_ATTUNED} onClick={() => dispatch((st, cx) => E.setRestFocus(st, cx, c.id, focus === 'attune' ? null : { itemId: it.id, action: 'attune' }))}>
                    {focus === 'attune' ? 'Cancel' : 'Attune during next rest'}
                  </button>
                )}
                {it.attuned && (
                  <button className="small ghost" onClick={() => dispatch((st, cx) => E.setRestFocus(st, cx, c.id, focus === 'unattune' ? null : { itemId: it.id, action: 'unattune' }))}>
                    {focus === 'unattune' ? 'Cancel' : 'End attunement during next rest'}
                  </button>
                )}
                <button className="small ghost" onClick={() => dispatch((st, cx) => E.leaveItem(st, cx, c.id, it.id, it.awaySince == null))}>
                  {it.awaySince == null ? 'Left behind' : 'Recovered'}
                </button>
              </div>
              {(!it.identified || (it.clues ?? []).length > 0 || (it.findings ?? []).length > 0) && <KnowledgePanel c={c} it={it} />}
              {!it.identified && (
                <div className="btn-row tight">
                  <Select value={caster} onChange={setCaster} options={[{ value: '', label: 'Identify spell: scroll' }, ...s.characters.map((x) => ({ value: x.id, label: `Identify spell: ${x.name}` }))]} />
                  <button className="small" onClick={() => dispatch((st, cx) => E.identifyBySpell(st, cx, c.id, it.id, caster || null, false))}>
                    Cast (1 min)
                  </button>
                  <button className="small ghost" onClick={() => dispatch((st, cx) => E.identifyBySpell(st, cx, c.id, it.id, caster || null, true))}>
                    As ritual (11 min)
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <details>
        <summary>Add a magic item</summary>
        <div className="form-row">
          <label className="field">
            <span className="field-label">True name (DM)</span>
            <input
              list="magic-item-names"
              value={name}
              placeholder="e.g. Wand of Magic Missiles"
              onChange={(e) => {
                setName(e.target.value);
                const ref = s.itemLibrary.find((x) => x.name.toLowerCase() === e.target.value.toLowerCase());
                if (ref) {
                  setAttune(ref.attunement);
                  setCharges(ref.charges ?? 0);
                  setRegain(ref.regain);
                  setRegainAt(ref.regainAt);
                }
              }}
            />
            <datalist id="magic-item-names">
              {s.itemLibrary.map((x) => (
                <option key={x.name} value={x.name} />
              ))}
            </datalist>
          </label>
          {!identified && <Text label="The party calls it" value={partyName} onChange={setPartyName} placeholder="e.g. black wand carved with stars" />}
          <Num label="Charges" value={charges} onChange={(v) => setCharges(Math.max(0, Math.round(v)))} min={0} width={3} />
          {charges > 0 && (
            <>
              <Text label="Regains" value={regain} onChange={setRegain} placeholder="1d6+1 or all" />
              <Select
                label="When"
                value={regainAt}
                onChange={setRegainAt}
                options={[
                  { value: 'dawn', label: 'At dawn' },
                  { value: 'longRest', label: 'Long Rest' },
                  { value: 'shortRest', label: 'Short Rest' },
                  { value: 'never', label: 'Never' },
                ]}
              />
            </>
          )}
        </div>
        <div className="chips">
          <Toggle checked={attune} onChange={setAttune} label="Requires attunement" />
          <Toggle checked={identified} onChange={setIdentified} label="Already identified" />
        </div>
        <button
          disabled={!name.trim()}
          onClick={() => {
            setChar(c.id, (x) =>
              void x.items.push({
                id: uid(),
                name: name.trim(),
                requiresAttunement: attune,
                attuned: false,
                identified,
                charges: charges > 0 ? charges : null,
                maxCharges: charges > 0 ? charges : null,
                regain,
                regainAt,
                awaySince: null,
                notes: '',
                partyName: partyName.trim(),
                magicKnown: identified,
                clues: [],
                findings: [],
              }),
            );
            setName('');
            setPartyName('');
          }}
        >
          Add item
        </button>
      </details>
      <Rule>
        Attuning takes a Short Rest focused on the item while touching it, with a maximum of {MAX_ATTUNED} items. Identifying works the same way, or with the Identify spell. Attunement ends if the item is more
        than 100 feet away for 24 hours, if you die, or if someone else attunes to it. Ending it voluntarily takes another Short Rest, and the attuning rest can&apos;t be the same one used to learn the item&apos;s properties. A cursed item&apos;s attunement can&apos;t be ended until the curse is broken (Remove Curse), and identifying doesn&apos;t reveal curses. Items that need a class or spellcasting can only be attuned by someone who qualifies. You can&apos;t attune to two copies of the same item.
      </Rule>
    </>
  );
}
