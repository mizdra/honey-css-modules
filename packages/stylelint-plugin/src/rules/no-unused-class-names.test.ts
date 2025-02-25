import dedent from 'dedent';
import stylelint from 'stylelint';
import { describe, expect, test } from 'vitest';
import { createIFF } from '../test/fixture.js';
import { formatLinterResult } from '../test/stylelint.js';
import { findUsedTokenNamesForTest, noUnusedClassNames } from './no-unused-class-names.js';

async function lint(rootDir: string) {
  return stylelint.lint({
    config: {
      plugins: [noUnusedClassNames],
      rules: {
        'css-modules-kit/no-unused-class-names': true,
      },
    },
    files: ['**/*.module.css'],
    cwd: rootDir,
  });
}

describe('no-unused-class-names', () => {
  test('warns unused class names', async () => {
    const iff = await createIFF({
      'a.module.css': dedent`
      .local1 {}
      .local2 {}
      .local3 {}
    `,
      'a.tsx': dedent`
      import styles from './a.module.css';
      styles.local1;
    `,
    });
    const results = await lint(iff.rootDir);
    expect(formatLinterResult(results, iff.rootDir)).toMatchInlineSnapshot(`
      [
        {
          "source": "<rootDir>/a.module.css",
          "warnings": [
            {
              "column": 2,
              "endColumn": 8,
              "endLine": 2,
              "line": 2,
              "rule": "css-modules-kit/no-unused-class-names",
              "text": ""local2" is defined but never used in "a.tsx" (css-modules-kit/no-unused-class-names)",
            },
            {
              "column": 2,
              "endColumn": 8,
              "endLine": 3,
              "line": 3,
              "rule": "css-modules-kit/no-unused-class-names",
              "text": ""local3" is defined but never used in "a.tsx" (css-modules-kit/no-unused-class-names)",
            },
          ],
        },
      ]
    `);
  });
  test('does not warn global class names', async () => {
    const iff = await createIFF({
      'a.module.css': dedent`
        .local1, :global(.global1) {}
      `,
      'a.ts': dedent`
        import styles from './a.module.css';
        styles.local1;
      `,
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
  test('does not warn if ts file is not found', async () => {
    const iff = await createIFF({
      'a.module.css': dedent`
        .local1 {}
      `,
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

test('findUsedTokenNames', () => {
  const text = dedent`
    import styles from './a.module.css';
    styles.a_1;
    styles.a_1;
    styles.a_2;
    styles['a_3'];
    styles["a_4"];
    styles[\`a_5\`];
    // styles.a_6; // false positive, but it is acceptable for simplicity of implementation
    styles['a_7;
    styles['a_8"];
    styles;
  `;
  const expected = new Set(['a_1', 'a_2', 'a_6']);
  expect(findUsedTokenNamesForTest(text)).toEqual(expected);
});
