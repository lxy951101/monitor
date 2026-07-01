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
