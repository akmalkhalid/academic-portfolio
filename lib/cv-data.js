// Loads and parses the canonical CV data (content/cv.yml).
// Server-only (uses fs) — safe to call from the /cv route (a server component)
// and from the PDF-generation script. Both run with cwd = repo root.
import fs from "node:fs";
import path from "node:path";
import * as yaml from "js-yaml";

export function loadCV() {
  const file = path.join(process.cwd(), "content", "cv.yml");
  const data = yaml.load(fs.readFileSync(file, "utf8"));

  // Inline the portrait as a data URI. Puppeteer renders the PDF via
  // page.setContent() with no base URL, so a relative <img src> would silently
  // fail there — the photo has to travel inside the HTML. Kept small (320px
  // JPEG on white, ~16 KB base64) because it ships in both the PDF and /cv.
  // Falls back to the monogram if the file is missing.
  try {
    const photo = path.join(process.cwd(), "public", "cv", "portrait-cv.jpg");
    data.meta.photo = "data:image/jpeg;base64," + fs.readFileSync(photo).toString("base64");
  } catch {
    /* no portrait on disk — the template draws the monogram instead */
  }
  return data;
}
