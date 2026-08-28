// build-index.mjs — 重新生成 skills-index.json（计算每个 SKILL.md 的 SHA-256）。
// 用法: node scripts/build-index.mjs [--revision <rev>]
// 契约: 见插件 plugins/dsh-skills-manager/docs/skill-catalog-contract.md
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url))); // repo root
const skillsDir = join(root, "skills");
const sha256Hex = (s) => createHash("sha256").update(s, "utf8").digest("hex");

const BASE = "https://raw.githubusercontent.com/luomious/dsh-skill-catalog/main";
const revision = process.argv.find((a) => a.startsWith("--revision"))
  ? process.argv[process.argv.indexOf("--revision") + 1]
  : new Date().toISOString().slice(0, 10) + "-1";

const meta = {
  "code-review": { description: "系统化代码审查：按缺陷/安全/性能/可维护性/风格分级输出问题清单，每条给出位置、根因与修改建议", categories: ["engineering"] },
  "git-commit-message": { description: "按 Conventional Commits 规范编写 git 提交信息：类型/范围/主题/正文/脚注，中英皆可，附示例", categories: ["engineering"] },
  "log-analysis": { description: "分析日志文件/日志片段：时间线还原、异常聚类、根因定位，输出结构化排查报告", categories: ["ops"] },
  "paper-summary": { description: "快速精读学术论文：动机/方法/实验/局限四段式总结，附关键数据与术语解释，保留原文出处", categories: ["research"] }
};

const items = [];
for (const id of Object.keys(meta).sort()) {
  const dir = join(skillsDir, id);
  const file = join(dir, "SKILL.md");
  if (!statSync(file).isFile()) throw new Error("missing " + file);
  const content = readFileSync(file, "utf8");
  // 基础自检：frontmatter name 与目录一致
  const m = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(content);
  if (!m) throw new Error(id + ": SKILL.md 缺少 frontmatter");
  const name = m[1].split(/\r?\n/).find((l) => l.trim().startsWith("name:"))?.split(":")[1]?.trim();
  if (name !== id) throw new Error(id + ": frontmatter name 与目录不一致: " + name);
  items.push({
    id,
    description: meta[id].description,
    categories: meta[id].categories,
    version: "1.0.0",
    author: { name: "luomious", url: "https://github.com/luomious" },
    updatedAt: new Date().toISOString().slice(0, 10) + "T00:00:00Z",
    download: {
      url: `${BASE}/skills/${id}/SKILL.md`,
      sha256: sha256Hex(content)
    }
  });
}

const index = {
  schemaVersion: "1.0.0",
  revision,
  generatedAt: new Date().toISOString(),
  items
};
const out = join(root, "skills-index.json");
writeFileSync(out, JSON.stringify(index, null, 2) + "\n", "utf8");
console.log("wrote " + out + " (" + items.length + " items, revision=" + revision + ")");
for (const it of items) console.log("  " + it.id + "  " + it.download.sha256);
