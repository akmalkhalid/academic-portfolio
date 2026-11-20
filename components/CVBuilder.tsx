"use client";

// Tailored CV builder (the "Tailored CV" tile at /cv/custom/).
//
// The visitor says who they are and how many pages they will read. Every entry in the record is
// scored for that reader, and the best entries are packed into the space. It all happens in the
// browser; nothing is uploaded.
//
// HOW IT WORKS, in four steps
//   1. POOL     Every line that could appear on a CV becomes one entry: an appointment, a grant,
//               a paper, a student, an award. Each entry has a base value (a recent first-author
//               Q1 paper is worth more than an old co-authored conference paper) and a cost in
//               printed lines.
//   2. READER   Each reader preset gives every SECTION a weight. A grant reviewer weights grants
//               at 10 and teaching at 1; an industry client is the other way round.
//   3. SCORE    value = section weight x base value x pillar emphasis.
//   4. PACK     Sort by value per line and keep adding entries until the page budget is full.
//               This is the classic greedy answer to the knapsack problem.
//
// DATA: /assistant/data.json, the same records the site assistant uses. It is rebuilt from
// content/cv.yml, content/publications, content/projects and content/students on every deploy
// (scripts/build-engine.mjs), so this page can never drift from the rest of the site.

import { useEffect, useMemo, useState } from "react";

/* ---------- the three research pillars (same wording as the engine page) ---------- */
const PILLARS: Record<string, { verb: string; name: string; line: string }> = {
  gen: { verb: "Generate", name: "Generative & Agentic AI", line: "Generative models, language models and agent teams propose candidates: levels, quests, puzzles, layouts, schedules." },
  eva: { verb: "Evaluate", name: "Games Informatics & Engagement Modelling", line: "Each candidate is scored by models of how people experience it, such as game refinement theory and the motion in mind model." },
  sea: { verb: "Search", name: "Computational Intelligence & Optimization", line: "Evolutionary, immune and swarm algorithms decide what gets generated next." },
};
const PILLAR_ORDER = ["gen", "eva", "sea"];

/* ---------- section titles, in the order used when a preset does not say otherwise ---------- */
const TITLE: Record<string, string> = {
  focus: "Research focus", employment: "Appointments", education: "Education", grants: "Research grants",
  pubs: "Selected publications", supervision: "Postgraduate supervision", awards: "Awards",
  service: "Professional service", teaching: "Teaching", ip: "Registered training modules",
  membership: "Memberships", skills: "Skills",
};

type Preset = { name: string; hint: string; pages: number; order: string[]; weight: Record<string, number>; lead: (d: any) => string };

/* ---------- step 2: the readers. `weight` says how much each section matters to them ---------- */
const PRESETS: Record<string, Preset> = {
  promotion: {
    name: "Promotion or expert panel", hint: "Research record first", pages: 4,
    order: ["focus", "employment", "education", "grants", "pubs", "supervision", "awards", "service", "teaching", "ip", "membership"],
    weight: { focus: 9, employment: 8, education: 7, grants: 9, pubs: 8, supervision: 8, awards: 6, service: 6, teaching: 5, ip: 4, membership: 4, skills: 0.5 },
    lead: (d) => `Senior Lecturer at UKM working on generative optimization: generative AI that proposes, models of engagement that evaluate, and metaheuristics that search. ${d.pubs.length} publications, ${d.metrics.citations.toLocaleString()} citations, h-index ${d.metrics.hIndex}. Principal investigator on competitive national and university grants and formerly Assistant Professor at JAIST, Japan.`,
  },
  industry: {
    name: "Industry or training client", hint: "Trainer and consultant first", pages: 2,
    order: ["focus", "ip", "service", "employment", "grants", "skills", "teaching", "awards", "education", "pubs", "membership"],
    weight: { focus: 8, ip: 10, service: 8, employment: 8, grants: 5, skills: 7, teaching: 6, awards: 5, education: 6, pubs: 2.5, membership: 6, supervision: 1 },
    lead: () => `AI researcher, trainer and Professional Technologist (MBOT) who turns generative AI, optimization and simulation into working tools and practical training. Creator of five registered AI training modules at UKM and a frequent invited speaker on AI for research, education and the workplace.`,
  },
  grant: {
    name: "Grant reviewer", hint: "Track record and capacity to deliver", pages: 2,
    order: ["focus", "grants", "pubs", "supervision", "employment", "awards", "education", "service"],
    weight: { focus: 8, grants: 10, pubs: 8, supervision: 7, employment: 7, awards: 5, education: 6, service: 3, teaching: 1, ip: 2, membership: 3, skills: 0.5 },
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
    weight: { focus: 9, employment: 8, education: 7, pubs: 7, grants: 7, awards: 5, supervision: 3, service: 3, teaching: 2, ip: 3, membership: 3, skills: 0.5 },
    lead: (d) => `Senior Lecturer in artificial intelligence at Universiti Kebangsaan Malaysia. Research on generative optimization across games, simulation and engagement modelling. ${d.pubs.length} publications, h-index ${d.metrics.hIndex}.`,
  },
};

const LINES_PER_PAGE = 54;   // lines of text on one printed page
const CHARS_PER_LINE = 84;   // characters that fit on one line of an entry
const CONTACT = "akmal@ukm.edu.my · akmal.app · ORCID 0000-0002-7909-8869";

type Entry = { sec: string; when: string; text: string; base: number; pillar: string; i: number; cost: number };

/* ---------- step 1: turn the whole record into one pool of scored entries ---------- */
function buildPool(d: any): Entry[] {
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
    add("grants", `${g.s}–${g.e}`, `${isPI(g.role) ? "PI" : "Co-I"}. ${g.t}. ${g.ag}${g.amt ? ", RM " + g.amt.toLocaleString() : ""}.`,
      (isPI(g.role) ? 1.5 : 0.8) * (0.6 + Math.log10(Math.max(g.amt, 1e3)) / 6) * (g.st === "Active" ? 1.15 : 1), g.p));

  // publications: recency, selected (s), first author (f), JCR quartile (q), journal over conference (c)
  [...d.pubs].sort((a: any, b: any) => b.y - a.y).forEach((p: any) =>
    add("pubs", String(p.y), `${p.a.length > 3 ? p.a[0] + " et al." : p.a.join(", ")} ${p.t}. ${p.v}.${p.q && p.q !== "Sc" ? " [" + p.q + "]" : ""}`,
      (0.45 + recency(p.y) * 0.6) * (p.s ? 1.7 : 1) * (p.f ? 1.35 : 1) * (({ Q1: 1.5, Q2: 1.25 } as any)[p.q] || 1) * (p.c === "J" ? 1.1 : 0.85), p.p));

  const main = (s: any) => s.r.startsWith("Main");
  [...d.students].sort((a: any, b: any) => +main(b) - +main(a) || b.y - a.y).forEach((s: any) =>
    add("supervision", `${s.d} ${s.y || ""}`.trim(), `${s.n} (${s.r.replace("-Supervisor", "").replace(" Supervisor", "")} supervisor, ${s.st.toLowerCase()}). ${s.t}.`,
      (main(s) ? 1.3 : 0.85) * (s.st === "Ongoing" ? 1 : 1.1), s.p));

  cv.awards.forEach((a: string, i: number) => add("awards", "", a, 1.1 - i * 0.1));
  cv.service.forEach((a: string, i: number) => add("service", "", a, 1.1 - i * 0.08));
  cv.teaching.forEach((t: any, i: number) => add("teaching", t.when, t.text, 1.1 - i * 0.1));
  cv.ip.forEach((t: any, i: number) => add("ip", t.year, `${t.title} (${t.place})`, 1.1 - i * 0.05));
  cv.membership.forEach((t: string, i: number) => add("membership", "", t, 1 - i * 0.1));
  Object.entries(cv.skills).forEach(([k, v]) => add("skills", k, String(v), 1));
  return pool;
}

/* ---------- steps 3 and 4: score for this reader, then pack greedily by value per line ---------- */
function tailor(d: any, pool: Entry[], presetKey: string, pages: number, emphasis: string) {
  const preset = PRESETS[presetKey];
  const lead = preset.lead(d);
  const budget = pages * LINES_PER_PAGE - (8 + Math.ceil(lead.length / 95));   // the header and lead take space too
  let used = 0;
  const count: Record<string, number> = {};
  const kept: Entry[] = [];

  const scored = pool
    .map((e) => ({ e, value: (preset.weight[e.sec] || 0) * e.base * (emphasis && e.pillar ? (e.pillar === emphasis ? 1.7 : 0.6) : 1) }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value / b.e.cost - a.value / a.e.cost);

  for (const { e } of scored) {
    const heading = count[e.sec] ? 0 : 2;                                        // a new section costs a heading
    if (used + e.cost + heading > budget) continue;                              // does not fit: try a smaller entry
    if (e.sec === "pubs" && pages < 3 && (count.pubs || 0) >= pages * 9) continue; // short CVs must not be all papers
    used += e.cost + heading;
    count[e.sec] = (count[e.sec] || 0) + 1;
    kept.push(e);
  }

  const order = [...preset.order, ...Object.keys(TITLE).filter((k) => !preset.order.includes(k))].filter((k) => count[k]);
  const sections = order.map((k) => {
    const items = kept.filter((e) => e.sec === k).sort((a, b) => a.i - b.i);
    return { key: k, title: k === "pubs" && items.length === d.pubs.length ? "Publications" : TITLE[k], items };
  });
  const leftOut = Object.keys(TITLE).filter((k) => !count[k]).map((k) => TITLE[k].toLowerCase());
  return { lead, sections, kept: kept.length, pubs: count.pubs || 0, lines: used + 8, leftOut };
}

const jobTitle = (meta: any) => String(meta.title).replace(/\s*\(.*\)/, "");

function toMarkdown(d: any, t: ReturnType<typeof tailor>) {
  const m = d.cv.meta;
  let md = `# ${m.name}, ${m.credential}\n${jobTitle(m)} · ${m.affiliation}\n${CONTACT}\n\n${t.lead}\n`;
  for (const s of t.sections) md += `\n## ${s.title}\n` + s.items.map((e) => `- ${e.when ? `**${e.when}** ` : ""}${e.text}`).join("\n") + "\n";
  return md;
}

/* ---------- styles: the light "paper" look of the other CV tabs; print shows the sheet only ---------- */
const CSS = `
.cvb{max-width:1120px;margin:0 auto;display:grid;grid-template-columns:minmax(0,330px) minmax(0,1fr);gap:22px;align-items:start;font-family:'Inter',-apple-system,'Segoe UI',Arial,sans-serif;color:#26303f}
@media(max-width:900px){.cvb{grid-template-columns:1fr}}
.cvb-ctrl{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:18px;display:flex;flex-direction:column;gap:16px;position:sticky;top:84px}
@media(max-width:900px){.cvb-ctrl{position:static}}
.cvb-label{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#1b2a5c;margin:0 0 8px}
.cvb-presets{display:flex;flex-direction:column;gap:6px}
.cvb-presets button{text-align:left;padding:10px 12px;border-radius:9px;border:1px solid #e5e7eb;background:#fff;cursor:pointer;font:600 14px/1.3 inherit;color:#1b2a5c}
.cvb-presets button small{display:block;font-weight:400;font-size:12.5px;color:#6b7280;margin-top:2px}
.cvb-presets button:hover{border-color:#1b2a5c}
.cvb-presets button[aria-pressed="true"]{background:#1b2a5c;border-color:#1b2a5c;color:#fff}
.cvb-presets button[aria-pressed="true"] small{color:#c7d2fe}
.cvb-ctrl input[type=range]{width:100%;accent-color:#1b2a5c}
.cvb-ctrl select{width:100%;padding:9px 10px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;font:400 14px inherit;color:#26303f}
.cvb-fit{font-size:12.5px;line-height:1.7;color:#6b7280;background:#f8fafc;border-left:3px solid #1b2a5c;border-radius:5px;padding:9px 12px}
.cvb-fit b{color:#1b2a5c}
.cvb-actions{display:flex;flex-wrap:wrap;gap:8px}
.cvb-actions button{padding:9px 14px;border-radius:8px;border:1px solid #1b2a5c;background:#1b2a5c;color:#fff;font:600 13.5px inherit;cursor:pointer}
.cvb-actions button.alt{background:#fff;color:#1b2a5c}
.cvb-note{font-size:12.5px;color:#6b7280;line-height:1.55;margin:0}
.cvb-note a{color:#1b2a5c;font-weight:600}
.cvb-sheet{background:#fff;box-shadow:0 8px 30px rgba(0,0,0,.10);border-radius:10px;padding:44px 48px;font-size:13.5px;line-height:1.5;min-height:420px}
@media(max-width:560px){.cvb-sheet{padding:26px 20px}}
.cvb-sheet h2{font-size:26px;font-weight:800;letter-spacing:-.02em;color:#1b2a5c;margin:0;line-height:1.15}
.cvb-sub{color:#6b7280;margin:4px 0 0}
.cvb-lead{margin:14px 0 0;padding-bottom:14px;border-bottom:3px solid #d8a72a}
.cvb-sheet h3{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#1b2a5c;margin:20px 0 7px;padding-bottom:4px;border-bottom:1px solid #e5e7eb}
.cvb-sheet ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:5px}
.cvb-sheet li{display:grid;grid-template-columns:92px 1fr;gap:10px;break-inside:avoid}
.cvb-sheet li>span:first-child{font-size:11.5px;font-weight:700;color:#1b2a5c;padding-top:2px}
@media(max-width:560px){.cvb-sheet li{grid-template-columns:1fr;gap:0}}
.cvb-foot{margin:22px 0 0;font-size:11px;color:#9ca3af}
@media print{
  header,footer,.dark-band,.cvv-grid,.cvb-ctrl,.cvb-intro,#akmal-assistant{display:none!important}
  html,body,main,.cvb-page{background:#fff!important;padding:0!important;margin:0!important;min-height:0!important}
  .cvb{display:block;max-width:none}
  /* sized so that a "2 page" CV really prints on 2 A4 pages (about 60 lines a page) */
  .cvb-sheet{box-shadow:none;border-radius:0;padding:0;font-size:9pt;line-height:1.36;min-height:0}
  .cvb-sheet h2{font-size:19pt}
  .cvb-sheet h3{break-after:avoid;margin:10px 0 4px;font-size:8pt}
  .cvb-sheet ul{gap:2px}
  .cvb-sheet li{grid-template-columns:78px 1fr}
  .cvb-lead{margin-top:8px;padding-bottom:8px}
  .cvb-foot{margin-top:12px}
  @page{size:A4;margin:12mm}
}`;

export default function CVBuilder() {
  const [data, setData] = useState<any>(null);
  const [failed, setFailed] = useState(false);
  const [preset, setPreset] = useState("promotion");
  const [pages, setPages] = useState(PRESETS.promotion.pages);
  const [emphasis, setEmphasis] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    fetch("/assistant/data.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j) => setData(j.data))
      .catch(() => setFailed(true));
  }, []);

  const pool = useMemo(() => (data ? buildPool(data) : []), [data]);
  const cv = useMemo(() => (data ? tailor(data, pool, preset, pages, emphasis) : null), [data, pool, preset, pages, emphasis]);

  const choose = (k: string) => { setPreset(k); setPages(PRESETS[k].pages); };   // each reader starts at a sensible length
  const copy = async () => {
    if (!data || !cv) return;
    try { await navigator.clipboard.writeText(toMarkdown(data, cv)); setCopied("Copied"); }
    catch { setCopied("Copy was blocked: select the text instead"); }
    setTimeout(() => setCopied(""), 2200);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cvb">
        <div className="cvb-ctrl">
          <div>
            <p className="cvb-label">Who is reading?</p>
            <div className="cvb-presets" role="group" aria-label="Reader">
              {Object.entries(PRESETS).map(([k, p]) => (
                <button key={k} type="button" aria-pressed={k === preset} onClick={() => choose(k)}>
                  {p.name}<small>{p.hint}</small>
                </button>
              ))}
            </div>
          </div>
          <label>
            <p className="cvb-label">Length: {pages} page{pages > 1 ? "s" : ""}</p>
            <input type="range" min={1} max={5} step={1} value={pages} onChange={(e) => setPages(+e.target.value)} />
          </label>
          <label>
            <p className="cvb-label">Emphasis</p>
            <select value={emphasis} onChange={(e) => setEmphasis(e.target.value)}>
              <option value="">All three pillars</option>
              <option value="gen">Generate: generative and agentic AI</option>
              <option value="eva">Evaluate: games and engagement</option>
              <option value="sea">Search: optimization</option>
            </select>
          </label>
          {cv && data ? (
            <div className="cvb-fit" aria-live="polite">
              <b>{cv.kept}</b> of {pool.length} entries kept · <b>{cv.pubs}</b> of {data.pubs.length} publications<br />
              about <b>{cv.lines}</b> of {pages * LINES_PER_PAGE} lines used<br />
              left out for this reader: {cv.leftOut.join(", ") || "nothing"}
            </div>
          ) : null}
          <div className="cvb-actions">
            <button type="button" onClick={() => window.print()} disabled={!cv}>Print or save as PDF</button>
            <button type="button" className="alt" onClick={copy} disabled={!cv}>{copied || "Copy as Markdown"}</button>
          </div>
          <p className="cvb-note">
            Need everything? The <a href="/cv/">Academic</a> and <a href="/cv/industry/">Industry</a> versions hold the complete record, each with a ready-made PDF.
          </p>
        </div>

        <div className="cvb-sheet" id="cv-tailored">
          {failed ? (
            <p>The record could not be loaded. Please reload the page, or open the <a href="/cv/">full academic CV</a>.</p>
          ) : !cv || !data ? (
            <p style={{ color: "#6b7280" }}>Assembling the CV…</p>
          ) : (
            <>
              <h2>{data.cv.meta.name}, {data.cv.meta.credential}</h2>
              <p className="cvb-sub">{jobTitle(data.cv.meta)} · {data.cv.meta.affiliation}</p>
              <p className="cvb-sub">{CONTACT}</p>
              <p className="cvb-lead">{cv.lead}</p>
              {cv.sections.map((s) => (
                <section key={s.key}>
                  <h3>{s.title}</h3>
                  <ul>
                    {s.items.map((e) => (
                      <li key={e.i}><span>{e.when}</span><span>{e.text}</span></li>
                    ))}
                  </ul>
                </section>
              ))}
              <p className="cvb-foot">Tailored at akmal.app/cv/custom from the live record. The complete CV is at akmal.app/cv.</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
