import { dirname, relative, resolve } from 'node:path';
import type { CSSModuleFile } from './parser/css-module-parser.js';

function getRelativePath(fromFilePath: string, toFilePath: string): string {
  const resolved = relative(dirname(fromFilePath), toFilePath);
  if (resolved.startsWith('..')) {
    return resolved;
  } else {
    return `./${resolved}`;
  }
}

export interface CreateDtsCodeOptions {
  isExternalFile: (filename: string) => boolean;
}

/**
 * Create a d.ts file from a CSS module file.
 * @example
 * If the CSS module file is:
 * ```css
 * @import './a.module.css';
 * @value local1: string;
 * @value imported1, imported2 as aliasedImported2 from './b.module.css';
 * .local2 { color: red }
 * ```
 * The d.ts file would be:
 * ```ts
 * declare const styles: Readonly<
 *   & { local1: string }
 *   & { local2: string }
 *   & (typeof import('./a.module.css'))['default']
 *   & { imported1: (typeof import('./c.module.css'))['default']['imported1'] }
 *   & { aliasedImported2: (typeof import('./d.module.css'))['default']['imported2'] }
 * >;
 * export default styles;
 * ```
 *
 * @throws {ResolveError} When the resolver throws an error.
 */
export function createDtsCode(
  { filename, localTokens, tokenImporters: _tokenImporters }: CSSModuleFile,
  options: CreateDtsCodeOptions,
): string {
  // Resolve and filter external files
  const tokenImporters = _tokenImporters.filter((tokenImporter) => {
    // Exclude non-relative paths such as `@import ‘bootstrap’`.
    if (!tokenImporter.specifier.startsWith('.')) return false;
    const absolutePath = resolve(dirname(filename), tokenImporter.specifier);
    // Exclude external files (files do not match `pattern` in the first argument of `hcm` command)
    return !options.isExternalFile(absolutePath);
  });

  // If the CSS module file has no tokens, return an .d.ts file with an empty object.
  if (localTokens.length === 0 && tokenImporters.length === 0) {
    return `declare const styles: Readonly<{}>;\nexport default styles;\n`;
  }

  let result = 'declare const styles: Readonly<\n';
  for (const token of localTokens) {
    result += `  & { ${token.name}: string }\n`;
  }
  for (const tokenImporter of tokenImporters) {
    if (tokenImporter.type === 'import') {
      result += `  & (typeof import('${tokenImporter.specifier}'))['default']\n`;
    } else {
      result += `  & { ${tokenImporter.localName}: (typeof import('${tokenImporter.specifier}'))['default']['${tokenImporter.importedName}'] }\n`;
    }
  }
  result += '>;\nexport default styles;\n';
  return result;
}
