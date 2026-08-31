// normalize-line-endings.mjs - convert every vendored SKILL.md to LF line endings
// so that the sha256 in the index matches what git/jsDelivr actually serves (LF).
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
if (!dir) { console.error("Usage: node normalize-line-endings.mjs <skillsDir>"); process.exit(1); }
let n = 0;
for (const id of readdirSync(dir)) {
  const f = join(dir, id, "SKILL.md");
  if (!existsSync(f)) continue;
  const c = readFileSync(f, "utf8");
  const lf = c.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (lf !== c) { writeFileSync(f, lf, "utf8"); n++; }
}
console.log("converted to LF:", n);
