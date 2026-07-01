# Vite 8 迁移实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Monitor SDK monorepo 从 Vite 5.4 迁移到 Vite 8，引入 Oxc lint/format，统一构建配置，新增全量 IIFE 打包和 GitHub CI/CD。

**Architecture:** 创建 `build-config` 共享构建工厂统一 14 个包的 vite.config.ts；新建 `bundle` 包打全量 IIFE；引入 oxlint + oxc-formatter 做 Rust 级 lint/format；新增 GitHub Actions CI 流程。

**Tech Stack:** Vite 8 (Rolldown), Vitest 4.1, TypeScript 7.0 (Go), oxlint, oxc-formatter, PNPM 9, Node 22

## Global Constraints

- 每个文件 ≤ 600 行，每个函数 ≤ 120 行
- 输出格式：ES（14 个包）+ IIFE 全量（bundle 包），移除 CJS
- `rollupOptions` → `rolldownOptions`
- `optimizeDeps.esbuildOptions` 废弃，移除
- Node.js 20.19+ / 22.12+ 要求
- 路径别名统一从 tsconfig.base.json paths 自动生成
- 所有问题、文档使用中文输出
- 流程、架构图使用 Mermaid

---

## File Structure

```mermaid
flowchart TD
    subgraph New
        BC[packages/build-config/src/index.ts]
        BU[packages/bundle/src/index.ts]
        CI[.github/workflows/ci.yml]
        OX[.oxlintrc.json]
    end

    subgraph Modified
        RP[package.json (root)]
        VWS[vitest.workspace.ts]
        PG[apps/playground/vite.config.ts]
        P1[packages/*/vite.config.ts ×14]
        P2[packages/*/package.json ×14]
    end

    BC -->|工厂函数| P1
    BC -->|resolveAlias| VWS
    BC -->|resolveAlias| PG
    BU -->|全量导入| P2
```

| 文件 | 职责 |
|------|------|
| `packages/build-config/src/index.ts` | 导出 `createLibConfig()` 工厂函数和 `resolveAlias` 别名映射 |
| `packages/build-config/package.json` | 包声明 |
| `packages/bundle/src/index.ts` | 聚合所有插件 + `window.Monitor` 挂载 |
| `packages/bundle/vite.config.ts` | 全量 IIFE 构建配置 |
| `packages/bundle/package.json` | 包声明，依赖所有插件 |
| `.oxlintrc.json` | oxlint 规则配置 |
| `.oxfmtrc.json` | oxfmt 格式化配置（可选，用默认即可） |
| `.github/workflows/ci.yml` | GitHub Actions CI |
| `package.json` (root) | 升级依赖、新增 scripts |
| `packages/*/vite.config.ts` ×14 | 改为使用 `createLibConfig()` |
| `packages/*/package.json` ×14 | 移除 CJS 入口（main/require） |
| `vitest.workspace.ts` | 别名改用 `@monitor/build-config` 导出 |
| `apps/playground/vite.config.ts` | 别名改用 `@monitor/build-config` 导出 |

---

### Task 1: 升级根目录依赖

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: 新的 `package.json` devDependencies 版本号，后续所有任务依赖

- [ ] **Step 1: 更新 package.json 依赖版本**

```json
{
  "name": "monitor-workspace",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "pnpm -r build",
    "typecheck": "pnpm -r typecheck",
    "test": "vitest --workspace vitest.workspace.ts",
    "test:run": "vitest run --workspace vitest.workspace.ts",
    "lint": "oxlint",
    "format": "oxfmt --write .",
    "format:check": "oxfmt --check .",
    "check:size": "node scripts/check-size.mjs",
    "ci": "pnpm typecheck && pnpm lint && pnpm format:check && pnpm build && pnpm test:run"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^7.0.0",
    "vite": "^8.0.0",
    "vitest": "^4.1.0",
    "oxlint": "^1.0.0",
    "oxc-formatter": "^0.10.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

- [ ] **Step 2: 删除旧的 node_modules 和 lockfile，重新安装**

```bash
rm -rf node_modules packages/*/node_modules apps/*/node_modules pnpm-lock.yaml
pnpm install
```

- [ ] **Step 3: 验证基础命令可用**

```bash
pnpm exec vite --version
# Expected: v8.x.x
pnpm exec vitest --version
# Expected: v4.1.x
pnpm exec tsc --version
# Expected: v7.x.x
pnpm exec oxlint --version
# Expected: v1.x.x
pnpm exec oxfmt --version
# Expected: v0.x.x
```

- [ ] **Step 4: 提交**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: 升级依赖到 Vite 8 / Vitest 4.1 / TypeScript 7 / Oxc"
```

---

### Task 2: Oxc 配置 — lint 与 format

**Files:**
- Create: `.oxlintrc.json`
- Create: `.oxfmtrc.json`

**Interfaces:**
- Consumes: Task 1 安装的 oxlint 和 oxc-formatter
- Produces: lint/format 规则，Task 9 CI 使用

- [ ] **Step 1: 创建 .oxlintrc.json**

```jsonc
{
  "rules": {
    "correctness": "error",
    "suspicious": "warn",
    "perf": "warn"
  }
}
```

- [ ] **Step 2: 创建 .oxfmtrc.json（可选，显式声明默认值）**

```json
{
  "indent": {
    "width": 2
  },
  "quote": "single",
  "semicolon": true,
  "trailingComma": "all"
}
```

**Note:** `oxfmt` 默认输出与 Prettier 兼容，此文件仅为显式声明。如果 `oxfmt` 当前版本的默认值已满足需求，可跳过此文件。

- [ ] **Step 3: 验证 lint 可运行**

```bash
pnpm lint
# Expected: 输出 lint 结果（可能有 warning，不应有 error）
```

- [ ] **Step 4: 执行全量格式化**

```bash
pnpm format
```

- [ ] **Step 5: 如果格式化产生了改动，单独提交**

```bash
git add -A
git commit -m "style: oxfmt 全量代码格式化"
```

- [ ] **Step 6: 提交 Oxc 配置文件**

```bash
git add .oxlintrc.json .oxfmtrc.json
git commit -m "chore: 添加 oxlint / oxc-formatter 配置"
```

---

### Task 3: GitHub CI/CD

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: Task 1 的 scripts（`ci`）、Task 2 的 lint/format 配置
- Produces: CI 自动化流程

- [ ] **Step 1: 创建 .github/workflows/ci.yml**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    strategy:
      matrix:
        node-version: ['22']

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup PNPM
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: Format check
        run: pnpm format:check

      - name: Build
        run: pnpm build

      - name: Test
        run: pnpm test:run
```

- [ ] **Step 2: 确认 CI 配置完整性**

检查 `.gitignore` 中 `node_modules` 和 `dist` 已被忽略（CI 中 `--frozen-lockfile` 确保不会意外改 lockfile）：

```bash
cat .gitignore
```

- [ ] **Step 3: 提交**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: 添加 GitHub Actions CI（typecheck/lint/format/build/test）"
```

---

### Task 4: 创建 `@monitor/build-config` 共享构建工厂

**Files:**
- Create: `packages/build-config/package.json`
- Create: `packages/build-config/tsconfig.json`
- Create: `packages/build-config/src/index.ts`

**Interfaces:**
- Produces:
  - `createLibConfig(options: LibConfigOptions): UserConfig` — Vite 配置工厂
  - `resolveAlias: Record<string, string>` — tsconfig paths 别名映射
- Later tasks consume these

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "@monitor/build-config",
  "version": "0.0.0",
  "type": "module",
  "private": true,
  "main": "src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "vite": "^8.0.0"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"]
}
```

- [ ] **Step 3: 创建 src/index.ts**

```typescript
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type UserConfig } from 'vite';

/** tsconfig paths 自动解析结果 */
function readTsconfigPaths(): Record<string, string> {
  const tsconfigPath = resolve(import.meta.dirname, '../../tsconfig.base.json');
  const raw = readFileSync(tsconfigPath, 'utf-8');
  const parsed = JSON.parse(raw);
  const paths = parsed.compilerOptions?.paths ?? {};

  const alias: Record<string, string> = {};
  for (const [key, values] of Object.entries(paths) as [string, string[]][]) {
    const aliasKey = key.replace('/*', '');
    const aliasValue = resolve(import.meta.dirname, '..', '..', values[0].replace('/*', ''));
    alias[aliasKey] = aliasValue;
  }
  return alias;
}

/** 从 tsconfig.base.json 自动生成的路径别名 */
export const resolveAlias: Record<string, string> = readTsconfigPaths();

export interface LibConfigOptions {
  /** 全局变量名（仅 IIFE 使用） */
  name: string;
  /** 入口文件，默认 "src/index.ts" */
  entry?: string;
  /** external 依赖列表 */
  external?: (string | RegExp)[];
  /** 输出格式，默认 ['es'] */
  formats?: ('es' | 'iife')[];
  /** IIFE 全局变量名 */
  iifeName?: string;
  /** 输出目录，默认 "dist" */
  outDir?: string;
}

/** 创建 Vite 库模式构建配置 */
export function createLibConfig(options: LibConfigOptions): UserConfig {
  const {
    name,
    entry = 'src/index.ts',
    external = [],
    formats = ['es'],
    iifeName = name,
    outDir = 'dist',
  } = options;

  const hasIife = formats.includes('iife');
  const hasEs = formats.includes('es');

  const libFormats: ('es' | 'iife')[] = [];
  if (hasEs) libFormats.push('es');
  if (hasIife) libFormats.push('iife');

  return defineConfig({
    build: {
      lib: {
        entry,
        name,
        formats: libFormats,
        fileName: (format) => {
          if (format === 'iife') return `${iifeName}.min.js`;
          return 'index.js';
        },
      },
      outDir,
      sourcemap: true,
      rolldownOptions: {
        external,
      },
    },
    resolve: {
      alias: resolveAlias,
    },
  });
}
```

> **注意：** `import.meta.dirname` 要求 Node.js 22+。如果当前 Node 版本不支持，改用 `new URL('.', import.meta.url).pathname`。

- [ ] **Step 4: 验证 build-config 自身 typecheck**

```bash
cd packages/build-config && pnpm typecheck
```

- [ ] **Step 5: 提交**

```bash
git add packages/build-config/
git commit -m "feat(build-config): 添加共享构建工厂 createLibConfig 和 resolveAlias"
```

---

### Task 5: 迁移无 external 的包 — config & plugin-perf-cache

**Files:**
- Modify: `packages/config/vite.config.ts`
- Modify: `packages/config/package.json`
- Modify: `packages/plugin-perf-cache/vite.config.ts`
- Modify: `packages/plugin-perf-cache/package.json`

**Interfaces:**
- Consumes: `createLibConfig` from `@monitor/build-config`
- Produces: 两种模板（无 external）给后续包参考

- [ ] **Step 1: 改造 packages/config/vite.config.ts**

```typescript
import { createLibConfig } from '@monitor/build-config';

export default createLibConfig({
  name: 'MonitorConfig',
});
```

- [ ] **Step 2: 改造 packages/config/package.json — 移除 CJS 入口**

```json
{
  "name": "@monitor/config",
  "version": "0.0.0",
  "type": "module",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "vite build",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

（移除 `"main": "dist/index.cjs"` 和 `exports` 中的 `"require"` 字段）

- [ ] **Step 3: 改造 packages/plugin-perf-cache/vite.config.ts**

```typescript
import { createLibConfig } from '@monitor/build-config';

export default createLibConfig({
  name: 'MonitorPluginPerfCache',
  external: ['@monitor/transport'],
});
```

- [ ] **Step 4: 改造 packages/plugin-perf-cache/package.json — 移除 CJS 入口**

```json
{
  "name": "@monitor/plugin-perf-cache",
  "version": "0.0.0",
  "type": "module",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "vite build",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@monitor/transport": "workspace:*"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

- [ ] **Step 5: 验证构建**

```bash
cd packages/config && pnpm build && cd ../../
cd packages/plugin-perf-cache && pnpm build && cd ../../
# Expected: 两个包 dist/ 下均输出 index.js + index.d.ts，无 .cjs 文件
```

- [ ] **Step 6: 提交**

```bash
git add packages/config/ packages/plugin-perf-cache/
git commit -m "refactor(config,plugin-perf-cache): 迁移到 createLibConfig，移除 CJS"
```

---

### Task 6: 迁移单/少量 external 的包 — protocol, transport, core

**Files:**
- Modify: `packages/protocol/vite.config.ts`, `packages/protocol/package.json`
- Modify: `packages/transport/vite.config.ts`, `packages/transport/package.json`
- Modify: `packages/core/vite.config.ts`, `packages/core/package.json`

- [ ] **Step 1: 改造 protocol (external: @monitor/config)**

`packages/protocol/vite.config.ts`:
```typescript
import { createLibConfig } from '@monitor/build-config';

export default createLibConfig({
  name: 'MonitorProtocol',
  external: ['@monitor/config'],
});
```

`packages/protocol/package.json` — 移除 `main` 和 `exports.require`。

- [ ] **Step 2: 改造 transport (external: @monitor/config, @monitor/protocol)**

`packages/transport/vite.config.ts`:
```typescript
import { createLibConfig } from '@monitor/build-config';

export default createLibConfig({
  name: 'MonitorTransport',
  external: ['@monitor/config', '@monitor/protocol'],
});
```

`packages/transport/package.json` — 移除 `main` 和 `exports.require`。

- [ ] **Step 3: 改造 core (external: @monitor/config, @monitor/protocol, @monitor/transport)**

`packages/core/vite.config.ts`:
```typescript
import { createLibConfig } from '@monitor/build-config';

export default createLibConfig({
  name: 'MonitorCore',
  external: ['@monitor/config', '@monitor/protocol', '@monitor/transport'],
});
```

`packages/core/package.json` — 移除 `main` 和 `exports.require`。

- [ ] **Step 4: 验证构建**

```bash
cd packages/protocol && pnpm build && cd ../../
cd packages/transport && pnpm build && cd ../../
cd packages/core && pnpm build && cd ../../
```

- [ ] **Step 5: 提交**

```bash
git add packages/protocol/ packages/transport/ packages/core/
git commit -m "refactor(protocol,transport,core): 迁移到 createLibConfig，移除 CJS"
```

---

### Task 7: 迁移插件包（7 个）

**Files:**
- Modify: 7 个插件包的 `vite.config.ts` + `package.json`

**涵盖：** `plugin-error`, `plugin-page`, `plugin-pv`, `plugin-metric`, `plugin-resource`, `plugin-perf-fsp`, `plugin-perf-ird`, `plugin-perf-shr`

> 注意：plugin-perf-cache 已在 Task 5 迁移。

- [ ] **Step 1: 改造 plugin-error ~ plugin-perf-fsp（5 个包，external 相同：@monitor/core, @monitor/protocol, @monitor/transport）**

每个包的 `vite.config.ts` 模式：

```typescript
import { createLibConfig } from '@monitor/build-config';

export default createLibConfig({
  name: 'MonitorPlugin<Name>',
  external: ['@monitor/core', '@monitor/protocol', '@monitor/transport'],
});
```

各包 name 映射：

| 包 | name |
|---|---|
| plugin-error | `MonitorPluginError` |
| plugin-page | `MonitorPluginPage` |
| plugin-pv | `MonitorPluginPv` |
| plugin-metric | `MonitorPluginMetric` |
| plugin-resource | `MonitorPluginResource` |
| plugin-perf-fsp | `MonitorPluginPerfFsp` |

每个包的 `package.json` — 移除 `main` 和 `exports.require`。

- [ ] **Step 2: 改造 plugin-perf-ird, plugin-perf-shr（external 包含 @monitor/plugin-perf-cache）**

`packages/plugin-perf-ird/vite.config.ts`:
```typescript
import { createLibConfig } from '@monitor/build-config';

export default createLibConfig({
  name: 'MonitorPluginPerfIrd',
  external: ['@monitor/core', '@monitor/plugin-perf-cache', '@monitor/protocol', '@monitor/transport'],
});
```

`packages/plugin-perf-shr/vite.config.ts`:
```typescript
import { createLibConfig } from '@monitor/build-config';

export default createLibConfig({
  name: 'MonitorPluginPerfShr',
  external: ['@monitor/core', '@monitor/plugin-perf-cache', '@monitor/protocol', '@monitor/transport'],
});
```

各自的 `package.json` — 移除 `main` 和 `exports.require`。

- [ ] **Step 3: 验证全部 7 个插件包构建**

```bash
for pkg in plugin-error plugin-page plugin-pv plugin-metric plugin-resource plugin-perf-fsp plugin-perf-ird plugin-perf-shr; do
  echo "=== Building $pkg ==="
  cd packages/$pkg && pnpm build && cd ../../
done
```

- [ ] **Step 4: 提交**

```bash
git add packages/plugin-*/
git commit -m "refactor(plugins): 7 个插件包迁移到 createLibConfig，移除 CJS"
```

---

### Task 8: 迁移 sdk 包 + 更新 vitest.workspace.ts

**Files:**
- Modify: `packages/sdk/vite.config.ts`
- Modify: `packages/sdk/package.json`
- Modify: `vitest.workspace.ts`

**Interfaces:**
- Consumes: `createLibConfig`, `resolveAlias` from `@monitor/build-config`
- Note: sdk 包旧的 IIFE 格式移除，IIFE 由 bundle 包承担

- [ ] **Step 1: 改造 packages/sdk/vite.config.ts**

```typescript
import { createLibConfig } from '@monitor/build-config';

export default createLibConfig({
  name: 'MonitorSdk',
  external: [
    '@monitor/core',
    '@monitor/plugin-error',
    '@monitor/plugin-resource',
    '@monitor/plugin-page',
    '@monitor/plugin-pv',
    '@monitor/plugin-metric',
    '@monitor/plugin-perf-fsp',
    '@monitor/plugin-perf-ird',
    '@monitor/plugin-perf-shr',
    '@monitor/plugin-perf-cache',
    '@monitor/transport',
  ],
});
```

（移除旧配置中的 `output.globals`、IIFE 相关设置）

- [ ] **Step 2: 改造 packages/sdk/package.json — 移除 CJS 和全局依赖**

```json
{
  "name": "@monitor/sdk",
  "version": "0.0.0",
  "type": "module",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "vite build",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@monitor/core": "workspace:*",
    "@monitor/plugin-error": "workspace:*",
    "@monitor/plugin-resource": "workspace:*",
    "@monitor/plugin-page": "workspace:*",
    "@monitor/plugin-pv": "workspace:*",
    "@monitor/plugin-metric": "workspace:*",
    "@monitor/plugin-perf-fsp": "workspace:*",
    "@monitor/plugin-perf-ird": "workspace:*",
    "@monitor/plugin-perf-shr": "workspace:*",
    "@monitor/plugin-perf-cache": "workspace:*",
    "@monitor/transport": "workspace:*"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

- [ ] **Step 3: 改造 vitest.workspace.ts**

```typescript
import { defineWorkspace } from 'vitest/config';
import { resolveAlias } from '@monitor/build-config';

export default defineWorkspace([
  {
    test: {
      name: 'packages',
      include: ['packages/*/src/**/*.test.ts'],
      passWithNoTests: true,
    },
    resolve: {
      alias: resolveAlias,
    },
  },
  {
    test: {
      name: 'apps',
      include: ['apps/*/src/**/*.test.ts'],
      passWithNoTests: true,
    },
    resolve: {
      alias: resolveAlias,
    },
  },
]);
```

- [ ] **Step 4: 验证构建 + 测试**

```bash
cd packages/sdk && pnpm build && cd ../../
pnpm test:run
```

- [ ] **Step 5: 提交**

```bash
git add packages/sdk/ vitest.workspace.ts
git commit -m "refactor(sdk,vitest): sdk 迁移到 createLibConfig，vitest 别名统一"
```

---

### Task 9: 创建 `@monitor/bundle` 全量 IIFE 打包

**Files:**
- Create: `packages/bundle/package.json`
- Create: `packages/bundle/tsconfig.json`
- Create: `packages/bundle/vite.config.ts`
- Create: `packages/bundle/src/index.ts`

**Interfaces:**
- Consumes: 所有现有插件包 + sdk 包 + `createLibConfig`
- Produces: `dist/monitor.min.js` — CDN 可用的 IIFE 全量包

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "@monitor/bundle",
  "version": "0.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "build": "vite build",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@monitor/sdk": "workspace:*",
    "@monitor/plugin-error": "workspace:*",
    "@monitor/plugin-pv": "workspace:*",
    "@monitor/plugin-metric": "workspace:*",
    "@monitor/plugin-resource": "workspace:*",
    "@monitor/plugin-page": "workspace:*",
    "@monitor/plugin-perf-fsp": "workspace:*",
    "@monitor/plugin-perf-ird": "workspace:*",
    "@monitor/plugin-perf-shr": "workspace:*",
    "@monitor/plugin-perf-cache": "workspace:*"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"]
}
```

- [ ] **Step 3: 创建 vite.config.ts**

```typescript
import { createLibConfig } from '@monitor/build-config';

export default createLibConfig({
  name: 'Monitor',
  formats: ['iife'],
  iifeName: 'Monitor',
  external: [],
});
```

- [ ] **Step 4: 创建 src/index.ts**

```typescript
import { Monitor } from '@monitor/sdk';

// 副作用导入 — 触发所有插件注册
import '@monitor/plugin-error';
import '@monitor/plugin-pv';
import '@monitor/plugin-metric';
import '@monitor/plugin-resource';
import '@monitor/plugin-page';
import '@monitor/plugin-perf-fsp';
import '@monitor/plugin-perf-ird';
import '@monitor/plugin-perf-shr';
import '@monitor/plugin-perf-cache';

(window as any).Monitor = Monitor;

export { Monitor };
```

- [ ] **Step 5: 构建 bundle**

```bash
cd packages/bundle && pnpm build && cd ../../
# Expected: dist/monitor.min.js 生成
```

- [ ] **Step 6: 验证 IIFE 输出正确**

```bash
head -5 packages/bundle/dist/monitor.min.js
# Expected: 以 IIFE 开头，包含 (function() { ... })() 模式
node -e "
const fs = require('fs');
const code = fs.readFileSync('packages/bundle/dist/monitor.min.js', 'utf-8');
console.log('Size:', (code.length / 1024).toFixed(1), 'KB');
console.log('Has Monitor:', code.includes('Monitor'));
"
```

- [ ] **Step 7: 提交**

```bash
git add packages/bundle/
git commit -m "feat(bundle): 新增全量 IIFE 打包（CDN 使用）"
```

---

### Task 10: 改造 playground 和 mock-server

**Files:**
- Modify: `apps/playground/vite.config.ts`
- Modify: `apps/mock-server/package.json`（如有需要）

- [ ] **Step 1: 改造 playground 的 vite.config.ts — 别名改用 resolveAlias**

```typescript
import { defineConfig } from 'vite';
import { resolveAlias } from '@monitor/build-config';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8787',
      '/rapi': 'http://localhost:8787',
      '/perf': 'http://localhost:8787',
      '/__records': 'http://localhost:8787',
    },
  },
  resolve: {
    alias: resolveAlias,
  },
});
```

- [ ] **Step 2: mock-server 检查**

mock-server 使用 `tsc --noEmit`，仅需确认 TypeScript 7 下类型检查通过：

```bash
cd apps/mock-server && pnpm typecheck && cd ../../
```

- [ ] **Step 3: 验证 playground dev 模式**

```bash
cd apps/playground && pnpm dev &
# 检查 http://localhost:5173 是否正常启动
# 然后 kill 进程
```

- [ ] **Step 4: 提交**

```bash
git add apps/playground/vite.config.ts
git commit -m "refactor(playground): 别名改用 build-config 的 resolveAlias"
```

---

### Task 11: 全量回归验证

**Files:** （无变更，仅验证）

- [ ] **Step 1: 全量安装 + 构建**

```bash
pnpm install
pnpm build
# Expected: 所有 15 个包（14 个 ES + 1 个 bundle）构建成功
```

- [ ] **Step 2: 类型检查**

```bash
pnpm typecheck
# Expected: 所有包类型检查通过
```

- [ ] **Step 3: Lint + 格式检查**

```bash
pnpm lint
pnpm format:check
# Expected: 无错误
```

- [ ] **Step 4: 全量测试**

```bash
pnpm test:run
# Expected: 所有测试通过
```

- [ ] **Step 5: 行数检查**

```bash
pnpm check:size
# Expected: 无文件 > 600 行，无函数 > 120 行
```

- [ ] **Step 6: CI 模拟**

```bash
pnpm ci
# Expected: 所有步骤通过（等同于 GitHub CI 流程）
```

- [ ] **Step 7: 如有失败项，修复后重新验证**

- [ ] **Step 8: 最终提交**

```bash
git add -A
git commit -m "chore: 全量回归验证通过 — Vite 8 迁移完成"
```
