import type { ESLint } from 'eslint';
import { noUnusedClassNames } from './rules/no-unused-class-names.js';

const plugin = {
  meta: {
    name: 'eslint-plugin-honey-css-modules',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    version: require('../package.json').version,
  },
  rules: {
    'no-unused-class-names': noUnusedClassNames,
  },
  configs: {
    recommended: {
      plugins: {},
      rules: {
        'honey-css-modules/no-unused-class-names': 'error',
      } as const,
    },
  },
} satisfies ESLint.Plugin;

// eslint-disable-next-line no-lone-blocks
{
  // @ts-expect-error
  plugin.configs.recommended.plugins['honey-css-modules'] = plugin;
}

export = plugin;
