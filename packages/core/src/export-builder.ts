import type { MatchesPattern } from './file.js';
import type { CSSModule } from './parser/css-module-parser.js';
import type { Resolver } from './resolver.js';

export interface ExportBuilderHost {
  matchesPattern: MatchesPattern;
  getCSSModule: (path: string) => CSSModule | undefined;
  resolver: Resolver;
}

/**
 * The export token record of a CSS module.
 */
export interface ExportRecord {
  /** The all exported tokens of the CSS module. */
  allTokens: string[];
}

export interface ExportBuilder {
  build(cssModule: CSSModule): ExportRecord;
}

/**
 * A builder for exported token records of CSS modules.
 */
// TODO: Add cache
// TODO: Add support for circular dependencies
// TODO: Handle same token name from different modules
export function createExportBuilder(host: ExportBuilderHost): ExportBuilder {
  function build(cssModule: CSSModule): ExportRecord {
    const result: ExportRecord = { allTokens: [...cssModule.localTokens.map((t) => t.name)] };

    for (const tokenImporter of cssModule.tokenImporters) {
      const from = host.resolver(tokenImporter.from, { request: cssModule.fileName });
      if (!from || !host.matchesPattern(from)) continue;
      const imported = host.getCSSModule(from);
      if (!imported) continue;

      const importedResult = build(imported);
      if (tokenImporter.type === 'import') {
        result.allTokens.push(...importedResult.allTokens);
      } else {
        for (const value of tokenImporter.values) {
          result.allTokens.push(value.name);
        }
      }
    }
    return result;
  }
  return { build };
}
