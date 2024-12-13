import type { CSSModuleFile } from './parser/css-module-parser.js';
import type { Resolver } from './resolver.js';
import { getPosixRelativePath } from './util.js';

export interface CreateDtsCodeOptions {
  resolver: Resolver;
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
  const tokenImporters: CSSModuleFile['tokenImporters'] = [];
  for (const tokenImporter of _tokenImporters) {
    const resolved = options.resolver(tokenImporter.specifier, { request: filename });
    if (resolved !== undefined && !options.isExternalFile(resolved)) {
      tokenImporters.push({ ...tokenImporter, specifier: resolved });
    }
  }

  // If the CSS module file has no tokens, return an .d.ts file with an empty object.
  if (localTokens.length === 0 && tokenImporters.length === 0) {
    return `declare const styles: Readonly<{}>;\nexport default styles;\n`;
  }

  let result = 'declare const styles: Readonly<\n';
  for (const token of localTokens) {
    result += `  & { ${token.name}: string }\n`;
  }
  for (const tokenImporter of tokenImporters) {
    const specifier = getPosixRelativePath(filename, tokenImporter.specifier);
    if (tokenImporter.type === 'import') {
      result += `  & (typeof import('${specifier}'))['default']\n`;
    } else {
      result += `  & { ${tokenImporter.localName}: (typeof import('${specifier}'))['default']['${tokenImporter.importedName}'] }\n`;
    }
  }
  result += '>;\nexport default styles;\n';
  return result;
}
