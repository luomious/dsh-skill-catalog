// e2e-remote.mjs — 端到端验证线上目录源（拉远程字节 → 插件校验器 → SHA-256 比对）。
import { createHash } from "node:crypto";
import {
  validateManifest, validateIndex, parseSkillFrontmatter, sha256Hex
} from "../../../plugins/dsh-skills-manager/lib/market/validate.js";

const BASE = "https://raw.githubusercontent.com/luomious/dsh-skill-catalog/main";
const MANIFEST_URL = `${BASE}/manifest.json`;

async function fetchText(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(url + " -> HTTP " + res.status);
  return await res.text();
}

const manifest = validateManifest(await fetchText(MANIFEST_URL), MANIFEST_URL);
console.log("remote manifest OK:", manifest.providerId, "|", manifest.name);

const indexRaw = await fetchText(manifest.endpoint);
const index = validateIndex(indexRaw, manifest.endpoint);
console.log("remote index OK:", index.items.length, "items");

let allOk = true;
for (const it of index.items) {
  const content = await fetchText(it.download.url);
  const fm = parseSkillFrontmatter(content, it.id);
  const actual = sha256Hex(content);
  if (actual !== it.download.sha256) { allOk = false; console.log("FAIL sha256:", it.id); continue; }
  console.log(`OK ${it.id} | sha256 match | desc="${fm.description.slice(0, 30)}..."`);
}
console.log(allOk ? "E2E ALL PASS (remote manifest+index+skills+sha256)" : "E2E FAILED");
process.exit(allOk ? 0 : 1);
