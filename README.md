# James Vo Portfolio (Svelte + Metrics Automation)

Recruiter-facing portfolio site with automated GitHub repository scanning, COCOMO-style estimates, and interactive project visualizations (including spider charts).

## What this repo does
- Renders a Svelte portfolio website deployed to Vercel.
- Scans GitHub repositories (public + private with anonymization) via `scc`.
- Generates portfolio metrics JSON under `public/metrics/`.
- Displays searchable/filterable projects with mini spider charts and a selected-project detail panel.
- Runs the scheduled metrics scan in GitHub Actions; its commits auto-trigger Vercel deploys.

## Stack
- Frontend: Svelte 4 + Vite 5
- Data scanning: Node.js scripts + Octokit + `scc`
- CI/CD: Vercel git integration (deploys) + GitHub Actions (metrics scan)
- Tests: Vitest + Testing Library

## Project structure
- `src/` app source
- `src/components/portfolio/` recruiter-facing metrics UI (overview, cards, spiders, detail panel)
- `src/stores/portfolioStore.js` portfolio state, filters/sorting, selected repo
- `scripts/fetch-repos.js` scan orchestrator (full + incremental merge)
- `scripts/validate-metrics.js` integrity gate for index/details consistency
- `public/metrics/` generated metrics index + per-repo details
- `.github/workflows/scan-metrics.yml` scheduled/manual scanning workflow
- `.github/workflows/deploy.yml` legacy GitHub Pages deploy (being retired after Vercel cutover)
- `vercel.json` Vercel config (security headers, cache policy)

## Local development
Install dependencies:
```bash
npm install
```

Run app:
```bash
npm run dev
```

Build app:
```bash
npm run build
```

Run tests:
```bash
npm run test
```

## Metrics pipeline (local)
Requirements:
- `GITHUB_TOKEN` env var (PAT with access to repos you want scanned; set in a gitignored `.env`)
- `scc` on PATH (e.g. `winget install --id boyter.scc` on Windows, `brew install scc` on macOS)
- `git` on PATH (repos are shallow-cloned during scanning)

Commands:
```bash
npm run scan          # incremental merge scan
npm run scan:full     # full rescan
npm run scan:test     # test mode with small repo subset
npm run scan:validate # verify metrics index/details integrity
```

## Metrics integrity policy
`scan:validate` fails when:
- an `index.json` repo entry points to a missing details file
- a details file exists but is not referenced by index
- portfolio totals do not match summed repo summaries

This same validation is enforced in the scan GitHub Actions workflow before any commit.

## Private repository handling
Private repos are included in metrics but anonymized for recruiter-facing display:
- name shown as `Private Project N`
- private URLs/descriptions are hidden
- summary metrics remain visible

## Deployment
- **Vercel git integration**: every push to `main` deploys to production; every PR gets a preview URL. No tokens or CI config needed — connect the repo once at vercel.com/new.
- Metrics commits made by `scan-metrics.yml` (as `github-actions[bot]`) auto-trigger Vercel production deploys, keeping the live site's metrics fresh.
- `vercel.json` sets security headers (nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy) and cache policy (immutable `/assets/*`, revalidated `/metrics/*` and `/blog/*`). CSP stays in the `index.html` meta tag.

## Workflows
- `scan-metrics.yml`
  - weekly incremental scan
  - monthly full scan
  - manual dispatch with full scan option
  - requires `GH_PAT` secret (mapped to `GITHUB_TOKEN` in scan step)
  - runs `npm run scan:validate` before committing metrics updates
- `deploy.yml` (legacy)
  - builds and deploys site to GitHub Pages on pushes to `main`
  - kept running in parallel during the Vercel cutover; delete after Vercel production is verified

## Notes
- If `scan:validate` fails locally, run a fresh full scan (`npm run scan:full`) once credentials and `scc` are available.
- The scanner now uses stable `sourceRef` values to avoid incremental data drift.
