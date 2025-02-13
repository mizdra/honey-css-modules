import dedent from 'dedent';
import { describe, expect, test } from 'vitest';
import { createIFF } from './test/fixture.js';
import { formatPath, launchTsserver } from './test/tsserver.js';

describe('Rename File', async () => {
  const tsserver = launchTsserver();
  const iff = await createIFF({
    'index.ts': dedent`
      import styles from './a.module.css';
    `,
    'a.module.css': dedent`
      @import './b.module.css';
      @value c_1 from './c.module.css';
      @import '@/d.module.css';
    `,
    'b.module.css': dedent`
      .b_1 { color: red; }
    `,
    'c.module.css': dedent`
      @value c_1: red;
    `,
    'd.module.css': dedent`
      .d_1 { color: red; }
    `,
    'hcm.config.mjs': dedent`
      export default {
        pattern: '**/*.module.css',
        dtsOutDir: 'generated',
        alias: { '@': '.' },
      };
    `,
    'tsconfig.json': dedent`
      {
        "compilerOptions": {
          "paths": { "@/*": ["./*"] }
        }
      }
    `,
  });
  await tsserver.sendUpdateOpen({
    openFiles: [{ file: iff.paths['index.ts'] }],
  });
  test.each([
    {
      name: 'a.module.css',
      oldFilePath: iff.paths['a.module.css'],
      newFilePath: iff.join('aa.module.css'),
      expected: [
        {
          fileName: formatPath(iff.paths['index.ts']),
          textChanges: [{ start: { line: 1, offset: 21 }, end: { line: 1, offset: 35 }, newText: './aa.module.css' }],
        },
      ],
    },
    {
      name: 'b.module.css',
      oldFilePath: iff.paths['b.module.css'],
      newFilePath: iff.join('bb.module.css'),
      expected: [
        {
          fileName: formatPath(iff.paths['a.module.css']),
          textChanges: [{ start: { line: 1, offset: 10 }, end: { line: 1, offset: 24 }, newText: './bb.module.css' }],
        },
      ],
    },
    {
      name: 'c.module.css',
      oldFilePath: iff.paths['c.module.css'],
      newFilePath: iff.join('cc.module.css'),
      expected: [
        {
          fileName: formatPath(iff.paths['a.module.css']),
          textChanges: [{ start: { line: 2, offset: 18 }, end: { line: 2, offset: 32 }, newText: './cc.module.css' }],
        },
      ],
    },
    {
      name: 'd.module.css',
      oldFilePath: iff.paths['d.module.css'],
      newFilePath: iff.join('dd.module.css'),
      expected: [
        {
          fileName: formatPath(iff.paths['a.module.css']),
          textChanges: [{ start: { line: 3, offset: 10 }, end: { line: 3, offset: 24 }, newText: '@/dd.module.css' }],
        },
      ],
    },
  ])('for $name', async ({ oldFilePath, newFilePath, expected }) => {
    const res = await tsserver.sendGetEditsForFileRename({ oldFilePath, newFilePath });
    expect(res.body).toStrictEqual(expected);
  });
});
