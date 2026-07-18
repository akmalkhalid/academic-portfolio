// ============================================================================
//  Build-time CV PDF generator  →  public/cv/Akmal_CV_2026.pdf
//
//  Reads content/cv.yml, renders the shared template, and prints an A4 PDF
//  with headless Chromium (puppeteer). Run this BEFORE `next build` so the PDF
//  lands in /public and gets copied into the static export.
//
//  Local test:   node scripts/generate-cv-pdf.mjs
//  Requires:     npm i -D puppeteer js-yaml   (puppeteer bundles Chromium)
// ============================================================================
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";
import { loadCV } from "../lib/cv-data.js";
import { renderDoc } from "../lib/cv-template.js";

const OUT_DIR = path.join(process.cwd(), "public", "cv");
const OUT_PDF = path.join(OUT_DIR, "Akmal_CV_2026.pdf");

const data = loadCV();
const html = renderDoc(data);

fs.mkdirSync(OUT_DIR, { recursive: true });

const footer = `<div style="width:100%;font-size:7pt;color:#9ca3af;text-align:center;font-family:Inter,Arial;padding:0 12mm;">
  ${data.meta.name}, ${data.meta.credential} · Curriculum Vitae · <span class="pageNumber"></span> / <span class="totalPages"></span></div>`;

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
try {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  // ensure web fonts are ready before printing
  await page.evaluateHandle("document.fonts.ready");
  await page.pdf({
    path: OUT_PDF,
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: "<div></div>",
    footerTemplate: footer,
    margin: { top: "11mm", bottom: "14mm", left: "12mm", right: "12mm" },
  });
  console.log(`✓ CV PDF written → ${path.relative(process.cwd(), OUT_PDF)}`);
} finally {
  await browser.close();
}
