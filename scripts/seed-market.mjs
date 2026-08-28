// seed-market.mjs — 把 DSH Skills Index 预置为本地市场源（免手填 manifest URL），
// 并预拉索引写入缓存。产出 ~/.dsh/.skills-market/state.json + cache/<recordId>.json。
// 结构与 dsh-skills-manager/lib/market/{state,api}.js 完全一致。
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { validateManifest, validateIndex } from "../../../plugins/dsh-skills-manager/lib/market/validate.js";

const MANIFEST_URL = "https://raw.githubusercontent.com/luomious/dsh-skill-catalog/main/manifest.json";
const marketRoot = join(homedir(), ".dsh", ".skills-market");
const cacheDir = join(marketRoot, "cache");
mkdirSync(cacheDir, { recursive: true });

const manifestRaw = await (await fetch(MANIFEST_URL)).text();
const manifest = validateManifest(manifestRaw, MANIFEST_URL);
const indexRaw = await (await fetch(manifest.endpoint)).text();
const snapshot = validateIndex(indexRaw, manifest.endpoint);

const recordId = "rec-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const addedAt = new Date().toISOString();

const state = {
  version: 1,
  sources: [{
    recordId,
    manifestUrl: MANIFEST_URL,
    manifest: { ...manifest, manifestUrl: MANIFEST_URL },
    addedAt,
    selected: true
  }],
  installed: []
};
writeFileSync(join(marketRoot, "state.json"), JSON.stringify(state, null, 2) + "\n", "utf8");

const cache = {
  fetchedAt: new Date().toISOString(),
  expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  snapshot
};
writeFileSync(join(cacheDir, recordId + ".json"), JSON.stringify(cache, null, 2) + "\n", "utf8");

console.log("seeded market source:", manifest.name, "| recordId:", recordId);
console.log("items cached:", snapshot.items.length);
console.log("state:", join(marketRoot, "state.json"));
