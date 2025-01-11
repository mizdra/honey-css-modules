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
        "code": "declare const styles = {};
      export default styles;
      ",
        "linkedCodeMapping": {
          "generatedLengths": [],
          "generatedOffsets": [],
          "lengths": [],
          "sourceOffsets": [],
        },
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
        "code": "declare const styles = {
        local1: '' as readonly string,
        local2: '' as readonly string,
      };
      export default styles;
      ",
        "linkedCodeMapping": {
          "generatedLengths": [],
          "generatedOffsets": [],
          "lengths": [],
          "sourceOffsets": [],
        },
        "mapping": {
          "generatedOffsets": [
            27,
            60,
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
            {
              type: 'value',
              from: './b.module.css',
              values: [{ name: 'imported1', loc: { start: { line: 1, column: 1, offset: 0 }, end: dummyPos } }],
            },
            {
              type: 'value',
              from: './c.module.css',
              values: [
                {
                  name: 'imported2',
                  loc: { start: { line: 1, column: 2, offset: 1 }, end: dummyPos },
                  localName: 'aliasedImported2',
                  localLoc: { start: { line: 1, column: 3, offset: 2 }, end: dummyPos },
                },
              ],
            },
          ],
        },
        options,
      ),
    ).toMatchInlineSnapshot(`
      {
        "code": "declare const styles = {
        ...(await import('./a.module.css')).default,
        imported1: (await import('./b.module.css')).default.imported1,
        aliasedImported2: (await import('./c.module.css')).default.imported2,
      };
      export default styles;
      ",
        "linkedCodeMapping": {
          "generatedLengths": [
            9,
            9,
          ],
          "generatedOffsets": [
            126,
            198,
          ],
          "lengths": [
            9,
            16,
          ],
          "sourceOffsets": [
            74,
            139,
          ],
        },
        "mapping": {
          "generatedOffsets": [
            74,
            126,
            139,
            198,
          ],
          "lengths": [
            9,
            9,
            16,
            9,
          ],
          "sourceOffsets": [
            0,
            0,
            2,
            1,
          ],
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
        "code": "declare const styles = {
        local1: '' as readonly string,
        ...(await import('./a.module.css')).default,
      };
      export default styles;
      ",
        "linkedCodeMapping": {
          "generatedLengths": [],
          "generatedOffsets": [],
          "lengths": [],
          "sourceOffsets": [],
        },
        "mapping": {
          "generatedOffsets": [
            27,
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
            {
              type: 'value',
              from: '@/b.module.css',
              values: [{ name: 'imported1', loc: { start: { line: 1, column: 1, offset: 0 }, end: dummyPos } }],
            },
            {
              type: 'value',
              from: '@/c.module.css',
              values: [
                {
                  name: 'imported2',
                  loc: { start: { line: 1, column: 2, offset: 1 }, end: dummyPos },
                  localName: 'aliasedImported2',
                  localLoc: { start: { line: 1, column: 3, offset: 2 }, end: dummyPos },
                },
              ],
            },
          ],
        },
        { ...options, resolver },
      ),
    ).toMatchInlineSnapshot(`
      {
        "code": "declare const styles = {
        ...(await import('./a.module.css')).default,
        imported1: (await import('./b.module.css')).default.imported1,
        aliasedImported2: (await import('./c.module.css')).default.imported2,
      };
      export default styles;
      ",
        "linkedCodeMapping": {
          "generatedLengths": [
            9,
            9,
          ],
          "generatedOffsets": [
            126,
            198,
          ],
          "lengths": [
            9,
            16,
          ],
          "sourceOffsets": [
            74,
            139,
          ],
        },
        "mapping": {
          "generatedOffsets": [
            74,
            126,
            139,
            198,
          ],
          "lengths": [
            9,
            9,
            16,
            9,
          ],
          "sourceOffsets": [
            0,
            0,
            2,
            1,
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
            {
              type: 'value',
              from: 'external.css',
              values: [
                {
                  name: 'imported',
                  loc: { start: { line: 1, column: 1, offset: 0 }, end: dummyPos },
                  localName: 'imported',
                  localLoc: { start: { line: 1, column: 2, offset: 1 }, end: dummyPos },
                },
              ],
            },
          ],
        },
        { ...options, isExternalFile: () => true },
      ),
    ).toMatchInlineSnapshot(`
      {
        "code": "declare const styles = {};
      export default styles;
      ",
        "linkedCodeMapping": {
          "generatedLengths": [],
          "generatedOffsets": [],
          "lengths": [],
          "sourceOffsets": [],
        },
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
        "code": "declare const styles = {};
      export default styles;
      ",
        "linkedCodeMapping": {
          "generatedLengths": [],
          "generatedOffsets": [],
          "lengths": [],
          "sourceOffsets": [],
        },
        "mapping": {
          "generatedOffsets": [],
          "lengths": [],
          "sourceOffsets": [],
        },
      }
    `);
  });
});
