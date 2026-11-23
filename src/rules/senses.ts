/**
 * What characters notice when their status changes over time, without the numbers, written as
 * "Rook feels …" or "The party feels …". "Feels" is only used when the change is physically felt;
 * things they see "notice", and things they wouldn't notice at all avoid the word.
 */
export type SenseKey =
  | 'dehydration'
  | 'rehydrated'
  | 'malnutrition'
  | 'hungry'
  | 'starving'
  | 'fed'
  | 'cold'
  | 'heat'
  | 'march'
  | 'coldNight'
  | 'sleep'
  | 'frigid'
  | 'exhaustionEases'
  | 'exhaustionStuck'
  | 'lifestyleDrops'
  | 'foodPoisoning'
  | 'foodPoisoningEnds'
  | 'waterIllness'
  | 'waterIllnessEnds'
  | 'dying'
  | 'stable'
  | 'wakesFromStable'
  | 'death'
  | 'revived'
  | 'stressUp'
  | 'stressDown'
  | 'fearUp'
  | 'fearDown'
  | 'renownUp'
  | 'renownDown'
  | 'attuned'
  | 'attunementEnds'
  | 'lightLow'
  | 'lightOut'
  | 'fireOut'
  | 'effectEnds'
  | 'shelterEnds'
  | 'concentrationDropped'
  | 'restedWell'
  | 'restInterrupted'
  | 'wokenByNoise'
  | 'shakenAwake'
  | 'sleepsThrough'
  | 'heal'
  | 'hurt'
  | 'hitDie'
  | 'contagionOnset'
  | 'contagionWorse'
  | 'contagionEases'
  | 'contagionEnds'
  | 'blinded'
  | 'encounter'
  | 'groundHeavy'
  | 'groundClear'
  | 'robbed'
  | 'jailed';

/** How the change reaches the character: felt in the body, noticed with the senses, or not noticed at all. */
export type Awareness = 'feels' | 'notices' | 'unaware';

interface SenseDef {
  how: Awareness;
  /** Predicates in the third person singular, finishing "Rook …" or "The party …". */
  lines: string[];
}

const F = (...lines: string[]): SenseDef => ({ how: 'feels', lines });
const N = (...lines: string[]): SenseDef => ({ how: 'notices', lines });
const U = (...lines: string[]): SenseDef => ({ how: 'unaware', lines });

export const SENSES: Record<SenseKey, SenseDef> = {
  dehydration: F('feels parched, with a pounding head and heavy limbs', 'feels dry-mouthed and dizzy, and every step takes effort', 'feels light-headed, with cracked lips and sluggish thoughts'),
  rehydrated: F('feels the thirst headache finally fade', 'feels clear-headed again now that the thirst is gone'),
  hungry: F('feels a nagging hunger and a growling stomach', 'feels hungry and a little short-tempered'),
  malnutrition: F('feels weak and shaky from too little food', 'feels a hollow, light-headed weakness from going underfed'),
  starving: F('feels cold, weak and consumed by hunger', 'feels their strength draining away from days without food'),
  fed: F('feels warm and strong again after a full meal', 'feels properly fed for the first time in days'),
  cold: F('feels numb fingers and bone-deep cold, shivering hard', 'feels chilled to the bone, teeth chattering and limbs stiff', 'feels the cold burning the skin, then going worryingly numb'),
  heat: F('feels faint and nauseous under the crushing heat', 'feels sweat-soaked and unsteady, head throbbing'),
  march: F('feels blistered feet and burning legs from the long march', 'feels ready to drop, stumbling more than walking'),
  coldNight: F('feels stiff, sore and shivering after a sleepless, freezing night', 'feels sluggish and achy after tossing in the cold all night'),
  sleep: F('feels heavy-eyed and foggy from lack of sleep', 'feels sleep tugging at every thought, reactions slowing'),
  frigid: F('feels muscles cramping and strength failing in the icy water', 'feels nothing below the waist anymore in the freezing water'),
  exhaustionEases: F('feels lighter and clearer after the rest', 'feels some of the heaviness lift after sleeping'),
  exhaustionStuck: F('feels just as drained as before, the body craving food or water more than sleep', 'feels a deep weariness that sleep alone won’t fix'),
  lifestyleDrops: N('notices the rooms getting smaller and the meals thinner now the money has run out', 'notices the landlord’s cooler welcome and a cheaper bed'),
  foodPoisoning: F('feels violent stomach cramps and cold sweats', 'feels a churning gut and shaking hands'),
  foodPoisoningEnds: F('feels the cramps gone at last, weak but settled', 'feels hollow but well again'),
  contagionOnset: F('feels feverish and achy, with a heaviness settling into the limbs', 'feels a creeping, sweaty fatigue that sleep does not touch'),
  contagionWorse: F('feels the sickness dig in deeper, weaker than yesterday', 'feels feverish and drained, worse than the day before'),
  contagionEases: F('feels a little stronger as the sickness loosens its grip', 'feels the fever ebb somewhat'),
  contagionEnds: F('feels the last of the sickness lift', 'feels truly well again for the first time in days'),
  blinded: F('feels the eyes burn and cloud over until nothing can be seen', 'feels a gritty sting in the eyes as the world fades to grey darkness'),
  groundHeavy: N('notices boots sinking deep with every step', 'notices the ground dragging at every stride'),
  groundClear: N('notices the ground firm and easy underfoot again', 'notices the going is easier now'),
  waterIllness: F('feels a gurgling, clammy queasiness', 'feels the stomach lurch and the vision swim'),
  waterIllnessEnds: F('feels the queasiness fade', 'feels steady again'),
  dying: U('collapses and slips away into darkness, aware of nothing', 'crumples to the ground, unconscious'),
  stable: U('lies still, breathing shallow but even, still unconscious', 'stops slipping away, though they remain out cold'),
  wakesFromStable: F('feels everything hurt on waking, but is alive', 'feels a pounding head and aching body on coming to'),
  death: U('breathes their last', 'falls still'),
  revived: F('feels warmth flood back in with a gasping breath', 'feels the heart lurch back into rhythm'),
  robbed: N('notices something missing or spoiled among their things', 'notices a torn seam and gnawed edges where something used to be'),
  jailed: N('notices the clank of a cell door and the smell of old straw', 'notices cold stone walls and a tiny barred window'),
  stressUp: F('feels knotted shoulders and a jaw clenched tight', 'feels jumpy, the heart racing at nothing'),
  stressDown: F('feels the tension in the chest loosen', 'feels able to breathe a little easier'),
  fearUp: F('feels a cold dread settle in the gut', 'feels shaky hands and a dry mouth'),
  fearDown: F('feels the dread recede', 'feels the nerves steady'),
  renownUp: N('notices people nodding in recognition', 'notices strangers who seem to know the name'),
  renownDown: N('notices conversations stop when they walk in', 'notices doors that are a little less open than before'),
  attuned: F('feels a faint hum settle into the bones as the item’s magic becomes part of them', 'feels the item warm in hand and suddenly understands how to use it'),
  attunementEnds: F('feels a small emptiness where the item’s magic used to hum', 'feels the bond with the item go quiet'),
  lightLow: N('notices the flame guttering as the shadows creep closer', 'notices the light failing'),
  lightOut: N('is plunged into darkness as the light dies', 'notices the last flicker of the flame before darkness rushes in'),
  fireOut: N('notices the campfire sputter out as the cold creeps back into camp', 'notices only embers remain, and the warmth draining away'),
  effectEnds: F('feels the tingle of the magic fade', 'feels the spell’s influence slip away'),
  shelterEnds: N('notices the magical shelter vanish as the weather rushes in', 'notices the protective dome dissolve'),
  concentrationDropped: F('feels the hold on the earlier spell slip away'),
  restedWell: F('feels refreshed and clear-headed'),
  restInterrupted: F('feels groggy and only half recovered, the rest broken', 'feels jolted awake with the night far from over'),
  wokenByNoise: N('is snapped awake by a sound in the dark', 'wakes to a crack, a scrape, a shout'),
  shakenAwake: U('sleeps on, unaware, until a hand shakes them awake', 'hears nothing until someone hisses their name and shoves them awake'),
  sleepsThrough: U('sleeps on, unaware anything happened', 'stirs, mumbles and rolls over, still asleep'),
  heal: F('feels warmth spread and the pain recede'),
  hurt: F('feels pain lance through them'),
  hitDie: F('feels some strength return after catching their breath and binding wounds'),
  encounter: N('notices movement at the edge of sight', 'hears something approaching'),
};

/** Picks a variant without using the dice; the same seed gives the same line, so a whole party shares one. */
export function sense(key: SenseKey, seed: number): string {
  const list = SENSES[key].lines;
  return list[Math.abs(seed) % list.length];
}

const PLURAL: Record<string, string> = { feels: 'feel', notices: 'notice', is: 'are', collapses: 'collapse', crumples: 'crumple', lies: 'lie', stops: 'stop', breathes: 'breathe', falls: 'fall', wakes: 'wake', sleeps: 'sleep', hears: 'hear', stirs: 'stir' };

/** Builds "Rook feels …", "Rook and Pip feel …" or "The party feels …". */
export function senseLine(names: string[], wholeParty: boolean, predicate: string): string {
  if (wholeParty || names.length === 0) return `The party ${predicate}.`;
  if (names.length === 1) return `${names[0]} ${predicate}.`;
  const [verb, ...rest] = predicate.split(' ');
  const subject = names.length === 2 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return `${subject} ${PLURAL[verb] ?? verb} ${rest.join(' ')}.`;
}
