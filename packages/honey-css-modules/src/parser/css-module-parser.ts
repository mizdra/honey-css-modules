import type { AtRule, Node, Root, Rule } from 'postcss';
import { parse } from 'postcss';
import { CSSModuleParseError } from '../error.js';
import { parseAtImport } from './at-import-parser.js';
import { parseAtValue } from './at-value-parser.js';
import { type Location } from './location.js';
import { parseRule } from './rule-parser.js';

type AtImport = AtRule & { name: 'import' };
type AtValue = AtRule & { name: 'value' };

function isAtRuleNode(node: Node): node is AtRule {
  return node.type === 'atrule';
}

function isAtImportNode(node: Node): node is AtImport {
  return isAtRuleNode(node) && node.name === 'import';
}

function isAtValueNode(node: Node): node is AtValue {
  return isAtRuleNode(node) && node.name === 'value';
}

function isRuleNode(node: Node): node is Rule {
  return node.type === 'rule';
}

/**
 * Collect tokens from the AST.
 * @throws {AtValueInvalidError}
 * @throws {ScopeError}
 */
function collectTokens(ast: Root) {
  const localTokens: Token[] = [];
  const tokenImporters: TokenImporter[] = [];
  ast.walk((node) => {
    if (isAtImportNode(node)) {
      const from = parseAtImport(node);
      if (from !== undefined) {
        tokenImporters.push({ type: 'import', from });
      }
    } else if (isAtValueNode(node)) {
      const parsedAtValue = parseAtValue(node);
      if (parsedAtValue.type === 'valueDeclaration') {
        localTokens.push({ name: parsedAtValue.name, loc: parsedAtValue.loc });
      } else if (parsedAtValue.type === 'valueImportDeclaration') {
        for (const value of parsedAtValue.values) {
          tokenImporters.push({
            type: 'value',
            from: parsedAtValue.from,
            ...value,
          });
        }
      }
    } else if (isRuleNode(node)) {
      const classSelectors = parseRule(node);
      for (const classSelector of classSelectors) {
        localTokens.push(classSelector);
      }
    }
  });
  return { localTokens, tokenImporters };
}

/** The item being exported from a CSS module file (a.k.a. token). */
export interface Token {
  /** The token name. */
  name: string;
  /** The location of the token in the source file. */
  loc: Location;
}

/**
 * A token importer using `@import`.
 * `@import` imports all tokens from the file. Therefore, it does not have
 * the name of the imported token unlike {@link ValueTokenImporter}.
 */
export interface ImportTokenImporter {
  type: 'import';
  /**
   * The specifier of the file from which the token is imported.
   * This is a string before being resolved.
   */
  from: string;
}

/** A token importer using `@value`. */
export interface ValueTokenImporter {
  type: 'value';
  /**
   * The specifier of the file from which the token is imported.
   * This is a string before being resolved.
   */
  from: string;
  /**
   * The name of the token in the file from which it is imported.
   * @example `@value a from './a.module.css'` would have `name` as `'a'`.
   * @example `@value a as b from './a.module.css'` would have `name` as `'a'`.
   */
  name: string;
  /**
   * The name of the token in the current file.
   * @example `@value a from './a.module.css'` would not have `localName`.
   * @example `@value a as b from './a.module.css'` would have `localName` as `'b'`.
   */
  localName?: string;
}

export type TokenImporter = ImportTokenImporter | ValueTokenImporter;

export interface CSSModuleFile {
  /** Absolute path of the file */
  filename: string;
  /**
   * List of token names defined in the file.
   * @example
   * Consider the following file:
   * ```css
   * .foo { color: red }
   * .bar, .baz { color: red }
   * ```
   * The `localTokens` for this file would be `['foo', 'bar', 'baz']`.
   */
  localTokens: Token[];
  /**
   * List of token importers in the file.
   * Token importer is a statement that imports tokens from another file.
   */
  tokenImporters: TokenImporter[];
}

export interface ParseCSSModuleCodeOptions {
  filename: string;
  dashedIdents: boolean;
}

/**
 * @throws {CSSModuleParseError}
 * @throws {AtValueInvalidError}
 * @throws {ScopeError}
 */
export function parseCSSModuleCode(code: string, { filename }: ParseCSSModuleCodeOptions): CSSModuleFile {
  let ast: Root;
  try {
    ast = parse(code, { from: filename });
  } catch (e) {
    throw new CSSModuleParseError(filename, e);
  }
  const { localTokens, tokenImporters } = collectTokens(ast);
  return {
    filename,
    localTokens,
    tokenImporters,
  };
}
