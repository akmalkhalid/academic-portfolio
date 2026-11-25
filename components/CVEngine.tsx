"use client";

// CV ENGINE — the one CV page (/cv). It replaces the three separate CVs (Academic, Industry,
// Tailored): they are now three settings of the same engine.
//
// The visitor chooses PARAMETERS and the CV is assembled in the browser:
//     reader     who it is for (full academic record, industry client, panel, grant reviewer, ...)
//     pages      1 to 5, or the full record
//     focus      all three pillars, or one of them
//     sections   switch any section off
//     template   Classic, Modern, Compact or Tech, plus an accent colour, headline numbers, photo
// The choices are kept in the address (for example /cv/?reader=industry&pages=2&template=modern),
// so a particular CV can be bookmarked or sent to someone.
//
// HOW THE CONTENT IS CHOSEN, in four steps
//   1. POOL     Every line that could appear on a CV becomes one entry: an appointment, a grant,
//               a paper, a student, a training session. Each entry has a base value (a recent
//               first-author Q1 paper is worth more than an old co-authored conference paper)
//               and a cost in printed lines.
//   2. READER   Each reader gives every SECTION a weight. A grant reviewer weights grants at 10
//               and training at 1; an industry client is the other way round.
//   3. SCORE    value = section weight x base value x pillar focus.
//   4. PACK     Sort by value per line and keep adding entries until the page budget is full
//               (the greedy answer to the knapsack problem). "Full record" skips this step.
//
// HOW IT LOOKS is separate from what it says: a template is only a CSS class on the sheet
// (t-classic, t-modern, t-compact, t-tech). The same sections go into every template.
//
// DOWNLOADS: Save as PDF (the browser's print dialog, with print styles that keep only the
// sheet), Word (.doc), Markdown (.md), and the two designed PDFs built on every deploy by
// scripts/generate-cv-pdf.mjs.
//
// DATA: passed in by app/cv/page.tsx, which reads public/assistant/data.json at build time.
// That file is rebuilt from content/ on every deploy (scripts/build-engine.mjs), so the CV
// cannot drift from the rest of the site.

import { useEffect, useMemo, useState } from "react";

/* ---------- the three research pillars (same wording as the engine page) ---------- */
const PILLARS: Record<string, { verb: string; name: string; line: string }> = {
  gen: { verb: "Generate", name: "Generative & Agentic AI", line: "Generative models, language models and agent teams propose candidates: levels, quests, puzzles, layouts, schedules." },
  eva: { verb: "Evaluate", name: "Games Informatics & Engagement Modelling", line: "Each candidate is scored by models of how people experience it, such as game refinement theory and the motion in mind model." },
  sea: { verb: "Search", name: "Computational Intelligence & Optimization", line: "Evolutionary, immune and swarm algorithms decide what gets generated next." },
};
const PILLAR_ORDER = ["gen", "eva", "sea"];

/* ---------- every section the engine knows, with its heading ---------- */
const TITLE: Record<string, string> = {
  focus: "Research focus", employment: "Appointments", education: "Education", grants: "Research grants",
  pubs: "Selected publications", supervision: "Postgraduate supervision", training: "Training delivered",
  expertise: "What I teach", awards: "Awards", service: "Professional service", teaching: "Teaching",
  ip: "Registered training modules", roles: "Training appointments", development: "Certifications and courses",
  membership: "Memberships", skills: "Skills",
};
// In the Modern template these short sections go in the side column.
const SIDE = ["education", "skills", "membership", "awards", "development"];

type Preset = { name: string; hint: string; pages: number; order: string[]; weight: Record<string, number>; lead: (d: any) => string };

/* ---------- step 2: the readers. `weight` says how much each section matters to them.
   pages: 0 means the full record. The first two are the former Academic and Industry CVs. ---------- */
const PRESETS: Record<string, Preset> = {
  academic: {
    name: "Academic: full record", hint: "Everything, scholarly order", pages: 0,
    order: ["focus", "employment", "education", "grants", "pubs", "supervision", "teaching", "training", "ip", "awards", "service", "roles", "development", "membership", "skills"],
    weight: { focus: 9, employment: 9, education: 9, grants: 9, pubs: 9, supervision: 8, teaching: 6, training: 5, ip: 5, awards: 7, service: 7, roles: 4, development: 3, membership: 5, skills: 3, expertise: 0 },
    lead: (d) => String(d.cv.profile || "").trim(),
  },
  industry: {
    name: "Industry or training client", hint: "Trainer and consultant first", pages: 2,
    order: ["expertise", "training", "ip", "roles", "employment", "development", "skills", "focus", "grants", "education", "awards", "service", "pubs", "membership"],
    weight: { expertise: 10, training: 9, ip: 9, roles: 8, employment: 8, development: 6, skills: 6, focus: 5, grants: 5, education: 6, awards: 5, service: 4, pubs: 2.5, membership: 5, teaching: 3, supervision: 1 },
    lead: () => `AI researcher, trainer and Professional Technologist (MBOT) who turns generative AI, optimization and simulation into working tools and practical training. Creator of five registered AI training modules at UKM and a frequent invited speaker on AI for research, education and the workplace.`,
  },
  promotion: {
    name: "Promotion or expert panel", hint: "Research record first", pages: 4,
    order: ["focus", "employment", "education", "grants", "pubs", "supervision", "awards", "service", "teaching", "ip", "membership"],
    weight: { focus: 9, employment: 8, education: 7, grants: 9, pubs: 8, supervision: 8, awards: 6, service: 6, teaching: 5, ip: 4, membership: 4, training: 2, roles: 3, skills: 0.5 },
    lead: (d) => `Senior Lecturer at UKM working on generative optimization: generative AI that proposes, models of engagement that evaluate, and metaheuristics that search. ${d.pubs.length} publications, ${d.metrics.citations.toLocaleString()} citations, h-index ${d.metrics.hIndex}. Principal investigator on competitive national and university grants and formerly Assistant Professor at JAIST, Japan.`,
  },
  grant: {
    name: "Grant reviewer", hint: "Track record and capacity to deliver", pages: 2,
    order: ["focus", "grants", "pubs", "supervision", "employment", "awards", "education", "service"],
    weight: { focus: 8, grants: 10, pubs: 8, supervision: 7, employment: 7, awards: 5, education: 6, service: 3, teaching: 1, ip: 2, membership: 3, training: 1, skills: 0.5 },
    lead: (d) => `Principal investigator with a record of funded, delivered projects in computational intelligence and generative AI, including the national programme on large language models for Bahasa Melayu. ${d.grants.length} grants to date, ${d.students.length} postgraduate researchers supervised.`,
  },
  student: {
    name: "Prospective postgraduate", hint: "Topics, supervision and active projects", pages: 1,
    order: ["focus", "supervision", "grants", "pubs", "teaching", "employment", "education"],
    weight: { focus: 10, supervision: 9, grants: 7, pubs: 6, teaching: 6, employment: 5, education: 4, awards: 2, service: 1, ip: 2, membership: 1, skills: 1 },
    lead: () => `I supervise MSc and PhD research where AI generates, evaluates and optimizes: metaheuristics and swarm intelligence, game and engagement modelling, and generative and agentic AI. Current student topics and active grants are listed below.`,
  },
  card: {
    name: "One-page summary", hint: "For a bio pack or a conference chair", pages: 1,
    order: ["focus", "employment", "education", "pubs", "grants", "awards"],
    weight: { focus: 9, employment: 8, education: 7, pubs: 7, grants: 7, awards: 5, supervision: 3, service: 3, teaching: 2, ip: 3, membership: 3, training: 2, skills: 0.5 },
    lead: (d) => `Senior Lecturer in artificial intelligence at Universiti Kebangsaan Malaysia. Research on generative optimization across games, simulation and engagement modelling. ${d.pubs.length} publications, h-index ${d.metrics.hIndex}.`,
  },
};

/* ---------- the templates: how the sheet looks. `lines` = lines of text that fit one A4 page ---------- */
// `side` (Modern only) = lines that fit one page of the side column. The side column sits beside
// the main column, so it has its own budget: filling it does not push anything off the page.
// `head` = extra lines the template's header takes on page 1 (Modern has a colour band and a stats bar).
const TEMPLATES: Record<string, { name: string; hint: string; lines: number; side?: number; head?: number }> = {
  classic: { name: "Classic", hint: "One column, navy and gold", lines: 54 },
  modern: { name: "Modern", hint: "Colour header, side column", lines: 40, side: 40, head: 5 },   // fewer: the main column is narrower, so entries wrap more
  compact: { name: "Compact", hint: "Plain, dense, black and white", lines: 66 },
  tech: { name: "Tech", hint: "Monospace labels, numbered sections", lines: 52 },
};
const ACCENTS: Record<string, string> = { navy: "#1b2a5c", violet: "#5b4bd6", teal: "#0f766e", coral: "#c2410c", slate: "#334155" };

const CHARS_PER_LINE = 84;   // characters that fit on one line of an entry
const CONTACT = "akmal@ukm.edu.my · akmal.app · ORCID 0000-0002-7909-8869";

type Entry = { sec: string; when: string; text: string; base: number; pillar: string; i: number; cost: number };

/* ---------- step 1: turn the whole record into one pool of scored entries ---------- */
function buildPool(d: any, today: string): Entry[] {
  const cv = d.cv;
  const pool: Entry[] = [];
  const add = (sec: string, when: string, text: string, base: number, pillar = "") =>
    pool.push({ sec, when, text, base, pillar, i: pool.length, cost: Math.max(1, Math.ceil(text.length / CHARS_PER_LINE)) });

  const latest = Math.max(...d.pubs.map((p: any) => +p.y || 0));
  const recency = (y: number) => 1 / (1 + 0.12 * Math.max(0, latest - (+y || latest)));   // newer work counts more
  const isPI = (role: string) => /^princip/i.test(role);

  PILLAR_ORDER.forEach((k) => add("focus", PILLARS[k].verb, `${PILLARS[k].name}. ${PILLARS[k].line}`, 1.2, k));
  cv.employment.forEach((e: any, i: number) => add("employment", e.period, `${e.role}, ${e.place}`, 1.3 - i * 0.15));
  cv.education.forEach((e: any, i: number) => add("education", e.period, `${e.degree}, ${e.place}. ${e.detail}`, 1.2 - i * 0.15));

  // grants: led beats joined, larger beats smaller, active gets a small lift
  [...d.grants].sort((a: any, b: any) => +isPI(b.role) - +isPI(a.role) || b.amt - a.amt).forEach((g: any) =>
    add("grants", `${g.s}–${g.e}`, `${isPI(g.role) ? "PI" : "Co-I"}. ${g.t}. ${g.ag}${g.amt ? ", RM " + g.amt.toLocaleString("en-US") : ""}.`,
      (isPI(g.role) ? 1.5 : 0.8) * (0.6 + Math.log10(Math.max(g.amt, 1e3)) / 6) * (g.st === "Active" ? 1.15 : 1), g.p));

  // publications: recency, selected (s), first author (f), JCR quartile (q), journal over conference (c)
  [...d.pubs].sort((a: any, b: any) => b.y - a.y).forEach((p: any) =>
    add("pubs", String(p.y), `${p.a.length > 3 ? p.a[0] + " et al." : p.a.join(", ")} ${p.t}. ${p.v}.${p.q && p.q !== "Sc" ? " [" + p.q + "]" : ""}`,
      (0.45 + recency(p.y) * 0.6) * (p.s ? 1.7 : 1) * (p.f ? 1.35 : 1) * (({ Q1: 1.5, Q2: 1.25 } as any)[p.q] || 1) * (p.c === "J" ? 1.1 : 0.85), p.p));

  const main = (s: any) => s.r.startsWith("Main");
  [...d.students].sort((a: any, b: any) => +main(b) - +main(a) || b.y - a.y).forEach((s: any) =>
    add("supervision", `${s.d} ${s.y || ""}`.trim(), `${s.n} (${s.r.replace("-Supervisor", "").replace(" Supervisor", "")} supervisor, ${s.st.toLowerCase()}). ${s.t}.`,
      (main(s) ? 1.3 : 0.85) * (s.st === "Ongoing" ? 1 : 1.1), s.p));

  // training: newest first; sessions dated after the build date are marked "scheduled"
  const tr = cv.training || { rows: [], expertise: [], development: [], appointments: [] };
  [...tr.rows].sort((a: any, b: any) => String(b.date).localeCompare(String(a.date))).forEach((r: any, i: number) =>
    add("training", r.when, `${r.title}. ${r.client}${r.audience ? " · " + r.audience : ""}${r.date > today ? " (scheduled)" : ""}`, Math.max(0.5, 1.35 - i * 0.012)));
  tr.expertise.forEach((e: any, i: number) => add("expertise", "", `${e.title}. ${e.text}.`, 1.3 - i * 0.05));
  tr.appointments.forEach((t: string, i: number) => add("roles", "", t, 1.15 - i * 0.05));
  tr.development.forEach((e: any, i: number) => add("development", e.year, `${e.title}. ${e.provider}`, 1.05 - i * 0.03));

  cv.awards.forEach((a: string, i: number) => add("awards", "", a, 1.1 - i * 0.1));
  cv.service.forEach((a: string, i: number) => add("service", "", a, 1.1 - i * 0.08));
  cv.teaching.forEach((t: any, i: number) => add("teaching", t.when, t.text, 1.1 - i * 0.1));
  cv.ip.forEach((t: any, i: number) => add("ip", t.year, `${t.title} (${t.place})`, 1.1 - i * 0.05));
  cv.membership.forEach((t: string, i: number) => add("membership", "", t, 1 - i * 0.1));
  Object.entries(cv.skills).forEach(([k, v]) => add("skills", k, String(v), 1));
  return pool;
}

/* ---------- steps 3 and 4: score for this reader, then pack greedily by value per line ---------- */
function assemble(d: any, pool: Entry[], presetKey: string, pages: number, focus: string, hidden: string[], linesPerPage: number, sideLines = 0, headLines = 0) {
  const preset = PRESETS[presetKey];
  const lead = preset.lead(d);
  const full = pages === 0;
  const budget = full ? Infinity : pages * linesPerPage - headLines - (8 + Math.ceil(lead.length / 95));   // the header and lead take space too
  // Two columns (Modern): side sections are packed against the side column's own budget.
  // An entry there wraps more (the column is a third of the page) and its date takes a line of its own.
  const twoCol = sideLines > 0;
  const sideBudget = full ? Infinity : pages * sideLines - headLines - (8 + Math.ceil(lead.length / 95));
  const sideCost = (e: Entry) => Math.ceil(e.text.length / 34) + (e.when ? 1 : 0);
  let used = 0, usedSide = 0;
  const count: Record<string, number> = {};
  const kept: Entry[] = [];

  const scored = pool
    .map((e) => ({ e, value: hidden.includes(e.sec) ? 0 : (preset.weight[e.sec] || 0) * e.base * (focus && e.pillar ? (e.pillar === focus ? 1.7 : 0.6) : 1) }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value / b.e.cost - a.value / a.e.cost);

  for (const { e } of scored) {
    const heading = count[e.sec] ? 0 : 2;                                          // a new section costs a heading
    if (twoCol && SIDE.includes(e.sec)) {                                          // side column: its own budget
      const c = sideCost(e) + heading;
      if (usedSide + c > sideBudget) continue;
      usedSide += c; count[e.sec] = (count[e.sec] || 0) + 1; kept.push(e);
      continue;
    }
    if (used + e.cost + heading > budget) continue;                                // does not fit: try a smaller entry
    if (!full && pages < 3 && e.sec === "pubs" && (count.pubs || 0) >= pages * 9) continue;        // short CVs must not be all papers
    if (!full && pages < 3 && e.sec === "training" && (count.training || 0) >= pages * 8) continue; // nor all training rows
    used += e.cost + heading;
    count[e.sec] = (count[e.sec] || 0) + 1;
    kept.push(e);
  }

  const order = [...preset.order, ...Object.keys(TITLE).filter((k) => !preset.order.includes(k))].filter((k) => count[k]);
  const total = (k: string) => pool.filter((e) => e.sec === k).length;
  const sections = order.map((k) => {
    const items = kept.filter((e) => e.sec === k).sort((a, b) => a.i - b.i);
    const all = items.length === total(k);
    return { key: k, title: k === "pubs" ? (all ? "Publications" : "Selected publications") : k === "training" && !all ? "Selected training delivered" : TITLE[k], items };
  });
  const leftOut = Object.keys(TITLE).filter((k) => !count[k] && total(k)).map((k) => TITLE[k].toLowerCase());
  return { lead, sections, kept: kept.length, pubs: count.pubs || 0, lines: used + 8, leftOut, full };
}
type Built = ReturnType<typeof assemble>;

const jobTitle = (d: any, reader: string) =>
  reader === "industry" && d.cv.industry ? d.cv.industry.title : String(d.cv.meta.title).replace(/\s*\(.*\)/, "");

/* ---------- exports: the same sections as plain Markdown and as a Word-readable document ---------- */
function toMarkdown(d: any, t: Built, reader: string) {
  const m = d.cv.meta;
  let md = `# ${m.name}, ${m.credential}\n${jobTitle(d, reader)} · ${m.affiliation}\n${CONTACT}\n\n${t.lead}\n`;
  for (const s of t.sections) md += `\n## ${s.title}\n` + s.items.map((e) => `- ${e.when ? `**${e.when}** ` : ""}${e.text}`).join("\n") + "\n";
  return md;
}
const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// Word opens an HTML file saved with a .doc name; simple tags and inline styles survive the trip.
function toWordHtml(d: any, t: Built, reader: string, accent: string) {
  const m = d.cv.meta;
  const rows = (s: Built["sections"][number]) => s.items.map((e) =>
    `<tr><td style="width:2.4cm;vertical-align:top;font-weight:bold;color:${accent};font-size:9pt">${escHtml(e.when)}</td><td style="vertical-align:top;font-size:10pt">${escHtml(e.text)}</td></tr>`).join("");
  return `<html><head><meta charset="utf-8"><title>${escHtml(m.name)} CV</title></head><body style="font-family:Calibri,Arial,sans-serif;color:#222">
<h1 style="color:${accent};font-size:20pt;margin:0">${escHtml(m.name)}, ${escHtml(m.credential)}</h1>
<p style="margin:2pt 0;color:#555;font-size:10pt">${escHtml(jobTitle(d, reader))} · ${escHtml(m.affiliation)}</p>
<p style="margin:2pt 0;color:#555;font-size:10pt">${escHtml(CONTACT)}</p>
<p style="font-size:10pt;margin:8pt 0">${escHtml(t.lead)}</p>
${t.sections.map((s) => `<h2 style="color:${accent};font-size:11pt;border-bottom:1px solid #ccc;margin:12pt 0 4pt">${escHtml(s.title.toUpperCase())}</h2><table style="border-collapse:collapse;width:100%">${rows(s)}</table>`).join("\n")}
</body></html>`;
}
function saveFile(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function CVEngine({ data, today }: { data: any; today: string }) {
  // ---- the parameters ----
  const [reader, setReader] = useState("academic");
  const [pages, setPages] = useState(PRESETS.academic.pages);     // 0 = full record
  const [focus, setFocus] = useState("");
  const [hidden, setHidden] = useState<string[]>([]);
  const [template, setTemplate] = useState("classic");
  const [accent, setAccent] = useState("navy");
  const [numbers, setNumbers] = useState(true);
  const [photo, setPhoto] = useState(false);
  const [copied, setCopied] = useState("");
  const [ready, setReady] = useState(false);

  // Read the parameters from the address once, then keep the address in step with them.
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const r = q.get("reader"); const rOk = r && PRESETS[r] ? r : "academic";
    setReader(rOk);
    const p = q.get("pages"); setPages(p === "full" ? 0 : p && +p >= 1 && +p <= 5 ? +p : PRESETS[rOk].pages);
    const f = q.get("focus"); if (f && PILLARS[f]) setFocus(f);
    const t = q.get("template"); if (t && TEMPLATES[t]) setTemplate(t);
    const a = q.get("accent"); if (a && ACCENTS[a]) setAccent(a);
    const h = q.get("hide"); if (h) setHidden(h.split(",").filter((k) => TITLE[k]));
    if (q.get("numbers") === "0") setNumbers(false);
    if (q.get("photo") === "1") setPhoto(true);
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const q = new URLSearchParams();
    if (reader !== "academic") q.set("reader", reader);
    if (pages !== PRESETS[reader].pages) q.set("pages", pages === 0 ? "full" : String(pages));
    if (focus) q.set("focus", focus);
    if (template !== "classic") q.set("template", template);
    if (accent !== "navy") q.set("accent", accent);
    if (hidden.length) q.set("hide", hidden.join(","));
    if (!numbers) q.set("numbers", "0");
    if (photo) q.set("photo", "1");
    const s = q.toString();
    history.replaceState(null, "", location.pathname + (s ? "?" + s : ""));
  }, [ready, reader, pages, focus, template, accent, hidden, numbers, photo]);

  const pool = useMemo(() => buildPool(data, today), [data, today]);
  const cv = useMemo(() => assemble(data, pool, reader, pages, focus, hidden, TEMPLATES[template].lines, TEMPLATES[template].side || 0, TEMPLATES[template].head || 0), [data, pool, reader, pages, focus, hidden, template]);

  const chooseReader = (k: string) => { setReader(k); setPages(PRESETS[k].pages); };   // each reader starts at a sensible length
  const toggleSection = (k: string) => setHidden((h) => (h.includes(k) ? h.filter((x) => x !== k) : [...h, k]));
  const flash = (msg: string) => { setCopied(msg); setTimeout(() => setCopied(""), 2200); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(toMarkdown(data, cv, reader)); flash("Copied"); }
    catch { flash("Copy was blocked"); }
  };
  const fileBase = `Akmal_CV_${reader}${pages ? "_" + pages + "p" : "_full"}`;
  const acc = template === "compact" ? "#111827" : ACCENTS[accent];
  const m = data.cv.meta;

  const grantTotal = data.grants.reduce((a: number, g: any) => a + (g.amt || 0), 0);
  const trained = (data.cv.training?.rows || []).filter((r: any) => r.date <= today).length;
  const stats = reader === "industry"
    ? [[String(trained), "sessions delivered"], [String(data.cv.ip.length), "registered modules"], [String(data.pubs.length), "publications"], ["RM " + (grantTotal / 1e6).toFixed(2) + "M", "research grants"]]
    : [[String(data.pubs.length), "publications"], [data.metrics.citations.toLocaleString("en-US"), "citations"], [String(data.metrics.hIndex), "h-index"], ["RM " + (grantTotal / 1e6).toFixed(2) + "M", "research grants"], [String(data.students.length), "students supervised"]];

  const side = template === "modern" ? cv.sections.filter((s) => SIDE.includes(s.key)) : [];
  const mainSecs = template === "modern" ? cv.sections.filter((s) => !SIDE.includes(s.key)) : cv.sections;
  const renderSec = (s: Built["sections"][number], n: number) => (
    <section key={s.key}>
      <h3>{template === "tech" ? <i>{String(n + 1).padStart(2, "0")} /</i> : null}{s.title}</h3>
      <ul>{s.items.map((e) => (<li key={e.i}><span>{e.when}</span><span>{e.text}</span></li>))}</ul>
    </section>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cve">
        {/* ---------------- the parameters ---------------- */}
        <div className="cve-ctrl">
          <div>
            <p className="cve-label">1 · Who is reading?</p>
            <div className="cve-presets" role="group" aria-label="Reader">
              {Object.entries(PRESETS).map(([k, p]) => (
                <button key={k} type="button" aria-pressed={k === reader} onClick={() => chooseReader(k)}>{p.name}<small>{p.hint}</small></button>
              ))}
            </div>
          </div>
          <div>
            <p className="cve-label">2 · Length: {pages === 0 ? "full record" : `${pages} page${pages > 1 ? "s" : ""}`}</p>
            <div className="cve-seg" role="group" aria-label="Length">
              {[1, 2, 3, 4, 5, 0].map((n) => (<button key={n} type="button" aria-pressed={pages === n} onClick={() => setPages(n)}>{n === 0 ? "Full" : n}</button>))}
            </div>
          </div>
          <label>
            <p className="cve-label">3 · Research focus</p>
            <select value={focus} onChange={(e) => setFocus(e.target.value)}>
              <option value="">All three pillars</option>
              <option value="gen">Generate: generative and agentic AI</option>
              <option value="eva">Evaluate: games and engagement</option>
              <option value="sea">Search: optimization</option>
            </select>
          </label>
          <div>
            <p className="cve-label">4 · Sections</p>
            <div className="cve-chips" role="group" aria-label="Sections to include">
              {Object.keys(TITLE).filter((k) => (PRESETS[reader].weight[k] || 0) > 0).map((k) => (
                <button key={k} type="button" aria-pressed={!hidden.includes(k)} onClick={() => toggleSection(k)}>{TITLE[k]}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="cve-label">5 · Template</p>
            <div className="cve-tpl" role="group" aria-label="Template">
              {Object.entries(TEMPLATES).map(([k, t]) => (
                <button key={k} type="button" aria-pressed={k === template} onClick={() => setTemplate(k)}>
                  <span className={"cve-thumb th-" + k} aria-hidden="true"><i /><i /><i /></span>{t.name}<small>{t.hint}</small>
                </button>
              ))}
            </div>
            <div className="cve-row">
              <span className="cve-swatches" role="group" aria-label="Accent colour">
                {Object.entries(ACCENTS).map(([k, c]) => (<button key={k} type="button" aria-pressed={k === accent} aria-label={k} title={k} disabled={template === "compact"} onClick={() => setAccent(k)} style={{ background: c }} />))}
              </span>
              <label className="cve-check"><input type="checkbox" checked={numbers} onChange={(e) => setNumbers(e.target.checked)} /> Headline numbers</label>
              <label className="cve-check"><input type="checkbox" checked={photo} onChange={(e) => setPhoto(e.target.checked)} /> Photo</label>
            </div>
          </div>
          <div className="cve-fit" aria-live="polite">
            <b>{cv.kept}</b> of {pool.length} entries · <b>{cv.pubs}</b> of {data.pubs.length} publications<br />
            {cv.full ? <>full record, as many pages as it needs</> : <>about <b>{cv.lines}</b> of {pages * TEMPLATES[template].lines} lines used</>}<br />
            left out: {cv.leftOut.join(", ") || "nothing"}
          </div>
          <div>
            <p className="cve-label">6 · Download</p>
            <div className="cve-actions">
              <button type="button" onClick={() => window.print()}>Save as PDF</button>
              <button type="button" className="alt" onClick={() => saveFile(fileBase + ".doc", toWordHtml(data, cv, reader, acc), "application/msword")}>Word</button>
              <button type="button" className="alt" onClick={() => saveFile(fileBase + ".md", toMarkdown(data, cv, reader), "text/markdown")}>Markdown</button>
              <button type="button" className="alt" onClick={copy}>{copied || "Copy text"}</button>
            </div>
            <p className="cve-note">“Save as PDF” opens the print dialog: choose <b>Save as PDF</b>. Ready-made designed PDFs: <a href="/cv/Akmal_CV_2026_Academic.pdf" download>Academic</a> · <a href="/cv/Akmal_CV_2026_Industry.pdf" download>Industry</a>.</p>
          </div>
        </div>

        {/* ---------------- the sheet (always paper-white, in both site themes) ---------------- */}
        <div className={"cve-sheet t-" + template} id="cv-sheet" data-theme="light" style={{ ["--acc" as string]: acc }}>
          <header className="cve-head">
            {photo ? <img src="/cv/portrait-cv.jpg" alt="" className="cve-photo" /> : null}
            <div>
              <h2>{m.name}, {m.credential}</h2>
              <p className="cve-sub">{jobTitle(data, reader)} · {m.affiliation}</p>
              <p className="cve-sub">{CONTACT}</p>
            </div>
          </header>
          {numbers ? <div className="cve-stats">{stats.map(([v, l]) => (<div key={l}><b>{v}</b><span>{l}</span></div>))}</div> : null}
          <p className="cve-lead">{cv.lead}</p>
          {/* Modern has two columns only when a side section was kept. Without this class the
              main column would fall into the narrow first grid track and leave the page half empty. */}
          <div className={"cve-body" + (template === "modern" && !side.length ? " no-side" : "")}>
            {template === "modern" && side.length ? <aside>{side.map((s, n) => renderSec(s, n))}</aside> : null}
            <div>{mainSecs.map((s, n) => renderSec(s, n))}</div>
          </div>
          <p className="cve-foot">Built at akmal.app/cv from the live record · {today}</p>
        </div>
      </div>
    </>
  );
}

/* ---------- styles. The control panel follows the site theme (var(--...)); the sheet is paper.
   Each template is a small block of overrides on top of the Classic rules. ---------- */
const CSS = `
.cve{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:minmax(0,340px) minmax(0,1fr);gap:22px;align-items:start;font-family:'Inter',-apple-system,'Segoe UI',Arial,sans-serif}
@media(max-width:940px){.cve{grid-template-columns:1fr}}
.cve-ctrl{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:16px;color:var(--body)}
.cve-label{font-family:'JetBrains Mono',monospace;font-size:10.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:0 0 8px}
.cve-ctrl button{font-family:inherit;cursor:pointer}
.cve-presets{display:flex;flex-direction:column;gap:5px}
.cve-presets button{text-align:left;padding:9px 12px;border-radius:9px;border:1px solid var(--line);background:transparent;font-weight:600;font-size:13.5px;line-height:1.3;color:var(--ink)}
.cve-presets small,.cve-tpl small{display:block;font-weight:400;font-size:12px;color:var(--muted);margin-top:2px}
.cve-presets button:hover,.cve-tpl button:hover,.cve-seg button:hover{border-color:var(--line-2)}
.cve-presets button[aria-pressed="true"],.cve-tpl button[aria-pressed="true"],.cve-seg button[aria-pressed="true"]{border-color:#8b7bf0;background:rgba(139,123,240,.16);box-shadow:0 0 0 1px #8b7bf0}
.cve-seg{display:grid;grid-template-columns:repeat(6,1fr);gap:5px}
.cve-seg button{padding:8px 0;border-radius:8px;border:1px solid var(--line);background:transparent;font-weight:600;font-size:13px;color:var(--ink)}
.cve-ctrl select{width:100%;padding:9px 10px;border:1px solid var(--line);border-radius:8px;background:var(--panel-2);font-size:13.5px;color:var(--ink)}
.cve-chips{display:flex;flex-wrap:wrap;gap:5px}
.cve-chips button{padding:5px 10px;border-radius:999px;border:1px solid var(--line);background:transparent;font-size:12px;color:var(--faint);text-decoration:line-through}
.cve-chips button[aria-pressed="true"]{color:var(--ink);text-decoration:none;border-color:var(--line-2);background:var(--panel-2)}
.cve-tpl{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.cve-tpl button{text-align:left;padding:9px 10px;border-radius:9px;border:1px solid var(--line);background:transparent;font-weight:600;font-size:13px;color:var(--ink)}
.cve-thumb{display:block;height:34px;border-radius:4px;background:#fff;margin-bottom:7px;padding:5px;position:relative;overflow:hidden}
.cve-thumb i{display:block;height:3px;border-radius:2px;background:#cbd5e1;margin-bottom:4px}
.cve-thumb i:first-child{width:55%;background:#1b2a5c;height:5px}
.th-modern{background:linear-gradient(#5b4bd6 0 12px,#fff 12px)}.th-modern i:first-child{background:#fff}.th-modern i{margin-left:30%}
.th-compact i{background:#6b7280;height:2px;margin-bottom:3px}.th-compact i:first-child{background:#111827}
.th-tech{background:#fff;border-left:4px solid #0f766e}.th-tech i:first-child{background:#0f766e;width:40%}
.cve-row{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;margin-top:10px}
.cve-swatches{display:inline-flex;gap:6px}
.cve-swatches button{width:22px;height:22px;border-radius:50%;border:2px solid transparent;padding:0}
.cve-swatches button[aria-pressed="true"]{border-color:var(--ink);box-shadow:0 0 0 2px var(--panel)}
.cve-swatches button:disabled{opacity:.3;cursor:not-allowed}
.cve-check{font-size:12.5px;color:var(--body);display:inline-flex;gap:6px;align-items:center;cursor:pointer}
.cve-check input{accent-color:#8b7bf0}
.cve-fit{font-size:12.5px;line-height:1.7;color:var(--body);background:var(--panel-2);border-left:3px solid #8b7bf0;border-radius:5px;padding:9px 12px}
.cve-fit b{color:var(--ink)}
.cve-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.cve-actions button{padding:10px 8px;border-radius:8px;border:1px solid #8b7bf0;background:#6d5cf0;color:#fff;font-weight:600;font-size:13px}
.cve-actions button.alt{background:transparent;color:var(--ink);border-color:var(--line-2)}
.cve-note{font-size:12px;color:var(--muted);line-height:1.55;margin:10px 0 0}
.cve-note a{color:var(--ink);font-weight:600}
.cve-ctrl button:focus-visible,.cve-ctrl select:focus-visible{outline:2px solid #8b7bf0;outline-offset:2px}

/* the sheet: Classic */
.cve-sheet{--gold:#d8a72a;background:#fff;color:#26303f;box-shadow:0 18px 50px rgba(0,0,0,.35);border-radius:10px;padding:44px 48px;font-size:13.5px;line-height:1.5;min-height:420px}
@media(max-width:560px){.cve-sheet{padding:26px 20px}}
.cve-head{display:flex;gap:18px;align-items:center}
.cve-photo{width:84px;height:84px;border-radius:50%;object-fit:cover;flex-shrink:0;border:3px solid var(--acc)}
.cve-sheet h2{font-size:26px;font-weight:800;letter-spacing:-.02em;color:var(--acc);margin:0;line-height:1.15}
.cve-sub{color:#6b7280;margin:4px 0 0}
.cve-stats{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 0}
.cve-stats div{flex:1;min-width:92px;border-radius:8px;padding:8px 10px;background:var(--acc);color:#fff}
.cve-stats b{display:block;font-size:17px;font-weight:800;line-height:1.1}
.cve-stats span{display:block;font-size:10px;letter-spacing:.04em;text-transform:uppercase;opacity:.85;margin-top:2px}
.cve-lead{margin:14px 0 0;padding-bottom:14px;border-bottom:3px solid var(--gold)}
.cve-sheet h3{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--acc);margin:20px 0 7px;padding-bottom:4px;border-bottom:1px solid #e5e7eb;break-after:avoid}
.cve-sheet h3 i{font-style:normal}
.cve-sheet ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:5px}
.cve-sheet li{display:grid;grid-template-columns:92px 1fr;gap:10px;break-inside:avoid}
.cve-sheet li>span:first-child{font-size:11.5px;font-weight:700;color:var(--acc);padding-top:2px}
@media(max-width:560px){.cve-sheet li{grid-template-columns:1fr;gap:0}}
.cve-foot{margin:22px 0 0;font-size:11px;color:#9ca3af}

/* Modern: colour header band, short sections in a tinted side column */
.t-modern{padding:0;overflow:hidden}
.t-modern .cve-head{background:var(--acc);padding:34px 40px 26px}
.t-modern h2{color:#fff}.t-modern .cve-sub{color:rgba(255,255,255,.82)}
.t-modern .cve-photo{border-color:#fff}
.t-modern .cve-stats{margin:0;padding:12px 40px;background:color-mix(in srgb,var(--acc) 12%,#fff);gap:18px}
.t-modern .cve-stats div{background:transparent;color:var(--acc);padding:0;min-width:0;flex:0 1 auto}
.t-modern .cve-stats span{color:#6b7280;opacity:1}
.t-modern .cve-lead{margin:0;padding:18px 40px;border-bottom:none;font-size:14px}
.t-modern .cve-body{display:grid;grid-template-columns:32% 1fr;gap:0}
.t-modern .cve-body>aside{background:color-mix(in srgb,var(--acc) 7%,#fff);padding:4px 22px 24px 40px}
.t-modern .cve-body>div{padding:4px 40px 24px 26px}
.t-modern .cve-body.no-side{grid-template-columns:1fr}
.t-modern .cve-body.no-side>div{padding-left:40px}
.t-modern .cve-body>aside li{grid-template-columns:1fr;gap:0}
.t-modern h3{border-bottom:2px solid var(--acc)}
.t-modern .cve-foot{padding:0 40px 22px;margin-top:6px}
@media(max-width:700px){.t-modern .cve-body{grid-template-columns:1fr}.t-modern .cve-body>aside,.t-modern .cve-body>div{padding:4px 22px 18px}.t-modern .cve-head,.t-modern .cve-lead,.t-modern .cve-stats,.t-modern .cve-foot{padding-left:22px;padding-right:22px}}

/* Compact: plain and dense, no colour; reads well in applicant-tracking systems */
.t-compact{font-size:12.5px;line-height:1.4;color:#111827;padding:36px 42px}
.t-compact h2{font-size:21px;font-weight:700;letter-spacing:0}
.t-compact .cve-sub{color:#374151;margin-top:2px}
.t-compact .cve-stats{gap:0 18px;margin-top:8px}
.t-compact .cve-stats div{background:none;color:#111827;padding:0;min-width:0;flex:0 1 auto;display:flex;gap:5px;align-items:baseline}
.t-compact .cve-stats b{font-size:12.5px;display:inline}.t-compact .cve-stats span{display:inline;font-size:11px;text-transform:none;letter-spacing:0;opacity:1;color:#374151}
.t-compact .cve-lead{border-bottom:1px solid #111827;margin-top:8px;padding-bottom:8px}
.t-compact h3{font-size:11.5px;margin:13px 0 4px;border-bottom:1px solid #9ca3af;padding-bottom:2px}
.t-compact ul{gap:2px}
.t-compact li{grid-template-columns:80px 1fr;gap:8px}
.t-compact li>span:first-child{font-weight:600;font-size:11px}

/* Tech: monospace labels, numbered sections, an accent rule down the left */
.t-tech{border-left:6px solid var(--acc);border-radius:4px 10px 10px 4px}
.t-tech h2{font-family:'Space Grotesk','Inter',sans-serif;font-weight:700;color:#0f172a}
.t-tech .cve-sub{font-family:'JetBrains Mono',monospace;font-size:11.5px}
.t-tech .cve-stats div{background:#0f172a;border-radius:4px;border-bottom:3px solid var(--acc)}
.t-tech .cve-stats b{font-family:'JetBrains Mono',monospace}
.t-tech .cve-lead{border-bottom:1px dashed var(--acc)}
.t-tech h3{font-family:'JetBrains Mono',monospace;font-weight:600;font-size:11.5px;color:#0f172a;border-bottom:none;display:flex;align-items:center;gap:8px}
.t-tech h3 i{color:var(--acc)}
.t-tech h3::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,var(--acc),transparent)}
.t-tech li>span:first-child{font-family:'JetBrains Mono',monospace;font-weight:500;font-size:10.5px}

@media print{
  header:not(.cve-head),footer,.dark-band,.cve-ctrl,.cve-intro,#akmal-assistant,.pt-root{display:none!important}
  html,body,main,.cve-page{background:#fff!important;background-image:none!important;padding:0!important;margin:0!important;min-height:0!important}
  .cve{display:block;max-width:none}
  /* sized so that a "2 page" CV really prints on 2 A4 pages */
  .cve-sheet{box-shadow:none!important;border-radius:0;padding:0;font-size:9pt;line-height:1.36;min-height:0;transform:none!important;background-image:none!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .cve-sheet h2{font-size:19pt}
  .cve-sheet h3{margin:10px 0 4px;font-size:8pt}
  .cve-sheet ul{gap:2px}
  .cve-sheet li{grid-template-columns:78px 1fr}
  .cve-lead{margin-top:8px;padding-bottom:8px}
  .cve-stats{margin-top:8px}.cve-stats div{padding:5px 8px}.cve-stats b{font-size:11pt}.cve-stats span{font-size:6.5pt}
  .cve-photo{width:60px;height:60px}
  .cve-foot{margin-top:12px}
  .t-modern .cve-head{padding:14px 16px 12px}.t-modern .cve-stats{padding:7px 16px}.t-modern .cve-lead{padding:9px 16px;font-size:9pt}
  /* a grid cannot break across pages, so in print the side column is a float beside the main column */
  .t-modern .cve-body{display:block}
  .t-modern .cve-body>aside{float:left;width:31%;padding:0 10px 10px 16px;box-sizing:border-box;border-radius:0 0 6px 0}
  .t-modern .cve-body>div{margin-left:33%;padding:0 16px 12px 0}
  .t-modern .cve-body.no-side>div{margin-left:0;padding-left:16px}
  .t-modern .cve-body::after{content:'';display:block;clear:both}
  .t-modern .cve-foot{padding:0 16px}
  .t-compact{font-size:8.3pt;line-height:1.3}.t-compact h2{font-size:15pt}.t-compact li{grid-template-columns:66px 1fr}
  .t-tech{border-left:none;padding-left:0}
  @page{size:A4;margin:12mm}
}`;
