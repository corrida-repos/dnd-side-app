import { useState } from 'react';
import { useGame, dispatch } from '../state/store';
import * as E from '../state/engine';
import { Card, Pill, Select, Toggle, Rule } from './common';
import { goTo } from './nav';
import { BUILDINGS, SETTLEMENT_SIZE, buildingType, groupsOf, type Town } from '../rules/settlements';
import type { Settlement } from '../rules/services';

const SIZES = (Object.keys(SETTLEMENT_SIZE) as Settlement[]).map((k) => ({ value: k, label: `${SETTLEMENT_SIZE[k].label} (${SETTLEMENT_SIZE[k].population})` }));

const TAB_LABEL: Record<string, string> = {
  money: 'Money',
  downtime: 'Downtime',
  camp: 'Camp',
  effects: 'Effects',
  gear: 'Gear',
  world: 'World',
  storage: 'Storage',
  bastions: 'Bastions',
  morning: 'Spells',
  travel: 'Travel',
};

/** The settlement the party is in: its DMG details and every building that does something here. */
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
          {s.place.settlement ? `${name} hasn't been rolled up yet.` : `The party isn't in a settlement. Rolling one up puts them in ${name}.`} Rolling gives its size, defining trait, claim to fame, leader and maybe a calamity (2024 DMG Settlement Tables), and every inn, temple, shop, craft, service and authority the party can use there.
        </p>
        <div className="form-row">
          <Select label="Size" value={size} onChange={setSize} options={SIZES} />
          <Toggle checked={water} onChange={setWater} label="By a coast, lake or river (docks)" />
        </div>
        <button className="primary small" onClick={() => dispatch((st, cx) => E.rollTown(st, cx, size, water))}>
          Roll up {name}
        </button>
        <Rule>2024 DMG Settlements by Size and Settlement Tables. Table rule: which buildings each size has.</Rule>
      </Card>
    );
  }
  return <TownView town={town} />;
}

function TownView({ town }: { town: Town }) {
  const [add, setAdd] = useState(BUILDINGS[0].id);
  const [open, setOpen] = useState<string | null>(null);
  const reroll = (field: 'trait' | 'fame' | 'leader' | 'calamity' | 'noCalamity') => dispatch((st, cx) => E.rerollTownDetail(st, cx, town.name, field));
  const size = SETTLEMENT_SIZE[town.size];
  return (
    <Card
      title={`${size.label} of ${town.name}`}
      className="span-2"
      actions={
        <button className="ghost small" onClick={() => confirm(`Roll ${town.name} up again? Its buildings and details are replaced.`) && dispatch((st, cx) => E.rollTown(st, cx, town.size, town.water))}>
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
                    const shown = open === kind;
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
                          <div>
                            {these.map((b, i) => (
                              <span key={b.id}>
                                {i > 0 && ' · '}
                                {b.name} <span className="muted">({b.keeper})</span>{' '}
                                <button className="ghost small" title={`Remove ${b.name}`} onClick={() => confirm(`Remove ${b.name}?`) && dispatch((st, cx) => E.removeTownBuilding(st, cx, town.name, b.id))}>
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="btn-row tight">
                            {t?.tab && (
                              <button className="ghost small" onClick={() => goTo(t.tab!)}>
                                {TAB_LABEL[t.tab] ?? t.tab} →
                              </button>
                            )}
                            {t?.specials && (
                              <button className="ghost small" onClick={() => setOpen(shown ? null : kind)}>
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
        2024 DMG Settlements by Size, Settlement Tables, Tavern Names and Common Names. The shop sells only what these buildings stock, up to the settlement’s most expensive item; an apothecary, herbalist or alchemist has Potions of Healing even in a village (2024 DMG). Table rule: which buildings each size has, and a calamity 1 time in 3.
      </Rule>
    </Card>
  );
}
