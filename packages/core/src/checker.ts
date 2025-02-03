import type { SemanticDiagnostic } from './diagnostic.js';
import type { IsExternalFile } from './external-file.js';
import type { CSSModuleFile } from './parser/css-module-parser.js';
import type { Resolver } from './resolver.js';

export type FileExists = (path: string) => boolean;

/**
 * Check CSS Module file for semantic problems.
 */
export function checkCSSModule(
  cssModule: CSSModuleFile,
  resolver: Resolver,
  isExternalFile: IsExternalFile,
  fileExists: FileExists,
): SemanticDiagnostic[] {
  const diagnostics: SemanticDiagnostic[] = [];
  for (const { from, fromLoc } of cssModule.tokenImporters) {
    const resolved = resolver(from, { request: cssModule.fileName });
    if (resolved === undefined || isExternalFile(resolved) || fileExists(resolved)) continue;
    diagnostics.push({
      type: 'semantic',
      category: 'error',
      text: `Cannot find module '${from}'.`,
      fileName: cssModule.fileName,
      start: { line: fromLoc.start.line, column: fromLoc.start.column },
      end: { line: fromLoc.end.line, column: fromLoc.end.column },
    });
  }
  return diagnostics;
}
