import type { AtRule } from 'postcss';
import postcssValueParser from 'postcss-value-parser';

/**
 * Parse the `@import` rule.
 * @param atImport The `@import` rule to parse.
 * @returns The specifier of the imported file.
 */
export function parseAtImport(atImport: AtRule): string | undefined {
  const firstNode = postcssValueParser(atImport.params).nodes[0];
  if (firstNode === undefined) return undefined;
  if (firstNode.type === 'string') return firstNode.value;
  if (firstNode.type === 'function' && firstNode.value === 'url') {
    if (firstNode.nodes[0] === undefined) return undefined;
    if (firstNode.nodes[0].type === 'string') return firstNode.nodes[0].value;
    if (firstNode.nodes[0].type === 'word') return firstNode.nodes[0].value;
  }
  return undefined;
}
