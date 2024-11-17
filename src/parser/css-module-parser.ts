import type { AtRule, Node, Root, Rule } from 'postcss';
import { parse } from 'postcss';
import { CSSModuleParseError } from '../error.js';
import { parseAtImport } from './at-import-parser.js';
import { parseAtValue } from './at-value-parser.js';
import { getTokenLocationOfAtValue, getTokenLocationOfClassSelector, type Location } from './location.js';
import { parseRule } from './rule-parser.js';

function isAtRuleNode(node: Node): node is AtRule {
  return node.type === 'atrule';
}

function isAtImportNode(node: Node): node is AtRule {
  return isAtRuleNode(node) && node.name === 'import';
}

function isAtValueNode(node: Node): node is AtRule {
  return isAtRuleNode(node) && node.name === 'value';
}

function isRuleNode(node: Node): node is Rule {
  return node.type === 'rule';
}

/**
 * Collect tokens from the AST.
 * @throws {AtValueInvalidError}
 */
function collectTokens(ast: Root) {
  const localTokens: Token[] = [];
  const tokenImporters: TokenImporter[] = [];
  ast.walk((node) => {
    if (isAtImportNode(node)) {
      const specifier = parseAtImport(node);
      if (specifier !== undefined) {
        tokenImporters.push({ type: 'import', specifier });
      }
    } else if (isAtValueNode(node)) {
      const parsedAtValue = parseAtValue(node);
      if (parsedAtValue.type === 'valueDeclaration') {
        localTokens.push({ name: parsedAtValue.name, loc: getTokenLocationOfAtValue(node, parsedAtValue.name) });
      } else if (parsedAtValue.type === 'valueImportDeclaration') {
        for (const value of parsedAtValue.values) {
          tokenImporters.push({
            type: 'value',
            specifier: parsedAtValue.from,
            importedName: value.importedName,
            localName: value.localName,
          });
        }
      }
    } else if (isRuleNode(node)) {
      const localClassNames = parseRule(node);
      for (const localClassName of localClassNames) {
        localTokens.push({ name: localClassName.value, loc: getTokenLocationOfClassSelector(node, localClassName) });
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
  loc: Location | undefined;
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
  specifier: string;
}

/** A token importer using `@value`. */
export interface ValueTokenImporter {
  type: 'value';
  /**
   * The specifier of the file from which the token is imported.
   * This is a string before being resolved.
   */
  specifier: string;
  /**
   * The name of the token in the file from which it is imported.
   * @example `@value a from './a.module.css'` would have `importedName` as `'a'`.
   * @example `@value a as b from './a.module.css'` would have `importedName` as `'a'`.
   */
  importedName: string;
  /**
   * The name of the token in the current file.
   * @example `@value a from './a.module.css'` would have `localName` as `'a'`.
   * @example `@value a as b from './a.module.css'` would have `localName` as `'b'`.
   */
  localName: string;
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
