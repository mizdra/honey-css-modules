import { describe, expect, test } from 'vitest';
import { createDtsCode, type CreateDtsCodeOptions } from './dts-creator.js';

const options: CreateDtsCodeOptions = {
  isExternalFile: () => false,
};

describe('createDtsCode', () => {
  test('creates d.ts file if css module file has no tokens', () => {
    expect(
      createDtsCode(
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
  test('creates d.ts file with local tokens', () => {
    expect(
      createDtsCode(
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
  test('creates d.ts file with token importers', () => {
    expect(
      createDtsCode(
        {
          filename: '/test.module.css',
          localTokens: [],
          tokenImporters: [
            { type: 'import', specifier: './a.module.css' },
            { type: 'import', specifier: './dir/b.module.css' },
            { type: 'value', specifier: './c.module.css', importedName: 'imported1', localName: 'imported1' },
            { type: 'value', specifier: './d.module.css', importedName: 'imported2', localName: 'aliasedImported2' },
          ],
        },
        options,
      ),
    ).toMatchInlineSnapshot(`
      "declare const styles: Readonly<
        & (typeof import('./a.module.css'))['default']
        & (typeof import('./dir/b.module.css'))['default']
        & { imported1: (typeof import('./c.module.css'))['default']['imported1'] }
        & { aliasedImported2: (typeof import('./d.module.css'))['default']['imported2'] }
      >;
      export default styles;
      "
    `);
  });
  test('creates types in the order of local tokens and token importers', () => {
    expect(
      createDtsCode(
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
  test('does not create types for external files', () => {
    expect(
      createDtsCode(
        {
          filename: '/test.module.css',
          localTokens: [],
          tokenImporters: [
            { type: 'import', specifier: 'external.css' },
            { type: 'value', specifier: 'external.css', importedName: 'imported', localName: 'imported' },
          ],
        },
        { ...options, isExternalFile: (specifier) => specifier === 'external.css' },
      ),
    ).toMatchInlineSnapshot(`
      "declare const styles: Readonly<{}>;
      export default styles;
      "
    `);
  });
});
