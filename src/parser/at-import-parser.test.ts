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
  expect(parseAtImport(atImports[0]!)).toBe(undefined);
  expect(parseAtImport(atImports[1]!)).toBe('test.css');
  expect(parseAtImport(atImports[2]!)).toBe('test.css');
  expect(parseAtImport(atImports[3]!)).toBe('test.css');
  expect(parseAtImport(atImports[4]!)).toBe('test.css');
});
