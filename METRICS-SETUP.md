# Automated citation figure (OpenAlex) — setup

Your site shows your **Google Scholar** citation total (1,153) as the headline —
that number stays manual (Scholar has no API). Alongside it, the site shows an
**OpenAlex** citation figure that updates itself. OpenAlex is free, needs **no API
key**, and is keyed to your **ORCID**, so it works from GitHub Actions with zero
credentials.

It **degrades gracefully**: if OpenAlex is ever unreachable, the build still
succeeds and shows the Scholar number alone. Nothing breaks.

## What it does
- `scripts/update-metrics.mjs` calls the OpenAlex Authors API for ORCID
  `0000-0002-7909-8869` at build time and writes `content/metrics.auto.json`.
- The homepage Citations tile keeps **1,153 (Scholar)** as the big number and adds
  `· OpenAlex <n>` to the small line beneath it.
- A **weekly GitHub Actions cron** (Mondays 00:00 UTC) rebuilds and redeploys so
  the figure refreshes on its own, without you pushing anything.

## Setup
**There is nothing to configure — no key, no secret.** Just make sure the two
`deploy.yml` edits are in place (the metrics step + the weekly cron; see below),
commit, and push. On the next deploy you'll see a line in the Actions log like:

```
[metrics] OpenAlex citations=… h-index=… i10=… → metrics.auto.json
```

If you instead see `keeping existing metrics.auto.json`, OpenAlex was briefly
unreachable — the site just shows Scholar until the next run. No action needed.

## The two deploy.yml edits (workflow files can't be written remotely)
1. Add the weekly cron under `on:`:
   ```yaml
   on:
     push:
       branches: [main]
     schedule:
       - cron: '0 0 * * 1'   # weekly (Mon 00:00 UTC) — refresh the OpenAlex figure
     workflow_dispatch:
   ```
2. Add the metrics step just before `Build Next.js` (no secrets needed):
   ```yaml
         - name: Update citation metrics (OpenAlex)
           run: node scripts/update-metrics.mjs

         - name: Build Next.js
           run: npm run build
   ```

## Notes
- Counts differ by source: OpenAlex counts a cleaner, narrower set than Google
  Scholar, so the OpenAlex figure will be **lower than 1,153** — that's expected,
  and why the tile labels each source.
- `content/metrics.auto.json` is committed with `null` values as a safe seed; the
  build overwrites it in-memory each run, so the figure in the deployed HTML is
  always fresh. It does not need to be committed back.
- To change the refresh cadence, edit the `schedule: cron` line in `deploy.yml`.
- To switch sources later (e.g. back to Scopus, or to Semantic Scholar), only
  `scripts/update-metrics.mjs` changes — it writes `{ citations, hIndex, source,
  updated }` and the site reads `source` for the label automatically.
