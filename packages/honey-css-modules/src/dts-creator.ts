import type { CSSModuleFile } from './parser/css-module-parser.js';
import type { Resolver } from './resolver.js';
import { getPosixRelativePath } from './util.js';

export interface CreateDtsOptions {
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
export function createDts(
  { filename, localTokens, tokenImporters: _tokenImporters }: CSSModuleFile,
  options: CreateDtsOptions,
): { code: string } {
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
    return { code: `declare const styles: Readonly<{}>;\nexport default styles;\n` };
  }

  let code = 'declare const styles: Readonly<\n';
  for (const token of localTokens) {
    code += `  & { ${token.name}: string }\n`;
  }
  for (const tokenImporter of tokenImporters) {
    const specifier = getPosixRelativePath(filename, tokenImporter.specifier);
    if (tokenImporter.type === 'import') {
      code += `  & (typeof import('${specifier}'))['default']\n`;
    } else {
      code += `  & { ${tokenImporter.localName}: (typeof import('${specifier}'))['default']['${tokenImporter.importedName}'] }\n`;
    }
  }
  code += '>;\nexport default styles;\n';
  return { code };
}
