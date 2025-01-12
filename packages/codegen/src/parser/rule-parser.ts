import type { Rule } from 'postcss';
import selectorParser from 'postcss-selector-parser';
import { ScopeError } from '../error.js';
import { type Location } from './location.js';

/**
 * Collect local class names from the AST.
 * This function is based on the behavior of postcss-modules-local-by-default.
 *
 * @see https://github.com/css-modules/postcss-modules-local-by-default/blob/38119276608ef14821797cfc0242b3c7dead69af/src/index.js
 * @see https://github.com/css-modules/postcss-modules-local-by-default/blob/38119276608ef14821797cfc0242b3c7dead69af/test/index.test.js
 * @example `.local1 :global(.global1) .local2 :local(.local3)` => `[".local1", ".local2", ".local3"]`
 * @throws {ScopeError}
 */
function collectLocalClassNames(root: selectorParser.Root): selectorParser.ClassName[] {
  return visitNode(root, undefined);

  function visitNode(
    node: selectorParser.Node,
    wrappedBy: ':local(...)' | ':global(...)' | undefined,
  ): selectorParser.ClassName[] {
    if (selectorParser.isClassName(node)) {
      switch (wrappedBy) {
        // If the class name is wrapped by `:local(...)` or `:global(...)`,
        // the scope is determined by the wrapper.
        case ':local(...)':
          return [node];
        case ':global(...)':
          return [];
        // If the class name is not wrapped by `:local(...)` or `:global(...)`,
        // the scope is determined by the mode.
        default:
          // Mode is customizable in css-loader, but we don't support it for simplicity. We fix the mode to 'local'.
          return [node];
      }
    } else if (selectorParser.isPseudo(node) && (node.value === ':local' || node.value === ':global')) {
      if (node.nodes.length === 0) {
        // `node` is `:local` or `:global` (without any arguments)
        // We don't support `:local` and `:global` (without any arguments) because they are complex.
        throw new ScopeError(
          `\`${node.value}\` (without any arguments) is not supported. Use \`${node.value}(...)\` instead.`,
        );
      } else {
        // `node` is `:local(...)` or `:global(...)` (with arguments)
        if (wrappedBy !== undefined) {
          throw new ScopeError(`A \`${node.value}\` is not allowed inside of \`${wrappedBy}\`.`);
        }
        return node.nodes.flatMap((child) =>
          visitNode(child, node.value === ':local' ? ':local(...)' : ':global(...)'),
        );
      }
    } else if (selectorParser.isContainer(node)) {
      return node.nodes.flatMap((child) => visitNode(child, wrappedBy));
    }
    return [];
  }
}

interface ClassSelector {
  /** The class name. It does not include the leading dot. */
  name: string;
  /** The location of the class selector. */
  loc: Location;
  /** The style definition of the class selector */
  definition: string;
}

/**
 * Parse a rule and collect local class selectors.
 * @throws {ScopeError}
 */
export function parseRule(rule: Rule): ClassSelector[] {
  const root = selectorParser().astSync(rule);
  return collectLocalClassNames(root).map((className) => {
    // If `rule` is `.a, .b { color: red; }` and `className` is `.b`,
    // `rule.source` is `{ start: { line: 1, column: 1 }, end: { line: 1, column: 22 } }`
    // And `className.source` is `{ start: { line: 1, column: 5 }, end: { line: 1, column: 6 } }`.
    const start = {
      line: rule.source!.start!.line + className.source!.start!.line - 1,
      column: rule.source!.start!.column + className.source!.start!.column,
      offset: rule.source!.start!.offset + className.sourceIndex + 1,
    };
    const end = {
      // The end line is always the same as the start line, as a class selector cannot break in the middle.
      line: start.line,
      column: start.column + className.value.length,
      offset: start.offset + className.value.length,
    };
    return {
      name: className.value,
      loc: { start, end },
      definition: rule.toString(),
    };
  });
}
