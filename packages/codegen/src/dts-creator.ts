import type { CSSModuleFile } from './parser/css-module-parser.js';
import type { Resolver } from './resolver.js';

export interface CreateDtsOptions {
  resolver: Resolver;
  isExternalFile: (filename: string) => boolean;
}

interface CodeMapping {
  /** The source offsets of the tokens in the *.module.css file. */
  sourceOffsets: number[];
  /** The lengths of the tokens in the *.module.css file. */
  lengths: number[];
  /** The generated offsets of the tokens in the *.d.ts file. */
  generatedOffsets: number[];
}

/** The map linking the two codes in *.d.ts */
// NOTE: `sourceOffsets` and `generatedOffsets` are interchangeable. Exchanging code assignments does not change the behavior.
interface LinkedCodeMapping extends CodeMapping {
  /** The offset of the first code to be linked. */
  sourceOffsets: number[];
  /** The length of the first code to be linked. */
  lengths: number[];
  /** The offset of the second code to be linked. */
  generatedOffsets: number[];
  /** The length of the second code to be linked. */
  generatedLengths: number[];
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
 * const styles = {
 *   local1: '' as readonly string,
 *   local2: '' as readonly string,
 *   ...(await import('./a.module.css')).default,
 *   imported1: (await import('./b.module.css')).default.imported1,
 *   aliasedImported2: (await import('./b.module.css')).default.imported2,
 * };
 * export default styles;
 * ```
 *
 * @throws {ResolveError} When the resolver throws an error.
 */
export function createDts(
  { filename, localTokens, tokenImporters: _tokenImporters }: CSSModuleFile,
  options: CreateDtsOptions,
): { code: string; mapping: CodeMapping; linkedCodeMapping: LinkedCodeMapping } {
  const mapping: CodeMapping = { sourceOffsets: [], lengths: [], generatedOffsets: [] };
  const linkedCodeMapping: LinkedCodeMapping = {
    sourceOffsets: [],
    lengths: [],
    generatedOffsets: [],
    generatedLengths: [],
  };

  // Filter external files
  const tokenImporters = _tokenImporters.filter((tokenImporter) => {
    const resolved = options.resolver(tokenImporter.from, { request: filename });
    return resolved !== undefined && !options.isExternalFile(resolved);
  });

  // If the CSS module file has no tokens, return an .d.ts file with an empty object.
  if (localTokens.length === 0 && tokenImporters.length === 0) {
    return { code: `declare const styles = {};\nexport default styles;\n`, mapping, linkedCodeMapping };
  }

  let code = 'declare const styles = {\n';
  for (const token of localTokens) {
    code += `  `;
    mapping.sourceOffsets.push(token.loc.start.offset);
    mapping.generatedOffsets.push(code.length);
    mapping.lengths.push(token.name.length);
    code += `${token.name}: '' as readonly string,\n`;
  }
  for (const tokenImporter of tokenImporters) {
    if (tokenImporter.type === 'import') {
      code += `  ...(await import('${tokenImporter.from}')).default,\n`;
    } else {
      for (const value of tokenImporter.values) {
        if (value.localName === undefined || value.localLoc === undefined) {
          code += `  `;
          mapping.sourceOffsets.push(value.loc.start.offset);
          mapping.lengths.push(value.name.length);
          mapping.generatedOffsets.push(code.length);
          linkedCodeMapping.sourceOffsets.push(code.length);
          linkedCodeMapping.lengths.push(value.name.length);
          code += `${value.name}: (await import('${tokenImporter.from}')).default.`;
          mapping.sourceOffsets.push(value.loc.start.offset);
          mapping.lengths.push(value.name.length);
          mapping.generatedOffsets.push(code.length);
          linkedCodeMapping.generatedOffsets.push(code.length);
          linkedCodeMapping.generatedLengths.push(value.name.length);
          code += `${value.name},\n`;
        } else {
          code += `  `;
          mapping.sourceOffsets.push(value.localLoc.start.offset);
          mapping.lengths.push(value.localName.length);
          mapping.generatedOffsets.push(code.length);
          linkedCodeMapping.sourceOffsets.push(code.length);
          linkedCodeMapping.lengths.push(value.localName.length);
          code += `${value.localName}: (await import('${tokenImporter.from}')).default.`;
          mapping.sourceOffsets.push(value.loc.start.offset);
          mapping.lengths.push(value.name.length);
          mapping.generatedOffsets.push(code.length);
          linkedCodeMapping.generatedOffsets.push(code.length);
          linkedCodeMapping.generatedLengths.push(value.name.length);
          code += `${value.name},\n`;
        }
      }
    }
  }
  code += '};\nexport default styles;\n';
  return { code, mapping, linkedCodeMapping };
}
