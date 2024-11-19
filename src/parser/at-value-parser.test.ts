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
    expect(parseAtValue(atValues[0]!)).toStrictEqual({ type: 'valueDeclaration', name: 'basic' });
    expect(parseAtValue(atValues[1]!)).toStrictEqual({ type: 'valueDeclaration', name: 'withoutColon' });
    expect(parseAtValue(atValues[2]!)).toStrictEqual({ type: 'valueDeclaration', name: 'empty' });
    expect(parseAtValue(atValues[3]!)).toStrictEqual({ type: 'valueDeclaration', name: 'comment' });
    expect(parseAtValue(atValues[4]!)).toStrictEqual({ type: 'valueDeclaration', name: 'complex' });
    expect(parseAtValue(atValues[5]!)).toStrictEqual({
      type: 'valueImportDeclaration',
      values: [{ importedName: 'import', localName: 'import' }],
      from: 'test.css',
    });
    expect(parseAtValue(atValues[6]!)).toStrictEqual({
      type: 'valueImportDeclaration',
      values: [
        { importedName: 'import1', localName: 'import1' },
        { importedName: 'import2', localName: 'import2' },
      ],
      from: 'test.css',
    });
    expect(parseAtValue(atValues[7]!)).toStrictEqual({
      type: 'valueImportDeclaration',
      values: [{ importedName: 'import', localName: 'alias' }],
      from: 'test.css',
    });
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
