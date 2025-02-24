import dedent from 'dedent';
import selectorParser from 'postcss-selector-parser';
import { describe, expect, test } from 'vitest';
import { createRoot, createRules } from '../test/ast.js';
import { calcDiagnosticsLocationForSelectorParserNode } from './location.js';

function calcLocations(source: string) {
  const [rule] = createRules(createRoot(source));
  const root = selectorParser().astSync(rule!);
  const result: { node: string; type: string; start: number; end: number }[] = [];
  root.walk((node) => {
    const loc = calcDiagnosticsLocationForSelectorParserNode(rule!, node);
    result.push({
      node: node.toString(),
      type: node.type,
      ...loc,
    });
  });
  return result;
}

describe('calcDiagnosticsLocationForSelectorParserNode', () => {
  test('single line', () => {
    const result = calcLocations('.a .b {}');
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "end": 5,
          "node": ".a .b",
          "start": 0,
          "type": "selector",
        },
        {
          "end": 2,
          "node": ".a",
          "start": 0,
          "type": "class",
        },
        {
          "end": 3,
          "node": " ",
          "start": 2,
          "type": "combinator",
        },
        {
          "end": 5,
          "node": ".b",
          "start": 3,
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
          "end": 10,
          "node": ".a
      .b
        .c",
          "start": 0,
          "type": "selector",
        },
        {
          "end": 2,
          "node": ".a",
          "start": 0,
          "type": "class",
        },
        {
          "end": 3,
          "node": "
      ",
          "start": 2,
          "type": "combinator",
        },
        {
          "end": 5,
          "node": ".b",
          "start": 3,
          "type": "class",
        },
        {
          "end": 8,
          "node": "
        ",
          "start": 5,
          "type": "combinator",
        },
        {
          "end": 10,
          "node": ".c",
          "start": 8,
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
          "end": 29,
          "node": ".a
        .b",
          "start": 22,
          "type": "selector",
        },
        {
          "end": 24,
          "node": ".a",
          "start": 22,
          "type": "class",
        },
        {
          "end": 27,
          "node": "
        ",
          "start": 24,
          "type": "combinator",
        },
        {
          "end": 29,
          "node": ".b",
          "start": 27,
          "type": "class",
        },
      ]
    `);
  });
});
