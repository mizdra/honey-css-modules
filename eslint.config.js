// @ts-check
import mizdra from '@mizdra/eslint-config-mizdra/flat';

/** @type {import('eslint').Linter.FlatConfig[]} */
// eslint-disable-next-line import-x/no-default-export
export default [
  { ignores: ['**/dist'] },
  ...mizdra.baseConfigs,
  ...mizdra.typescriptConfigs,
  ...mizdra.nodeConfigs,
  {
    files: ['**/*.{js,jsx,mjs,cjs}', '**/*.{ts,tsx,cts,mts}'],
    rules: {
      // Write your favorite rules
    },
  },
  mizdra.prettierConfig,
];
