import type { Language } from '@volar/language-core';
import type { CSSModule, ExportBuilder, MatchesPattern, Resolver, SemanticDiagnostic } from '@css-modules-kit/core';
import { checkCSSModule } from '@css-modules-kit/core';
import ts from 'typescript';
import { CMK_DATA_KEY, isCSSModuleScript } from '../../language-plugin.js';
import { convertErrorCategory, TS_ERROR_CODE_FOR_CMK_ERROR } from '../../util.js';

// eslint-disable-next-line max-params
export function getSemanticDiagnostics(
  language: Language<string>,
  languageService: ts.LanguageService,
  exportBuilder: ExportBuilder,
  resolver: Resolver,
  matchesPattern: MatchesPattern,
  getCSSModule: (path: string) => CSSModule | undefined,
): ts.LanguageService['getSemanticDiagnostics'] {
  return (fileName: string) => {
    const prior = languageService.getSemanticDiagnostics(fileName);
    const script = language.scripts.get(fileName);
    if (isCSSModuleScript(script)) {
      const virtualCode = script.generated.root;
      const cssModule = virtualCode[CMK_DATA_KEY].cssModule;
      const diagnostics = checkCSSModule(cssModule, exportBuilder, matchesPattern, resolver, getCSSModule);
      const sourceFile = languageService.getProgram()!.getSourceFile(fileName)!;
      const tsDiagnostics = diagnostics.map((diagnostic) => convertDiagnostic(diagnostic, sourceFile));
      prior.push(...tsDiagnostics);
    }
    return prior;
  };
}

function convertDiagnostic(diagnostic: SemanticDiagnostic, sourceFile: ts.SourceFile): ts.Diagnostic {
  const start =
    diagnostic.start ?
      ts.getPositionOfLineAndCharacter(sourceFile, diagnostic.start.line - 1, diagnostic.start.column - 1)
    : undefined;
  const length =
    start !== undefined && diagnostic.end ?
      ts.getPositionOfLineAndCharacter(sourceFile, diagnostic.end.line - 1, diagnostic.end.column - 1) - start
    : undefined;
  return {
    file: sourceFile,
    start,
    category: convertErrorCategory(diagnostic.category),
    length,
    messageText: diagnostic.text,
    code: TS_ERROR_CODE_FOR_CMK_ERROR,
  };
}
