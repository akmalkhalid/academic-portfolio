// Loads and parses the canonical CV data (content/cv.yml).
// Server-only (uses fs) — safe to call from the /cv route (a server component)
// and from the PDF-generation script. Both run with cwd = repo root.
import fs from "node:fs";
import path from "node:path";
import * as yaml from "js-yaml";

export function loadCV() {
  const file = path.join(process.cwd(), "content", "cv.yml");
  return yaml.load(fs.readFileSync(file, "utf8"));
}
