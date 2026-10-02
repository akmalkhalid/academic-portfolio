// Shared renderer for the on-site living CV. /cv (academic) and /cv/industry
// (trainer-first) both render the SAME template as their downloadable PDFs,
// from the SAME data (content/cv.yml). Server component: the YAML is read at
// build time, so both pages are fully static (works with `output: 'export'`).
//
// Styles are scoped under #cv-root (CV_CSS_SCOPED) so nothing leaks into the
// rest of the site.

// @ts-ignore — plain JS helpers, no type decls needed
import { loadCV } from "../lib/cv-data.js";
// @ts-ignore
import { renderBody, CV_CSS_SCOPED, PROFILES } from "../lib/cv-template.js";
import PageBanner from "@/components/PageBanner";

type Profile = "academic" | "industry";

const COPY: Record<Profile, { lede: string; note: string }> = {
  academic: {
    lede: "The full academic record — appointments, grants, publications, supervision, training delivered and service. This page and the PDF are generated from one source file, so they can never drift apart.",
    note: "Academic CV — the complete scholarly record.",
  },
  industry: {
    lede: "Trainer-first profile for organisations — the AI training and workshops delivered, what I teach, certifications, and a compact research record. Same source file as the academic CV.",
    note: "Industry CV — trainer-first, for organisations commissioning AI training or consultancy.",
  },
};

export default function CVView({ profile }: { profile: Profile }) {
  const data = loadCV();
  const body = renderBody(data, { profile });
  const other: Profile = profile === "academic" ? "industry" : "academic";
  const tab = (p: Profile, href: string, label: string) => (
    <a
      href={href}
      aria-current={p === profile ? "page" : undefined}
      style={{
        padding: "8px 16px", borderRadius: 999, fontSize: 14, fontWeight: 600, textDecoration: "none",
        background: p === profile ? "#1b2a5c" : "transparent",
        color: p === profile ? "#fff" : "#1b2a5c",
      }}
    >
      {label}
    </a>
  );

  return (
    <>
      <PageBanner
        eyebrow="/ curriculum vitae"
        title="Curriculum Vitae"
        kicker="Dr. Mohd Nor Akmal Khalid · Senior Lecturer, FTSM, Universiti Kebangsaan Malaysia"
        lede={COPY[profile].lede}
      >
        <a href={`/cv/${PROFILES[profile].pdf}`} className="btn-lume" download>
          Download {profile === "academic" ? "Academic" : "Industry"} CV <span aria-hidden="true">↓</span>
        </a>
        <a href={`/cv/${PROFILES[other].pdf}`} className="btn-ghost" download>
          {other === "academic" ? "Academic" : "Industry (trainer)"} PDF <span aria-hidden="true">↓</span>
        </a>
      </PageBanner>

      <div style={{ background: "#f4f5f7", minHeight: "100vh", padding: "28px 12px 64px" }}>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        />
        <style dangerouslySetInnerHTML={{ __html: CV_CSS_SCOPED }} />

        <nav
          aria-label="CV version"
          style={{
            display: "flex", gap: 4, width: "fit-content", margin: "0 auto 12px", padding: 4,
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 999,
          }}
        >
          {tab("academic", "/cv/", "Academic")}
          {tab("industry", "/cv/industry/", "Industry · Trainer")}
        </nav>

        <div style={{ maxWidth: 900, margin: "0 auto 16px", fontSize: 13, color: "#6b7280", textAlign: "center" }}>
          {COPY[profile].note} Auto-generated from the same data as the PDF — always current.
        </div>

        <div
          id="cv-root"
          style={{
            maxWidth: 900, margin: "0 auto", background: "#fff",
            boxShadow: "0 8px 30px rgba(0,0,0,.10)", borderRadius: 10,
            // padding lives in CV_SCREEN_CSS so it can shrink on phones
          }}
          dangerouslySetInnerHTML={{ __html: body }}
        />
      </div>
    </>
  );
}
