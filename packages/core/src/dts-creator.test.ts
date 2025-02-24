import { describe, expect, test } from 'vitest';
import { createDts, type CreateDtsOptions } from './dts-creator.js';
import { dirname, join } from './path.js';

const options: CreateDtsOptions = {
  resolver: (specifier, { request }) => join(dirname(request), specifier),
  matchesPattern: () => true,
};

function fakeLoc(offset: number) {
  return { start: offset, end: offset };
}

describe('createDts', () => {
  test('creates d.ts file if css module file has no tokens', () => {
    expect(
      createDts(
        {
          fileName: '/test.module.css',
          localTokens: [],
          tokenImporters: [],
          text: '',
        },
        options,
      ),
    ).toMatchInlineSnapshot(`
      {
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
        "text": "declare const styles = {};
      export default styles;
      ",
      }
    `);
  });
  test('creates d.ts file with local tokens', () => {
    expect(
      createDts(
        {
          fileName: '/test.module.css',
          localTokens: [
            {
              name: 'local1',
              loc: fakeLoc(0),
            },
            { name: 'local2', loc: fakeLoc(1) },
          ],
          tokenImporters: [],
          text: '',
        },
        options,
      ),
    ).toMatchInlineSnapshot(`
      {
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
            1,
          ],
        },
        "text": "declare const styles = {
        local1: '' as readonly string,
        local2: '' as readonly string,
      };
      export default styles;
      ",
      }
    `);
  });
  test('creates d.ts file with token importers', () => {
    expect(
      createDts(
        {
          fileName: '/test.module.css',
          localTokens: [],
          tokenImporters: [
            { type: 'import', from: './a.module.css', fromLoc: fakeLoc(0) },
            {
              type: 'value',
              values: [{ name: 'imported1', loc: fakeLoc(1) }],
              from: './b.module.css',
              fromLoc: fakeLoc(2),
            },
            {
              type: 'value',
              values: [
                {
                  localName: 'aliasedImported2',
                  localLoc: fakeLoc(3),
                  name: 'imported2',
                  loc: fakeLoc(4),
                },
              ],
              from: './c.module.css',
              fromLoc: fakeLoc(5),
            },
          ],
          text: '',
        },
        options,
      ),
    ).toMatchInlineSnapshot(`
      {
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
            44,
            74,
            99,
            126,
            139,
            171,
            198,
          ],
          "lengths": [
            16,
            9,
            16,
            9,
            16,
            16,
            9,
          ],
          "sourceOffsets": [
            -1,
            1,
            1,
            1,
            3,
            4,
            4,
          ],
        },
        "text": "declare const styles = {
        ...(await import('./a.module.css')).default,
        imported1: (await import('./b.module.css')).default.imported1,
        aliasedImported2: (await import('./c.module.css')).default.imported2,
      };
      export default styles;
      ",
      }
    `);
  });
  test('creates types in the order of local tokens and token importers', () => {
    expect(
      createDts(
        {
          fileName: '/test.module.css',
          localTokens: [{ name: 'local1', loc: fakeLoc(0) }],
          tokenImporters: [{ type: 'import', from: './a.module.css', fromLoc: fakeLoc(1) }],
          text: '',
        },
        options,
      ),
    ).toMatchInlineSnapshot(`
      {
        "linkedCodeMapping": {
          "generatedLengths": [],
          "generatedOffsets": [],
          "lengths": [],
          "sourceOffsets": [],
        },
        "mapping": {
          "generatedOffsets": [
            27,
            77,
          ],
          "lengths": [
            6,
            16,
          ],
          "sourceOffsets": [
            0,
            0,
          ],
        },
        "text": "declare const styles = {
        local1: '' as readonly string,
        ...(await import('./a.module.css')).default,
      };
      export default styles;
      ",
      }
    `);
  });
  test('resolves specifiers', () => {
    const resolver = (specifier: string) => specifier.replace('@', '/src');
    expect(
      createDts(
        {
          fileName: '/src/test.module.css',
          localTokens: [],
          tokenImporters: [
            { type: 'import', from: '@/a.module.css', fromLoc: fakeLoc(0) },
            {
              type: 'value',
              values: [{ name: 'imported1', loc: fakeLoc(1) }],
              from: '@/b.module.css',
              fromLoc: fakeLoc(2),
            },
            {
              type: 'value',
              values: [
                {
                  localName: 'aliasedImported2',
                  localLoc: fakeLoc(3),
                  name: 'imported2',
                  loc: fakeLoc(4),
                },
              ],
              from: '@/c.module.css',
              fromLoc: fakeLoc(5),
            },
          ],
          text: '',
        },
        { ...options, resolver },
      ),
    ).toMatchInlineSnapshot(`
      {
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
            44,
            74,
            99,
            126,
            139,
            171,
            198,
          ],
          "lengths": [
            16,
            9,
            16,
            9,
            16,
            16,
            9,
          ],
          "sourceOffsets": [
            -1,
            1,
            1,
            1,
            3,
            4,
            4,
          ],
        },
        "text": "declare const styles = {
        ...(await import('@/a.module.css')).default,
        imported1: (await import('@/b.module.css')).default.imported1,
        aliasedImported2: (await import('@/c.module.css')).default.imported2,
      };
      export default styles;
      ",
      }
    `);
  });
  test('does not create types for external files', () => {
    expect(
      createDts(
        {
          fileName: '/test.module.css',
          localTokens: [],
          tokenImporters: [
            { type: 'import', from: 'external.css', fromLoc: fakeLoc(0) },
            {
              type: 'value',
              values: [
                {
                  localName: 'imported',
                  localLoc: fakeLoc(1),
                  name: 'imported',
                  loc: fakeLoc(2),
                },
              ],
              from: 'external.css',
              fromLoc: fakeLoc(3),
            },
          ],
          text: '',
        },
        { ...options, matchesPattern: () => false },
      ),
    ).toMatchInlineSnapshot(`
      {
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
        "text": "declare const styles = {};
      export default styles;
      ",
      }
    `);
  });
  test('does not create types for unresolved files', () => {
    const resolver = (_specifier: string) => undefined;
    expect(
      createDts(
        {
          fileName: '/src/test.module.css',
          localTokens: [],
          tokenImporters: [{ type: 'import', from: '@/a.module.css', fromLoc: fakeLoc(0) }],
          text: '',
        },
        { ...options, resolver },
      ),
    ).toMatchInlineSnapshot(`
      {
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
        "text": "declare const styles = {};
      export default styles;
      ",
      }
    `);
  });
});
