# Portfolio Metrics Scripts

These scripts scan GitHub repositories, calculate portfolio metrics, and generate JSON consumed by the Svelte site.

## Scripts
- `fetch-repos.js`
  - orchestrates full and incremental scans
  - merges unchanged repo metrics with rescanned repos
  - writes `public/metrics/index.json` + `public/metrics/repos/*.json`
  - cleans orphan details files not referenced by the final index
- `scan-repo.js`
  - clones one repo to temp dir and runs `scc`
  - calculates summary/language/COCOMO metrics
- `validate-metrics.js`
  - validates index/details referential integrity and totals
- `utils/cocomo.js`
  - COCOMO + AI-assisted effort/cost calculations
- `utils/anonymize.js`
  - private repo anonymization + stable repo id helpers
- `utils/scan-planner.js`
  - deterministic `sourceRef` and incremental scan planning
- `utils/project-classifier.js`
  - infers top project-type tags (for example `AI/ML`, `Web`, `Backend`) with confidence

## Environment
Set `GITHUB_TOKEN` before scanning.

Example `.env`:
```bash
GITHUB_TOKEN=ghp_xxx
```

## Usage
```bash
npm run scan
npm run scan:full
npm run scan:test
npm run scan:validate
```

## Incremental behavior
Incremental scan now:
1. Builds a scan plan with stable `sourceRef` per repo.
2. Forces rescan when repo changed, sourceRef is missing, details file is missing, or legacy private-id migration is needed.
3. Reuses unchanged repo details.
4. Recomputes aggregate totals from the merged full set.
5. Removes orphan `public/metrics/repos/*.json` files.
6. Emits `projectTags` (top 2 with confidence) to support recruiter-friendly categorization.

## Integrity gate
`validate-metrics.js` fails on:
- missing referenced details files
- orphan details files
- mismatched aggregate totals vs repo summaries

Use it before commits and in CI.
