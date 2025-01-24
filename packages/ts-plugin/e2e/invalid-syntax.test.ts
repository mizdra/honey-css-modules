import dedent from 'dedent';
import { expect, test } from 'vitest';
import { createIFF } from './test/fixture.js';
import { formatPath, launchTsserver, simplifyDefinitions, sortDefinitions } from './test/tsserver.js';

test('handle invalid syntax CSS without crashing', async () => {
  const tsserver = launchTsserver();
  const iff = await createIFF({
    'index.ts': dedent`
      import styles from './a.module.css';
      styles.a_1;
    `,
    'a.module.css': dedent`
      .a_1 { color: red; }
      .a_2 {
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
    openFiles: [{ file: iff.paths['index.ts'] }],
  });
  const res = await tsserver.sendDefinitionAndBoundSpan({
    file: iff.paths['index.ts'],
    line: 2,
    offset: 8,
  });
  const expected = [
    {
      file: formatPath(iff.paths['a.module.css']),
      start: { line: 1, offset: 2 },
      end: { line: 1, offset: 5 },
    },
  ];
  expect(sortDefinitions(simplifyDefinitions(res.body?.definitions ?? []))).toStrictEqual(sortDefinitions(expected));
});
