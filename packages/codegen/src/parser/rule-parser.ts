import type { Rule } from 'postcss';
import selectorParser from 'postcss-selector-parser';
import type { Diagnostic } from './diagnostic.js';
import { calcLocationForSelectorParserNode, type Location } from './location.js';

interface CollectResult {
  classNames: selectorParser.ClassName[];
  diagnostics: Diagnostic[];
}

function flatCollectResults(results: CollectResult[]): CollectResult {
  const classNames: selectorParser.ClassName[] = [];
  const diagnostics: Diagnostic[] = [];
  for (const result of results) {
    classNames.push(...result.classNames);
    diagnostics.push(...result.diagnostics);
  }
  return { classNames, diagnostics };
}

/**
 * Collect local class names from the AST.
 * This function is based on the behavior of postcss-modules-local-by-default.
 *
 * @see https://github.com/css-modules/postcss-modules-local-by-default/blob/38119276608ef14821797cfc0242b3c7dead69af/src/index.js
 * @see https://github.com/css-modules/postcss-modules-local-by-default/blob/38119276608ef14821797cfc0242b3c7dead69af/test/index.test.js
 * @example `.local1 :global(.global1) .local2 :local(.local3)` => `[".local1", ".local2", ".local3"]`
 */
function collectLocalClassNames(rule: Rule, root: selectorParser.Root): CollectResult {
  return visitNode(root, undefined);

  function visitNode(node: selectorParser.Node, wrappedBy: ':local(...)' | ':global(...)' | undefined): CollectResult {
    if (selectorParser.isClassName(node)) {
      switch (wrappedBy) {
        // If the class name is wrapped by `:local(...)` or `:global(...)`,
        // the scope is determined by the wrapper.
        case ':local(...)':
          return { classNames: [node], diagnostics: [] };
        case ':global(...)':
          return { classNames: [], diagnostics: [] };
        // If the class name is not wrapped by `:local(...)` or `:global(...)`,
        // the scope is determined by the mode.
        default:
          // Mode is customizable in css-loader, but we don't support it for simplicity. We fix the mode to 'local'.
          return { classNames: [node], diagnostics: [] };
      }
    } else if (selectorParser.isPseudo(node) && (node.value === ':local' || node.value === ':global')) {
      if (node.nodes.length === 0) {
        // `node` is `:local` or `:global` (without any arguments)
        // We don't support `:local` and `:global` (without any arguments) because they are complex.
        const diagnostic: Diagnostic = {
          ...calcLocationForSelectorParserNode(rule, node),
          text: `\`${node.value}\` is not supported. Use \`${node.value}(...)\` instead.`,
          category: 'error',
        };
        return { classNames: [], diagnostics: [diagnostic] };
      } else {
        // `node` is `:local(...)` or `:global(...)` (with arguments)
        if (wrappedBy !== undefined) {
          const diagnostic: Diagnostic = {
            ...calcLocationForSelectorParserNode(rule, node),
            text: `A \`${node.value}(...)\` is not allowed inside of \`${wrappedBy}\`.`,
            category: 'error',
          };
          return { classNames: [], diagnostics: [diagnostic] };
        }
        return flatCollectResults(
          node.nodes.map((child) => visitNode(child, node.value === ':local' ? ':local(...)' : ':global(...)')),
        );
      }
    } else if (selectorParser.isContainer(node)) {
      return flatCollectResults(node.nodes.map((child) => visitNode(child, wrappedBy)));
    }
    return { classNames: [], diagnostics: [] };
  }
}

interface ClassSelector {
  /** The class name. It does not include the leading dot. */
  name: string;
  /** The location of the class selector. */
  loc: Location;
}

interface ParseRuleResult {
  classSelectors: ClassSelector[];
  diagnostics: Diagnostic[];
}

/**
 * Parse a rule and collect local class selectors.
 */
export function parseRule(rule: Rule): ParseRuleResult {
  const root = selectorParser().astSync(rule);
  const result = collectLocalClassNames(rule, root);
  const classSelectors = result.classNames.map((className) => {
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
    };
  });
  return { classSelectors, diagnostics: result.diagnostics };
}
