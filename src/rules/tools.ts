/**
 * Tool checks from the 2024 PHB (each tool's Utilize entry), and the table rule for trying
 * without the right tool: an improvised attempt at DC +5, taking twice as long where time matters.
 */

/** Table rule: how much harder an improvised attempt is than the tool's check. */
export const IMPROVISED_DC = 5;
/** Table rule: improvised attempts that take time take this many times as long. */
export const IMPROVISED_TIME = 2;

/** What a tester is examining. */
export type TestKind = 'food' | 'drink' | 'object' | 'container' | 'plant';

export const TEST_KIND_LABEL: Record<TestKind, string> = {
  food: 'Food (spoiled or poisoned?)',
  drink: 'A drink (poisoned?)',
  object: 'An object or substance (poisoned?)',
  container: 'A glass or ceramic container (what did it hold?)',
  plant: 'A plant (safe or poisonous?)',
};

export interface ToolTest {
  id: string;
  tool: string;
  /** Matches the tool's name in an inventory. */
  match: RegExp;
  ability: 'Intelligence' | 'Wisdom';
  dc: number;
  /** The Utilize entry, as the 2024 PHB words it. */
  utilize: string;
  kinds: TestKind[];
}

/** 2024 PHB Utilize entries that tell whether something is safe. */
export const TOOL_TESTS: ToolTest[] = [
  { id: 'cook', tool: "Cook's Utensils", match: /cook'?s utensils/i, ability: 'Wisdom', dc: 15, utilize: 'detect spoiled or poisoned food (DC 15)', kinds: ['food'] },
  { id: 'brewer', tool: "Brewer's Supplies", match: /brewer'?s supplies/i, ability: 'Intelligence', dc: 15, utilize: 'detect poisoned drink (DC 15)', kinds: ['drink'] },
  { id: 'poisoner', tool: "Poisoner's Kit", match: /poisoner'?s kit/i, ability: 'Intelligence', dc: 10, utilize: 'detect a poisoned object (DC 10)', kinds: ['food', 'drink', 'object'] },
  { id: 'alchemist', tool: "Alchemist's Supplies", match: /alchemist'?s supplies/i, ability: 'Intelligence', dc: 15, utilize: 'identify a substance (DC 15)', kinds: ['food', 'drink', 'object'] },
  { id: 'glass', tool: "Glassblower's Tools", match: /glassblower'?s tools/i, ability: 'Intelligence', dc: 15, utilize: 'discern what a glass object held in the past 24 hours (DC 15)', kinds: ['container'] },
  { id: 'potter', tool: "Potter's Tools", match: /potter'?s tools/i, ability: 'Intelligence', dc: 15, utilize: 'discern what a ceramic object held in the past 24 hours (DC 15)', kinds: ['container'] },
  { id: 'herbalism', tool: 'Herbalism Kit', match: /herbalism kit/i, ability: 'Intelligence', dc: 10, utilize: 'identify a plant (DC 10)', kinds: ['plant'] },
];

/** Table rule: the improvised check for each kind, at the easiest tool's DC + 5. */
export const IMPROVISED_TESTS: Record<TestKind, { check: string; dc: number; how: string }> = {
  food: { check: 'Wisdom (Perception)', dc: 15 + IMPROVISED_DC, how: 'smells and tastes' },
  drink: { check: 'Wisdom (Perception)', dc: 15 + IMPROVISED_DC, how: 'sniffs and sips' },
  object: { check: 'Wisdom (Perception)', dc: 10 + IMPROVISED_DC, how: 'looks closely at' },
  container: { check: 'Wisdom (Perception)', dc: 15 + IMPROVISED_DC, how: 'sniffs the dregs in' },
  plant: { check: 'Intelligence (Nature) or Wisdom (Survival)', dc: 10 + IMPROVISED_DC, how: 'studies the leaves and smell of' },
};

export const toolTestsFor = (kind: TestKind): ToolTest[] => TOOL_TESTS.filter((t) => t.kinds.includes(kind));

/** 2024 PHB Alchemist's Supplies: start a fire, Intelligence DC 15. */
export const ALCHEMIST_FIRE_DC = 15;
export const ALCHEMIST = /alchemist'?s supplies/i;

/** Table rule: cooking a tasty meal without Cook's Utensils, Wisdom (Survival). */
export const IMPROVISED_COOK_DC = 10 + IMPROVISED_DC;
/** Table rule: harvesting poison without a Poisoner's Kit. */
export const IMPROVISED_HARVEST_DC = 20 + IMPROVISED_DC;
/** Table rule: Sight Rot ointment from foraged herbs without an Herbalism Kit, Intelligence (Nature or Medicine). */
export const IMPROVISED_OINTMENT_DC = 15;
