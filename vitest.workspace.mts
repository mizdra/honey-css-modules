// eslint-disable-next-line no-restricted-imports
import { resolve } from 'node:path';
import { defineConfig, defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  defineConfig({
    test: {
      name: 'unit',
      include: ['packages/*/src/**/*.test.ts'],
    },
    resolve: {
      alias: {
        'honey-css-modules-core': resolve('packages/core/src/index.ts'),
      },
    },
  }),
  defineConfig({
    test: {
      name: 'e2e',
      include: ['packages/*/e2e/**/*.test.ts'],
    },
  }),
]);
