import { describe, expect, test } from 'vitest';
import { checkCSSModule } from './checker.js';
import type { CSSModule } from './parser/css-module-parser.js';
import { createResolver } from './resolver.js';
import { createAtImportTokenImporter, createAtValueTokenImporter } from './test/token.js';

const resolver = createResolver({});

describe('checkCSSModule', () => {
  test('report diagnostics for non-existing module', () => {
    const cssModule: CSSModule = {
      fileName: '/a.module.css',
      localTokens: [],
      tokenImporters: [
        createAtImportTokenImporter('./b.module.css'),
        createAtValueTokenImporter('./c.module.css', ['c_1']),
      ],
      text: '',
    };
    const exportBuilder = {
      build: () => ({ allTokens: [] }),
    };
    const matchesPattern = () => true;
    const getCSSModule = () => undefined;
    const diagnostics = checkCSSModule(cssModule, exportBuilder, matchesPattern, resolver, getCSSModule);
    expect(diagnostics).toMatchInlineSnapshot(`
      [
        {
          "category": "error",
          "end": {
            "column": 1,
            "line": 1,
          },
          "fileName": "/a.module.css",
          "start": {
            "column": 1,
            "line": 1,
          },
          "text": "Cannot import module './b.module.css'",
          "type": "semantic",
        },
        {
          "category": "error",
          "end": {
            "column": 1,
            "line": 1,
          },
          "fileName": "/a.module.css",
          "start": {
            "column": 1,
            "line": 1,
          },
          "text": "Cannot import module './c.module.css'",
          "type": "semantic",
        },
      ]
    `);
  });
  test('report diagnostics for non-exported token', () => {
    const cssModule: CSSModule = {
      fileName: '/a.module.css',
      localTokens: [],
      tokenImporters: [createAtValueTokenImporter('./b.module.css', ['b_1', 'b_2'])],
      text: '',
    };
    const exportBuilder = {
      build: () => ({ allTokens: ['b_1'] }),
    };
    const matchesPattern = () => true;
    const getCSSModule = () => cssModule;
    const diagnostics = checkCSSModule(cssModule, exportBuilder, matchesPattern, resolver, getCSSModule);
    expect(diagnostics).toMatchInlineSnapshot(`
      [
        {
          "category": "error",
          "end": {
            "column": 1,
            "line": 1,
          },
          "fileName": "/a.module.css",
          "start": {
            "column": 1,
            "line": 1,
          },
          "text": "Module './b.module.css' has no exported token 'b_2'.",
          "type": "semantic",
        },
      ]
    `);
  });
  test('ignore token importers for unresolvable modules', () => {
    const cssModule: CSSModule = {
      fileName: '/a.module.css',
      localTokens: [],
      tokenImporters: [createAtImportTokenImporter('./unresolvable.module.css')],
      text: '',
    };
    const exportBuilder = {
      build: () => ({ allTokens: [] }),
    };
    const matchesPattern = () => true;
    const resolver = () => undefined;
    const getCSSModule = () => undefined;
    const diagnostics = checkCSSModule(cssModule, exportBuilder, matchesPattern, resolver, getCSSModule);
    expect(diagnostics).toEqual([]);
  });
  test('ignore token importers that do not match the pattern', () => {
    const cssModule: CSSModule = {
      fileName: '/a.module.css',
      localTokens: [],
      tokenImporters: [
        createAtImportTokenImporter('./b.module.css'),
        createAtValueTokenImporter('./c.module.css', ['c_1']),
      ],
      text: '',
    };
    const exportBuilder = {
      build: () => ({ allTokens: [] }),
    };
    const matchesPattern = () => false;
    const getCSSModule = () => undefined;
    const diagnostics = checkCSSModule(cssModule, exportBuilder, matchesPattern, resolver, getCSSModule);
    expect(diagnostics).toEqual([]);
  });
});
