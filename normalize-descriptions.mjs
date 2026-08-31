// normalize-descriptions.mjs - rewrite every vendored SKILL.md frontmatter description
// to a single-line quoted scalar (<=500 chars). Handles YAML block scalars (> | - variants)
// and over-long single lines. Usage: node normalize-descriptions.mjs <skillsDir>
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const skillsDir = process.argv[2];
if (!skillsDir) { console.error("Usage: node normalize-descriptions.mjs <skillsDir>"); process.exit(1); }

function parseFrontmatterBlock(content) {
  const stripped = String(content).replace(/^\uFEFF/, "");
  const m = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(stripped);
  if (!m) return null;
  return { stripped, block: m[1], full: m[0] };
}

function getDescription(lines) {
  const di = lines.findIndex((l) => /^description\s*:/.test(l));
  if (di < 0) return null;
  const raw = lines[di].slice(lines[di].indexOf(":") + 1);
  const val = raw.trim();
  const isBlock = !val || /^[>|]/.test(val);
  if (!isBlock) {
    let v = val;
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    return { lineIdx: di, blockEnd: di + 1, singleLine: true, val: v };
  }
  const parts = [];
  let j = di + 1;
  while (j < lines.length && (/^[ \t]/.test(lines[j]) || lines[j].trim() === "")) {
    if (lines[j].trim() !== "") parts.push(lines[j].replace(/^[ \t]+/, ""));
    j++;
  }
  return { lineIdx: di, blockEnd: j, singleLine: false, val: parts.join(" ").replace(/\s+/g, " ").trim() };
}

function shorten(d) {
  if (d.length <= 500) return d;
  let cut = d.slice(0, 500);
  const idx = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "), cut.lastIndexOf("; "), cut.lastIndexOf(" "));
  if (idx > 200) cut = cut.slice(0, idx + 1);
  return cut.trim();
}

let fixed = 0, ok = 0;
for (const dir of readdirSync(skillsDir).sort()) {
  const f = join(skillsDir, dir, "SKILL.md");
  if (!existsSync(f)) continue;
  const content = readFileSync(f, "utf8");
  const fm = parseFrontmatterBlock(content);
  if (!fm) { console.warn("skip (no fm): " + dir); continue; }
  const lines = fm.block.split(/\r?\n/);
  const d = getDescription(lines);
  if (!d) { console.warn("skip (no desc): " + dir); continue; }
  // Rewrite when: block scalar, over-long, or contains a \" escape residue
  // (DSH frontmatter parsing does not unescape, so we avoid \" entirely).
  const needsFix = !d.singleLine || d.val.length > 500 || d.val.includes("\\");
  if (!needsFix) { ok++; continue; }
  const finalDesc = shorten(d.val);
  // Use single quotes inside a double-quoted scalar: zero escape overhead,
  // and DSH frontmatter parsing strips quotes without unescaping \".
  // Drop any leftover backslash escape residue from earlier rewrites first.
  const esc = finalDesc.replace(/\\/g, "").replace(/"/g, "'");
  const newLines = lines.slice(0, d.lineIdx).concat(['description: "' + esc + '"'], lines.slice(d.blockEnd));
  // NOTE: the regex captures the closing '---' plus its trailing newline, so the
  // replacement must end with "\n---\n" to avoid gluing the body to '---'.
  const newFm = "---\n" + newLines.join("\n") + "\n---\n";
  writeFileSync(f, fm.stripped.replace(fm.full, newFm), "utf8");
  fixed++;
  console.log("fixed " + dir + " (" + (d.singleLine ? "long" : "block") + ") -> " + finalDesc.slice(0, 70));
}
console.log("fixed=" + fixed + ", untouched=" + ok);
