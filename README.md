# James Vo Portfolio (Svelte + Metrics Automation)

Recruiter-facing portfolio site with automated GitHub repository scanning, COCOMO-style estimates, and interactive project visualizations (including spider charts).

## What this repo does
- Renders a Svelte portfolio website deployed to GitHub Pages.
- Scans GitHub repositories (public + private with anonymization) via `scc`.
- Generates portfolio metrics JSON under `public/metrics/`.
- Displays searchable/filterable projects with mini spider charts and a selected-project detail panel.
- Runs scheduled scan/deploy workflows in GitHub Actions.

## Stack
- Frontend: Svelte 4 + Vite 5
- Data scanning: Node.js scripts + Octokit + `scc`
- CI/CD: GitHub Actions (scan + deploy)
- Tests: Vitest + Testing Library

## Project structure
- `src/` app source
- `src/components/portfolio/` recruiter-facing metrics UI (overview, cards, spiders, detail panel)
- `src/stores/portfolioStore.js` portfolio state, filters/sorting, selected repo
- `scripts/fetch-repos.js` scan orchestrator (full + incremental merge)
- `scripts/validate-metrics.js` integrity gate for index/details consistency
- `public/metrics/` generated metrics index + per-repo details
- `.github/workflows/scan-metrics.yml` scheduled/manual scanning workflow
- `.github/workflows/deploy.yml` GitHub Pages build/deploy workflow

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
Required env var:
- `GITHUB_TOKEN` (PAT with access to repos you want scanned)

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

## Workflows
- `scan-metrics.yml`
  - weekly incremental scan
  - monthly full scan
  - manual dispatch with full scan option
  - requires `GH_PAT` secret (mapped to `GITHUB_TOKEN` in scan step)
  - runs `npm run scan:validate` before committing metrics updates
- `deploy.yml`
  - builds and deploys site to GitHub Pages on pushes to `main`

## Notes
- If `scan:validate` fails locally, run a fresh full scan (`npm run scan:full`) once credentials and `scc` are available.
- The scanner now uses stable `sourceRef` values to avoid incremental data drift.
