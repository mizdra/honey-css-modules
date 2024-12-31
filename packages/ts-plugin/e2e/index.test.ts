import dedent from 'dedent';
import { describe, expect, test } from 'vitest';
import { createIFF } from './test/fixture.js';
import { launchTsserver } from './test/tsserver.js';

function formatPath(path: string) {
  // In windows, tsserver returns paths with '/' instead of '\\'.
  return path.replaceAll('\\', '/');
}

describe('Go to Definition', async () => {
  const tsserver = launchTsserver();
  const iff = await createIFF({
    'a.ts': dedent`
      import styles from './a.module.css';
      styles.a_1;
      styles.a_2;
      styles.a_3;
      styles.b_1;
      styles.b_2;
      styles.c_1;
      styles.c_alias;
    `,
    'a.module.css': dedent`
      @import './b.module.css';
      @value c_1, c_2 as c_alias from './c.module.css';
      .a_1 { color: red; }
      .a_2 { color: red; }
      .a_2 { color: red; }
      @value a_3: red;
    `,
    'b.module.css': dedent`
      .b_1 { color: red; }
      @value b_2: red;
    `,
    'c.module.css': dedent`
      @value c_1: red;
      @value c_2: red;
    `,
    'hcm.config.mjs': dedent`
      export default {
        pattern: '**/*.module.css',
        dtsOutDir: 'generated',
      };
    `,
    'tsconfig.json': dedent`
      {
        "compilerOptions": {}
      }
    `,
  });
  await tsserver.sendUpdateOpen({
    openFiles: [{ file: iff.paths['a.ts'] }],
  });
  test.each([
    {
      name: 'a_1',
      file: iff.paths['a.ts'],
      line: 2,
      offset: 8,
      expected: [
        { file: formatPath(iff.paths['a.module.css']), start: { line: 3, offset: 2 }, end: { line: 3, offset: 5 } },
      ],
    },
    {
      name: 'a_2',
      file: iff.paths['a.ts'],
      line: 3,
      offset: 8,
      expected: [
        { file: formatPath(iff.paths['a.module.css']), start: { line: 5, offset: 2 }, end: { line: 5, offset: 5 } },
        { file: formatPath(iff.paths['a.module.css']), start: { line: 4, offset: 2 }, end: { line: 4, offset: 5 } },
      ],
    },
    {
      name: 'a_3',
      file: iff.paths['a.ts'],
      line: 4,
      offset: 8,
      expected: [
        { file: formatPath(iff.paths['a.module.css']), start: { line: 6, offset: 8 }, end: { line: 6, offset: 11 } },
      ],
    },
    {
      name: 'b_1',
      file: iff.paths['a.ts'],
      line: 5,
      offset: 8,
      expected: [
        { file: formatPath(iff.paths['b.module.css']), start: { line: 1, offset: 2 }, end: { line: 1, offset: 5 } },
      ],
    },
    {
      name: 'b_2',
      file: iff.paths['a.ts'],
      line: 6,
      offset: 8,
      expected: [
        { file: formatPath(iff.paths['b.module.css']), start: { line: 2, offset: 8 }, end: { line: 2, offset: 11 } },
      ],
    },
    {
      name: 'c_1',
      file: iff.paths['a.ts'],
      line: 7,
      offset: 8,
      expected: [
        { file: formatPath(iff.paths['c.module.css']), start: { line: 1, offset: 8 }, end: { line: 1, offset: 11 } },
      ],
    },
    {
      name: 'c_alias',
      file: iff.paths['a.ts'],
      line: 8,
      offset: 8,
      expected: [
        { file: formatPath(iff.paths['a.module.css']), start: { line: 2, offset: 20 }, end: { line: 2, offset: 27 } },
      ],
    },
  ])('Go to definition of $name', async ({ file, line, offset, expected }) => {
    const res = await tsserver.sendDefinitionAndBoundSpan({
      file,
      line,
      offset,
    });
    expect(res.body?.definitions).toStrictEqual(expected);
  });
});
