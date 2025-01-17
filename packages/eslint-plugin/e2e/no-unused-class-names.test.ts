import css from '@eslint/css';
import dedent from 'dedent';
import type { Linter } from 'eslint';
import { ESLint } from 'eslint';
import honeyCssModules from 'eslint-plugin-honey-css-modules';
import tseslint from 'typescript-eslint';
import { expect, test } from 'vitest';
import { createIFF } from '../src/test/fixture.js';

function filterMessage(message: Linter.LintMessage) {
  return {
    ruleId: message.ruleId,
    messageId: message.messageId,
    line: message.line,
    column: message.column,
    endLine: message.endLine,
    endColumn: message.endColumn,
  };
}

function filterResult(result: ESLint.LintResult, rootDir: string) {
  return {
    filePath: result.filePath.replace(rootDir, '<rootDir>').replaceAll('\\', '/'),
    messages: result.messages.map(filterMessage),
  };
}

function filterResults(results: ESLint.LintResult[], rootDir: string) {
  return results.map((result) => filterResult(result, rootDir));
}

test('no-unused-class-names', async () => {
  const iff = await createIFF({
    'Foo.module.css': dedent`
      .local1 {}
      .local2 {}
    `,
    'Foo.tsx': dedent`
      import styles from './Foo.module.css';
      styles.local1;
    `,
    'eslint.config.mjs': dedent`
      export default [];
    `,
  });
  const eslint = new ESLint({
    cwd: iff.rootDir,
    baseConfig: [
      {
        files: ['**/*.ts', '**/*.tsx'],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(tseslint.configs.base as any),
      },
      {
        files: ['**/*.css'],
        plugins: { css, 'honey-css-modules': honeyCssModules },
        language: 'css/css',
        rules: {
          'honey-css-modules/no-unused-class-names': 'error',
        },
      },
    ],
  });
  const results = await eslint.lintFiles([iff.paths['Foo.module.css']]);
  expect(filterResults(results, iff.rootDir)).toMatchInlineSnapshot(`
    [
      {
        "filePath": "<rootDir>/Foo.module.css",
        "messages": [
          {
            "column": 1,
            "endColumn": 8,
            "endLine": 1,
            "line": 1,
            "messageId": "disallow",
            "ruleId": "honey-css-modules/no-unused-class-names",
          },
          {
            "column": 1,
            "endColumn": 8,
            "endLine": 2,
            "line": 2,
            "messageId": "disallow",
            "ruleId": "honey-css-modules/no-unused-class-names",
          },
        ],
      },
    ]
  `);
});
