# James Vo Portfolio (Svelte + Metrics Automation)

Recruiter-facing portfolio site with automated GitHub repository scanning, COCOMO-style estimates, and interactive project visualizations (including spider charts).

## What this repo does
- Renders a Svelte portfolio website deployed to Vercel.
- Scans GitHub repositories (public + private with anonymization) via `scc`.
- Generates portfolio metrics JSON under `public/metrics/`.
- Displays searchable/filterable project cards (code-composition bars) with a detail panel (language breakdown, quality radar, COCOMO estimates).
- Hosts a Markdown blog: drafts, live preview while writing, reading time, tags, RSS, opt-in math (see "Writing blog posts").
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

## Writing blog posts
Posts are Markdown files in `public/blog/posts/` with YAML-style frontmatter.

Start a new post (creates a draft with a starter outline):
```bash
npm run blog:new -- "My Post Title"
```

Then run `npm run dev` and open `http://localhost:5173/#posts/<slug>`. Saving the file refreshes the open post in place (scroll position is kept), and the blog list picks up new or renamed posts without a reload.

Frontmatter:
```yaml
---
title: My Post Title
date: 2026-11-09
excerpt: One or two sentences shown in the list and under the title.
tags: [machine learning, side projects]
updated: 2026-11-20  # optional: shows "Updated <date>" for revised posts
math: true        # optional: render $inline$ and $$display$$ TeX with KaTeX
draft: true
---
```

- `draft: true` shows the post on the dev server (with a badge) but keeps it out of the published index and strips the file from production builds. Delete the line or set it to `false` to publish.
- `math: true` turns on KaTeX for that post only (loaded on demand). Inline math needs no space just inside the dollars and no digit right after the closing one, so prices like "$5 and $10" stay text; write `\$` for a literal dollar, and put things like `$HOME` in backticks. Display math (`$$`) goes on its own lines.
- Reading time is computed automatically. Posts with three or more `##`/`###` sections get a contents rail on wide screens, and once posts use more than one tag the blog page shows tag filter chips.
- Builds also write an RSS feed to `/blog/feed.xml` (full post content, published posts only). Links use the `<link rel="canonical">` origin from `index.html`; set `SITE_URL` to override it, e.g. after moving to a custom domain.
- `npm run build` regenerates `public/blog/index.json`, so the index can't go stale. `npm run blog:index` does the same on its own.
- The `markdown-style-guide` draft shows every supported element: headings, lists, task lists, code blocks (highlighted, with a copy button), pull quotes, callouts (`> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`), tables, and images with captions (`![alt](/path.png "Caption")`). Put images under `public/blog/` and reference them by absolute path.

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
