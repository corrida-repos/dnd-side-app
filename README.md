# Wayfarer's Ledger

A time, place and survival tracker for D&D 5.5e (the 2024 *Player's Handbook* and *Dungeon Master's Guide*). It runs in the browser, needs no server, and saves to local storage.

## What it tracks

| Area | What it does |
| --- | --- |
| **Time and calendar** | A clock and date (Harptos, Gregorian or a plain 12×30 calendar), sunrise and sunset by season, and quick buttons to skip ahead. Every hour and every midnight, the rules checks below run. |
| **Weather** | The DMG d20 tables for temperature (normal, or 1d4×10 °F colder or warmer), wind and precipitation, rolled each day from the climate, season and altitude. An hourly temperature curve, rain vs. sleet vs. snow, the rolls shown, and a manual override. |
| **Weather effects** | Strong wind, heavy rain or snow, extreme cold (DC 10 Con save each hour), extreme heat (DC 5 + 1 per hour without water, Disadvantage in heavy armor), high altitude, and light levels. Saves roll automatically, or wait for players to roll. |
| **Food and water** | Daily needs by size, rations and waterskins, camp stores, foraging (DC 10/15/20), refilling at water sources. Dehydration and malnutrition are checked at midnight, including the rule that Exhaustion can't be removed until the creature has eaten or drunk a full day's worth. |
| **Temperature control** | Cold Resistance or Immunity, cold weather gear, Fire Resistance or Immunity, heavy clothing, shelter (tent, building, cave) and an optional "campfire warms the camp" table rule. |
| **Campfire** | Fuel in hours, lighting it with a Tinderbox, wind and heavy rain putting it out unless the pit is sheltered, gathering firewood, hot meals with a Cook's Utensils check, and Chef feat treats. |
| **Rests** | Short Rest (1 h), Long Rest (8 h, once per 24 h, removes 1 Exhaustion level), forced march saves past 8 hours of travel. |
| **Morning and spells** | A daily checklist per character, and spell preparation using the 2024 prepared-spell tables. Clerics, Druids and Wizards can change any spell after a Long Rest. Paladins and Rangers swap one. Bards, Sorcerers and Warlocks change spells on level up. Always-prepared spells, ritual and concentration tags. |
| **Downtime** | Crafting nonmagical items (10 GP per day, materials cost half), Spell Scrolls, Potions of Healing, magic items by rarity (consumables take half), and custom activities. Several crafters split the time. |
| **Chronicle** | A searchable log of every roll and event. |

## Spell data from 5etools

The app ships with **no** spell text. In **Settings → Spell library**, load a spell JSON file in 5etools format that you have access to (for example `spells-xphb.json`). Only the name, level, school, source and ritual/concentration flags are kept, and you can then search the list on the Morning tab. You can also add spells by hand.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # rules and engine tests (Vitest)
npm run build      # static site in dist/
```

The rules live in `src/rules/` as pure functions. `src/state/engine.ts` applies them to the game state (clock ticks, saves, rests, travel, meals). The React UI is in `src/components/`.

## Table defaults you may want to change

- **Seasonal base temperatures** per climate (`src/rules/weather.ts`). The DMG only says "normal for the season", so these are reasonable real-world-style defaults.
- **Climate-adjusted precipitation**, the **campfire warms the camp** rule, and **double water in extreme heat** (2014 rule) are toggles in Settings.
- **Firewood gathering** (1d6 + 2 hours of fuel on a Survival check) is a table rule. The 2024 books don't specify one.

## Legal

This work includes material from the System Reference Document 5.2 ("SRD 5.2") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

Not affiliated with Wizards of the Coast or 5etools.
