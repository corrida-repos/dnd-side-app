# Working on this repo

## What this app is for

D&D Life Manager handles every nitty-gritty part of D&D life that isn't tied to one campaign or adventure and doesn't run on combat's seconds-long timescale: time, travel, weather, survival, rests, upkeep, money, downtime and the wider world. Put player-facing options from Wizards of the Coast 5.5e books in Light, including supplemental and setting books. Put 5.5e checks, penalties, costs and bookkeeping in Complete. Put legacy and table rules in Gritty or higher, with more involved rules in Hardcore and Brutal. Give players in-world descriptions of what their characters notice when something changes over time.

A long-term goal: give characters paths to rise in socioeconomic power, whether noble (court, titles, land), clerical (piety, priesthood) or bourgeois (guild, trade, civic office). The three ladders share one shape (see Phase 11 in `ROADMAP.md`), so new features in money, downtime and the wider world should feed into them where they can.

## How to work

- Commit and push directly to `main`. Do not open pull requests.
- Pushing to `main` deploys the app to GitHub Pages (`.github/workflows/deploy-pages.yml`), so run `npm test` and `npm run build` before pushing.
- Rules logic lives in `src/rules/` (pure functions, tested); state changes go through `src/state/engine.ts`.
