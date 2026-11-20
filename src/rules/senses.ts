/**
 * What a character notices when their status changes over time, without knowing the numbers.
 * Written in the second person so the DM can read them out. Several variants keep repeats fresh.
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
  | 'hitDie';

export const SENSES: Record<SenseKey, string[]> = {
  dehydration: [
    'Your tongue feels thick and your lips crack. A dull headache pulses behind your eyes, and every step takes more effort than it should.',
    'Your mouth is parched and your head swims when you stand too quickly. Your limbs feel heavy.',
    'Dizziness comes in waves. Your skin feels papery and your thoughts move slowly.',
  ],
  rehydrated: ['The pounding in your head finally fades. You feel like yourself again, at least where thirst is concerned.', 'Water has never tasted so good. The fog in your head lifts.'],
  malnutrition: [
    'Your stomach gnaws at you and your hands tremble. You tire faster than you should.',
    'A hollow, light-headed weakness settles in. Your belt sits looser than it did.',
  ],
  hungry: ['Your stomach growls loudly and you feel a little short-tempered.', 'A nagging hunger follows you around. You catch yourself thinking about bread.'],
  starving: ['Hunger has become a constant ache. Your strength is draining away by the day.', 'You feel cold and weak, and your thoughts keep drifting back to food.'],
  fed: ['A full meal settles in your belly and warmth spreads back into your limbs.', 'For the first time in days you are properly fed, and some of your strength returns.'],
  cold: [
    'Your fingers and toes have gone numb. Shivers rack you, and every movement feels stiff and clumsy.',
    'The cold has crept into your bones. Your teeth chatter and your breath comes in ragged clouds.',
    'Your skin burns with cold, then stops hurting at all, which is worse.',
  ],
  heat: [
    'Sweat stings your eyes and the world shimmers. Your head throbs and your legs feel unsteady.',
    'The heat presses down on you like a weight. You feel faint and nauseous.',
  ],
  march: ['Your feet are blistered and your legs burn with every step. Your pack feels twice as heavy as it did this morning.', 'You stumble more than you walk now, and your eyes keep drifting shut on the road.'],
  coldNight: [
    'You barely slept. You wake stiff, shivering and aching, with frost on your cloak.',
    'The cold kept you tossing all night. You rise sluggish and sore, and your joints protest.',
  ],
  sleep: [
    'Your eyelids are lead. The edges of your vision blur, and you catch yourself drifting off mid-thought.',
    'Exhaustion hums in your skull. Sounds seem far away and your reactions are slow.',
  ],
  frigid: ['The icy water steals your breath. Your muscles cramp and your strokes grow weak.', 'You can no longer feel your legs in the freezing water. Your body is shutting down.'],
  exhaustionEases: [
    'You wake feeling a little more like yourself. Some of the heaviness has lifted.',
    'Rest has done you good. Your limbs feel lighter and your head is clearer.',
  ],
  exhaustionStuck: ['Despite the rest, you feel just as drained. Your body needs food or water more than sleep.', 'Sleep did little. A deep weariness remains, and you know what your body is craving.'],
  foodPoisoning: [
    'Your stomach cramps violently. Cold sweat beads on your brow, and the world tilts and churns.',
    'A wave of nausea hits you. Your gut twists and your hands won’t stop shaking.',
  ],
  foodPoisoningEnds: ['The cramps have finally passed. You wake weak but with a settled stomach.', 'Sleep has purged the sickness. You feel hollow, but well.'],
  waterIllness: ['Your guts gurgle and twist. A clammy queasiness makes it hard to focus.', 'Something in that water disagreed with you. Your stomach lurches and your vision swims.'],
  waterIllnessEnds: ['The queasiness fades and your stomach settles.', 'You feel steady again. The sickness has passed.'],
  dying: ['Everything goes dark and distant. Sounds fade to a dull roar, then to nothing.', 'You crumple. Cold seeps up from the ground as the world slips away.'],
  stable: ['Through the darkness, your breathing evens out. The worst has passed, though you are still far away.', 'Something steadies you. Your heartbeat slows to a faint but even rhythm.'],
  wakesFromStable: ['Your eyes flutter open. Everything hurts, but you are alive.', 'You come to with a groan, head pounding and body aching.'],
  death: ['A last breath, and then stillness.', 'The light leaves their eyes.'],
  revived: ['You gasp awake, lungs burning, as warmth floods back into your body.', 'Darkness gives way to light. Your heart lurches back into rhythm.'],
  stressUp: ['Your shoulders are knotted and your jaw clenched. Small noises make you flinch.', 'Your heart races at nothing. Sleep and calm feel very far away.'],
  stressDown: ['The tension in your chest loosens a little.', 'You can breathe a little easier now.'],
  fearUp: ['A cold dread settles in your gut. Shadows seem to move at the edge of your sight.', 'Your hands shake and your mouth is dry with fear.'],
  fearDown: ['The dread recedes, and the shadows look like shadows again.', 'Your nerves steady.'],
  renownUp: ['People nod to you in the street. Your name seems to be getting around.', 'Strangers look at you with recognition, and some with respect.'],
  renownDown: ['Conversations stop when you enter. Your reputation has taken a knock.', 'Doors that were open to you feel a little more closed.'],
  attuned: ['A faint hum settles into your bones as the item’s magic becomes part of you.', 'The item grows warm in your hand, and you suddenly understand how it wants to be used.'],
  attunementEnds: ['The familiar hum of the item’s magic has gone quiet. The bond is broken.', 'You feel a small emptiness where the item’s magic used to be.'],
  lightLow: ['The flame gutters and shrinks. The shadows creep closer.', 'The light is failing. It won’t last much longer.'],
  lightOut: ['The light dies, and darkness rushes in.', 'With a last flicker, the flame goes out.'],
  fireOut: ['The campfire sputters and dies. The warmth drains away fast and the night presses in.', 'Only embers remain, and the cold creeps back into camp.'],
  effectEnds: ['The tingle of magic fades from your skin.', 'You feel the spell’s influence slip away.'],
  shelterEnds: ['The magical shelter shimmers and vanishes. The weather hits you all at once.', 'The protective dome dissolves, and wind and cold rush in.'],
  concentrationDropped: ['Your hold on the spell slips as your mind turns to new magic.'],
  restedWell: ['You wake refreshed and clear-headed, ready for the day.', 'A good night’s rest. Your aches have faded and your mind is sharp.'],
  restInterrupted: ['You are jolted awake, heart pounding, with the night far from over.', 'Your rest is broken. You feel groggy and only half recovered.'],
  wokenByNoise: ['A sound snaps you awake. You are on your feet before you know why.', 'Something wakes you: a crack, a shout, a scrape in the dark.'],
  shakenAwake: ['A hand shakes your shoulder roughly and an urgent whisper drags you up out of sleep.', 'Someone hisses your name and shoves you awake.'],
  sleepsThrough: ['You sleep on, unaware.', 'You stir, mumble, and roll over.'],
  heal: ['Warmth spreads through you and the pain recedes.'],
  hurt: ['Pain lances through you.'],
  hitDie: ['You catch your breath, bind your wounds, and feel some strength return.'],
};

/** Picks a variant without using the dice, so the game's random rolls aren't disturbed. */
export function sense(key: SenseKey, seed: number): string {
  const list = SENSES[key];
  return list[Math.abs(seed) % list.length];
}
