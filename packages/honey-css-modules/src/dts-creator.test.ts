import { dirname, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { createDts, type CreateDtsOptions } from './dts-creator.js';

const options: CreateDtsOptions = {
  resolver: (specifier, { request }) => resolve(dirname(request), specifier),
  isExternalFile: () => false,
};

const dummyPos = { line: 1, column: 1, offset: 0 };

describe('createDts', () => {
  test('creates d.ts file if css module file has no tokens', () => {
    expect(
      createDts(
        {
          filename: '/test.module.css',
          localTokens: [],
          tokenImporters: [],
        },
        options,
      ),
    ).toMatchInlineSnapshot(`
      {
        "code": "declare const styles: Readonly<{}>;
      export default styles;
      ",
        "mapping": {
          "generatedOffsets": [],
          "lengths": [],
          "sourceOffsets": [],
        },
      }
    `);
  });
  test('creates d.ts file with local tokens', () => {
    expect(
      createDts(
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
      {
        "code": "declare const styles: Readonly<
        & { local1: string }
        & { local2: string }
      >;
      export default styles;
      ",
        "mapping": {
          "generatedOffsets": [],
          "lengths": [],
          "sourceOffsets": [],
        },
      }
    `);
  });
  test('includes mapping if the token has location information', () => {
    expect(
      createDts(
        {
          filename: '/test.module.css',
          localTokens: [
            {
              name: 'local1',
              loc: { start: { line: 1, column: 1, offset: 0 }, end: dummyPos },
            },
            { name: 'local2', loc: { start: { line: 2, column: 1, offset: 10 }, end: dummyPos } },
          ],
          tokenImporters: [],
        },
        options,
      ),
    ).toMatchInlineSnapshot(`
      {
        "code": "declare const styles: Readonly<
        & { local1: string }
        & { local2: string }
      >;
      export default styles;
      ",
        "mapping": {
          "generatedOffsets": [
            38,
            61,
          ],
          "lengths": [
            6,
            6,
          ],
          "sourceOffsets": [
            0,
            10,
          ],
        },
      }
    `);
  });
  test('creates d.ts file with token importers', () => {
    expect(
      createDts(
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
      {
        "code": "declare const styles: Readonly<
        & (typeof import('./a.module.css'))['default']
        & { imported1: (typeof import('./b.module.css'))['default']['imported1'] }
        & { aliasedImported2: (typeof import('./c.module.css'))['default']['imported2'] }
      >;
      export default styles;
      ",
        "mapping": {
          "generatedOffsets": [],
          "lengths": [],
          "sourceOffsets": [],
        },
      }
    `);
  });
  test('creates types in the order of local tokens and token importers', () => {
    expect(
      createDts(
        {
          filename: '/test.module.css',
          localTokens: [{ name: 'local1', loc: undefined }],
          tokenImporters: [{ type: 'import', specifier: './a.module.css' }],
        },
        options,
      ),
    ).toMatchInlineSnapshot(`
      {
        "code": "declare const styles: Readonly<
        & { local1: string }
        & (typeof import('./a.module.css'))['default']
      >;
      export default styles;
      ",
        "mapping": {
          "generatedOffsets": [],
          "lengths": [],
          "sourceOffsets": [],
        },
      }
    `);
  });
  test('resolves specifiers', () => {
    const resolver = (specifier: string) => specifier.replace('@', '/src');
    expect(
      createDts(
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
      {
        "code": "declare const styles: Readonly<
        & (typeof import('./a.module.css'))['default']
        & { imported1: (typeof import('./b.module.css'))['default']['imported1'] }
        & { aliasedImported2: (typeof import('./c.module.css'))['default']['imported2'] }
      >;
      export default styles;
      ",
        "mapping": {
          "generatedOffsets": [],
          "lengths": [],
          "sourceOffsets": [],
        },
      }
    `);
  });
  test('does not create types for external files', () => {
    expect(
      createDts(
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
      {
        "code": "declare const styles: Readonly<{}>;
      export default styles;
      ",
        "mapping": {
          "generatedOffsets": [],
          "lengths": [],
          "sourceOffsets": [],
        },
      }
    `);
  });
  test('does not create types for unresolved files', () => {
    const resolver = (_specifier: string) => undefined;
    expect(
      createDts(
        {
          filename: '/src/test.module.css',
          localTokens: [],
          tokenImporters: [{ type: 'import', specifier: '@/a.module.css' }],
        },
        { ...options, resolver },
      ),
    ).toMatchInlineSnapshot(`
      {
        "code": "declare const styles: Readonly<{}>;
      export default styles;
      ",
        "mapping": {
          "generatedOffsets": [],
          "lengths": [],
          "sourceOffsets": [],
        },
      }
    `);
  });
});
