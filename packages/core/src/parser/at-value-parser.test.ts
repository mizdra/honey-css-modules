import dedent from 'dedent';
import { describe, expect, test } from 'vitest';
import { createAtValues, createRoot } from '../test/ast.js';
import { parseAtValue } from './at-value-parser.js';

describe('parseAtValue', () => {
  test('valid', () => {
    const atValues = createAtValues(
      createRoot(dedent`
        @value basic: #000;
        @value withoutColon #000;
        @value empty:;
        @value comment:/* comment */;
        @value complex: (max-width: 599px);
        @value import from "test.css";
        @value import1, import2 from "test.css";
        @value import3 as alias1 from "test.css";
         @value  withSpace1 : #000 ;
         @value  withSpace2 ,  withSpace3  as  alias2  from  "test.css" ;
      `),
    );
    const result = atValues.map(parseAtValue);
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "atValue": {
            "loc": {
              "end": 12,
              "start": 7,
            },
            "name": "basic",
            "type": "valueDeclaration",
          },
          "diagnostics": [],
        },
        {
          "atValue": {
            "loc": {
              "end": 39,
              "start": 27,
            },
            "name": "withoutColon",
            "type": "valueDeclaration",
          },
          "diagnostics": [],
        },
        {
          "atValue": {
            "loc": {
              "end": 58,
              "start": 53,
            },
            "name": "empty",
            "type": "valueDeclaration",
          },
          "diagnostics": [],
        },
        {
          "atValue": {
            "loc": {
              "end": 75,
              "start": 68,
            },
            "name": "comment",
            "type": "valueDeclaration",
          },
          "diagnostics": [],
        },
        {
          "atValue": {
            "loc": {
              "end": 105,
              "start": 98,
            },
            "name": "complex",
            "type": "valueDeclaration",
          },
          "diagnostics": [],
        },
        {
          "atValue": {
            "from": "test.css",
            "fromLoc": {
              "end": 155,
              "start": 147,
            },
            "type": "valueImportDeclaration",
            "values": [
              {
                "loc": {
                  "end": 140,
                  "start": 134,
                },
                "name": "import",
              },
            ],
          },
          "diagnostics": [],
        },
        {
          "atValue": {
            "from": "test.css",
            "fromLoc": {
              "end": 196,
              "start": 188,
            },
            "type": "valueImportDeclaration",
            "values": [
              {
                "loc": {
                  "end": 172,
                  "start": 165,
                },
                "name": "import1",
              },
              {
                "loc": {
                  "end": 181,
                  "start": 174,
                },
                "name": "import2",
              },
            ],
          },
          "diagnostics": [],
        },
        {
          "atValue": {
            "from": "test.css",
            "fromLoc": {
              "end": 238,
              "start": 230,
            },
            "type": "valueImportDeclaration",
            "values": [
              {
                "loc": {
                  "end": 213,
                  "start": 206,
                },
                "localLoc": {
                  "end": 223,
                  "start": 217,
                },
                "localName": "alias1",
                "name": "import3",
              },
            ],
          },
          "diagnostics": [],
        },
        {
          "atValue": {
            "loc": {
              "end": 260,
              "start": 250,
            },
            "name": "withSpace1",
            "type": "valueDeclaration",
          },
          "diagnostics": [],
        },
        {
          "atValue": {
            "from": "test.css",
            "fromLoc": {
              "end": 332,
              "start": 324,
            },
            "type": "valueImportDeclaration",
            "values": [
              {
                "loc": {
                  "end": 289,
                  "start": 279,
                },
                "name": "withSpace2",
              },
              {
                "loc": {
                  "end": 303,
                  "start": 293,
                },
                "localLoc": {
                  "end": 315,
                  "start": 309,
                },
                "localName": "alias2",
                "name": "withSpace3",
              },
            ],
          },
          "diagnostics": [],
        },
      ]
    `);
  });
  test('invalid', () => {
    const [atValue1, atValue2] = createAtValues(
      createRoot(dedent`
        @value;
        @value a,,b from "test.css";
      `),
    );
    expect(parseAtValue(atValue1!)).toMatchInlineSnapshot(`
      {
        "diagnostics": [
          {
            "category": "error",
            "end": 8,
            "fileName": "/test/test.css",
            "start": 0,
            "text": "\`@value\` is a invalid syntax.",
            "type": "syntactic",
          },
        ],
      }
    `);
    expect(parseAtValue(atValue2!)).toMatchInlineSnapshot(`
      {
        "atValue": {
          "from": "test.css",
          "fromLoc": {
            "end": 34,
            "start": 26,
          },
          "type": "valueImportDeclaration",
          "values": [
            {
              "loc": {
                "end": 16,
                "start": 15,
              },
              "name": "a",
            },
            {
              "loc": {
                "end": 19,
                "start": 18,
              },
              "name": "b",
            },
          ],
        },
        "diagnostics": [
          {
            "category": "error",
            "end": 15,
            "fileName": "/test/test.css",
            "start": 15,
            "text": "\`\` is invalid syntax.",
            "type": "syntactic",
          },
        ],
      }
    `);
  });
});
