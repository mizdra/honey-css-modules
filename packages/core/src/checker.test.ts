import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { checkCSSModule } from './checker.js';
import type { CSSModuleFile } from './parser/css-module-parser.js';
import type { Resolver } from './resolver.js';

const resolver: Resolver = (specifier, options) => resolve(options.request, '..', specifier);

describe('checkCSSModule', () => {
  test('returns diagnostics if a file does not exist', () => {
    const cssModule: CSSModuleFile = {
      fileName: '/a.module.css',
      localTokens: [],
      tokenImporters: [
        {
          type: 'import',
          from: './b.module.css', // exists
          fromLoc: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 2, offset: 1 },
          },
        },
        {
          type: 'import',
          from: './c.module.css', // non-existent and external
          fromLoc: {
            start: { line: 1, column: 3, offset: 2 },
            end: { line: 1, column: 4, offset: 3 },
          },
        },
        {
          type: 'import',
          from: './d.module.css', // non-existent
          fromLoc: {
            start: { line: 1, column: 5, offset: 4 },
            end: { line: 1, column: 6, offset: 5 },
          },
        },
      ],
    };
    const isExternalFile = (path: string) => path === '/c.module.css';
    const fileExists = (path: string) => path === '/b.module.css';
    const diagnostics = checkCSSModule(cssModule, resolver, isExternalFile, fileExists);
    expect(diagnostics).toMatchInlineSnapshot(`
      [
        {
          "category": "error",
          "end": {
            "column": 6,
            "line": 1,
          },
          "fileName": "/a.module.css",
          "start": {
            "column": 5,
            "line": 1,
          },
          "text": "Cannot find module './d.module.css'.",
          "type": "semantic",
        },
      ]
    `);
  });
});
