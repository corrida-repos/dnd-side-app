# Wayfarer's Ledger

**Live app:** https://corrida-repos.github.io/dnd-side-app/

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
| **Armor** | Light, Medium or Heavy armor and shields per character, worn or not. Putting it on and taking it off moves the clock (Light 1/1 min, Medium 5/1, Heavy 10/5), and when the whole party does it the clock moves by the slowest person. Medium or Heavy armor gives Disadvantage on extreme heat saves. There's an optional Xanathar's rule for sleeping in armor. |
| **Purifying food and water** | Water sources are marked clean or questionable. Foraged food and questionable water go into separate "unpurified" stores and tainted waterskins. *Purify Food and Drink* (as a ritual in 10 minutes or with a slot, checking whether the caster has it prepared, or Wizard ritual casting) cleans everything. So does boiling water over the fire, and cooking uses up foraged food first and makes it safe. Eating or drinking anything unpurified means a DC 10 Con save or Poisoned for an hour (a table rule you can switch off). |
| **Rests** | Short Rest (1 h), Long Rest (8 h, once per 24 h, removes 1 Exhaustion level), forced march saves past 8 hours of travel. |
| **Morning and spells** | A daily checklist per character, and spell preparation using the 2024 prepared-spell tables. Clerics, Druids and Wizards can change any spell after a Long Rest. Paladins and Rangers swap one. Bards, Sorcerers and Warlocks change spells on level up. Always-prepared spells, ritual and concentration tags. |
| **Downtime** | Crafting nonmagical items (one 8-hour day per 10 GP of price, materials cost half), with a picker of common armor, weapons and gear that shows its price, craft time and tool, Spell Scrolls, Potions of Healing, magic items by rarity (consumables take half), and custom activities. Several crafters split the time. |
| **Bastions** | Found a Bastion at level 5 and add facilities. Special facilities come with level (2/4/5/6 slots at levels 5/9/13/17) and take orders: Craft, Empower, Harvest, Maintain, Recruit, Research or Trade. Basic facilities cost money and take time to build: Cramped 500 GP and 20 days, Roomy 1,000 GP and 45, Vast 3,000 GP and 125. Enlarging costs 500 GP and 25 days (Cramped to Roomy) or 2,000 GP and 80 days (Roomy to Vast). Construction moves forward each in-game day, a Bastion turn comes due every 7 days, and a d100 Bastion event is rolled when every facility is told to Maintain. |
| **Chronicle** | A searchable log of every roll and event. |

## Deployment

Every push to `main` runs the tests, builds the app and publishes it to GitHub Pages (`.github/workflows/deploy-pages.yml`). You can also start it by hand from the Actions tab. One-time setup: in the repository's **Settings → Pages**, set **Source** to **GitHub Actions**.

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
- **Unpurified supplies** (DC 10 Con save or Poisoned for 1 hour), **boiling water** (30 min) and **cooking makes foraged food safe** are table rules. The 2024 books leave food safety to the DM.
- **Firewood gathering** (1d6 + 2 hours of fuel on a Survival check) is a table rule. The 2024 books don't specify one.

## Legal

This work includes material from the System Reference Document 5.2 ("SRD 5.2") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

Not affiliated with Wizards of the Coast or 5etools.
