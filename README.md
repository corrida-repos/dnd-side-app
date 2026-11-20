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
| **Labelled debuffs** | Every Exhaustion level records its cause (Malnutrition, Dehydration, Extreme cold, Extreme heat, Forced march, Cold night or Other), and Poisoned shows as **Food poisoning** (raw food, until a Long Rest) or **Waterborne illness** (unpurified water, with time left). Levels from Malnutrition or Dehydration are marked 🔒 and stay until the need is met in full. A Long Rest removes the newest level that isn't locked. |
| **Temperature control** | Day-to-night temperature swings, a **Bedroll** (automatic success on extreme cold saves while sleeping in it) and **Blanket** (Advantage), and an optional cold-night rule: sleeping out at or below 32 °F (adjustable) without warm cover means a DC 10 Con save on waking or 1 Exhaustion level. Also Cold Resistance or Immunity, cold weather gear, Fire Resistance or Immunity, heavy clothing, shelter (tent, building, cave) and an optional "campfire warms the camp" table rule. |
| **Campfire** | Fuel in hours, lighting it with a Tinderbox, wind and heavy rain putting it out unless the pit is sheltered, gathering firewood, hot meals with a Cook's Utensils check, and Chef feat treats. |
| **Armor** | Light, Medium or Heavy armor and shields per character, worn or not. Putting it on and taking it off moves the clock (Light 1/1 min, Medium 5/1, Heavy 10/5), and when the whole party does it the clock moves by the slowest person. Medium or Heavy armor gives Disadvantage on extreme heat saves. There's an optional Xanathar's rule for sleeping in armor. |
| **Raw food and dirty water** | Foraged food arrives **raw**. Eating it uncooked means a Con save (DC 10 by default, adjustable), or the character is **Sick**: Poisoned until they finish a Long Rest. Water sources are marked clean or questionable, and questionable or foraged water means a DC 10 Con save or Poisoned for 1 hour. Cooking a hot meal uses up raw food first and makes it safe, boiling makes water safe, and *Purify Food and Drink* (as a ritual in 10 minutes or with a slot, with preparation checks and Wizard ritual casting) makes everything safe. Meals use safe food and rations before anything raw. Both risks can be switched off in Settings. |
| **Rests and fatigue** | Short Rest (1 h), Long Rest (8 h, once per 24 h, removes 1 Exhaustion level) with a countdown until the next one is allowed. **Forced march:** each travel hour past 8 since the last Long Rest means a Con save (DC 10 + hours past 8), and the Travel card previews the DCs. **Staying awake** (optional Xanathar's rule, on by default): every 24 hours without a Long Rest means a Con save (DC 10, +5 per further day) or Sleep deprivation Exhaustion, with an "awake for" timer on the Time card. |
| **Morning and spells** | A daily checklist per character, and spell preparation using the 2024 prepared-spell tables. Clerics, Druids and Wizards can change any spell after a Long Rest. Paladins and Rangers swap one. Bards, Sorcerers and Warlocks change spells on level up. Always-prepared spells, ritual and concentration tags. |
| **Downtime** | Crafting nonmagical items (one 8-hour day per 10 GP of price, materials cost half), with a picker of common armor, weapons and gear that shows its price, craft time and tool, Spell Scrolls, Potions of Healing, magic items by rarity (consumables take half), and custom activities. Several crafters split the time. |
| **Bastions** | Found a Bastion at level 5 and add facilities. Special facilities come with level (2/4/5/6 slots at levels 5/9/13/17) and take orders: Craft, Empower, Harvest, Maintain, Recruit, Research or Trade. Basic facilities cost money and take time to build: Cramped 500 GP and 20 days, Roomy 1,000 GP and 45, Vast 3,000 GP and 125. Enlarging costs 500 GP and 25 days (Cramped to Roomy) or 2,000 GP and 80 days (Roomy to Vast). Construction moves forward each in-game day, a Bastion turn comes due every 7 days, and a d100 Bastion event is rolled when every facility is told to Maintain. |
| **Gear and resources** | HP and Temporary HP, Hit Point Dice (spend on a Short Rest; all back on a Long Rest if you start with at least 1 HP). Limited-use features and spell slots that come back on a Short Rest, a Long Rest, one per Short Rest, or at dawn, with class presets and automatic slot tables for full casters, half casters and Warlocks. Magic items: attunement (a Short Rest focused on the item, maximum 3, ends after 24 hours more than 100 ft away), identifying (by a rest or the *Identify* spell, including the ritual) and charges regained at dawn or on rests. |
| **Night watch** | Pick who keeps watch and in what order. A Long Rest is split into 2-hour watches with an optional random encounter check each. |
| **Effects and lights** | Torches, candles, lamps and lanterns burn down (with a warning 10 minutes before they go out, and +1 flask of oil). Spells, potions and long effects (*Mage Armor*, *Aid*, *Heroes' Feast*, *Goodberry*, *Geas* and more) expire on the clock. Each caster holds one Concentration spell at a time. *Leomund's Tiny Hut*, *Rope Trick* and *Magnificent Mansion* count as shelter from the weather. The header shows the soonest-ending effect. |
| **Exploration** | 10-minute exploration turns with an optional wandering monster check, hold-breath time (1 + Con modifier minutes, at least 30 seconds), and frigid water (safe for Con score minutes, then a DC 10 Con save each minute). |
| **Money and mounts** | A gold ledger per character. In town, daily lifestyle is charged at midnight and covers meals and lodging (Wretched free up to Aristocratic 10 GP). Hireling wages (skilled 2 GP, untrained 2 SP a day), crafting materials and Bastion construction are charged too, and all of it can be switched off. Mounts (horses, ponies, mules, camels, mastiffs and more) are party members with their own feed, water and Exhaustion. Buying and selling magic items are downtime deals, with typical values by rarity and selling at about half. |
| **World** | Moon phases (Selûne, with an offset to match your campaign), festivals and custom holidays, faction renown with notes, spells cast daily until permanent (*Teleportation Circle*, *Guards and Wards*, *Private Sanctum* for 365 days; *Forbiddance* for 30), resurrection time limits (*Revivify* 1 minute, *Raise Dead* and *Reincarnate* 10 days, *Resurrection* 100 years) with *Gentle Repose* pausing the count, and divination limits (+25% chance of a wrong answer per extra casting before a Long Rest). |
| **Downtime extras** | Activity presets (carousing, crime, gambling, pit fighting, relaxation, religious service, research, training, working) with suggested time, cost and the check to make, plus replacing a Wizard's lost spellbook (1 hour and 10 GP per prepared spell level). |
| **Chronicle** | A searchable log of every roll and event. |

## Deployment

Every push to `main` runs the tests, builds the app and publishes it to GitHub Pages (`.github/workflows/deploy-pages.yml`). You can also start it by hand from the Actions tab. One-time setup: in the repository's **Settings → Pages**, set **Source** to **GitHub Actions**.

## Spell data from 5etools

The app ships with **no** spell text. In **Settings → Spell library**, load a spell JSON file in 5etools format that you have access to (for example `spells-xphb.json`). Only the name, level, school, source and ritual/concentration flags are kept, and you can then search the list on the Morning tab. You can also add spells by hand.

## Roadmap

See [ROADMAP.md](ROADMAP.md) for everything time-based in the rules and what is tracked so far.

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
- **Raw food** (Con save or Sick until a Long Rest), **unpurified water** (DC 10 Con save or Poisoned for 1 hour), **boiling water** (30 min) and **cooking makes foraged food safe** are table rules. The 2024 books leave food safety to the DM.
- **Firewood gathering** (1d6 + 2 hours of fuel on a Survival check) is a table rule. The 2024 books don't specify one.

## Legal

This work includes material from the System Reference Document 5.2 ("SRD 5.2") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

Not affiliated with Wizards of the Coast or 5etools.
