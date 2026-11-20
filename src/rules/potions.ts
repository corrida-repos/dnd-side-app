/** 2024 DMG, chapter 7: Potion Miscibility. */
export const POTION_MISCIBILITY: { upTo: number; text: string }[] = [
  { upTo: 1, text: 'Both potions lose their effects, and the mixture explodes: each creature within 5 ft takes 4d10 Force damage.' },
  { upTo: 8, text: 'Both potions lose their effects, and the mixture becomes an ingested poison of the DM’s choice.' },
  { upTo: 15, text: 'Both potions lose their effects.' },
  { upTo: 25, text: 'One potion loses its effect.' },
  { upTo: 35, text: 'Both potions work, but their numbers and durations are halved (one with neither loses its effect).' },
  { upTo: 90, text: 'Both potions work normally.' },
  { upTo: 99, text: 'Both work, and one potion’s numbers and duration are doubled.' },
  { upTo: 100, text: 'Only one potion works, but its effect is permanent (the simplest or most fun effect, DM’s choice).' },
];

/** 2024 DMG "Harvesting Poison". */
export const POISON_HARVEST_DC = 20;
