import dedent from 'dedent';
import { describe, expect, test } from 'vitest';
import { parseCSSModule, type ParseCSSModuleOptions } from './css-module-parser.js';

const options: ParseCSSModuleOptions = { fileName: '/test.module.css', dashedIdents: false, safe: false };

describe('parseCSSModule', () => {
  test('collects local tokens', () => {
    const {
      cssModule: { text, ...cssModule },
      diagnostics,
    } = parseCSSModule(
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
    expect({ cssModule, diagnostics }).toMatchInlineSnapshot(`
      {
        "cssModule": {
          "fileName": "/test.module.css",
          "localTokens": [
            {
              "loc": {
                "end": 6,
                "start": 1,
              },
              "name": "basic",
            },
            {
              "loc": {
                "end": 20,
                "start": 11,
              },
              "name": "cascading",
            },
            {
              "loc": {
                "end": 34,
                "start": 25,
              },
              "name": "cascading",
            },
            {
              "loc": {
                "end": 53,
                "start": 39,
              },
              "name": "pseudo_class_1",
            },
            {
              "loc": {
                "end": 72,
                "start": 58,
              },
              "name": "pseudo_class_2",
            },
            {
              "loc": {
                "end": 102,
                "start": 88,
              },
              "name": "pseudo_class_3",
            },
            {
              "loc": {
                "end": 127,
                "start": 108,
              },
              "name": "multiple_selector_1",
            },
            {
              "loc": {
                "end": 147,
                "start": 128,
              },
              "name": "multiple_selector_2",
            },
            {
              "loc": {
                "end": 164,
                "start": 152,
              },
              "name": "combinator_1",
            },
            {
              "loc": {
                "end": 180,
                "start": 168,
              },
              "name": "combinator_2",
            },
            {
              "loc": {
                "end": 265,
                "start": 258,
              },
              "name": "at_rule",
            },
            {
              "loc": {
                "end": 291,
                "start": 276,
              },
              "name": "selector_list_1",
            },
            {
              "loc": {
                "end": 309,
                "start": 294,
              },
              "name": "selector_list_2",
            },
            {
              "loc": {
                "end": 328,
                "start": 321,
              },
              "name": "local_1",
            },
            {
              "loc": {
                "end": 345,
                "start": 340,
              },
              "name": "value",
            },
          ],
          "tokenImporters": [],
        },
        "diagnostics": [],
      }
    `);
  });
  test('collects token importers', () => {
    const {
      cssModule: { text, ...cssModule },
      diagnostics,
    } = parseCSSModule(
      dedent`
        @import './a.module.css';
        @value a, b as alias from './a.module.css';
      `,
      options,
    );
    expect({ cssModule, diagnostics }).toMatchInlineSnapshot(`
      {
        "cssModule": {
          "fileName": "/test.module.css",
          "localTokens": [],
          "tokenImporters": [
            {
              "from": "./a.module.css",
              "fromLoc": {
                "end": 23,
                "start": 9,
              },
              "type": "import",
            },
            {
              "from": "./a.module.css",
              "fromLoc": {
                "end": 67,
                "start": 53,
              },
              "type": "value",
              "values": [
                {
                  "loc": {
                    "end": 34,
                    "start": 33,
                  },
                  "name": "a",
                },
                {
                  "loc": {
                    "end": 37,
                    "start": 36,
                  },
                  "localLoc": {
                    "end": 46,
                    "start": 41,
                  },
                  "localName": "alias",
                  "name": "b",
                },
              ],
            },
          ],
        },
        "diagnostics": [],
      }
    `);
  });
  test('collects diagnostics', () => {
    const {
      cssModule: { text, ...cssModule },
      diagnostics,
    } = parseCSSModule(
      dedent`
        :local .local1 {}
        @value;
      `,
      options,
    );
    expect({ cssModule, diagnostics }).toMatchInlineSnapshot(`
      {
        "cssModule": {
          "fileName": "/test.module.css",
          "localTokens": [
            {
              "loc": {
                "end": 14,
                "start": 8,
              },
              "name": "local1",
            },
          ],
          "tokenImporters": [],
        },
        "diagnostics": [
          {
            "category": "error",
            "end": 6,
            "fileName": "/test.module.css",
            "start": 0,
            "text": "\`:local\` is not supported. Use \`:local(...)\` instead.",
            "type": "syntactic",
          },
          {
            "category": "error",
            "end": 26,
            "fileName": "/test.module.css",
            "start": 18,
            "text": "\`@value\` is a invalid syntax.",
            "type": "syntactic",
          },
        ],
      }
    `);
  });
  // TODO: Support local tokens by CSS variables. This is supported by lightningcss.
  // https://github.com/parcel-bundler/lightningcss/blob/a3390fd4140ca87f5035595d22bc9357cf72177e/src/css_modules.rs#L34
  test.fails('collects local tokens as CSS variables if dashedIdents is true', () => {
    const text1 = ':root { --a: red; }';
    const parsed1 = parseCSSModule(text1, { ...options, dashedIdents: false });
    expect(parsed1.cssModule?.localTokens).toEqual([]);

    const text2 = dedent`
        :root { --a: red; }
        .a {
          color: var(--b);
          background-color: var(--c from './a.module.css');
          background-color: var(--d from global);
        }
      `;
    const parsed2 = parseCSSModule(text2, { ...options, dashedIdents: true });
    expect(parsed2.cssModule?.localTokens).toEqual(['--a', 'a', '--b']);
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
  test('reports diagnostics if the CSS is invalid', () => {
    expect(
      parseCSSModule(
        dedent`
          .a {
        `,
        options,
      ),
    ).toMatchInlineSnapshot(`
      {
        "cssModule": {
          "fileName": "/test.module.css",
          "localTokens": [],
          "text": ".a {",
          "tokenImporters": [],
        },
        "diagnostics": [
          {
            "category": "error",
            "fileName": "/test.module.css",
            "start": 0,
            "text": "Unclosed block",
            "type": "syntactic",
          },
        ],
      }
    `);
  });
  test('parses CSS in a fault-tolerant manner if safe is true', () => {
    const {
      cssModule: { text, ...cssModule },
      diagnostics,
    } = parseCSSModule(
      dedent`
        .a {
      `,
      { ...options, safe: true },
    );
    expect({ cssModule, diagnostics }).toMatchInlineSnapshot(`
      {
        "cssModule": {
          "fileName": "/test.module.css",
          "localTokens": [
            {
              "loc": {
                "end": 2,
                "start": 1,
              },
              "name": "a",
            },
          ],
          "tokenImporters": [],
        },
        "diagnostics": [],
      }
    `);
  });
});
