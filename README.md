# Redesign → Next.js integration

This folder contains the **redesigned site ported into your existing Next.js
file-based CMS**. Your content workflow is unchanged: you still edit Markdown /
YAML in `/content`, commit, and push. These files only change how that content
is *rendered* (the new look, the matrix page transition, the interactive
graphs/demos, the Chicago citation copy).

Everything reads from your existing `lib/content.ts` loaders, so the
publications constellation, the funded-projects timeline, the courses, and the
supervision lists are all driven by your `/content` files — nothing is hardcoded
except the curated prose (research-pillar descriptions, the postgraduate guide).

---

## How to apply it (GitHub Desktop workflow)

1. **Copy these files into your repo**, overwriting the matching paths:

   ```
   app/globals.css                         (replaces)
   app/layout.tsx                          (replaces — new shell + nav + footer + transition)
   app/page.tsx                            (replaces — home, server component)
   app/HomeClient.tsx                      (NEW)
   app/about/page.tsx        + AboutClient.tsx
   app/research/page.tsx     + ResearchClient.tsx     (now also holds the Projects content)
   app/publications/page.tsx + PublicationsClient.tsx
   app/teaching/page.tsx     + TeachingClient.tsx
   app/tools/page.tsx                      (replaces — self-contained)
   app/contact/page.tsx      + ContactClient.tsx
   app/postgraduate-guide/page.tsx + PostgraduateClient.tsx
   components/SiteNav.tsx                  (replaces)
   components/PageTransition.tsx           (NEW)
   lib/content.ts                          (replaces — adds optional `metrics` to SiteConfig)
   lib/style.ts  lib/view.ts  lib/cite.ts  (NEW helpers)
   content/site.yml                        (replaces — adds a `metrics:` block; see note)
   ```

2. **Delete `app/projects/`** from your repo. Projects are now merged into the
   Research page (`/research`), and `/projects` is gone from the nav. Leaving the
   old folder will just publish a stale, unstyled page.

3. **Old components are now unused** — `components/AuthorList.tsx`,
   `components/PublicationsFilter.tsx`, `components/TopicTag.tsx`. They're
   harmless to keep, but you can delete them; nothing imports them anymore.

4. **`npm run dev`** and click through. Everything should build with your
   existing dependencies (no new packages).

5. Commit in GitHub Desktop and push — your normal deploy runs.

---

## Notes

- **`content/site.yml`** gains an optional `metrics:` block (citations, h-index,
  i10) — the only home-page numbers that can't be derived from `/content`.
  Publications, grant, and student counts are computed automatically. If you'd
  rather not replace your `site.yml`, just append:

  ```yaml
  metrics:
    citations: 1153
    hIndex: 18
    i10Index: 31
  ```

- **Nav** no longer shows *Projects* (merged into Research) or *Postgraduate*
  (now an unlisted page, reachable from Teaching, Contact, and the Research CTA).
  To re-add any link, edit the `NAV` array in `components/SiteNav.tsx`.

- **Static microsites** under `public/courses/*` and `public/tools/*` still work
  exactly as before. The page transition does a normal full-page load for them
  (and a smooth in-app transition between the eight main pages).

- **Profile photo**: pages use `/profile.jpg` (your existing `public/profile.jpg`).

- **Live visitor counter** stays cookie-free and shows a local tally until you
  wire up the analytics worker — set `COUNTER_ENDPOINT` in `app/HomeClient.tsx`.

- **Reduced motion** is respected everywhere (the matrix transition, all canvas
  demos, and the scroll reveals fall back to static).
