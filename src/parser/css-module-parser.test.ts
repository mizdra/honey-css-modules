import dedent from 'dedent';
import { describe, expect, test } from 'vitest';
import { parseCSSModuleCode, type ParseCSSModuleCodeOptions } from './css-module-parser.js';

const options: ParseCSSModuleCodeOptions = { filename: '/test.module.css', dashedIdents: false };

describe('parseCSSModuleCode', () => {
  test('collects local tokens', () => {
    // TODO: Should we take care of `:global`?
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
        :local .local_class_name_1 {}
        :local {
          .local_class_name_2 {}
          .local_class_name_3 {}
        }
        :local(.local_class_name_4) {}
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
              },
              "start": {
                "column": 2,
                "line": 1,
              },
            },
            "name": "basic",
          },
          {
            "loc": {
              "end": {
                "column": 10,
                "line": 2,
              },
              "start": {
                "column": 2,
                "line": 2,
              },
            },
            "name": "cascading",
          },
          {
            "loc": {
              "end": {
                "column": 10,
                "line": 3,
              },
              "start": {
                "column": 2,
                "line": 3,
              },
            },
            "name": "cascading",
          },
          {
            "loc": {
              "end": {
                "column": 15,
                "line": 4,
              },
              "start": {
                "column": 2,
                "line": 4,
              },
            },
            "name": "pseudo_class_1",
          },
          {
            "loc": {
              "end": {
                "column": 15,
                "line": 5,
              },
              "start": {
                "column": 2,
                "line": 5,
              },
            },
            "name": "pseudo_class_2",
          },
          {
            "loc": {
              "end": {
                "column": 20,
                "line": 6,
              },
              "start": {
                "column": 7,
                "line": 6,
              },
            },
            "name": "pseudo_class_3",
          },
          {
            "loc": {
              "end": {
                "column": 20,
                "line": 7,
              },
              "start": {
                "column": 2,
                "line": 7,
              },
            },
            "name": "multiple_selector_1",
          },
          {
            "loc": {
              "end": {
                "column": 40,
                "line": 7,
              },
              "start": {
                "column": 22,
                "line": 7,
              },
            },
            "name": "multiple_selector_2",
          },
          {
            "loc": {
              "end": {
                "column": 13,
                "line": 8,
              },
              "start": {
                "column": 2,
                "line": 8,
              },
            },
            "name": "combinator_1",
          },
          {
            "loc": {
              "end": {
                "column": 29,
                "line": 8,
              },
              "start": {
                "column": 18,
                "line": 8,
              },
            },
            "name": "combinator_2",
          },
          {
            "loc": {
              "end": {
                "column": 12,
                "line": 11,
              },
              "start": {
                "column": 6,
                "line": 11,
              },
            },
            "name": "at_rule",
          },
          {
            "loc": {
              "end": {
                "column": 16,
                "line": 14,
              },
              "start": {
                "column": 2,
                "line": 14,
              },
            },
            "name": "selector_list_1",
          },
          {
            "loc": {
              "end": {
                "column": 34,
                "line": 14,
              },
              "start": {
                "column": 20,
                "line": 14,
              },
            },
            "name": "selector_list_2",
          },
          {
            "loc": {
              "end": {
                "column": 26,
                "line": 15,
              },
              "start": {
                "column": 9,
                "line": 15,
              },
            },
            "name": "local_class_name_1",
          },
          {
            "loc": {
              "end": {
                "column": 21,
                "line": 17,
              },
              "start": {
                "column": 4,
                "line": 17,
              },
            },
            "name": "local_class_name_2",
          },
          {
            "loc": {
              "end": {
                "column": 21,
                "line": 18,
              },
              "start": {
                "column": 4,
                "line": 18,
              },
            },
            "name": "local_class_name_3",
          },
          {
            "loc": {
              "end": {
                "column": 26,
                "line": 20,
              },
              "start": {
                "column": 9,
                "line": 20,
              },
            },
            "name": "local_class_name_4",
          },
          {
            "loc": {
              "end": {
                "column": 12,
                "line": 21,
              },
              "start": {
                "column": 8,
                "line": 21,
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
});
