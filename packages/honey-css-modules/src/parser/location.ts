import type { AtRule, Rule } from 'postcss';
import type { ClassName } from 'postcss-selector-parser';

export interface Position {
  /** The line number in the source file. It is 1-based (compatible with postcss). */
  // TODO: Maybe it should be deleted since it is not used
  line: number;
  /** The column number in the source file. It is 1-based (compatible with postcss). */
  // TODO: Maybe it should be deleted since it is not used
  column: number;
  /** The offset in the source file. It is 0-based. */
  offset: number;
}

export interface Location {
  /** The starting position of the node. It is inclusive (compatible with postcss). */
  start: Position;
  /** The ending position of the node. It is inclusive (compatible with postcss). */
  // TODO: Maybe it should be deleted since it is not used
  end: Position;
}

/**
 * Get the location of the token defined by `@value`.
 * @returns The location of the `@value` rule.
 * @example If `@value a from './a.module.css'`, it returns `{ start: { line: 1, column: 8 }, end: { line: 1, column: 9 } }`.
 */
export function getTokenLocationOfAtValue(atValue: AtRule, name: string): Location | undefined {
  // The node derived from `postcss.parse` always has location information.
  const start = {
    line: atValue.source!.start!.line,
    column: atValue.source!.start!.column + atValue.toString().indexOf(name, 7),
    offset: atValue.source!.start!.offset + atValue.toString().indexOf(name, 7),
  };
  const end = {
    line: start.line,
    column: start.column + name.length - 1,
    offset: start.offset + name.length - 1,
  };
  return { start, end };
}

/**
 * Get the location of the class selector.
 * @param rule The rule node that contains the token.
 * @param classSelector The class selector node that contains the token.
 * @returns The location of the class selector.
 * @example If `rule` is `.a, .b { color: red; }` and `classSelector` is `.b`, it returns `{ start: { line: 1, column: 6 }, end: { line: 1, column: 7 } }`.
 */
export function getTokenLocationOfClassSelector(rule: Rule, classSelector: ClassName): Location {
  // The node derived from `postcss.parse` always has location information.

  // If `rule` is `.a, .b { color: red; }` and `classSelector` is `.b`,
  // `rule.source` is `{ start: { line: 1, column: 1 }, end: { line: 1, column: 22 } }`
  // And `classSelector.source` is `{ start: { line: 1, column: 5 }, end: { line: 1, column: 6 } }`.

  const start = {
    line: rule.source!.start!.line + classSelector.source!.start!.line - 1,
    column: rule.source!.start!.column + classSelector.source!.start!.column,
    offset: rule.source!.start!.offset + classSelector.sourceIndex + 1,
  };
  const end = {
    // The end line is always the same as the start line, as a class selector cannot break in the middle.
    line: start.line,
    // The end column is the start column plus the length of the class selector.
    column: start.column + classSelector.value.length - 1,
    offset: start.offset + classSelector.value.length - 1,
  };
  return { start, end };
}
