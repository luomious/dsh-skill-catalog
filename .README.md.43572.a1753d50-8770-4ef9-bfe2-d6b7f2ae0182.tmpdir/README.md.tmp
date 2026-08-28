# DSH Skills Index（开源技能目录源）

DeepSeek Harness 技能市场的**目录源（manifest + index）**，遵循
[dsh-skills-manager 技能目录契约 v1](https://github.com/xiaoxianyu-office/dsh-skills-manager/blob/main/docs/skill-catalog-contract.md)。

## 怎么用（DSH 设置页）

1. 设置页 → Skills → **市场** Tab
2. 添加目录源，粘贴：
   ```
   https://raw.githubusercontent.com/luomious/dsh-skill-catalog/main/manifest.json
   ```
3. 选中该源 → 浏览/搜索/安装 skill（安装到 `~/.dsh/skills/<name>/SKILL.md`，SHA-256 强校验 + 同源下载）

## 目录结构

```
manifest.json          # 目录源 manifest（契约 §3）
skills-index.json      # 技能索引（契约 §4，由脚本生成，勿手改）
skills/<id>/SKILL.md   # 每个技能一个目录，frontmatter name 必须与目录名一致
scripts/build-index.mjs# 重新生成 skills-index.json（自动算 SHA-256）
```

## 新增/更新一个 skill

```bash
mkdir -p skills/<kebab-name>
# 编写 skills/<kebab-name>/SKILL.md（frontmatter: name + description 必填）
node scripts/build-index.mjs
git add -A && git commit -m "feat(skills): add <kebab-name>"
git push
```

> 推送后 GitHub raw 生效即完成；插件端索引 24h 缓存，必要时在 UI 点「刷新」强制拉取。

## 契约要点（v1）

- 所有 URL 必须 HTTPS 且同源（本目录统一走 `raw.githubusercontent.com`）。
- manifest 不得声明「默认/选中/回退」；来源必须由用户显式添加。
- 索引 ≤ 900 KiB、条目 id 唯一 kebab-case、`sha256` 64 位 hex，与 SKILL.md 内容严格一致。
