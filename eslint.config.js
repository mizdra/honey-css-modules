import mizdra from '@mizdra/eslint-config-mizdra';

/** @type {import('eslint').Linter.Config[]} */
export default [
  { ignores: ['**/dist'] },
  ...mizdra.baseConfigs,
  ...mizdra.typescriptConfigs,
  ...mizdra.nodeConfigs,
  {
    files: ['**/*.{js,jsx,mjs,cjs}', '**/*.{ts,tsx,cts,mts}'],
    rules: {
      'simple-import-sort/imports': [
        'error',
        {
          // Remove blank lines between import groups
          // ref: https://github.com/lydell/eslint-plugin-simple-import-sort?tab=readme-ov-file#how-do-i-use-this-with-dprint
          groups: [['^\\u0000', '^node:', '^@?\\w', '^', '^\\.']],
        },
      ],
      'no-restricted-globals': [
        'error',
        {
          name: 'Buffer',
          message: 'Use Uint8Array instead.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          name: 'buffer',
          message: 'Use Uint8Array instead.',
        },
        {
          name: 'node:buffer',
          message: 'Use Uint8Array instead.',
        },
      ],
    },
  },
  mizdra.prettierConfig,
];
