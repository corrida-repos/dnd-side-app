import type { TerrainType } from './terrain';

/**
 * Table rule: travelling through land nobody in the party knows. The distance to the destination is only a guess
 * ("three days north, past the marsh"), so the real distance is rolled when the party sets out and is only learned
 * on arrival. A mapper with Cartographer's Tools can chart the way as the party goes (2024 PHB: Wisdom DC 15 to draft
 * a map), which gives +5 to find the way there on later trips (2024 PHB Map).
 */

/** How far the real distance is from the party's guess, by 1d6. Unknown ground tends to be further than it looks. */
export const DISTANCE_ERROR: Record<number, number> = { 1: 0.75, 2: 1, 3: 1, 4: 1.25, 5: 1.25, 6: 1.5 };

/** The real distance of an uncharted stage, from the party's estimate and a 1d6 roll. */
export function trueDistance(estimate: number, d6: number): number {
  const f = DISTANCE_ERROR[Math.min(6, Math.max(1, Math.round(d6)))];
  return Math.max(1, Math.round(estimate * f));
}

/** How the arrival compares with what the party expected, in the characters' words rather than numbers. */
export function arrivalNote(estimate: number, actual: number): string {
  if (actual < estimate) return `It was closer than anyone thought: about ${actual} miles, not the ${estimate} the party expected.`;
  if (actual === estimate) return `The guess was a good one: about ${actual} miles, as expected.`;
  if (actual >= estimate * 1.5) return `It was much further than anyone thought: about ${actual} miles, not the ${estimate} the party expected.`;
  return `It was further than it looked: about ${actual} miles, not the ${estimate} the party expected.`;
}

/** What the party notices as they set out into unknown land, by terrain. */
const INTO_THE_UNKNOWN: Record<TerrainType, string[]> = {
  arctic: ['The last cairn falls behind. Ahead the snow runs on without a mark, and nobody can say where the ice is thin.', 'The white ridges ahead have no names. The wind wipes out the party’s own tracks behind them.'],
  coastal: ['Past the last fishing hut the shore bends away into coves nobody in the party has seen.', 'The cliffs ahead are strange to everyone, and every headland hides what lies beyond.'],
  desert: ['The caravan trail fades into bare sand. Every dune ahead looks like the one before it.', 'No one knows where the next water is. The heat shimmer hides the horizon.'],
  forest: ['The path gives out among the trees. From here on, every clearing is new and the canopy hides the sun.', 'The woods close in. Nobody recognizes the trees, the streams or the birdsong.'],
  grassland: ['The last farm track ends. The grass runs to the horizon with no road and no landmark to steer by.', 'The plain ahead is open and unfamiliar. Distances are hard to judge with nothing to measure them against.'],
  hill: ['The party crests a rise into hills none of them know. Each valley could lead anywhere.', 'The hills ahead fold into one another. Nobody can say which valley leads on.'],
  mountain: ['Past the last shepherd’s hut, the peaks ahead have no names anyone knows. The passes might go through, or might not.', 'The trail ends at a scree slope. Above it the mountain is unknown to everyone.'],
  swamp: ['The causeway sinks out of sight. From here on, nobody knows which ground will hold.', 'Reeds close in on every side. The channels ahead are unknown, and they all look the same.'],
  underdark: ['The worked tunnels end. Beyond, the passages are raw stone that nobody in the party has walked.', 'The air changes as the known caves fall behind. Side passages branch off into the dark.'],
  urban: ['These streets are strange to everyone. The alleys twist, and the locals give no directions.', 'Nobody knows this quarter. Every turning could be a dead end.'],
  waterborne: ['The coast slips below the horizon. These waters aren’t on any chart the party carries.', 'Unfamiliar currents tug at the hull. Nobody aboard knows what lies ahead.'],
};

/** A line for setting out into uncharted land; `pick` chooses between the variants. */
export function intoTheUnknown(terrain: TerrainType, pick: number): string {
  const lines = INTO_THE_UNKNOWN[terrain];
  return lines[Math.abs(Math.floor(pick)) % lines.length];
}

/** What the party notices once they've gone further than they expected and still haven't arrived. */
export const OVERDUE_NOTE = 'The party has gone as far as they thought it was, and there is still no sign of their destination. Doubts start to creep in.';

/** Charting the way as the party travels: the 2024 PHB Cartographer's Tools check. */
export const CHART_DC = 15;
