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
