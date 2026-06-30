# monitor
一个性能监控系统

## 开发命令

```bash
pnpm install
pnpm test:run
pnpm check:size
```

- `pnpm build`：构建所有 workspace 子项目。
- `pnpm typecheck`：检查所有 workspace 子项目类型。
- `pnpm test:run`：以一次性模式运行 Vitest workspace。
- `pnpm check:size`：检查源码文件和函数行数约束。

## TypeScript 配置

- `tsconfig.base.json`：通用严格配置，不绑定浏览器或 Node 运行环境。
- `tsconfig.browser.json`：浏览器包继承使用，包含 DOM 类型和 Bundler 解析。
- `tsconfig.node.json`：Node 应用继承使用，包含 NodeNext 解析和 Node 类型。
