import { defineConfig } from 'vitest/config';

// eslint-disable-next-line import-x/no-default-export
export default defineConfig({
  test: {
    reporters: process.env['GITHUB_ACTIONS'] ? ['default', 'github-actions'] : 'default',
  },
});
