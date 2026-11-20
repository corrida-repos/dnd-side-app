# Working on this repo

## What this app is for

Wayfarer's Ledger handles every nitty-gritty part of D&D life that isn't tied to one campaign or adventure and doesn't run on combat's seconds-long timescale: time, travel, weather, survival, rests, upkeep, money, downtime and the wider world. Follow the 2024 rules (PHB/DMG), mark anything else as a table rule or optional rule with a switch, and give players in-world descriptions of what their characters notice when something changes over time.

## How to work

- Commit and push directly to `main`. Do not open pull requests.
- Pushing to `main` deploys the app to GitHub Pages (`.github/workflows/deploy-pages.yml`), so run `npm test` and `npm run build` before pushing.
- Rules logic lives in `src/rules/` (pure functions, tested); state changes go through `src/state/engine.ts`.
