// /cv — the CV engine: one page that builds every version of the CV.
//
// The three CVs that used to be separate pages (Academic at /cv, Industry at /cv/industry and
// Tailored at /cv/custom) are now three settings of one engine, components/CVEngine.tsx.
// The old addresses forward here with the matching setting.
//
// This file runs at build time. It reads the record that scripts/build-engine.mjs has just
// written (public/assistant/data.json; `prebuild` runs it before every build) and hands it to
// the engine, so the page's HTML already contains the full academic CV for search engines and
// for visitors without JavaScript.
import fs from "node:fs";
import path from "node:path";
import PageBanner from "@/components/PageBanner";
import CVEngine from "@/components/CVEngine";

export const metadata = {
  title: "Curriculum Vitae — Mohd Nor Akmal Khalid",
  description:
    "The CV of Dr. Mohd Nor Akmal Khalid, built for your purpose: choose the reader (full academic record, industry client, promotion panel, grant reviewer, prospective student), the length, the sections and a template, then download it as PDF, Word or Markdown. Always current.",
};

export default function CVPage() {
  const { data } = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public", "assistant", "data.json"), "utf8"));
  const today = new Date().toISOString().slice(0, 10);   // build date: splits training into delivered / scheduled
  return (
    <>
      <PageBanner
        eyebrow="/ curriculum vitae"
        title="One CV, built for the reader"
        kicker="Dr. Mohd Nor Akmal Khalid · Senior Lecturer, FTSM, Universiti Kebangsaan Malaysia"
        lede="Choose who is reading, how long it should be, which sections to keep and how it should look. The CV is assembled in your browser from the same record as the rest of this site, and downloads as PDF, Word or Markdown."
      >
        <a href="/cv/Akmal_CV_2026_Academic.pdf" className="btn-lume" download>Academic PDF <span aria-hidden="true">↓</span></a>
        <a href="/cv/Akmal_CV_2026_Industry.pdf" className="btn-ghost" download>Industry PDF <span aria-hidden="true">↓</span></a>
      </PageBanner>

      <div className="cve-page" style={{ background: "var(--bg)", minHeight: "100vh", padding: "28px 12px 64px" }}>
        <CVEngine data={data} today={today} />
      </div>
    </>
  );
}
