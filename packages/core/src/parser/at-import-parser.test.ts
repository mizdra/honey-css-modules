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
      {
        "from": "test.css",
        "fromLoc": {
          "end": 26,
          "start": 18,
        },
      },
      {
        "from": "test.css",
        "fromLoc": {
          "end": 50,
          "start": 42,
        },
      },
      {
        "from": "test.css",
        "fromLoc": {
          "end": 74,
          "start": 66,
        },
      },
      {
        "from": "test.css",
        "fromLoc": {
          "end": 94,
          "start": 86,
        },
      },
    ]
  `);
});
