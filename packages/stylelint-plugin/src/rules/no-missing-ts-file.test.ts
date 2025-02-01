import stylelint from 'stylelint';
import { describe, expect, test } from 'vitest';
import { createIFF } from '../test/fixture.js';
import { formatLinterResult } from '../test/stylelint.js';
import { noMissingTsFile } from './no-missing-ts-file.js';

async function lint(rootDir: string) {
  return stylelint.lint({
    config: {
      plugins: [noMissingTsFile],
      rules: {
        'honey-css-modules/no-missing-ts-file': true,
      },
    },
    files: ['**/*.module.css'],
    cwd: rootDir,
  });
}

describe('no-missing-ts-file', () => {
  test('warns missing ts file', async () => {
    const iff = await createIFF({
      'a.module.css': '.foo {}',
    });
    const results = await lint(iff.rootDir);
    expect(formatLinterResult(results, iff.rootDir)).toMatchInlineSnapshot(`
      [
        {
          "source": "<rootDir>/a.module.css",
          "warnings": [
            {
              "column": 1,
              "endColumn": 2,
              "endLine": 1,
              "line": 1,
              "rule": "honey-css-modules/no-missing-ts-file",
              "text": "The corresponding TypeScript file is not found. (honey-css-modules/no-missing-ts-file)",
            },
          ],
        },
      ]
    `);
  });
  test('does not warn when ts file exists', async () => {
    const iff = await createIFF({
      'a.module.css': '',
      'a.tsx': '',
    });
    const results = await lint(iff.rootDir);
    expect(formatLinterResult(results, iff.rootDir)).toMatchInlineSnapshot(`
      [
        {
          "source": "<rootDir>/a.module.css",
          "warnings": [],
        },
      ]
    `);
  });
});
