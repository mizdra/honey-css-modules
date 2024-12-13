import { defineConfig, defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  defineConfig({
    test: {
      name: 'unit',
      include: ['src/**/*.test.ts'],
      reporters: process.env['GITHUB_ACTIONS'] ? ['default', 'github-actions'] : 'default',
    },
  }),
  defineConfig({
    test: {
      name: 'e2e',
      include: ['e2e/**/*.test.ts'],
      reporters: process.env['GITHUB_ACTIONS'] ? ['default', 'github-actions'] : 'default',
    },
  }),
]);
