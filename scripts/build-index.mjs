// build-index.mjs - regenerate skills-index.json for dsh-skill-catalog
// Usage: node scripts/build-index.mjs [--revision <rev>]
// Contract: plugins/dsh-skills-manager/docs/skill-catalog-contract.md
// v2 (2026-08-31): generic scan of skills/, URLs via jsDelivr immutable tag @v1.1.0
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const skillsDir = join(root, "skills");
const sha256Hex = (s) => createHash("sha256").update(s, "utf8").digest("hex");
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// jsDelivr serves this repo at an immutable tag; bump VERSION + BASE on each release.
const BASE = "https://cdn.jsdelivr.net/gh/luomious/dsh-skill-catalog@v1.1.2";
const VERSION = "1.1.2";
const AUTHOR = { name: "luomious", url: "https://github.com/luomious" };

const CATEGORIES = {
  "code-review": ["engineering"],
  "git-commit-message": ["engineering"],
  "log-analysis": ["ops"],
  "paper-summary": ["research"],
  "academy-guide": ["learning", "document"],
  "algorithmic-art": ["design", "creative"],
  "brand-guidelines": ["design", "marketing"],
  "canvas-design": ["design", "creative"],
  "claude-api": ["developer-tools", "api"],
  "discernment-nudge": ["writing", "analysis"],
  "doc-coauthoring": ["office", "writing"],
  "docx": ["office", "document"],
  "frontend-design": ["design", "web"],
  "internal-comms": ["writing", "communication"],
  "mcp-builder": ["developer-tools", "mcp"],
  "pdf": ["office", "document"],
  "pptx": ["office", "presentation"],
  "skill-creator": ["developer-tools", "meta"],
  "slack-gif-creator": ["creative", "communication"],
  "theme-factory": ["design", "frontend"],
  "web-artifacts-builder": ["web", "design"],
  "webapp-testing": ["testing", "web"],
  "xlsx": ["office", "spreadsheet"]
};

function parseFrontmatter(content) {
  const stripped = String(content).replace(/^\uFEFF/, "");
  const m = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(stripped);
  if (!m) return null;
  const fields = {};
  for (const line of m[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const raw = line.slice(idx + 1).trim();
    let val = raw;
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (key) fields[key] = val.replace(/\s+$/, "");
  }
  return fields;
}

const revision = process.argv.find((a) => a.startsWith("--revision"))
  ? process.argv[process.argv.indexOf("--revision") + 1]
  : new Date().toISOString().slice(0, 10) + "-1";

const items = [];
for (const dir of readdirSync(skillsDir).sort()) {
  const file = join(skillsDir, dir, "SKILL.md");
  if (!existsSync(file) || !statSync(file).isFile()) continue;
  if (!ID_RE.test(dir)) { console.warn("skip (bad name): " + dir); continue; }
  const content = readFileSync(file, "utf8");
  const fm = parseFrontmatter(content);
  if (!fm || fm.name !== dir) { console.warn("skip (frontmatter mismatch): " + dir); continue; }
  const description = String(fm.description || "").trim();
  if (!description || description.length > 500) { console.warn("skip (bad description): " + dir); continue; }
  items.push({
    id: dir,
    description,
    categories: CATEGORIES[dir] || ["general"],
    version: VERSION,
    author: AUTHOR,
    updatedAt: new Date().toISOString().slice(0, 10) + "T00:00:00Z",
    download: { url: `${BASE}/skills/${dir}/SKILL.md`, sha256: sha256Hex(content) }
  });
}
if (!items.length) { console.error("no skills found"); process.exit(1); }
const index = { schemaVersion: "1.0.0", revision, generatedAt: new Date().toISOString(), items };
writeFileSync(join(root, "skills-index.json"), JSON.stringify(index, null, 2) + "\n", "utf8");
console.log("wrote skills-index.json (" + items.length + " items, revision=" + revision + ", base=" + BASE + ")");
