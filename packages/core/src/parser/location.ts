import type { Rule } from 'postcss';
import type selectorParser from 'postcss-selector-parser';

export interface Position {
  /**
   * The line number in the source file. It is 1-based.
   * This is compatible with postcss and tsserver.
   */
  // TODO: Maybe it should be deleted since it is not used
  line: number;
  /**
   * The column number in the source file. It is 1-based.
   * This is compatible with postcss and tsserver.
   */
  // TODO: Maybe it should be deleted since it is not used
  column: number;
  /** The offset in the source file. It is 0-based. */
  offset: number;
}

export interface Location {
  /**
   * The starting offset of the node. It is inclusive and 0-based.
   */
  start: number;
  /**
   * The ending offset of the node. It is exclusive and 0-based.
   */
  end: number;
}

export function calcDiagnosticsLocationForSelectorParserNode(
  rule: Rule,
  node: selectorParser.Node,
): { start: number; end: number } {
  const start = rule.source!.start!.offset + node.sourceIndex;
  const end = start + node.toString().length;
  return { start, end };
}
