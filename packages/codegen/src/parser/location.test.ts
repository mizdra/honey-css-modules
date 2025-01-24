import dedent from 'dedent';
import selectorParser from 'postcss-selector-parser';
import { describe, expect, test } from 'vitest';
import { createRoot, createRules } from '../test/ast.js';
import type { Position } from './location.js';
import { calcLocationForSelectorParserNode } from './location.js';

function calcLocations(source: string) {
  const [rule] = createRules(createRoot(source));
  const root = selectorParser().astSync(rule!);
  const result: { node: string; type: string; start: Position; end: Position }[] = [];
  root.walk((node) => {
    const loc = calcLocationForSelectorParserNode(rule!, node);
    result.push({
      node: node.toString(),
      type: node.type,
      ...loc,
    });
  });
  return result;
}

describe('calcLocationForSelectorParserNode', () => {
  test('single line', () => {
    const result = calcLocations('.a .b {}');
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "end": {
            "column": 6,
            "line": 1,
            "offset": 5,
          },
          "node": ".a .b",
          "start": {
            "column": 1,
            "line": 1,
            "offset": 0,
          },
          "type": "selector",
        },
        {
          "end": {
            "column": 3,
            "line": 1,
            "offset": 2,
          },
          "node": ".a",
          "start": {
            "column": 1,
            "line": 1,
            "offset": 0,
          },
          "type": "class",
        },
        {
          "end": {
            "column": 4,
            "line": 1,
            "offset": 3,
          },
          "node": " ",
          "start": {
            "column": 3,
            "line": 1,
            "offset": 2,
          },
          "type": "combinator",
        },
        {
          "end": {
            "column": 6,
            "line": 1,
            "offset": 5,
          },
          "node": ".b",
          "start": {
            "column": 4,
            "line": 1,
            "offset": 3,
          },
          "type": "class",
        },
      ]
    `);
  });
  test('multiple line', () => {
    const result1 = calcLocations(dedent`
      .a
      .b
        .c {}
    `);
    expect(result1).toMatchInlineSnapshot(`
      [
        {
          "end": {
            "column": 5,
            "line": 3,
            "offset": 10,
          },
          "node": ".a
      .b
        .c",
          "start": {
            "column": 1,
            "line": 1,
            "offset": 0,
          },
          "type": "selector",
        },
        {
          "end": {
            "column": 3,
            "line": 1,
            "offset": 2,
          },
          "node": ".a",
          "start": {
            "column": 1,
            "line": 1,
            "offset": 0,
          },
          "type": "class",
        },
        {
          "end": {
            "column": 1,
            "line": 2,
            "offset": 3,
          },
          "node": "
      ",
          "start": {
            "column": 3,
            "line": 1,
            "offset": 2,
          },
          "type": "combinator",
        },
        {
          "end": {
            "column": 3,
            "line": 2,
            "offset": 5,
          },
          "node": ".b",
          "start": {
            "column": 1,
            "line": 2,
            "offset": 3,
          },
          "type": "class",
        },
        {
          "end": {
            "column": 3,
            "line": 3,
            "offset": 8,
          },
          "node": "
        ",
          "start": {
            "column": 3,
            "line": 2,
            "offset": 5,
          },
          "type": "combinator",
        },
        {
          "end": {
            "column": 5,
            "line": 3,
            "offset": 10,
          },
          "node": ".c",
          "start": {
            "column": 3,
            "line": 3,
            "offset": 8,
          },
          "type": "class",
        },
      ]
    `);
    const result2 = calcLocations(dedent`
      @import './test.css';
      .a
        .b {}
    `);
    expect(result2).toMatchInlineSnapshot(`
      [
        {
          "end": {
            "column": 5,
            "line": 3,
            "offset": 29,
          },
          "node": ".a
        .b",
          "start": {
            "column": 1,
            "line": 2,
            "offset": 22,
          },
          "type": "selector",
        },
        {
          "end": {
            "column": 3,
            "line": 2,
            "offset": 24,
          },
          "node": ".a",
          "start": {
            "column": 1,
            "line": 2,
            "offset": 22,
          },
          "type": "class",
        },
        {
          "end": {
            "column": 3,
            "line": 3,
            "offset": 27,
          },
          "node": "
        ",
          "start": {
            "column": 3,
            "line": 2,
            "offset": 24,
          },
          "type": "combinator",
        },
        {
          "end": {
            "column": 5,
            "line": 3,
            "offset": 29,
          },
          "node": ".b",
          "start": {
            "column": 3,
            "line": 3,
            "offset": 27,
          },
          "type": "class",
        },
      ]
    `);
  });
});
