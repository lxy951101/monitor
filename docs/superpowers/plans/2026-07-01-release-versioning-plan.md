# 发布与版本管理 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Monitor SDK (pnpm Monorepo) 搭建 Changesets 驱动的版本管理 + GitHub Release 自动发布流水线

**Architecture:** 通过 @changesets/cli 实现 fixed 模式统一版本管理，CI 新增 release workflow 在 Version Packages PR 合并后自动构建 IIFE bundle、创建 git tag 和 GitHub Release

**Tech Stack:** @changesets/cli ^2.27.0, GitHub Actions, softprops/action-gh-release@v2

## Global Constraints

- 14 个可发布包统一版本号（fixed 模式），`@monitor/build-config` 和 `@monitor/bundle` 排除
- 当前为 alpha 预发布阶段：`v1.0.0-alpha.0` 起步
- 暂不发布到 npm（`private: true`）
- GitHub Release 附带 `packages/bundle/dist/monitor.min.js` 作为 CDN 资源
- git tag 前缀 `v`
- Changeset 约定：每次至少包含 `@monitor/sdk`

## 文件结构

```
monitor/
├── .changeset/
│   ├── config.json          (新增) Changesets 配置
│   └── *.md                 (新增) 开发者提交的 changeset 文件
├── .github/workflows/
│   ├── ci.yml               (不变) 现有 CI
│   └── release.yml          (新增) 发布流水线
├── package.json             (修改) 根: 加 version + scripts + devDeps
├── packages/
│   ├── config/package.json           (修改) version: "1.0.0"
│   ├── core/package.json             (修改) version: "1.0.0"
│   ├── protocol/package.json         (修改) version: "1.0.0"
│   ├── sdk/package.json              (修改) version: "1.0.0"
│   ├── transport/package.json        (修改) version: "1.0.0"
│   ├── plugin-error/package.json     (修改) version: "1.0.0"
│   ├── plugin-metric/package.json    (修改) version: "1.0.0"
│   ├── plugin-page/package.json      (修改) version: "1.0.0"
│   ├── plugin-perf-cache/package.json(修改) version: "1.0.0"
│   ├── plugin-perf-fsp/package.json  (修改) version: "1.0.0"
│   ├── plugin-perf-ird/package.json  (修改) version: "1.0.0"
│   ├── plugin-perf-shr/package.json  (修改) version: "1.0.0"
│   ├── plugin-pv/package.json        (修改) version: "1.0.0"
│   └── plugin-resource/package.json  (修改) version: "1.0.0"
│   # build-config 和 bundle 不改 — 它们不在 fixed 列表中
```

**文件职责：**
- `.changeset/config.json` — fixed 模式、prerelease 配置
- `.github/workflows/release.yml` — 发版 CI
- 根 `package.json` — 版本号参考 + changeset 脚本
- 14 个包 `package.json` — 版本字段同步为 `1.0.0`

---

### Task 1: 安装 @changesets/cli 并创建配置文件

**Files:**
- Create: `.changeset/config.json`
- Modify: `package.json` (reformat only — will add `version` field in this task)

**Produces:**
- `.changeset/config.json` — Changesets 核心配置，定义 fixed 组和 prerelease 行为
- `package.json` — 补 `"version": "1.0.0"` 字段 + 安装 `@changesets/cli`

- [ ] **Step 1: 安装 @changesets/cli**

```bash
pnpm add -DW @changesets/cli@^2.27.0
```

Expected: 依赖添加到根 `package.json` 的 `devDependencies`，`pnpm-lock.yaml` 更新。

- [ ] **Step 2: 创建 `.changeset/config.json`**

写入文件 `.changeset/config.json`：

```json
{
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [
    [
      "@monitor/config",
      "@monitor/core",
      "@monitor/protocol",
      "@monitor/sdk",
      "@monitor/transport",
      "@monitor/plugin-error",
      "@monitor/plugin-metric",
      "@monitor/plugin-page",
      "@monitor/plugin-perf-cache",
      "@monitor/plugin-perf-fsp",
      "@monitor/plugin-perf-ird",
      "@monitor/plugin-perf-shr",
      "@monitor/plugin-pv",
      "@monitor/plugin-resource"
    ]
  ],
  "private": true,
  "baseBranch": "main"
}
```

- [ ] **Step 3: 修改根 package.json — 补 `version` 字段**

在 `"private": true` 下一行插入：

```json
"version": "1.0.0",
```

- [ ] **Step 4: 验证 changeset CLI 可用**

```bash
npx changeset --version
```

Expected: 输出版本号，无报错。

- [ ] **Step 5: Commit**

```bash
git add .changeset/config.json package.json pnpm-lock.yaml
git commit -m "chore: 安装 @changesets/cli + 根 package.json 补 version 1.0.0"
```

---

### Task 2: 统一 14 个包的版本号为 1.0.0

**Files:**
- Modify: 14 个 `packages/*/package.json` 中的 `version` 字段

**Consumes:** 14 个包的 package.json 文件

**Produces:** 所有 fixed 组包 version 字段为 `"1.0.0"`

- [ ] **Step 1: 检查当前版本号**

```bash
grep -r '"version"' packages/*/package.json | grep -v node_modules
```

Expected: 所有包显示 `"version": "0.0.0"`。`build-config` 和 `bundle` 也是 `0.0.0`，但它们不在 fixed 列表，不改。

- [ ] **Step 2: 逐个修改 14 个包**

修改以下文件中 `"version": "0.0.0"` → `"version": "1.0.0"`：

1. `packages/config/package.json`
2. `packages/core/package.json`
3. `packages/protocol/package.json`
4. `packages/sdk/package.json`
5. `packages/transport/package.json`
6. `packages/plugin-error/package.json`
7. `packages/plugin-metric/package.json`
8. `packages/plugin-page/package.json`
9. `packages/plugin-perf-cache/package.json`
10. `packages/plugin-perf-fsp/package.json`
11. `packages/plugin-perf-ird/package.json`
12. `packages/plugin-perf-shr/package.json`
13. `packages/plugin-pv/package.json`
14. `packages/plugin-resource/package.json`

`build-config` 和 `bundle` 保持 `"version": "0.0.0"` 不修改。

- [ ] **Step 3: 验证全部版本一致**

```bash
grep -r '"version"' packages/config/package.json packages/core/package.json packages/protocol/package.json packages/sdk/package.json packages/transport/package.json packages/plugin-*/package.json | grep -v build-config | grep -v bundle
```

Expected: 14 个包全部显示 `"version": "1.0.0"`。

- [ ] **Step 4: Commit**

```bash
git add packages/config/package.json packages/core/package.json packages/protocol/package.json packages/sdk/package.json packages/transport/package.json packages/plugin-error/package.json packages/plugin-metric/package.json packages/plugin-page/package.json packages/plugin-perf-cache/package.json packages/plugin-perf-fsp/package.json packages/plugin-perf-ird/package.json packages/plugin-perf-shr/package.json packages/plugin-pv/package.json packages/plugin-resource/package.json
git commit -m "chore: 14 个包统一版本号为 1.0.0"
```

---

### Task 3: 根 package.json 补充 changeset 脚本

**Files:**
- Modify: `package.json` — `scripts` 和 `devDependencies`（devDeps 已在 Task1 安装）

**Consumes:**
- 根 `package.json` 已安装 `@changesets/cli`

**Produces:** 开发者可通过 `pnpm changeset` 创建 changeset

- [ ] **Step 1: 读取当前根 package.json**

```bash
cat package.json
```

确认 `devDependencies` 中已包含 `"@changesets/cli": "^2.27.0"`。（Task 1 已安装）

- [ ] **Step 2: 在 scripts 中添加 changeset 命令**

在 `"scripts"` 块中，`"check:size"` 之后追加：

```json
"changeset": "changeset",
"version-packages": "changeset version",
"release": "pnpm build && changeset publish"
```

修改后 scripts 块应为：

```json
"scripts": {
  "build": "pnpm -r build",
  "typecheck": "pnpm -r typecheck",
  "test": "vitest",
  "test:run": "vitest run",
  "lint": "oxlint",
  "format": "oxfmt --write .",
  "format:check": "oxfmt --check .",
  "check:size": "node scripts/check-size.mjs",
  "changeset": "changeset",
  "version-packages": "changeset version",
  "release": "pnpm build && changeset publish",
  "ci": "pnpm typecheck && pnpm lint && pnpm format:check && pnpm build && pnpm test:run"
}
```

- [ ] **Step 3: 验证 scripts 合法**

```bash
node -e "const p = require('./package.json'); console.log(p.scripts.changeset, p.scripts['version-packages'], p.scripts.release)"
```

Expected: `changeset changeset version pnpm build && changeset publish`

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: 根 package.json 添加 changeset/version-packages/release 脚本"
```

---

### Task 4: 进入 alpha 预发布模式

**Files:**
- Create: `.changeset/pre.json` (由 `changeset pre enter alpha` 生成)

**Consumes:**
- `.changeset/config.json` 已存在
- 14 个包版本号为 `1.0.0`

**Produces:**
- `.changeset/pre.json` — prerelease 模式标记文件

- [ ] **Step 1: 执行 prerelease 初始化**

```bash
npx changeset pre enter alpha
```

Expected 输出（示例）:

```
🦋  Entered alpha mode
🦋  Run `changeset version` to version packages
```

- [ ] **Step 2: 验证生成的 pre.json**

```bash
cat .changeset/pre.json
```

Expected: 包含 `"mode": "pre"` 和 `"tag": "alpha"`，`"changesets"` 为空数组。

- [ ] **Step 3: Commit**

```bash
git add .changeset/pre.json
git commit -m "chore: changeset pre enter alpha"
```

---

### Task 5: 创建 Release CI Workflow

**Files:**
- Create: `.github/workflows/release.yml`

**Consumes:**
- IIFE bundle 由 `packages/bundle` 的 `pnpm build` 产出
- 版本号从 `packages/sdk/package.json` 读取

**Produces:**
- 发版 commit push 到 main 后自动构建 → git tag → GitHub Release

- [ ] **Step 1: 创建 `.github/workflows/release.yml`**

写入文件 `.github/workflows/release.yml`：

```yaml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    if: contains(github.event.head_commit.message, 'Version Packages')
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v5

      - uses: pnpm/action-setup@v6

      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile

      - run: pnpm build

      - id: version
        run: echo "tag=$(node -e "console.log(require('./packages/sdk/package.json').version)")" >> $GITHUB_OUTPUT

      - id: changelog
        run: |
          awk '/^## /{if(++c==2) exit} c' packages/sdk/CHANGELOG.md > /tmp/release-body.md
          echo "body_file=/tmp/release-body.md" >> $GITHUB_OUTPUT

      - run: |
          git tag "v${{ steps.version.outputs.tag }}"
          git push origin "v${{ steps.version.outputs.tag }}"

      - uses: softprops/action-gh-release@v2
        with:
          tag_name: v${{ steps.version.outputs.tag }}
          body_path: ${{ steps.changelog.outputs.body_file }}
          files: packages/bundle/dist/monitor.min.js
```

- [ ] **Step 2: 验证 YAML 语法**

```bash
node -e "const y = require('fs').readFileSync('.github/workflows/release.yml','utf-8'); console.log('YAML file readable:', y.length > 0)"
```

Expected: `YAML file readable: true`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci: 添加 Release Workflow — 发版时自动构建 + git tag + GitHub Release"
```

---

### Task 6: 创建初始 changeset 并验证完整流程

**Files:**
- Create: `.changeset/initial-setup.md` (初始 changeset)

**Consumes:** 所有上述任务的产出

**Produces:** 首个 changeset 文件，用于触发首次 alpha 发版

> **注意**: 此任务在实际开发中会在**后续 PR 合并后**才触发 CI 发版。本任务的目标是验证 `changeset` 命令可正常工作、文件格式正确。

- [ ] **Step 1: 创建初始 changeset**

手动写入 `.changeset/initial-setup.md`：

```markdown
---
"@monitor/sdk": patch
"@monitor/config": patch
"@monitor/core": patch
"@monitor/protocol": patch
"@monitor/transport": patch
"@monitor/plugin-error": patch
"@monitor/plugin-metric": patch
"@monitor/plugin-page": patch
"@monitor/plugin-perf-cache": patch
"@monitor/plugin-perf-fsp": patch
"@monitor/plugin-perf-ird": patch
"@monitor/plugin-perf-shr": patch
"@monitor/plugin-pv": patch
"@monitor/plugin-resource": patch
---

初始化发布流水线：Changesets 版本管理 + GitHub Release CDN 分发。
```

- [ ] **Step 2: 本地模拟 Version Packages 看效果**

```bash
npx changeset version
```

Expected: 14 个包的 `package.json` 版本变为 `1.0.0-alpha.0`，各自生成/更新 `CHANGELOG.md`，`.changeset/initial-setup.md` 被删除。

- [ ] **Step 3: 还原 version 命令的变更**

`changeset version` 只是为了验证，不应提交。还原：

```bash
git checkout -- packages/ && rm -f packages/*/CHANGELOG.md && git checkout -- .changeset/
```

- [ ] **Step 4: Commit 初始 changeset**

初始 changeset 文件保留，等合并到 main 后由 Changesets bot 正式执行 version bump。

```bash
git add .changeset/initial-setup.md
git commit -m "chore: 初始 changeset — 发布流水线初始化"
```

- [ ] **Step 5: 运行 CI 检查确认不破坏现有流程**

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm build && pnpm test:run
```

Expected: 全部 PASS。新文件不影响现有 typecheck/lint/build/test。

---

## 验证清单

全部任务完成后，确认以下状态：

- [ ] `.changeset/config.json` 存在，`fixed` 数组含 14 个包
- [ ] `.changeset/pre.json` 存在，`mode: "pre"`, `tag: "alpha"`
- [ ] 根 `package.json` 有 `"version": "1.0.0"`
- [ ] 14 个包的 `package.json` version 为 `"1.0.0"`
- [ ] `pnpm changeset` 命令可用
- [ ] `.github/workflows/release.yml` 存在
- [ ] `pnpm ci` (typecheck/lint/format/build/test) 全部 PASS
- [ ] `.changeset/initial-setup.md` 已提交，等待合并后触发首次发版

## 首次发版触发流程

上述任务全部合并到 main 后：

1. Changesets bot 自动检测到 `.changeset/initial-setup.md` + `pre.json` → 创建 "Version Packages" PR
2. 该 PR 将：14 个包版本 `1.0.0` → `1.0.0-alpha.0`，生成 CHANGELOG，删除 `initial-setup.md`
3. 合并此 PR → `release.yml` 检测到 "Version Packages" commit → 构建 bundle → git tag `v1.0.0-alpha.0` → GitHub Release 附带 `monitor.min.js`
4. CDN 地址即刻生效：`https://github.com/<owner>/monitor/releases/download/v1.0.0-alpha.0/monitor.min.js`
