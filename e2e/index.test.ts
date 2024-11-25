import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { createIFF } from '../src/test/fixture.js';

const binPath = join(import.meta.dirname, '../bin/hcm.js');

test('generates .d.ts', async () => {
  const iff = await createIFF({
    'src/a.module.css': `.a1 { color: red; }`,
    'src/b.module.css': `.b1 { color: red; }`,
    'hcm.config.mjs': `export default { pattern: 'src/**/*.css', dtsOutDir: 'dist' };`,
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
});
