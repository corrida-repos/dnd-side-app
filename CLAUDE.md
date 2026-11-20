# Working on this repo

- Commit and push directly to `main`. Do not open pull requests.
- Pushing to `main` deploys the app to GitHub Pages (`.github/workflows/deploy-pages.yml`), so run `npm test` and `npm run build` before pushing.
- Rules logic lives in `src/rules/` (pure functions, tested); state changes go through `src/state/engine.ts`.
