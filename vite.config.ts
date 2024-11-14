import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    reporters: process.env['GITHUB_ACTIONS'] ? ['default', 'github-actions'] : 'default',
  },
});
