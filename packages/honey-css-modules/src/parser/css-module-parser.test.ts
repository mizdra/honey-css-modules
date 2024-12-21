import dedent from 'dedent';
import { describe, expect, test } from 'vitest';
import { parseCSSModuleCode, type ParseCSSModuleCodeOptions } from './css-module-parser.js';

const options: ParseCSSModuleCodeOptions = { filename: '/test.module.css', dashedIdents: false };

describe('parseCSSModuleCode', () => {
  test('collects local tokens', () => {
    const parsed = parseCSSModuleCode(
      dedent`
        .basic {}
        .cascading {}
        .cascading {}
        .pseudo_class_1 {}
        .pseudo_class_2:hover {}
        :not(.pseudo_class_3) {}
        .multiple_selector_1.multiple_selector_2 {}
        .combinator_1 + .combinator_2 {}
        @supports (display: flex) {
          @media screen and (min-width: 900px) {
            .at_rule {}
          }
        }
        .selector_list_1, .selector_list_2 {}
        :local(.local_1) {}
        @value value: #BF4040;
      `,
      options,
    );
    expect(parsed).toMatchInlineSnapshot(`
      {
        "filename": "/test.module.css",
        "localTokens": [
          {
            "loc": {
              "end": {
                "column": 6,
                "line": 1,
                "offset": 5,
              },
              "start": {
                "column": 2,
                "line": 1,
                "offset": 1,
              },
            },
            "name": "basic",
          },
          {
            "loc": {
              "end": {
                "column": 10,
                "line": 2,
                "offset": 19,
              },
              "start": {
                "column": 2,
                "line": 2,
                "offset": 11,
              },
            },
            "name": "cascading",
          },
          {
            "loc": {
              "end": {
                "column": 10,
                "line": 3,
                "offset": 33,
              },
              "start": {
                "column": 2,
                "line": 3,
                "offset": 25,
              },
            },
            "name": "cascading",
          },
          {
            "loc": {
              "end": {
                "column": 15,
                "line": 4,
                "offset": 52,
              },
              "start": {
                "column": 2,
                "line": 4,
                "offset": 39,
              },
            },
            "name": "pseudo_class_1",
          },
          {
            "loc": {
              "end": {
                "column": 15,
                "line": 5,
                "offset": 71,
              },
              "start": {
                "column": 2,
                "line": 5,
                "offset": 58,
              },
            },
            "name": "pseudo_class_2",
          },
          {
            "loc": {
              "end": {
                "column": 20,
                "line": 6,
                "offset": 101,
              },
              "start": {
                "column": 7,
                "line": 6,
                "offset": 88,
              },
            },
            "name": "pseudo_class_3",
          },
          {
            "loc": {
              "end": {
                "column": 20,
                "line": 7,
                "offset": 126,
              },
              "start": {
                "column": 2,
                "line": 7,
                "offset": 108,
              },
            },
            "name": "multiple_selector_1",
          },
          {
            "loc": {
              "end": {
                "column": 40,
                "line": 7,
                "offset": 146,
              },
              "start": {
                "column": 22,
                "line": 7,
                "offset": 128,
              },
            },
            "name": "multiple_selector_2",
          },
          {
            "loc": {
              "end": {
                "column": 13,
                "line": 8,
                "offset": 163,
              },
              "start": {
                "column": 2,
                "line": 8,
                "offset": 152,
              },
            },
            "name": "combinator_1",
          },
          {
            "loc": {
              "end": {
                "column": 29,
                "line": 8,
                "offset": 179,
              },
              "start": {
                "column": 18,
                "line": 8,
                "offset": 168,
              },
            },
            "name": "combinator_2",
          },
          {
            "loc": {
              "end": {
                "column": 12,
                "line": 11,
                "offset": 264,
              },
              "start": {
                "column": 6,
                "line": 11,
                "offset": 258,
              },
            },
            "name": "at_rule",
          },
          {
            "loc": {
              "end": {
                "column": 16,
                "line": 14,
                "offset": 290,
              },
              "start": {
                "column": 2,
                "line": 14,
                "offset": 276,
              },
            },
            "name": "selector_list_1",
          },
          {
            "loc": {
              "end": {
                "column": 34,
                "line": 14,
                "offset": 308,
              },
              "start": {
                "column": 20,
                "line": 14,
                "offset": 294,
              },
            },
            "name": "selector_list_2",
          },
          {
            "loc": {
              "end": {
                "column": 15,
                "line": 15,
                "offset": 327,
              },
              "start": {
                "column": 9,
                "line": 15,
                "offset": 321,
              },
            },
            "name": "local_1",
          },
          {
            "loc": {
              "end": {
                "column": 12,
                "line": 16,
                "offset": 344,
              },
              "start": {
                "column": 8,
                "line": 16,
                "offset": 340,
              },
            },
            "name": "value",
          },
        ],
        "tokenImporters": [],
      }
    `);
  });
  test('collects token importers', () => {
    const parsed = parseCSSModuleCode(
      dedent`
        @import './a.module.css';
        @import a, x as b from './a.module.css';
        @value c, x as d from './a.module.css';
      `,
      options,
    );
    expect(parsed).toMatchInlineSnapshot(`
      {
        "filename": "/test.module.css",
        "localTokens": [],
        "tokenImporters": [
          {
            "specifier": "./a.module.css",
            "type": "import",
          },
          {
            "importedName": "c",
            "localName": "c",
            "specifier": "./a.module.css",
            "type": "value",
          },
          {
            "importedName": "x",
            "localName": "d",
            "specifier": "./a.module.css",
            "type": "value",
          },
        ],
      }
    `);
  });
  // TODO: Support local tokens by CSS variables. This is supported by lightningcss.
  // https://github.com/parcel-bundler/lightningcss/blob/a3390fd4140ca87f5035595d22bc9357cf72177e/src/css_modules.rs#L34
  test.fails('collects local tokens as CSS variables if dashedIdents is true', () => {
    const code1 = ':root { --a: red; }';
    const parsed1 = parseCSSModuleCode(code1, { ...options, dashedIdents: false });
    expect(parsed1.localTokens).toEqual([]);

    const code2 = dedent`
        :root { --a: red; }
        .a {
          color: var(--b);
          background-color: var(--c from './a.module.css');
          background-color: var(--d from global);
        }
      `;
    const parsed2 = parseCSSModuleCode(code2, { ...options, dashedIdents: true });
    expect(parsed2.localTokens).toEqual(['--a', 'a', '--b']);
  });
  // TODO: Support local tokens by animation names. This is supported by postcss-modules-local-by-default and lightningcss.
  // https://github.com/css-modules/postcss-modules-local-by-default/blob/39a2f78d9f39f5c0e30dd9b2a25f4a145431cb20/test/index.test.js#L162-L399
  // https://github.com/parcel-bundler/lightningcss/blob/a3390fd4140ca87f5035595d22bc9357cf72177e/src/css_modules.rs#L37

  // TODO: Support local tokens by grid names. This is supported by lightningcss.
  // https://github.com/parcel-bundler/lightningcss/blob/a3390fd4140ca87f5035595d22bc9357cf72177e/src/css_modules.rs#L40

  // TODO: Support local tokens by container names. This is supported by lightningcss.
  // https://github.com/parcel-bundler/lightningcss/blob/a3390fd4140ca87f5035595d22bc9357cf72177e/src/css_modules.rs#L46

  // TODO: Support local tokens by custom identifiers. This is supported by lightningcss.
  // https://github.com/parcel-bundler/lightningcss/blob/a3390fd4140ca87f5035595d22bc9357cf72177e/src/css_modules.rs#L43
  // https://developer.mozilla.org/ja/docs/Web/CSS/custom-ident
});
