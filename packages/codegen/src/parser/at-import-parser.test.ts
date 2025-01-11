import dedent from 'dedent';
import { expect, test } from 'vitest';
import { createAtImports, createRoot } from '../test/ast.js';
import { parseAtImport } from './at-import-parser.js';

test('parseAtImport', () => {
  const atImports = createAtImports(
    createRoot(dedent`
      @import;
      @import "test.css";
      @import url("test.css");
      @import url(test.css);
      @import "test.css" print;
    `),
  );
  expect(atImports.map(parseAtImport)).toMatchInlineSnapshot(`
    [
      undefined,
      "test.css",
      "test.css",
      "test.css",
      "test.css",
    ]
  `);
});
