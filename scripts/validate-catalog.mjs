// validate-catalog.mjs — 用 dsh-skills-manager 自己的校验器验证目录源，发布前必跑。
// 用法: node validate-catalog.mjs <catalog-root>
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  validateManifest, validateIndex, parseSkillFrontmatter, sha256Hex
} from "../../../plugins/dsh-skills-manager/lib/market/validate.js";

const root = process.argv[2];
if (!root) { console.error("usage: node validate-catalog.mjs <catalog-root>"); process.exit(2); }

const manifestUrl = "https://raw.githubusercontent.com/luomious/dsh-skill-catalog/main/manifest.json";
const manifest = validateManifest(readFileSync(join(root, "manifest.json"), "utf8"), manifestUrl);
console.log("PASS manifest:", manifest.providerId, "->", manifest.endpoint);

const index = validateIndex(readFileSync(join(root, "skills-index.json"), "utf8"), manifest.endpoint);
console.log("PASS index:", index.items.length, "items");

const skillsDir = join(root, "skills");
let ok = 0;
for (const it of index.items) {
  const file = join(skillsDir, it.id, "SKILL.md");
  if (!statSync(file).isFile()) throw new Error("missing " + file);
  const content = readFileSync(file, "utf8");
  const fm = parseSkillFrontmatter(content, it.id);
  const actual = sha256Hex(content);
  if (actual !== it.download.sha256) throw new Error(it.id + ": sha256 不一致 " + actual);
  ok++;
  console.log("PASS skill:", it.id, "|", fm.description.slice(0, 40) + "...", "| sha256 ok");
}
console.log(`ALL PASS: manifest + index + ${ok} skills`);
