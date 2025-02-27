import { spawnSync } from 'node:child_process';
import { join } from '@css-modules-kit/core';
import dedent from 'dedent';
import { expect, test } from 'vitest';
import { createIFF } from '../src/test/fixture.js';

const binPath = join(__dirname, '../bin/cmk.mjs');

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
    'tsconfig.json': dedent`
      {
        "compilerOptions": {
          "paths": { "@/*": ["./src/*"] }
        },
        "cmkOptions": {
          "dtsOutDir": "dist"
        }
      }
    `,
  });
  const cmk = spawnSync('node', [binPath], {
    cwd: iff.rootDir,
  });
  expect(cmk.error).toBeUndefined();
  expect(cmk.stderr.toString()).toBe('');
  expect(cmk.status).toBe(0);
  expect(await iff.readFile('dist/src/a.module.css.d.ts')).toMatchInlineSnapshot(`
    "declare const styles = {
      a1: '' as readonly string,
      ...(await import('./b.module.css')).default,
      ...(await import('@/c.module.css')).default,
    };
    export default styles;
    "
  `);
  expect(await iff.readFile('dist/src/b.module.css.d.ts')).toMatchInlineSnapshot(`
    "declare const styles = {
      b1: '' as readonly string,
    };
    export default styles;
    "
  `);
  expect(await iff.readFile('dist/src/c.module.css.d.ts')).toMatchInlineSnapshot(`
    "declare const styles = {
      c1: '' as readonly string,
    };
    export default styles;
    "
  `);
});

test('reports system error', async () => {
  const iff = await createIFF({});
  const cmk = spawnSync('node', [binPath], {
    cwd: iff.rootDir,
  });
  expect(cmk.status).toBe(1);
  expect(cmk.stderr.toString()).toMatchInlineSnapshot(`
    "error TS_CONFIG_NOT_FOUND: No tsconfig.json found.
    "
  `);
});

test('generates .d.ts with circular import', async () => {
  const iff = await createIFF({
    'src/a.module.css': dedent`
      @import './b.module.css';
      .a1 { color: red; }
    `,
    'src/b.module.css': dedent`
      @import './a.module.css';
      .b1 { color: red; }
    `,
    'src/c.module.css': dedent`
      @import './c.module.css';
      .c1 { color: red; }
    `,
    'tsconfig.json': dedent`
      {
        "cmkOptions": {
          "dtsOutDir": "dist"
        }
      }
    `,
  });
  const cmk = spawnSync('node', [binPath], {
    cwd: iff.rootDir,
  });
  expect(cmk.error).toBeUndefined();
  expect(cmk.stderr.toString()).toBe('');
  expect(cmk.status).toBe(0);
  expect(await iff.readFile('dist/src/a.module.css.d.ts')).toMatchInlineSnapshot(`
    "declare const styles = {
      a1: '' as readonly string,
      ...(await import('./b.module.css')).default,
    };
    export default styles;
    "
  `);
  expect(await iff.readFile('dist/src/b.module.css.d.ts')).toMatchInlineSnapshot(`
    "declare const styles = {
      b1: '' as readonly string,
      ...(await import('./a.module.css')).default,
    };
    export default styles;
    "
  `);
  expect(await iff.readFile('dist/src/c.module.css.d.ts')).toMatchInlineSnapshot(`
    "declare const styles = {
      c1: '' as readonly string,
      ...(await import('./c.module.css')).default,
    };
    export default styles;
    "
  `);
});
