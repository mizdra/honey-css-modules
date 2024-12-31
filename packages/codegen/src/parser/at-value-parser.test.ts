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
        @value import as alias from "test.css";
        @value  withSpace: #000;
      `),
    );
    const result = atValues.map(parseAtValue);
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "loc": {
            "end": {
              "column": 13,
              "line": 1,
              "offset": 12,
            },
            "start": {
              "column": 8,
              "line": 1,
              "offset": 7,
            },
          },
          "name": "basic",
          "type": "valueDeclaration",
        },
        {
          "loc": {
            "end": {
              "column": 20,
              "line": 2,
              "offset": 39,
            },
            "start": {
              "column": 8,
              "line": 2,
              "offset": 27,
            },
          },
          "name": "withoutColon",
          "type": "valueDeclaration",
        },
        {
          "loc": {
            "end": {
              "column": 13,
              "line": 3,
              "offset": 58,
            },
            "start": {
              "column": 8,
              "line": 3,
              "offset": 53,
            },
          },
          "name": "empty",
          "type": "valueDeclaration",
        },
        {
          "loc": {
            "end": {
              "column": 15,
              "line": 4,
              "offset": 75,
            },
            "start": {
              "column": 8,
              "line": 4,
              "offset": 68,
            },
          },
          "name": "comment",
          "type": "valueDeclaration",
        },
        {
          "loc": {
            "end": {
              "column": 15,
              "line": 5,
              "offset": 105,
            },
            "start": {
              "column": 8,
              "line": 5,
              "offset": 98,
            },
          },
          "name": "complex",
          "type": "valueDeclaration",
        },
        {
          "from": "test.css",
          "type": "valueImportDeclaration",
          "values": [
            {
              "name": "import",
            },
          ],
        },
        {
          "from": "test.css",
          "type": "valueImportDeclaration",
          "values": [
            {
              "name": "import1",
            },
            {
              "name": "import2",
            },
          ],
        },
        {
          "from": "test.css",
          "type": "valueImportDeclaration",
          "values": [
            {
              "localName": "alias",
              "name": "import",
            },
          ],
        },
        {
          "loc": {
            "end": {
              "column": 18,
              "line": 9,
              "offset": 256,
            },
            "start": {
              "column": 9,
              "line": 9,
              "offset": 247,
            },
          },
          "name": "withSpace",
          "type": "valueDeclaration",
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
    expect(() => parseAtValue(atValue1!)).toThrowErrorMatchingInlineSnapshot(`[Error: \`@value\` is invalid!]`);
    expect(() => parseAtValue(atValue2!)).toThrowErrorMatchingInlineSnapshot(
      `[Error: \`@value a,,b from "test.css"\` is invalid!]`,
    );
  });
});
