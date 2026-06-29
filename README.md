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
