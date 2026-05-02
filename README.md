# Academic Portfolio (File-Based CMS)

A dynamic academic portfolio for FTSM, UKM. Content lives as Markdown and YAML files
in `/content` — no external CMS, no database. Edit files, commit, push, deploy.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Where the content lives

| Section | File / folder | Format |
|---|---|---|
| Site config (your name, email, social) | `content/site.yml` | YAML |
| Topic tags (taxonomy) | `content/tags.yml` | YAML |
| Publications | `content/publications/*.md` | Markdown + YAML frontmatter |
| Projects / grants | `content/projects/*.md` | Markdown + YAML frontmatter |
| Courses | `content/courses/*.md` | Markdown + YAML frontmatter |
| Students | `content/students/students.yml` | YAML |
| Open research slots | `content/research-slots/slots.yml` | YAML |

## Adding a new publication

Create a file in `content/publications/`. Naming convention: `YYYY-short-slug.md`.

```markdown
---
title: "Your paper title"
authors: "Last, First, [Your Name], Other, A."
year: 2025
venue: "Journal name"
category: "Journal"   # Journal | Conference | Book Chapter | Book | Preprint
quartile: "Q1"
doi: "https://doi.org/..."
topicTags: ["generative-ai", "optimization"]   # IDs from content/tags.yml
citationCount: 0
featured: true
---

Optional abstract or notes here.
```

Save, commit, push. Site rebuilds automatically.

## Adding a new project

Create a file in `content/projects/`. Same pattern as publications.

## Adding a new student

Open `content/students/students.yml`, add a new entry to the list. Set `showPublicly: true`
to display it on the website.

## Editing on GitHub directly (no local setup needed)

Once the site is on GitHub, you can edit any content file in your browser:
1. Navigate to the file on GitHub
2. Click the pencil icon ("Edit this file")
3. Make changes, commit
4. The site rebuilds automatically (~2 minutes)

## Deployment

See the README's deployment section or the conversation that generated this project.

## License

Content: © Author. Code: MIT.
=======
# academic-portfolio
Dr Akmal's Academic Portfolio
>>>>>>> 2dcb686f6c5f371cb7c24107cb3bfa01f7d86367
