// ============================================================================
//  Build-time CV PDF generator  →  public/cv/
//      Akmal_CV_2026_Academic.pdf   full scholarly record
//      Akmal_CV_2026_Industry.pdf   trainer-first profile
//      Akmal_CV_2026.pdf            legacy name (= Academic) so old links work
//
//  Reads content/cv.yml, renders the shared template once per profile, and
//  prints A4 PDFs with headless Chromium (puppeteer). Run this BEFORE `next build` so the PDF
//  lands in /public and gets copied into the static export.
//
//  Local test:   node scripts/generate-cv-pdf.mjs
//  Requires:     npm i -D puppeteer js-yaml   (puppeteer bundles Chromium)
// ============================================================================
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";
import { loadCV } from "../lib/cv-data.js";
import { renderDoc, PROFILES } from "../lib/cv-template.js";

const OUT_DIR = path.join(process.cwd(), "public", "cv");
const LEGACY = "Akmal_CV_2026.pdf";

const data = loadCV();
fs.mkdirSync(OUT_DIR, { recursive: true });

const footerFor = (label) => `<div style="width:100%;font-size:7pt;color:#9ca3af;text-align:center;font-family:Inter,Arial;padding:0 12mm;">
  ${data.meta.name}, ${data.meta.credential} · ${label} · <span class="pageNumber"></span> / <span class="totalPages"></span></div>`;

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
try {
  for (const p of Object.values(PROFILES)) {
    const out = path.join(OUT_DIR, p.pdf);
    const page = await browser.newPage();
    await page.setContent(renderDoc(data, { profile: p.key }), { waitUntil: "networkidle0" });
    // ensure web fonts are ready before printing
    await page.evaluateHandle("document.fonts.ready");
    await page.pdf({
      path: out,
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: footerFor(p.footer),
      margin: { top: "11mm", bottom: "14mm", left: "12mm", right: "12mm" },
    });
    await page.close();
    console.log(`✓ ${p.label} → ${path.relative(process.cwd(), out)}`);
  }
  fs.copyFileSync(path.join(OUT_DIR, PROFILES.academic.pdf), path.join(OUT_DIR, LEGACY));
  console.log(`✓ legacy copy → public/cv/${LEGACY}`);
} finally {
  await browser.close();
}
