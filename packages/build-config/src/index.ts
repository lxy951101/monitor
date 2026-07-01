import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type UserConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** tsconfig paths 自动解析结果 */
function readTsconfigPaths(): Record<string, string> {
  const tsconfigPath = resolve(__dirname, '../../tsconfig.base.json');
  const raw = readFileSync(tsconfigPath, 'utf-8');
  const parsed = JSON.parse(raw);
  const paths = parsed.compilerOptions?.paths ?? {};

  const alias: Record<string, string> = {};
  for (const [key, values] of Object.entries(paths) as [string, string[]][]) {
    const aliasKey = key.replace('/*', '');
    const aliasValue = resolve(
      __dirname,
      '..',
      '..',
      values[0].replace('/*', ''),
    );
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
