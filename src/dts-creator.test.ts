import { dirname, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { createDtsCode, type CreateDtsCodeOptions } from './dts-creator.js';

const options: CreateDtsCodeOptions = {
  resolver: (specifier, { request }) => resolve(dirname(request), specifier),
  isExternalFile: () => false,
};

describe('createDtsCode', () => {
  test('creates d.ts file if css module file has no tokens', async () => {
    expect(
      await createDtsCode(
        {
          filename: '/test.module.css',
          localTokens: [],
          tokenImporters: [],
        },
        options,
      ),
    ).toMatchInlineSnapshot(`
      "declare const styles: Readonly<{}>;
      export default styles;
      "
    `);
  });
  test('creates d.ts file with local tokens', async () => {
    expect(
      await createDtsCode(
        {
          filename: '/test.module.css',
          localTokens: [
            { name: 'local1', loc: undefined },
            { name: 'local2', loc: undefined },
          ],
          tokenImporters: [],
        },
        options,
      ),
    ).toMatchInlineSnapshot(`
      "declare const styles: Readonly<
        & { local1: string }
        & { local2: string }
      >;
      export default styles;
      "
    `);
  });
  test('creates d.ts file with token importers', async () => {
    expect(
      await createDtsCode(
        {
          filename: '/test.module.css',
          localTokens: [],
          tokenImporters: [
            { type: 'import', specifier: './a.module.css' },
            { type: 'value', specifier: './b.module.css', importedName: 'imported1', localName: 'imported1' },
            { type: 'value', specifier: './c.module.css', importedName: 'imported2', localName: 'aliasedImported2' },
          ],
        },
        options,
      ),
    ).toMatchInlineSnapshot(`
      "declare const styles: Readonly<
        & (typeof import('./a.module.css'))['default']
        & { imported1: (typeof import('./b.module.css'))['default']['imported1'] }
        & { aliasedImported2: (typeof import('./c.module.css'))['default']['imported2'] }
      >;
      export default styles;
      "
    `);
  });
  test('creates types in the order of local tokens and token importers', async () => {
    expect(
      await createDtsCode(
        {
          filename: '/test.module.css',
          localTokens: [{ name: 'local1', loc: undefined }],
          tokenImporters: [{ type: 'import', specifier: './a.module.css' }],
        },
        options,
      ),
    ).toMatchInlineSnapshot(`
      "declare const styles: Readonly<
        & { local1: string }
        & (typeof import('./a.module.css'))['default']
      >;
      export default styles;
      "
    `);
  });
  test('resolves specifiers', async () => {
    const resolver = (specifier: string) => specifier.replace('@', '/src');
    expect(
      await createDtsCode(
        {
          filename: '/src/test.module.css',
          localTokens: [],
          tokenImporters: [
            { type: 'import', specifier: '@/a.module.css' },
            { type: 'value', specifier: '@/b.module.css', importedName: 'imported1', localName: 'imported1' },
            { type: 'value', specifier: '@/c.module.css', importedName: 'imported2', localName: 'aliasedImported2' },
          ],
        },
        { ...options, resolver },
      ),
    ).toMatchInlineSnapshot(`
      "declare const styles: Readonly<
        & (typeof import('./a.module.css'))['default']
        & { imported1: (typeof import('./b.module.css'))['default']['imported1'] }
        & { aliasedImported2: (typeof import('./c.module.css'))['default']['imported2'] }
      >;
      export default styles;
      "
    `);
  });
  test('does not create types for external files', async () => {
    expect(
      await createDtsCode(
        {
          filename: '/test.module.css',
          localTokens: [],
          tokenImporters: [
            { type: 'import', specifier: 'external.css' },
            { type: 'value', specifier: 'external.css', importedName: 'imported', localName: 'imported' },
          ],
        },
        { ...options, isExternalFile: () => true },
      ),
    ).toMatchInlineSnapshot(`
      "declare const styles: Readonly<{}>;
      export default styles;
      "
    `);
  });
});
