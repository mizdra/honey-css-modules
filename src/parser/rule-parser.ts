import type { Rule } from 'postcss';
import selectorParser from 'postcss-selector-parser';
import { ScopeError } from '../error.js';

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

/**
 * Parse a rule and collect local class names.
 * @throws {ScopeError}
 */
export function parseRule(rule: Rule): selectorParser.ClassName[] {
  const root = selectorParser().astSync(rule);
  return collectLocalClassNames(root);
}
