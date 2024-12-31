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
            { type: 'import', from: './a.module.css' },
            { type: 'value', from: './b.module.css', name: 'imported1' },
            { type: 'value', from: './c.module.css', name: 'imported2', localName: 'aliasedImported2' },
          ],
        },
        options,
      ),
    ).toMatchInlineSnapshot(`
      {
        "code": "declare const styles: Readonly<
        & (typeof import('./a.module.css'))['default']
        & Pick<(typeof import('./b.module.css'))['default'], 'imported1'>
        & Pick<(typeof import('./c.module.css'))['default'], 'imported2'>
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
          localTokens: [{ name: 'local1', loc: { start: { line: 1, column: 1, offset: 0 }, end: dummyPos } }],
          tokenImporters: [{ type: 'import', from: './a.module.css' }],
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
          "generatedOffsets": [
            38,
          ],
          "lengths": [
            6,
          ],
          "sourceOffsets": [
            0,
          ],
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
            { type: 'import', from: '@/a.module.css' },
            { type: 'value', from: '@/b.module.css', name: 'imported1' },
            {
              type: 'value',
              from: '@/c.module.css',
              name: 'imported2',
              localName: 'aliasedImported2',
              localLoc: { start: { line: 1, column: 1, offset: 0 }, end: dummyPos },
            },
          ],
        },
        { ...options, resolver },
      ),
    ).toMatchInlineSnapshot(`
      {
        "code": "declare const styles: Readonly<
        & (typeof import('./a.module.css'))['default']
        & Pick<(typeof import('./b.module.css'))['default'], 'imported1'>
        & { aliasedImported2: (typeof import('./c.module.css'))['default']['imported2'] }
      >;
      export default styles;
      ",
        "mapping": {
          "generatedOffsets": [
            155,
          ],
          "lengths": [
            16,
          ],
          "sourceOffsets": [
            0,
          ],
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
            { type: 'import', from: 'external.css' },
            { type: 'value', from: 'external.css', name: 'imported', localName: 'imported' },
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
          tokenImporters: [{ type: 'import', from: '@/a.module.css' }],
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
