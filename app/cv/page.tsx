// On-site living CV at /cv — renders the SAME template as the downloadable PDF,
// from the SAME data (content/cv.yml). A server component, so the file is read at
// build time and the page is fully static (works with `output: 'export'`).
//
// Styles are scoped under #cv-root (CV_CSS_SCOPED) so nothing leaks into the
// rest of your site. A "Download PDF" button links to the build-time PDF.

// @ts-ignore — plain JS helpers, no type decls needed
import { loadCV } from "../../lib/cv-data.js";
// @ts-ignore
import { renderBody, CV_CSS_SCOPED } from "../../lib/cv-template.js";

export const metadata = {
  title: "Curriculum Vitae — Mohd Nor Akmal Khalid",
  description:
    "Full academic CV of Dr. Mohd Nor Akmal Khalid — Computational Intelligence for games and engagement modelling. Always current; download as PDF.",
};

export default function CVPage() {
  const data = loadCV();
  const body = renderBody(data);

  return (
    <div style={{ background: "#f4f5f7", minHeight: "100vh", padding: "24px 12px 64px" }}>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
      />
      <style dangerouslySetInnerHTML={{ __html: CV_CSS_SCOPED }} />

      <div style={{ maxWidth: 900, margin: "0 auto 16px", display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center" }}>
        <span style={{ marginRight: "auto", fontSize: 13, color: "#6b7280" }}>
          Auto-generated from this page — always current.
        </span>
        <a
          href="/cv/Akmal_CV_2026.pdf"
          className="cv-download-btn"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#1b2a5c", color: "#fff", fontWeight: 600, fontSize: 14,
            padding: "9px 16px", borderRadius: 8, textDecoration: "none",
          }}
        >
          ↓ Download PDF
        </a>
      </div>

      <div
        id="cv-root"
        style={{
          maxWidth: 900, margin: "0 auto", background: "#fff",
          boxShadow: "0 8px 30px rgba(0,0,0,.10)", borderRadius: 10,
          padding: "34px 40px",
        }}
        dangerouslySetInnerHTML={{ __html: body }}
      />
    </div>
  );
}
