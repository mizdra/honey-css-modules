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
        /* NOTE: \`@value d, e from moduleName;\` is not supported. */
      `),
    );
    expect(parseAtValue(atValues[0]!)).toMatchInlineSnapshot(`
      {
        "name": "basic",
        "type": "valueDeclaration",
      }
    `);
    expect(parseAtValue(atValues[1]!)).toMatchInlineSnapshot(`
      {
        "name": "withoutColon",
        "type": "valueDeclaration",
      }
    `);
    expect(parseAtValue(atValues[2]!)).toMatchInlineSnapshot(`
      {
        "name": "empty",
        "type": "valueDeclaration",
      }
    `);
    expect(parseAtValue(atValues[3]!)).toMatchInlineSnapshot(`
      {
        "name": "comment",
        "type": "valueDeclaration",
      }
    `);
    expect(parseAtValue(atValues[4]!)).toMatchInlineSnapshot(`
      {
        "name": "complex",
        "type": "valueDeclaration",
      }
    `);
    expect(parseAtValue(atValues[5]!)).toMatchInlineSnapshot(`
      {
        "from": "test.css",
        "type": "valueImportDeclaration",
        "values": [
          {
            "name": "import",
          },
        ],
      }
    `);
    expect(parseAtValue(atValues[6]!)).toMatchInlineSnapshot(`
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
      }
    `);
    expect(parseAtValue(atValues[7]!)).toMatchInlineSnapshot(`
      {
        "from": "test.css",
        "type": "valueImportDeclaration",
        "values": [
          {
            "localName": "alias",
            "name": "import",
          },
        ],
      }
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
