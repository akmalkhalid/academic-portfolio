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
import PageBanner from "@/components/PageBanner";

export const metadata = {
  title: "Curriculum Vitae — Mohd Nor Akmal Khalid",
  description:
    "Full academic CV of Dr. Mohd Nor Akmal Khalid — Computational Intelligence for games and engagement modelling. Always current; download as PDF.",
};

export default function CVPage() {
  const data = loadCV();
  const body = renderBody(data);

  return (
    <>
      <PageBanner
        eyebrow="/ curriculum vitae"
        title="Curriculum Vitae"
        kicker="Dr. Mohd Nor Akmal Khalid · Senior Lecturer, FTSM, Universiti Kebangsaan Malaysia"
        lede="The full academic record — appointments, grants, publications, supervision and service. This page and the PDF are generated from one source file, so they can never drift apart."
      >
        <a href="/cv/Akmal_CV_2026.pdf" className="btn-lume" download>
          Download PDF <span aria-hidden="true">↓</span>
        </a>
        <a href="/publications" className="btn-ghost">Browse publications</a>
      </PageBanner>

    <div style={{ background: "#f4f5f7", minHeight: "100vh", padding: "34px 12px 64px" }}>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
      />
      <style dangerouslySetInnerHTML={{ __html: CV_CSS_SCOPED }} />

      <div style={{ maxWidth: 900, margin: "0 auto 16px", fontSize: 13, color: "#6b7280", textAlign: "center" }}>
        Auto-generated from the same data as the downloadable PDF — always current.
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
    </>
  );
}
