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
//  renderBody(data) → the inner <main class="cv"> … </main>
// ---------------------------------------------------------------------------
export function renderBody(d) {
  const m = d.meta;
  const maxGrant = Math.max(...d.grants.map(g => g.amount || 0));

  const contacts = m.contacts.map(c => `<span class="chip"><b>${esc(c.label)}</b> ${esc(c.value)}</span>`).join("");
  const stats = d.stats.map(s => `<div class="stat" style="background:${ACCENTS[s.accent]}"><div class="stat-v">${esc(s.value)}</div><div class="stat-l">${esc(s.label)}</div></div>`).join("");
  const focus = d.researchFocus.map(f => `<div class="focus" style="--fc:${ACCENTS[f.accent]}"><div class="focus-t">${esc(f.title)}</div><div class="focus-x">${esc(f.text)}</div></div>`).join("");
  const papers = d.selectedPapers.map(g => `<div class="pg"><div class="pg-label" style="background:${ACCENTS[g.accent]}">${esc(g.group)}</div>${g.items.map(it => `<div class="paper"><span class="mark">${MARK[it.marker] || ""}</span>${qBadge(it.quartile)}<span class="cite">${esc(it.cite)}</span></div>`).join("")}</div>`).join("");

  const eduBlock = `<div class="col">${sectionHead("04", "Education")}${d.education.map(e => `<div class="tl"><div class="tl-h"><b>${esc(e.period)}</b> · ${esc(e.degree)}</div><div class="tl-s">${esc(e.place)}</div><div class="tl-d">${esc(e.detail)}</div></div>`).join("")}</div>`;
  const empBlock = `<div class="col">${sectionHead("05", "Employment")}${d.employment.map(e => `<div class="tl"><div class="tl-h"><b>${esc(e.period)}</b> · ${esc(e.role)}</div><div class="tl-s">${esc(e.place)}</div></div>`).join("")}</div>`;

  const grants = d.grants.map(g => {
    const w = g.amount ? Math.max(6, Math.round((g.amount / maxGrant) * 100)) : 0;
    const barColor = { "PI": "#15803d", "Co-PI": "#c2740c", "Co-I": "#475569", "Member": "#64748b" }[g.role] || "#475569";
    const val = g.amount ? `RM ${g.amount.toLocaleString("en-US")}` : `<span class="grant-note">${esc(g.note || "")}</span>`;
    return `<div class="grant"><div class="grant-top">${roleBadge(g.role)}<span class="grant-title">${esc(g.title)}</span></div><div class="grant-meta">${esc(g.period)} · ${esc(g.funder)}</div><div class="grant-bar"><div class="grant-fill" style="width:${w}%;background:${barColor}"></div></div><div class="grant-amt" style="color:${barColor}">${val}</div></div>`;
  }).join("");

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

  return `<main class="cv">
  <header class="hero">
    <div class="mono">${esc(m.monogram)}</div>
    <div class="hero-body">
      <div class="name">${esc(m.name)}, <span class="cred">${esc(m.credential)}</span></div>
      <div class="subtitle">${esc(m.title)} · ${esc(m.subtitle)}</div>
      <div class="affil">${esc(m.affiliation)}</div>
      <div class="chips">${contacts}</div>
    </div>
  </header>
  <div class="stats">${stats}</div>
  ${sectionHead("01", "Professional Profile")}
  <p class="profile">${esc(d.profile)}</p>
  ${sectionHead("02", "Research Focus")}
  <div class="focus-grid">${focus}</div>
  ${sectionHead("03", "Selected Papers", "representative work · first / corresponding author")}
  <div class="legend">&lowast; first author · &dagger; corresponding / senior author · &sect; sole author · Scopus quartile shown where applicable.</div>
  ${papers}
  <div class="twocol keep">${eduBlock}${empBlock}</div>
  ${sectionHead("06", "Signature Research Grants", "10 grants · RM 575,300 as PI · RM 1.51M cumulative")}
  <div class="grant-grid">${grants}</div>
  ${sectionHead("07", "Developed AI Modules & IP", "5 copyrights")}
  <div class="ip-grid">${ip}</div>
  ${sectionHead("08", "Journal Articles", "70 peer-reviewed · 2013–2025")}
  <div class="reflist">${journals}</div>
  ${sectionHead("09", "Conference Proceedings", "33 papers")}
  <div class="reflist">${confs}</div>
  ${sectionHead("10", "Book Chapters", "3")}
  <div class="reflist">${chapters}</div>
  ${sectionHead("11", "Postgraduate Supervision", "14 total · 7 as main supervisor")}
  <div class="subhead">Ongoing — 12 researchers</div>
  <div class="sup-grid">${d.supervision.ongoing.map(supItem).join("")}</div>
  <div class="subhead">Graduated</div>
  <div class="sup-grid">${d.supervision.graduated.map(supItem).join("")}</div>
  <div class="twocol keep">
    <div class="col">${sectionHead("12", "Awards & Honours", "5")}<ul class="bul">${awards}</ul></div>
    <div class="col">${sectionHead("13", "Teaching", "FTSM, UKM")}${teaching}</div>
  </div>
  ${sectionHead("14", "Technical Skills")}
  <div class="skills">${skills}</div>
  <div class="twocol keep">
    <div class="col">${sectionHead("15", "Membership & Certification")}<ul class="bul">${membership}</ul></div>
    <div class="col">${sectionHead("16", "Editorial & Professional Service")}<ul class="bul">${service}</ul></div>
  </div>
  ${sectionHead("17", "References")}
  <div class="ref-grid">${refs}</div>
</main>`;
}

// ---------------------------------------------------------------------------
//  renderDoc(data) → a full standalone HTML document (used for the PDF)
// ---------------------------------------------------------------------------
export function renderDoc(d) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${esc(d.meta.name)} — Curriculum Vitae</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${CV_CSS}</style></head><body>${renderBody(d)}</body></html>`;
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
.q{display:inline-block;color:#fff;font-size:6.2pt;font-weight:700;border-radius:3px;padding:1px 4px;margin-right:4px;vertical-align:1px;}
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
.ref-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.refcard{background:#f8fafc;border-left:3px solid var(--navy);border-radius:5px;padding:9px 12px;}
.refcard-n{font-weight:800;color:var(--navy);font-size:9pt;}
.refcard-r{font-size:7.6pt;color:#4b5563;margin:2px 0;}
.refcard-e{font-size:7.6pt;color:var(--muted);}
`;

// Scoped variant for the on-site /cv route (every selector under #cv-root).
export const CV_CSS_SCOPED = scopeCss(CV_CSS, "#cv-root");
