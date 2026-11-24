import { useState, type ReactNode } from 'react';
import { useGame, dispatch } from '../state/store';
import * as E from '../state/engine';
import { Card, Pill, Select, Toggle, Rule } from './common';
import { goTo } from './nav';
import { BUILDINGS, CRIME_EXAMPLE, SETTLEMENT_SIZE, buildingType, groupsOf, securityNotes, type StaffGroup, type Town, type TownBuilding } from '../rules/settlements';
import { ALIGN_LABEL, statLine, type Npc } from '../rules/npcs';
import type { Settlement } from '../rules/services';

const SIZES = (Object.keys(SETTLEMENT_SIZE) as Settlement[]).map((k) => ({ value: k, label: `${SETTLEMENT_SIZE[k].label} (${SETTLEMENT_SIZE[k].population})` }));

const TAB_LABEL: Record<string, string> = {
  money: 'Town & Money',
  downtime: 'Downtime',
  camp: 'Camp',
  effects: 'Effects & Ailments',
  gear: 'Characters',
  world: 'World',
  storage: 'Storage',
  bastions: 'Bastions',
  morning: 'Characters',
  travel: 'Travel',
};

/** The settlement the party is in: its DMG details, the people who run it, its watch, and every building that does something here. */
export function TownCard() {
  const s = useGame();
  const town = E.currentTown(s);
  const [size, setSize] = useState<Settlement>('town');
  const [water, setWater] = useState(false);
  const name = s.place.name.trim() || 'this place';
  if (!town) {
    return (
      <Card title="Settlement" className="span-2">
        <p className="small">
          {s.place.settlement ? `${name} hasn't been rolled up yet.` : `The party isn't in a settlement. Rolling one up puts them in ${name}.`} Rolling gives its size, defining trait, claim to fame, leader and maybe a calamity (2024 DMG Settlement Tables); every inn, temple, shop, craft, service and authority the party can use there, each with the person who runs it (2024 DMG Detailed NPCs); and the watch that keeps the peace.
        </p>
        <div className="form-row">
          <Select label="Size" value={size} onChange={setSize} options={SIZES} />
          <Toggle checked={water} onChange={setWater} label="By a coast, lake or river (docks)" />
        </div>
        <button className="primary small" onClick={() => dispatch((st, cx) => E.rollTown(st, cx, size, water))}>
          Roll up {name}
        </button>
        <Rule>2024 DMG Settlements by Size, Settlement Tables and Detailed NPCs; 2024 Monster Manual stat blocks. Table rule: which buildings each size has, and the size of the watch.</Rule>
      </Card>
    );
  }
  return <TownView town={town} />;
}

const staffLine = (g: StaffGroup) => `${g.count} × ${g.role.toLowerCase()} (${g.stat})`;

/** One townsperson: what the party sees, and the DM's notes. */
function NpcPanel({ town, npc, refer, extra }: { town: Town; npc: Npc; refer: E.TownNpcRef; extra?: ReactNode }) {
  const [secret, setSecret] = useState(false);
  return (
    <div className="small" style={{ margin: '4px 0 8px' }}>
      <div>
        <b>{npc.name}</b>
        {npc.role && <span>, {npc.role.toLowerCase()}</span>}
        {npc.stat && <span className="muted"> · {statLine(npc.stat)}</span>}
      </div>
      {(npc.align || npc.appearance) && (
        <div>
          {npc.align && (
            <span>
              {ALIGN_LABEL[npc.align]}
              {npc.traits?.length ? `: ${npc.traits.join(', ').toLowerCase()}` : ''}.{' '}
            </span>
          )}
          {npc.appearance && <span>Stands out: {npc.appearance.charAt(0).toLowerCase() + npc.appearance.slice(1)}.</span>}
        </div>
      )}
      {npc.secret && (
        <div>
          {secret ? (
            <span>
              <Pill tone="warn">DM only</Pill> Secret: {npc.secret}
            </span>
          ) : (
            <button className="ghost small" onClick={() => setSecret(true)}>
              Show secret (DM)
            </button>
          )}
        </div>
      )}
      {extra}
      <div className="btn-row tight">
        <button className="ghost small" onClick={() => dispatch((st, cx) => E.rerollTownNpc(st, cx, town.name, refer))}>
          New person
        </button>
        <button className="ghost small" onClick={() => dispatch((st, cx) => E.townNpcToContact(st, cx, town.name, refer))}>
          Add to contacts
        </button>
      </div>
    </div>
  );
}

function BuildingLine({ town, b }: { town: Town; b: TownBuilding }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button className="ghost small" onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? '▾' : '▸'} {b.name}
      </button>{' '}
      <span className="muted">{b.keeper.name}</span>
      {open && (
        <div style={{ paddingLeft: 16 }}>
          <NpcPanel town={town} npc={b.keeper} refer={{ building: b.id }} extra={b.staff?.length ? <div>Staff: {b.staff.map(staffLine).join('; ')}.</div> : null} />
          <button className="ghost small" onClick={() => confirm(`Remove ${b.name}?`) && dispatch((st, cx) => E.removeTownBuilding(st, cx, town.name, b.id))}>
            Remove {b.name}
          </button>
        </div>
      )}
    </div>
  );
}

function SecurityPanel({ town }: { town: Town }) {
  const sec = town.security;
  if (!sec) return <p className="small muted">Roll the settlement again to raise its watch.</p>;
  const total = sec.forces.reduce((a, f) => a + f.count, 0);
  return (
    <div>
      <p className="small">
        {sec.walls ? `Walled, ${sec.gates} gate${sec.gates === 1 ? '' : 's'}.` : 'No walls.'} {total ? `${total.toLocaleString()} in the watch.` : 'No standing watch.'}
        {sec.militia ? ` Militia: ${sec.militia.count.toLocaleString()} ${sec.militia.stat} (${sec.militia.role.toLowerCase()}).` : ''}
      </p>
      {sec.officers.map((o, i) => (
        <NpcPanel key={i} town={town} npc={o} refer={{ officer: i }} />
      ))}
      {sec.forces.length > 0 && (
        <ul className="small">
          {sec.forces.map((f) => (
            <li key={f.role}>
              {f.count.toLocaleString()} × {f.role.toLowerCase()}: {statLine(f.stat)}
            </li>
          ))}
        </ul>
      )}
      <ul className="small">
        {securityNotes(town.size, sec).map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
      {town.size !== 'village' && (
        <details className="small">
          <summary>The DMG’s example laws (Free City of Greyhawk)</summary>
          <ul>
            {CRIME_EXAMPLE.map((c) => (
              <li key={c.label}>
                <b>{c.label}</b> ({c.covers}): {c.punishment}.
              </li>
            ))}
          </ul>
          <p className="muted">Heat, bounties and arrests are tracked under Notoriety on the World tab.</p>
        </details>
      )}
      <div className="btn-row tight">
        <button className="ghost small" onClick={() => goTo('world')}>
          Notoriety (World) →
        </button>
      </div>
    </div>
  );
}

function TownView({ town }: { town: Town }) {
  const [add, setAdd] = useState(BUILDINGS[0].id);
  const [wares, setWares] = useState<string | null>(null);
  const reroll = (field: 'trait' | 'fame' | 'leader' | 'calamity' | 'noCalamity') => dispatch((st, cx) => E.rerollTownDetail(st, cx, town.name, field));
  const size = SETTLEMENT_SIZE[town.size];
  const watchCount = town.security ? town.security.forces.reduce((a, f) => a + f.count, 0) : 0;
  return (
    <Card
      title={`${size.label} of ${town.name}`}
      className="span-2"
      actions={
        <button className="ghost small" onClick={() => confirm(`Roll ${town.name} up again? Its buildings, people and details are replaced.`) && dispatch((st, cx) => E.rollTown(st, cx, town.size, town.water))}>
          Roll again
        </button>
      }
    >
      <div className="form-row">
        <Select label="Size" value={town.size} onChange={(v) => dispatch((st, cx) => E.setTownSize(st, cx, town.name, v))} options={SIZES} />
        <span className="small">
          Population {size.population}; items up to {size.maxGp.toLocaleString()} GP for sale. {town.buildings.length} places of note.
        </span>
      </div>
      <ul className="small">
        <li>
          <b>Defining trait:</b> {town.trait}{' '}
          <button className="ghost small" onClick={() => reroll('trait')}>
            ↻
          </button>
        </li>
        <li>
          <b>Claim to fame:</b> {town.fame}{' '}
          <button className="ghost small" onClick={() => reroll('fame')}>
            ↻
          </button>
        </li>
        <li>
          <b>Local leader:</b> {town.leader}{' '}
          <button className="ghost small" onClick={() => reroll('leader')}>
            ↻
          </button>
        </li>
        <li>
          <b>Current calamity:</b> {town.calamity ?? <span className="muted">none</span>}{' '}
          <button className="ghost small" onClick={() => reroll('calamity')}>
            {town.calamity ? '↻' : 'Roll one'}
          </button>
          {town.calamity && (
            <button className="ghost small" onClick={() => reroll('noCalamity')}>
              Resolved
            </button>
          )}
        </li>
      </ul>
      {town.ruler && (
        <details>
          <summary>
            <b>Who rules</b> <span className="small muted">({town.ruler.name})</span>
          </summary>
          <NpcPanel town={town} npc={town.ruler} refer={{ ruler: true }} />
        </details>
      )}
      <details>
        <summary>
          <b>Security</b> <span className="small muted">({!town.security ? 'not rolled' : watchCount ? `${watchCount.toLocaleString()} in the watch` : 'a constable and militia'})</span>
        </summary>
        <SecurityPanel town={town} />
      </details>
      {groupsOf(town).map(({ group, buildings }) => {
        const kinds = [...new Set(buildings.map((b) => b.type))];
        return (
          <details key={group}>
            <summary>
              <b>{group}</b> <span className="small muted">({buildings.length})</span>
            </summary>
            <div className="table-wrap">
              <table>
                <tbody>
                  {kinds.map((kind) => {
                    const t = buildingType(kind);
                    const these = buildings.filter((b) => b.type === kind);
                    const shown = wares === kind;
                    return (
                      <tr key={kind}>
                        <td>
                          <b>{t?.label ?? kind}</b>
                          {these.length > 1 && <span className="small muted"> ×{these.length}</span>}
                          {t?.dmgShop && <div className="small muted">DMG shop</div>}
                        </td>
                        <td className="small">
                          {t?.does}
                          {shown && t?.specials && (
                            <div className="muted">
                              Also sells: {t.specials.map((x) => `${x.name} (${x.gp.toLocaleString()} GP${x.note ? `, ${x.note}` : ''})`).join('; ')}.
                            </div>
                          )}
                          {these.map((b) => (
                            <BuildingLine key={b.id} town={town} b={b} />
                          ))}
                        </td>
                        <td>
                          <div className="btn-row tight">
                            {t?.tab && (
                              <button className="ghost small" onClick={() => goTo(t.tab!)}>
                                {TAB_LABEL[t.tab] ?? t.tab} →
                              </button>
                            )}
                            {t?.specials && (
                              <button className="ghost small" onClick={() => setWares(shown ? null : kind)}>
                                {shown ? 'Less' : 'Wares'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        );
      })}
      <div className="form-row">
        <Select label="Add a building" value={add} onChange={setAdd} options={BUILDINGS.map((b) => ({ value: b.id, label: `${b.label} (${b.group})` }))} />
        <button className="small" onClick={() => dispatch((st, cx) => E.addTownBuilding(st, cx, town.name, add))}>
          Add
        </button>
        {town.water ? <Pill tone="muted">By the water</Pill> : null}
      </div>
      <Rule>
        2024 DMG: Settlements by Size, Settlement Tables, Tavern Names, Detailed NPCs (names, appearance, secrets), and the Free City of Greyhawk’s City Watch, walls and gates; 2024 PHB Personality Traits by Alignment; 2024 Monster Manual stat blocks. The shop sells only what these buildings stock, up to the settlement’s most expensive item; an apothecary, herbalist or alchemist has Potions of Healing even in a village. Table rules: which buildings each size has, who staffs them, the size of the watch and militia, patrol sizes, and a calamity 1 time in 3.
      </Rule>
    </Card>
  );
}
