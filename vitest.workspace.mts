import { resolve } from 'node:path';
import { defineConfig, defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  defineConfig({
    test: {
      name: 'unit',
      include: ['packages/*/src/**/*.test.ts'],
      reporters: process.env['GITHUB_ACTIONS'] ? ['default', 'github-actions'] : 'default',
    },
    resolve: {
      alias: {
        'honey-css-modules': resolve('packages/codegen/src/index.ts'),
      },
    },
  }),
  defineConfig({
    test: {
      name: 'e2e',
      include: ['packages/*/e2e/**/*.test.ts'],
      reporters: process.env['GITHUB_ACTIONS'] ? ['default', 'github-actions'] : 'default',
    },
  }),
]);
