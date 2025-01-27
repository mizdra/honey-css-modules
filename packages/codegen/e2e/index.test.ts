import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import dedent from 'dedent';
import { expect, test } from 'vitest';
import { createIFF } from '../src/test/fixture.js';

const binPath = join(__dirname, '../bin/hcm.mjs');

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
    "declare const styles = {
      a1: '' as readonly string,
      ...(await import('./b.module.css')).default,
      ...(await import('@/c.module.css')).default,
    };
    export default styles;
    "
  `);
  expect(await readFile(iff.join('dist/src/b.module.css.d.ts'), 'utf-8')).toMatchInlineSnapshot(`
    "declare const styles = {
      b1: '' as readonly string,
    };
    export default styles;
    "
  `);
  expect(await readFile(iff.join('dist/src/c.module.css.d.ts'), 'utf-8')).toMatchInlineSnapshot(`
    "declare const styles = {
      c1: '' as readonly string,
    };
    export default styles;
    "
  `);
});

test('reports system error', async () => {
  const iff = await createIFF({});
  const hcm = spawnSync('node', [binPath], {
    cwd: iff.rootDir,
  });
  expect(hcm.status).toBe(1);
  expect(hcm.stderr.toString()).toMatchInlineSnapshot(`
    "error CONFIG_NOT_FOUND: No config file found. Did you forget to create hcm.config.{js,mjs,cjs}?
    "
  `);
});
