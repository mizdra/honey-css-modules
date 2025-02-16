import { describe, expect, test } from 'vitest';
import { createExportBuilder } from './export-builder.js';
import type { CSSModule } from './parser/css-module-parser.js';
import { resolve } from './path.js';
import { createResolver } from './resolver.js';
import { createAtImportTokenImporter, createAtValueTokenImporter, createToken } from './test/token.js';

const resolver = createResolver({});

describe('ExportBuilder', () => {
  test('build export record', () => {
    const exportBuilder = createExportBuilder({
      getCSSModule: () => undefined,
      matchesPattern: () => true,
      resolver: () => undefined,
    });
    const cssModule: CSSModule = {
      fileName: resolve('/a.css'),
      localTokens: [createToken('a_1')],
      tokenImporters: [],
    };
    expect(exportBuilder.build(cssModule)).toMatchInlineSnapshot(`
      {
        "allTokens": [
          "a_1",
        ],
      }
    `);
  });
  test('collect all tokens from imported modules', () => {
    const exportBuilder = createExportBuilder({
      getCSSModule: (path) => {
        if (path === resolve('/b.module.css')) {
          return {
            fileName: resolve('/b.module.css'),
            localTokens: [createToken('b_1')],
            tokenImporters: [],
          };
        } else if (path === resolve('/c.module.css')) {
          return {
            fileName: resolve('/c.module.css'),
            localTokens: [createToken('c_1'), createToken('c_2')],
            tokenImporters: [],
          };
        } else {
          return undefined;
        }
      },
      matchesPattern: (path) => {
        return (
          path === resolve('/a.module.css') || path === resolve('/b.module.css') || path === resolve('/c.module.css')
        );
      },
      resolver,
    });
    const cssModule: CSSModule = {
      fileName: resolve('/a.module.css'),
      localTokens: [createToken('a_1')],
      tokenImporters: [
        createAtImportTokenImporter('./b.module.css'),
        createAtValueTokenImporter('./c.module.css', ['c_1']),
      ],
    };
    expect(exportBuilder.build(cssModule)).toMatchInlineSnapshot(`
      {
        "allTokens": [
          "a_1",
          "b_1",
          "c_1",
        ],
      }
    `);
  });
  test('collect all tokens from imported modules recursively', () => {
    const exportBuilder = createExportBuilder({
      getCSSModule: (path) => {
        if (path === resolve('/b.module.css')) {
          return {
            fileName: resolve('/b.module.css'),
            localTokens: [createToken('b_1')],
            tokenImporters: [createAtImportTokenImporter('./c.module.css')],
          };
        } else if (path === resolve('/c.module.css')) {
          return {
            fileName: resolve('/c.module.css'),
            localTokens: [createToken('c_1')],
            tokenImporters: [],
          };
        } else {
          return undefined;
        }
      },
      matchesPattern: (path) => {
        return (
          path === resolve('/a.module.css') || path === resolve('/b.module.css') || path === resolve('/c.module.css')
        );
      },
      resolver,
    });
    const cssModule: CSSModule = {
      fileName: resolve('/a.module.css'),
      localTokens: [createToken('a_1')],
      tokenImporters: [createAtImportTokenImporter('./b.module.css')],
    };
    expect(exportBuilder.build(cssModule)).toMatchInlineSnapshot(`
      {
        "allTokens": [
          "a_1",
          "b_1",
          "c_1",
        ],
      }
    `);
  });
  test('do not collect tokens from unresolvable modules', () => {
    const exportBuilder = createExportBuilder({
      getCSSModule: () => undefined,
      matchesPattern: () => true,
      resolver: () => undefined,
    });
    const cssModule: CSSModule = {
      fileName: resolve('/a.module.css'),
      localTokens: [],
      tokenImporters: [createAtImportTokenImporter('./unresolvable.module.css')],
    };
    expect(exportBuilder.build(cssModule)).toMatchInlineSnapshot(`
      {
        "allTokens": [],
      }
    `);
  });
  test('do not collect tokens from modules that do not match the pattern', () => {
    const exportBuilder = createExportBuilder({
      getCSSModule: () => undefined,
      matchesPattern: (path) => path !== resolve('/b.module.css'),
      resolver,
    });
    const cssModule: CSSModule = {
      fileName: resolve('/a.module.css'),
      localTokens: [],
      tokenImporters: [createAtImportTokenImporter('./b.module.css')],
    };
    expect(exportBuilder.build(cssModule)).toMatchInlineSnapshot(`
      {
        "allTokens": [],
      }
    `);
  });
  test('do not collect tokens from non-existing modules', () => {
    const exportBuilder = createExportBuilder({
      getCSSModule: () => undefined,
      matchesPattern: () => true,
      resolver,
    });
    const cssModule: CSSModule = {
      fileName: resolve('/a.module.css'),
      localTokens: [],
      tokenImporters: [createAtImportTokenImporter('./non-existing.module.css')],
    };
    expect(exportBuilder.build(cssModule)).toMatchInlineSnapshot(`
      {
        "allTokens": [],
      }
    `);
  });
});
