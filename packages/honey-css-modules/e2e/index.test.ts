import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import dedent from 'dedent';
import { expect, test } from 'vitest';
import { createIFF } from '../src/test/fixture.js';

const binPath = join(import.meta.dirname, '../bin/hcm.js');

test('generates .d.ts', async () => {
  const iff = await createIFF({
    'src/a.module.css': dedent`
      @import './b.module.css';
      @import './external.css';
      @import '@/c.module.css';
      .a1 { color: red; }
    `,
    'src/b.module.css': `.b1 { color: red; }`,
    'src/c.module.css': `.c1 { color: red; }`,
    'hcm.config.mjs': dedent`
      export default {
        pattern: 'src/**/*.module.css',
        dtsOutDir: 'dist',
        alias: { '@': 'src' },
      };
    `,
  });
  const hcm = spawnSync('node', [binPath], {
    cwd: iff.rootDir,
    // MEMO: Suppress ExperimentalWarning output from `fs.promises.glob` and `path.matchesGlob`
    // TODO: Remove `--no-warnings=ExperimentalWarning`
    env: { ...process.env, NODE_OPTIONS: '--no-warnings=ExperimentalWarning' },
  });
  expect(hcm.error).toBeUndefined();
  expect(hcm.stderr.toString()).toBe('');
  expect(hcm.status).toBe(0);
  expect(await readFile(iff.join('dist/src/a.module.css.d.ts'), 'utf-8')).toMatchInlineSnapshot(`
    "declare const styles: Readonly<
      & { a1: string }
      & (typeof import('./b.module.css'))['default']
      & (typeof import('./c.module.css'))['default']
    >;
    export default styles;
    "
  `);
  expect(await readFile(iff.join('dist/src/b.module.css.d.ts'), 'utf-8')).toMatchInlineSnapshot(`
    "declare const styles: Readonly<
      & { b1: string }
    >;
    export default styles;
    "
  `);
  expect(await readFile(iff.join('dist/src/c.module.css.d.ts'), 'utf-8')).toMatchInlineSnapshot(`
    "declare const styles: Readonly<
      & { c1: string }
    >;
    export default styles;
    "
  `);
});
