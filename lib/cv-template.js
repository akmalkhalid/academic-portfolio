// ============================================================================
//  Shared CV template — the SINGLE source of layout for BOTH outputs:
//    • the build-time PDF   (scripts/generate-cv-pdf.mjs → renderDoc)
//    • the on-site /cv page  (app/cv/page.tsx → renderBody + CV_CSS_SCOPED)
//  Plain ESM JS so it imports cleanly from the Node script AND the Next route.
// ============================================================================

const esc = (s = "") => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const ACCENTS = {
  blue: "#2563eb", blue2: "#1d4ed8", indigo: "#4f46e5", teal: "#0f766e",
  amber: "#c2740c", purple: "#7c3aed", rose: "#9d174d", green: "#15803d", slate: "#475569",
};
const MARK = { first: "&lowast;", corr: "&dagger;", sole: "&sect;" };

const qBadge = (q) => {
  if (!q) return "";
  const c = { Q1: "#166534", Q2: "#0e7490", Q3: "#b45309", Q4: "#6b7280", Scopus: "#2563eb" }[q] || "#6b7280";
  return `<span class="q" style="background:${c}">${esc(q)}</span>`;
};
const roleBadge = (role) => {
  const map = { "PI": "#15803d", "Co-PI": "#b45309", "Co-I": "#475569", "Member": "#64748b",
    "PhD·Main": "#2563eb", "MSc·Main": "#0f766e", "PhD·Co": "#64748b" };
  return `<span class="role" style="background:${map[role] || "#475569"}">${esc(role).toUpperCase()}</span>`;
};
const sectionHead = (num, title, note = "") =>
  `<div class="sec-head"><div class="sec-head-l"><span class="sec-num">${num}</span><span class="sec-title">${esc(title)}</span></div>${note ? `<span class="sec-note">${esc(note)}</span>` : ""}</div><div class="rule"></div>`;

// ---------------------------------------------------------------------------
//  Profiles. One data file, two CVs:
//    academic  — the full scholarly record (default; also the legacy PDF)
//    industry  — trainer-first: training delivered, expertise, certifications,
//                then a compact research record
// ---------------------------------------------------------------------------
export const PROFILES = {
  academic: { key: "academic", label: "Academic CV", pdf: "Akmal_CV_2026_Academic.pdf", footer: "Curriculum Vitae (Academic)" },
  industry: { key: "industry", label: "Industry CV · Trainer", pdf: "Akmal_CV_2026_Industry.pdf", footer: "Curriculum Vitae (Industry · Trainer)" },
};

const KIND = { workshop: "#0f766e", course: "#7c3aed", talk: "#2563eb", keynote: "#c2740c", webinar: "#475569" };
const SECTOR = { academia: "Academia", government: "Government", health: "Healthcare", industry: "Industry", international: "International", schools: "Schools" };
const kindBadge = (k) => `<span class="role" style="background:${KIND[k] || "#475569"}">${esc(k).toUpperCase()}</span>`;
const isoToday = () => new Date().toISOString().slice(0, 10);

// Split training rows into delivered / scheduled against the build date, so the
// weekly rebuild moves a session into "Delivered" once its date has passed.
export function splitTraining(d, today = isoToday()) {
  const rows = ((d.training && d.training.delivered) || []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const done = rows.filter(r => String(r.date) <= today).reverse();   // newest first
  const next = rows.filter(r => String(r.date) > today);              // soonest first
  const orgs = new Set(done.map(r => r.client.replace(/,? via .*$/i, "").trim()));
  const days = done.reduce((t, r) => t + (Number(r.days) || 0), 0);
  const sectors = new Set(done.map(r => r.sector));
  const listed = done.reduce((t, r) => t + (Number(r.participants) || 0), 0);
  return { done, next, orgCount: orgs.size, days: Math.round(days), sectorCount: sectors.size, listed };
}

export function renderBody(d, opts = {}) {
  const profile = PROFILES[opts.profile] ? opts.profile : "academic";
  const isInd = profile === "industry";
  const ind = d.industry || {};
  const m = d.meta;
  const maxGrant = Math.max(...d.grants.map(g => g.amount || 0));
  const tr = splitTraining(d, opts.today);
  const trYear = (tr.done[0] && String(tr.done[0].date).slice(0, 4)) || "";

  // Section numbers are assigned in render order, so either profile can add,
  // drop or reorder sections without renumbering by hand.
  let n = 0;
  const H = (title, note = "") => sectionHead(String(++n).padStart(2, "0"), title, note);

  // Headline counts are DERIVED from the lists printed further down, never taken
  // from hand-maintained numbers in cv.yml — that is how the CV came to claim 113
  // publications while listing 106 of them, and while the site computed 114 from
  // content/publications. Anything typed in two places drifts; this can't.
  const pubTotal = (d.journals || []).length + (d.conferences || []).length + (d.bookChapters || []).length;
  const q1 = (d.journals || []).filter(j => j.q === "Q1").length;
  const q2 = (d.journals || []).filter(j => j.q === "Q2").length;
  const statList = (d.stats || []).map(s => {
    if (/^publications$/i.test(s.label)) return { ...s, value: String(pubTotal) };
    if (/q1\s*\/\s*q2/i.test(s.label)) return { ...s, value: `${q1} / ${q2}` };
    return s;
  });
  const statOf = (re) => (statList.find(s => re.test(s.label)) || {}).value || "";
  const devCount = ((d.training && d.training.development) || []).length;
  const indStats = [
    { value: String(tr.done.length), label: `Sessions delivered ${trYear}`, accent: "teal" },
    { value: String(tr.orgCount), label: "Host organisations", accent: "blue" },
    { value: `${tr.days}+`, label: "Training days", accent: "indigo" },
    { value: String(tr.sectorCount), label: "Sectors served", accent: "amber" },
    { value: String(d.ip.length), label: "Registered AI modules", accent: "purple" },
    { value: String(devCount), label: "Courses completed 2025–26", accent: "blue2" },
    { value: String(pubTotal), label: "Publications", accent: "slate" },
    { value: statOf(/funding/i), label: "Research funding", accent: "rose" },
  ];

  const contacts = m.contacts.map(c => `<span class="chip"><b>${esc(c.label)}</b> ${esc(c.value)}</span>`).join("");
  const stats = (isInd ? indStats : statList).map(s => `<div class="stat" style="background:${ACCENTS[s.accent]}"><div class="stat-v">${esc(s.value)}</div><div class="stat-l">${esc(s.label)}</div></div>`).join("");
  const cards = (list) => list.map(f => `<div class="focus" style="--fc:${ACCENTS[f.accent]}"><div class="focus-t">${esc(f.title)}</div><div class="focus-x">${esc(f.text)}</div></div>`).join("");
  const papers = d.selectedPapers.map(g => `<div class="pg"><div class="pg-label" style="background:${ACCENTS[g.accent]}">${esc(g.group)}</div>${g.items.map(it => `<div class="paper"><span class="mark">${MARK[it.marker] || ""}</span>${qBadge(it.quartile)}<span class="cite">${esc(it.cite)}</span></div>`).join("")}</div>`).join("");

  const eduBlock = () => `<div class="col">${H("Education")}${d.education.map(e => `<div class="tl"><div class="tl-h"><b>${esc(e.period)}</b> · ${esc(e.degree)}</div><div class="tl-s">${esc(e.place)}</div><div class="tl-d">${esc(e.detail)}</div></div>`).join("")}</div>`;
  const empBlock = () => `<div class="col">${H("Employment")}${d.employment.map(e => `<div class="tl"><div class="tl-h"><b>${esc(e.period)}</b> · ${esc(e.role)}</div><div class="tl-s">${esc(e.place)}</div></div>`).join("")}</div>`;

  const grantCard = (g) => {
    const w = g.amount ? Math.max(6, Math.round((g.amount / maxGrant) * 100)) : 0;
    const barColor = { "PI": "#15803d", "Co-PI": "#c2740c", "Co-I": "#475569", "Member": "#64748b" }[g.role] || "#475569";
    const val = g.amount ? `RM ${g.amount.toLocaleString("en-US")}` : `<span class="grant-note">${esc(g.note || "")}</span>`;
    return `<div class="grant"><div class="grant-top">${roleBadge(g.role)}<span class="grant-title">${esc(g.title)}</span></div><div class="grant-meta">${esc(g.period)} · ${esc(g.funder)}</div><div class="grant-bar"><div class="grant-fill" style="width:${w}%;background:${barColor}"></div></div><div class="grant-amt" style="color:${barColor}">${val}</div></div>`;
  };
  const grants = d.grants.map(grantCard).join("");

  const ip = d.ip.map(x => `<div class="ip"><span class="ip-t">${esc(x.title)}</span> · ${esc(x.place)} (${esc(x.year)})</div>`).join("");
  const journals = d.journals.map((j, i) => `<div class="ref-item"><span class="num">${i + 1}.</span> ${qBadge(j.q)}<span class="cite">${esc(j.cite)}</span></div>`).join("");
  const confs = d.conferences.map((c, i) => `<div class="ref-item"><span class="num">${i + 1}.</span> <span class="cite">${esc(c)}</span></div>`).join("");
  const chapters = d.bookChapters.map((c, i) => `<div class="ref-item"><span class="num">${i + 1}.</span> <span class="cite">${esc(c)}</span></div>`).join("");

  const supItem = (s) => `<div class="sup">${roleBadge(s.role)}<span class="sup-n">${esc(s.name)}</span> <span class="sup-y">(${esc(s.year)})</span> <span class="sup-t">— ${esc(s.topic)}</span>${s.now ? ` <span class="sup-now">${esc(s.now)}</span>` : ""}</div>`;
  const awards = d.awards.map(a => `<li>${esc(a)}</li>`).join("");
  const teaching = d.teaching.map(t => `<div class="teach"><span class="when">${esc(t.when)}</span> ${esc(t.text)}</div>`).join("");
  const skills = Object.entries(d.skills).map(([k, v]) => `<div class="skill"><div class="skill-k">${esc(k)}</div><div class="skill-c">${v.split("·").map(x => `<span class="tag">${esc(x.trim())}</span>`).join("")}</div></div>`).join("");
  const membership = d.membership.map(x => `<li>${esc(x)}</li>`).join("");
  const service = d.service.map(x => `<li>${esc(x)}</li>`).join("");
  const refs = d.references.map(r => `<div class="refcard"><div class="refcard-n">${esc(r.name)}</div><div class="refcard-r">${esc(r.role)}, ${esc(r.affil)}</div><div class="refcard-e">✉ ${esc(r.email)}</div></div>`).join("");

  // --- training blocks --------------------------------------------------------
  const appointments = ((d.training && d.training.appointments) || []).map(x => `<li>${esc(x)}</li>`).join("");
  const dev = ((d.training && d.training.development) || []).map(x =>
    `<div class="dev"><span class="when">${esc(x.year)}</span> <span class="dev-t">${esc(x.title)}</span> <span class="dev-p">— ${esc(x.provider)}${x.note ? ` · ${esc(x.note)}` : ""}</span></div>`).join("");
  // Full rows (industry): date · kind · title / client · audience
  const trRow = (r) => `<div class="tr"><div class="tr-when">${esc(r.when)}</div><div class="tr-body"><div class="tr-top">${kindBadge(r.kind)}<span class="tr-t">${esc(r.title)}</span></div><div class="tr-meta">${esc(r.client)}${r.audience ? ` · ${esc(r.audience)}` : ""}${r.participants ? ` · ${r.participants} participants` : ""}${r.rating ? ` · rated ${esc(r.rating)}` : ""}</div></div></div>`;
  // Compact rows (academic): one line each, two columns
  const trLine = (r) => `<div class="ref-item"><span class="num">${esc(r.when)}</span> <span class="cite"><b>${esc(r.title)}</b> — ${esc(r.client)}.</span></div>`;
  const sectorLine = Object.entries(tr.done.reduce((a, r) => (a[r.sector] = (a[r.sector] || 0) + 1, a), {}))
    .sort((a, b) => b[1] - a[1]).map(([k, v]) => `${SECTOR[k] || k} ${v}`).join(" · ");
  const trNote = `${tr.done.length} sessions · ${tr.orgCount} organisations · ${trYear}`;

  const hero = `<header class="hero">
    ${m.photo ? `<img class="mono-photo" src="${m.photo}" alt="">` : `<div class="mono">${esc(m.monogram)}</div>`}
    <div class="hero-body">
      <div class="name">${esc(m.name)}, <span class="cred">${esc(m.credential)}</span></div>
      <div class="subtitle">${esc(isInd ? (ind.title || m.title) : m.title)} · ${esc(isInd ? (ind.subtitle || m.subtitle) : m.subtitle)}</div>
      <div class="affil">${esc(m.affiliation)}</div>
      <div class="chips">${contacts}</div>
    </div>
  </header>`;

  if (isInd) {
    const piGrants = d.grants.filter(g => g.role === "PI").map(grantCard).join("");
    const scheduled = tr.next.length ? `<div class="subhead">Scheduled — confirmed engagements</div><div class="tr-list">${tr.next.map(trRow).join("")}</div>` : "";
    return `<main class="cv cv-ind">
  ${hero}
  <div class="stats">${stats}</div>
  ${H("Professional Profile")}
  <p class="profile">${esc(ind.profile || d.profile)}</p>
  ${H("Training Expertise")}
  <div class="focus-grid">${cards((d.training && d.training.expertise) || [])}</div>
  ${H("Training & Workshops Delivered", trNote)}
  <div class="legend">By sector: ${esc(sectorLine)}. Newest first; participant counts shown where an attendance list exists.</div>
  <div class="tr-list">${tr.done.map(trRow).join("")}</div>
  ${scheduled}
  ${H("Registered AI Training Modules", `${d.ip.length} copyrights · UKM`)}
  <div class="ip-grid">${ip}</div>
  <div class="twocol keep">
    <div class="col">${H("Appointments")}<ul class="bul">${appointments}</ul></div>
    <div class="col">${H("Awards & Recognition", String(d.awards.length))}<ul class="bul">${awards}</ul></div>
  </div>
  ${H("Professional Development & Certification", "2025–2026")}
  <div class="dev-list">${dev}</div>
  <div class="twocol keep">${eduBlock()}${empBlock()}</div>
  ${H("Research Credentials", `${pubTotal} publications · h-index ${statOf(/h-index/i)} · full record in the Academic CV`)}
  <div class="legend">Grants led as principal investigator. Complete publication list, supervision and service: akmal.app/cv</div>
  <div class="grant-grid">${piGrants}</div>
  ${H("Technical Skills")}
  <div class="skills">${skills}</div>
  <div class="twocol keep">
    <div class="col">${H("Membership & Certification")}<ul class="bul">${membership}</ul></div>
    <div class="col">${H("Professional Service")}<ul class="bul">${service}</ul></div>
  </div>
  ${H("References")}
  <div class="ref-grid">${refs}</div>
</main>`;
  }

  return `<main class="cv">
  ${hero}
  <div class="stats">${stats}</div>
  ${H("Professional Profile")}
  <p class="profile">${esc(d.profile)}</p>
  ${H("Research Focus")}
  <div class="focus-grid">${cards(d.researchFocus)}</div>
  ${H("Selected Papers", "representative work · first / corresponding author")}
  <div class="legend">&lowast; first author · &dagger; corresponding / senior author · &sect; sole author · Scopus quartile shown where applicable.</div>
  ${papers}
  <div class="twocol keep">${eduBlock()}${empBlock()}</div>
  ${H("Signature Research Grants", "10 grants · RM 575,300 as PI · RM 1.51M cumulative")}
  <div class="grant-grid">${grants}</div>
  ${H("Developed AI Modules & IP", `${d.ip.length} copyrights`)}
  <div class="ip-grid">${ip}</div>
  ${H("Journal Articles", "70 peer-reviewed · 2013–2025")}
  <div class="reflist">${journals}</div>
  ${H("Conference Proceedings", "33 papers")}
  <div class="reflist">${confs}</div>
  ${H("Book Chapters", "3")}
  <div class="reflist">${chapters}</div>
  ${H("Postgraduate Supervision", "14 total · 7 as main supervisor")}
  <div class="subhead">Ongoing — 12 researchers</div>
  <div class="sup-grid">${d.supervision.ongoing.map(supItem).join("")}</div>
  <div class="subhead">Graduated</div>
  <div class="sup-grid">${d.supervision.graduated.map(supItem).join("")}</div>
  ${H("Invited Talks, Workshops & Training Delivered", trNote)}
  <div class="reflist">${tr.done.map(trLine).join("")}</div>
  <div class="twocol keep">
    <div class="col">${H("Awards & Honours", String(d.awards.length))}<ul class="bul">${awards}</ul></div>
    <div class="col">${H("Teaching", "FTSM, UKM")}${teaching}</div>
  </div>
  ${H("Professional Development", "2025–2026")}
  <div class="dev-list">${dev}</div>
  ${H("Technical Skills")}
  <div class="skills">${skills}</div>
  <div class="twocol keep">
    <div class="col">${H("Membership, Appointments & Certification")}<ul class="bul">${membership}${appointments}</ul></div>
    <div class="col">${H("Editorial & Professional Service")}<ul class="bul">${service}</ul></div>
  </div>
  ${H("References")}
  <div class="ref-grid">${refs}</div>
</main>`;
}

// ---------------------------------------------------------------------------
//  renderDoc(data) → a full standalone HTML document (used for the PDF)
// ---------------------------------------------------------------------------
export function renderDoc(d, opts = {}) {
  const p = PROFILES[opts.profile] || PROFILES.academic;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${esc(d.meta.name)} — ${esc(p.footer)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${CV_CSS}</style></head><body>${renderBody(d, opts)}</body></html>`;
}

// ---------------------------------------------------------------------------
//  Scope every rule under a root id so importing this on the site can never
//  leak styles into the rest of the portfolio.
// ---------------------------------------------------------------------------
function scopeCss(css, root) {
  const globals = [];
  // Drop @import entirely — the /cv page loads Inter via a <link> instead.
  // (Matching the full url(...) avoids truncating on the ';' inside the font URL.)
  css = css.replace(/@import\s+url\([^)]*\)[^;]*;/g, () => "");
  css = css.replace(/@page\s*\{[^}]*\}/g, (mm) => { globals.push(mm); return ""; });
  const scoped = css.replace(/([^{}]+)\{([^}]*)\}/g, (_full, sel, body) => {
    const s = sel.split(",").map((p) => {
      p = p.trim();
      if (!p) return p;
      if (p === "body" || p === "html" || p === ":root") return root;
      return root + " " + p;
    }).join(", ");
    return s + "{" + body + "}";
  });
  return globals.join("\n") + "\n" + scoped;
}

export const CV_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
:root{--navy:#1b2a5c;--ink:#26303f;--muted:#6b7280;--gold:#d8a72a;--line:#e5e7eb;}
*{box-sizing:border-box;margin:0;padding:0;}
@page{size:A4;margin:11mm 12mm 12mm;}
body{font-family:'Inter',-apple-system,'Segoe UI',Arial,sans-serif;color:var(--ink);font-size:9.2pt;line-height:1.42;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.cv{max-width:186mm;margin:0 auto;}
b{font-weight:700;}
.hero{display:flex;gap:16px;align-items:center;border-radius:14px;padding:16px 20px;color:#fff;background:linear-gradient(120deg,#1e3a8a 0%,#3730a3 46%,#6d28d9 100%);}
.mono-photo{flex:0 0 auto;width:60px;height:60px;border-radius:50%;object-fit:cover;background:#fff;border:2px solid rgba(255,255,255,.55);}
.mono{flex:0 0 auto;width:60px;height:60px;border-radius:50%;background:#eab308;color:#1b2a5c;font-weight:800;font-size:15pt;display:flex;align-items:center;justify-content:center;letter-spacing:.5px;}
.name{font-size:22pt;font-weight:800;line-height:1.05;letter-spacing:-.3px;}
.cred{color:#fbbf24;}
.subtitle{font-size:10.5pt;font-weight:500;margin-top:2px;color:#e5e7ff;}
.affil{font-size:8pt;opacity:.85;margin-top:3px;}
.chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px;}
.chip{background:rgba(255,255,255,.13);border-radius:20px;padding:2.5px 9px;font-size:7pt;white-space:nowrap;}
.chip b{color:#fbbf24;font-weight:700;}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:11px 0 4px;}
.stat{border-radius:9px;padding:9px 11px;color:#fff;}
.stat-v{font-size:16pt;font-weight:800;line-height:1;}
.stat-l{font-size:6.8pt;font-weight:600;text-transform:uppercase;letter-spacing:.6px;margin-top:3px;opacity:.95;}
.sec-head{display:flex;justify-content:space-between;align-items:flex-end;margin-top:15px;}
.sec-head-l{display:flex;align-items:center;gap:8px;}
.sec-num{background:var(--navy);color:#fff;font-weight:700;font-size:8pt;border-radius:5px;padding:2px 7px;}
.sec-title{color:var(--navy);font-weight:800;font-size:12pt;letter-spacing:-.2px;}
.sec-note{color:var(--muted);font-size:7.6pt;font-style:italic;}
.rule{height:2px;background:linear-gradient(90deg,var(--gold) 0%,var(--gold) 30%,var(--line) 30%);margin:3px 0 8px;}
.profile{font-size:9pt;text-align:justify;color:#374151;}
.focus-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;}
.focus{border-radius:10px;padding:11px 12px;color:#fff;background:var(--fc);background:linear-gradient(150deg,var(--fc),color-mix(in srgb,var(--fc) 78%,#000));}
.focus-t{font-weight:800;font-size:10pt;margin-bottom:4px;}
.focus-x{font-size:7.6pt;line-height:1.4;opacity:.96;}
.legend{font-size:7.2pt;color:var(--muted);margin-bottom:6px;}
.pg{margin-bottom:7px;}
.pg-label{display:inline-block;color:#fff;font-weight:700;font-size:7.8pt;border-radius:5px;padding:2px 8px;margin-bottom:4px;}
.paper{font-size:8.2pt;margin:2.5px 0 2.5px 2px;padding-left:2px;line-height:1.38;}
.mark{color:#15803d;font-weight:800;margin-right:3px;}
.cite{color:#374151;}
.q{display:inline-block;color:#fff;font-size:6.2pt;font-weight:700;border-radius:3px;padding:1px 4px;margin-right:4px;vertical-align:1px;text-indent:0;}
.twocol{display:grid;grid-template-columns:1fr 1fr;gap:22px;}
.col{min-width:0;}
.keep{break-inside:avoid;}
.tl{position:relative;padding-left:12px;margin:6px 0;}
.tl::before{content:"";position:absolute;left:0;top:4px;width:6px;height:6px;border-radius:50%;background:var(--gold);}
.tl-h{font-size:8.6pt;color:var(--navy);}
.tl-s{font-size:8pt;color:#4b5563;}
.tl-d{font-size:7.6pt;color:var(--muted);}
.grant-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px 22px;}
.grant{break-inside:avoid;}
.grant-top{display:flex;gap:6px;align-items:baseline;}
.grant-title{font-weight:700;font-size:8.6pt;color:var(--navy);line-height:1.25;}
.grant-meta{font-size:7.4pt;color:var(--muted);margin:2px 0 3px;}
.grant-bar{height:5px;background:#eef1f5;border-radius:4px;overflow:hidden;}
.grant-fill{height:100%;border-radius:4px;}
.grant-amt{font-size:8.4pt;font-weight:800;margin-top:2px;}
.grant-note{color:#15803d;font-weight:700;}
.role{display:inline-block;color:#fff;font-size:6.2pt;font-weight:700;letter-spacing:.4px;border-radius:3px;padding:1.5px 5px;white-space:nowrap;}
.ip-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;}
.ip{background:#fbf7ec;border-left:3px solid var(--gold);border-radius:4px;padding:6px 9px;font-size:8pt;color:#4b5563;}
.ip-t{font-weight:700;color:var(--navy);}
.reflist{column-count:2;column-gap:20px;}
.ref-item{break-inside:avoid;font-size:7.4pt;line-height:1.34;margin-bottom:4px;color:#374151;padding-left:14px;text-indent:-14px;}
.num{color:var(--navy);font-weight:700;}
.subhead{font-weight:700;font-size:8.6pt;color:#334155;margin:8px 0 4px;}
.sup-grid{column-count:2;column-gap:20px;}
.sup{break-inside:avoid;font-size:7.6pt;line-height:1.35;margin-bottom:5px;color:#4b5563;}
.sup-n{font-weight:700;color:var(--navy);}
.sup-y{color:var(--muted);}
.sup-now{color:#15803d;font-style:italic;}
.bul{list-style:none;}
.bul li{font-size:8.2pt;padding-left:11px;position:relative;margin:3px 0;color:#374151;}
.bul li::before{content:"";position:absolute;left:0;top:5px;width:5px;height:5px;border-radius:50%;background:var(--gold);}
.teach{font-size:8.2pt;margin:3px 0;color:#374151;}
.when{display:inline-block;background:#eef2ff;color:var(--navy);font-weight:700;font-size:6.8pt;border-radius:3px;padding:1px 5px;margin-right:4px;}
.skills{display:flex;flex-direction:column;gap:6px;}
.skill{display:flex;gap:10px;align-items:flex-start;}
.skill-k{flex:0 0 74px;font-weight:700;font-size:7.6pt;color:var(--navy);text-transform:uppercase;letter-spacing:.4px;padding-top:2px;}
.skill-c{display:flex;flex-wrap:wrap;gap:4px;}
.tag{background:#f1f5f9;border:1px solid #e2e8f0;border-radius:20px;padding:1.5px 8px;font-size:7.4pt;color:#334155;}
.dev-list{column-count:2;column-gap:20px;}
.dev{break-inside:avoid;font-size:7.6pt;line-height:1.36;margin-bottom:4px;color:#374151;}
.dev-t{font-weight:700;color:var(--navy);}
.dev-p{color:var(--muted);}
.tr-list{column-count:2;column-gap:18px;}
.tr{display:flex;gap:8px;break-inside:avoid;border-left:2px solid var(--line);padding-left:7px;margin-bottom:6px;}
.tr-when{flex:0 0 58px;font-size:7pt;font-weight:700;color:var(--navy);line-height:1.3;padding-top:1px;}
.tr-body{min-width:0;}
.tr-top{display:flex;gap:5px;align-items:baseline;}
.tr-t{font-weight:700;font-size:7.9pt;color:#1f2937;line-height:1.28;}
.tr-meta{font-size:7pt;color:var(--muted);line-height:1.32;margin-top:1px;}
.ref-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.refcard{background:#f8fafc;border-left:3px solid var(--navy);border-radius:5px;padding:9px 12px;}
.refcard-n{font-weight:800;color:var(--navy);font-size:9pt;}
.refcard-r{font-size:7.6pt;color:#4b5563;margin:2px 0;}
.refcard-e{font-size:7.6pt;color:var(--muted);}
`;

// Scoped variant for the on-site /cv route (every selector under #cv-root).
// Screen-only responsive rules for the on-site /cv route.
//
// Deliberately kept OUT of CV_CSS and appended AFTER scopeCss(): CV_CSS is the
// A4 print stylesheet that renderDoc() feeds to Puppeteer, so anything added
// there would change the PDF. scopeCss()'s selector regex also cannot handle
// nested at-rules, hence the hand-written #cv-root prefixes below.
//
// The CV is a print document — multi-column grids, pt units, justified text —
// which overflows a phone viewport. These rules collapse it to a single column
// without touching the PDF.
const CV_SCREEN_CSS = `
#cv-root{padding:34px 40px;}
@media (max-width:780px){
  #cv-root{padding:20px 16px;font-size:9.8pt;}
  #cv-root .cv{max-width:100%;}
  #cv-root .hero{flex-direction:column;align-items:flex-start;gap:12px;padding:14px 16px;}
  #cv-root .name{font-size:18pt;}
  #cv-root .subtitle{font-size:9.6pt;}
  #cv-root .stats{grid-template-columns:repeat(2,1fr);}
  #cv-root .focus-grid{grid-template-columns:1fr;}
  #cv-root .twocol,
  #cv-root .grant-grid,
  #cv-root .ip-grid,
  #cv-root .ref-grid{grid-template-columns:1fr;gap:10px;}
  #cv-root .reflist,
  #cv-root .dev-list,
  #cv-root .sup-grid{column-count:1;}
  #cv-root .tr-list{column-count:1;}
  #cv-root .profile{text-align:left;}
  #cv-root .skill{flex-direction:column;gap:3px;}
  #cv-root .skill-k{flex:0 0 auto;}
  #cv-root .sec-head{flex-direction:column;align-items:flex-start;gap:2px;}
}
@media (max-width:420px){
  #cv-root .stats{grid-template-columns:1fr;}
  #cv-root .mono{width:52px;height:52px;font-size:13pt;}
}
`;

export const CV_CSS_SCOPED = scopeCss(CV_CSS, "#cv-root") + CV_SCREEN_CSS;
