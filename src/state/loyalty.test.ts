import { expect, it } from 'vitest';
import { createDefaultState, newCharacter } from './defaults';
import * as E from './engine';

const ctx: E.Ctx = { rng: () => 0.999 };

function campaign() {
  const s = createDefaultState(ctx.rng);
  s.settings.encounters = false;
  s.settings.foodAndWater = false;
  s.characters = [
    newCharacter({ name: 'A', gp: 20, abilities: { cha: 16 } }),
    newCharacter({ name: 'B', gp: 20, abilities: { cha: 12 } }),
  ];
  return s;
}

it('a spontaneous volunteer leaves at zero Loyalty without changing anyone’s purse', () => {
  const s = E.employHireling(campaign(), ctx, 'other', 'Nessa', 'party', true);
  const ally = s.hirelings[0];
  expect(ally).toMatchObject({ active: true, wageGp: 0, loyalty: { score: 8 } });
  const after = E.changeNpcLoyalty(s, ctx, { kind: 'hireling', id: ally.id }, 'abuse');
  expect(after.hirelings[0]).toMatchObject({ active: false, loyalty: { score: 0 } });
  expect(after.characters.map((c) => c.gp)).toEqual([20, 20]);
  expect(after.log[0].text).toBe('Nessa leaves the party.');
});

it('refunds half of the latest recorded wage to its original payers once', () => {
  let s = E.employHireling(campaign(), ctx, 'guard', 'Rook', 'party');
  s = E.advance(s, ctx, 2 * 1440, 'camp');
  const target = { kind: 'hireling', id: s.hirelings[0].id } as const;
  const before = s.characters.map((c) => c.gp);
  const paid = s.hirelings[0].loyalty!.lastPayment!;
  expect(paid).toHaveLength(2);
  s.hirelings[0].payer = s.characters[0].id;
  const after = E.changeNpcLoyalty(s, ctx, target, 0);
  expect(after.characters.map((c) => c.gp)).toEqual(before.map((gp) => gp + paid[0].gp / 2));
  expect(after.hirelings[0].active).toBe(false);
  expect(E.changeNpcLoyalty(after, ctx, target, 0).characters.map((c) => c.gp)).toEqual(after.characters.map((c) => c.gp));
});

it('tracks a named joined NPC with a character sheet separately from the PCs', () => {
  const s = campaign();
  const npc = newCharacter({ name: 'Rell', gp: 0, abilities: { cha: 20 } });
  s.characters.push(npc);
  const joined = E.markNpcCompanion(s, ctx, npc.id, 2, s.characters[0].id);
  expect(joined.characters[2].loyalty?.score).toBe(8);
  const paid = E.advance(joined, ctx, 1440, 'camp');
  const before = paid.characters[0].gp;
  const after = E.changeNpcLoyalty(paid, ctx, { kind: 'character', id: npc.id }, 0);
  expect(after.characters.some((c) => c.id === npc.id)).toBe(false);
  expect(after.characters[0].gp).toBe(before + 1);
});
