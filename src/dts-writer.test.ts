import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import dedent from 'dedent';
import { describe, expect, test } from 'vitest';
import { getDtsFilePath, writeDtsFile } from './dts-writer.js';
import { WriteDtsFileError } from './error.js';
import { createIFF } from './test/fixture.js';

describe('getDtsFilePath', () => {
  const options = { cwd: '/app', outDir: 'dist', arbitraryExtensions: false };
  test('cwd', () => {
    expect(getDtsFilePath('/app1/src/dir/a.module.css', { ...options, cwd: '/app1' })).toBe(
      resolve('/app1/dist/src/dir/a.module.css.d.ts'),
    );
  });
  test('outDir', () => {
    expect(getDtsFilePath('/app/src/dir/a.module.css', { ...options, outDir: 'dist/dir' })).toBe(
      resolve('/app/dist/dir/src/dir/a.module.css.d.ts'),
    );
  });
  test('arbitraryExtensions', () => {
    expect(getDtsFilePath('/app/src/dir/a.module.css', { ...options, arbitraryExtensions: true })).toBe(
      resolve('/app/dist/src/dir/a.module.d.css.ts'),
    );
  });
});

describe('writeDtsFile', () => {
  test('writes a d.ts file', async () => {
    const iff = await createIFF({});
    await writeDtsFile(
      dedent`
        declare const styles: { local1: string };
        export default styles;
      `,
      iff.join('src/a.module.css'),
      {
        outDir: iff.join('generated'),
        cwd: iff.rootDir,
        arbitraryExtensions: false,
      },
    );
    expect(await readFile(iff.join('generated/src/a.module.css.d.ts'), 'utf-8')).toMatchInlineSnapshot(`
      "declare const styles: { local1: string };
      export default styles;"
    `);
  });
  test('throws an error when the file cannot be written', async () => {
    const iff = await createIFF({
      // A directory exists at the same path
      'generated/src/a.module.css.d.ts': {},
    });
    await expect(
      writeDtsFile(
        dedent`
          declare const styles: { local1: string };
          export default styles;
        `,
        iff.join('src/a.module.css'),
        {
          outDir: iff.join('generated'),
          cwd: iff.rootDir,
          arbitraryExtensions: false,
        },
      ),
    ).rejects.toThrow(WriteDtsFileError);
  });
});
