# GitHub Actions Overview

This repository has two workflows:
- `scan-metrics.yml` (repository metrics scan)
- `deploy.yml` (legacy site build + GitHub Pages deploy — being retired)

Site deployments are handled by the **Vercel git integration**: every push to `main`
(including metrics commits from `scan-metrics.yml`) triggers a production deploy, and
every PR gets a preview URL. No deploy tokens or workflow config are required.

## 1) Scan Repository Metrics (`scan-metrics.yml`)

### Triggers
- Weekly incremental scan: Monday 02:00 UTC
- Monthly full scan: day 1 at 03:00 UTC
- Manual workflow dispatch (`full_scan` boolean)

### Required secrets
- `GH_PAT` (Personal Access Token)
  - mapped to `GITHUB_TOKEN` env for scanner runtime
  - workflow fails early if missing

### What the workflow does
1. Checkout repo
2. Setup Node.js 20
3. Install `scc`
4. Install npm dependencies
5. Decide full vs incremental mode
6. Run scanner (`npm run scan` or `npm run scan -- --full`)
7. Run integrity gate (`npm run scan:validate`)
8. Commit/push `public/metrics/` changes when present
9. Publish summary in workflow run output

### Validation gate
Metrics updates are blocked if validation fails for:
- missing referenced details files
- orphan details files
- aggregate totals mismatch

## 2) Deploy to GitHub Pages (`deploy.yml`) — LEGACY

Kept running in parallel during the Vercel cutover. Delete this workflow (and disable
Pages in repo settings) once Vercel production is verified end-to-end.

### Triggers
- Push to `main`
- Manual workflow dispatch

### What it does
1. Checkout
2. Setup Node.js 20
3. `npm ci`
4. `npm run build`
5. Upload `dist/` artifact
6. Deploy to GitHub Pages

## Manual operating playbook

### Trigger full resync
Use manual dispatch for `Scan Repository Metrics` with `full_scan=true` when:
- migrating scan/index logic
- recovering from stale or inconsistent metrics
- first initialization

### Verify successful scan
Check workflow summary for:
- scan type (full/incremental)
- whether metrics changed
- whether commit/push happened

### If scan fails
- Confirm `GH_PAT` exists and has correct repo access
- Inspect failing step logs (scan or validate)
- Fix issue and rerun; use full scan if index/details are out of sync

## Related docs
- `README.md`
- `scripts/README.md`
