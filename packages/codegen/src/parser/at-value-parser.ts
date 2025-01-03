import type { AtRule } from 'postcss';
import { AtValueInvalidError } from '../error.js';
import type { Location } from './location.js';

interface ValueDeclaration {
  type: 'valueDeclaration';
  name: string;
  // value: string; // unused
  loc: Location;
}

interface ValueImportDeclaration {
  type: 'valueImportDeclaration';
  values: {
    name: string;
    localName?: string;
    localLoc?: Location;
  }[];
  from: string;
}

type ParsedAtValue = ValueDeclaration | ValueImportDeclaration;

const VALUE_IMPORT_PATTERN = /^(.+?)\s+from\s+("[^"]*"|'[^']*')$/du;
const VALUE_DEFINITION_PATTERN = /(?:\s+|^)([\w-]+):?(.*?)$/du;
const IMPORTED_ITEM_PATTERN = /^([\w-]+)(?:\s+as\s+([\w-]+))?/du;

/**
 * Parse the `@value` rule.
 * Forked from https://github.com/css-modules/postcss-modules-values/blob/v4.0.0/src/index.js.
 *
 * @throws {AtValueInvalidError}
 * @license
 * ISC License (ISC)
 * Copyright (c) 2015, Glen Maddern
 *
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted,
 * provided that the above copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING
 * ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
 * WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH
 * THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */
// MEMO: honey-css-modules does not support `@value` with parentheses (e.g., `@value (a, b) from '...';`) to simplify the implementation.
// MEMO: honey-css-modules does not support `@value` with variable module name (e.g., `@value a from moduleName;`) to simplify the implementation.
export function parseAtValue(atValue: AtRule): ParsedAtValue {
  const matchesForValueImport = atValue.params.match(VALUE_IMPORT_PATTERN);
  if (matchesForValueImport) {
    const [, importedItems, from] = matchesForValueImport as [string, string, string];

    let lastItemIndex = 0;
    const values = importedItems.split(/\s*,\s*/u).map((alias) => {
      const currentItemIndex = importedItems.indexOf(alias, lastItemIndex);
      lastItemIndex = currentItemIndex;
      const matchesForImportedItem = alias.match(IMPORTED_ITEM_PATTERN);

      if (matchesForImportedItem) {
        const [, name, localName] = matchesForImportedItem as [string, string, string | undefined];
        if (localName === undefined) {
          return { name };
        } else {
          const localNameIndex = matchesForImportedItem.indices![2]![0];
          const start = {
            line: atValue.source!.start!.line,
            column:
              atValue.source!.start!.column +
              6 +
              (atValue.raws.afterName?.length ?? 0) +
              currentItemIndex +
              localNameIndex,
            offset:
              atValue.source!.start!.offset +
              6 +
              (atValue.raws.afterName?.length ?? 0) +
              currentItemIndex +
              localNameIndex,
          };
          const end = {
            line: start.line,
            column: start.column + localName.length,
            offset: start.offset + localName.length,
          };
          return { name, localName, localLoc: { start, end } };
        }
      } else {
        throw new AtValueInvalidError(atValue);
      }
    });

    // `from` is surrounded by quotes (e.g., `"./test.module.css"`). So, remove the quotes.
    const normalizedFrom = from.slice(1, -1);

    return { type: 'valueImportDeclaration', values, from: normalizedFrom };
  }

  const matchesForValueDefinition = `${atValue.params}${atValue.raws.between!}`.match(VALUE_DEFINITION_PATTERN);
  if (matchesForValueDefinition) {
    const [, name, _value] = matchesForValueDefinition;
    if (name === undefined) throw new Error(`unreachable`);
    /** The index of the `<name>` in `@value <name>: <value>;`. */
    const nameIndex = 6 + (atValue.raws.afterName?.length ?? 0) + matchesForValueDefinition.indices![1]![0];
    const start = {
      line: atValue.source!.start!.line,
      column: atValue.source!.start!.column + nameIndex,
      offset: atValue.source!.start!.offset + nameIndex,
    };
    const end = {
      line: start.line,
      column: start.column + name.length,
      offset: start.offset + name.length,
    };
    return { type: 'valueDeclaration', name, loc: { start, end } };
  }
  throw new AtValueInvalidError(atValue);
}
