import type { MatchesPattern } from './file.js';
import type { CSSModule } from './parser/css-module-parser.js';
import type { Resolver } from './resolver.js';

export const STYLES_EXPORT_NAME = 'styles';

export interface CreateDtsOptions {
  resolver: Resolver;
  matchesPattern: MatchesPattern;
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
 */
export function createDts(
  { fileName, localTokens, tokenImporters: _tokenImporters }: CSSModule,
  options: CreateDtsOptions,
): { text: string; mapping: CodeMapping; linkedCodeMapping: LinkedCodeMapping } {
  const mapping: CodeMapping = { sourceOffsets: [], lengths: [], generatedOffsets: [] };
  const linkedCodeMapping: LinkedCodeMapping = {
    sourceOffsets: [],
    lengths: [],
    generatedOffsets: [],
    generatedLengths: [],
  };

  // Filter external files
  const tokenImporters = _tokenImporters.filter((tokenImporter) => {
    const resolved = options.resolver(tokenImporter.from, { request: fileName });
    return resolved !== undefined && options.matchesPattern(resolved);
  });

  // If the CSS module file has no tokens, return an .d.ts file with an empty object.
  if (localTokens.length === 0 && tokenImporters.length === 0) {
    return {
      text: `declare const ${STYLES_EXPORT_NAME} = {};\nexport default ${STYLES_EXPORT_NAME};\n`,
      mapping,
      linkedCodeMapping,
    };
  }

  let text = `declare const ${STYLES_EXPORT_NAME} = {\n`;
  for (const token of localTokens) {
    text += `  `;
    mapping.sourceOffsets.push(token.loc.start);
    mapping.generatedOffsets.push(text.length);
    mapping.lengths.push(token.name.length);
    text += `${token.name}: '' as readonly string,\n`;
  }
  for (const tokenImporter of tokenImporters) {
    if (tokenImporter.type === 'import') {
      text += `  ...(await import(`;
      mapping.sourceOffsets.push(tokenImporter.fromLoc.start - 1);
      mapping.lengths.push(tokenImporter.from.length + 2);
      mapping.generatedOffsets.push(text.length);
      text += `'${tokenImporter.from}')).default,\n`;
    } else {
      // eslint-disable-next-line no-loop-func
      tokenImporter.values.forEach((value, i) => {
        const localName = value.localName ?? value.name;
        const localLoc = value.localLoc ?? value.loc;

        text += `  `;
        mapping.sourceOffsets.push(localLoc.start);
        mapping.lengths.push(localName.length);
        mapping.generatedOffsets.push(text.length);
        linkedCodeMapping.sourceOffsets.push(text.length);
        linkedCodeMapping.lengths.push(localName.length);
        text += `${localName}: (await import(`;
        if (i === 0) {
          mapping.sourceOffsets.push(tokenImporter.fromLoc.start - 1);
          mapping.lengths.push(tokenImporter.from.length + 2);
          mapping.generatedOffsets.push(text.length);
        }
        text += `'${tokenImporter.from}')).default.`;
        mapping.sourceOffsets.push(value.loc.start);
        mapping.lengths.push(value.name.length);
        mapping.generatedOffsets.push(text.length);
        linkedCodeMapping.generatedOffsets.push(text.length);
        linkedCodeMapping.generatedLengths.push(value.name.length);
        text += `${value.name},\n`;
      });
    }
  }
  text += `};\nexport default ${STYLES_EXPORT_NAME};\n`;
  return { text, mapping, linkedCodeMapping };
}
