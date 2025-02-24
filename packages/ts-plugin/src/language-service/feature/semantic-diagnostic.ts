import type { Language } from '@volar/language-core';
import type { CSSModule, ExportBuilder, MatchesPattern, Resolver, SemanticDiagnostic } from 'honey-css-modules-core';
import { checkCSSModule } from 'honey-css-modules-core';
import type ts from 'typescript';
import { HCM_DATA_KEY, isCSSModuleScript } from '../../language-plugin.js';
import { convertErrorCategory, TS_ERROR_CODE_FOR_HCM_ERROR } from '../../util.js';

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
      const cssModule = virtualCode[HCM_DATA_KEY].cssModule;
      const diagnostics = checkCSSModule(cssModule, exportBuilder, matchesPattern, resolver, getCSSModule);
      const sourceFile = languageService.getProgram()!.getSourceFile(fileName)!;
      const tsDiagnostics = diagnostics.map((diagnostic) => convertDiagnostic(diagnostic, sourceFile));
      prior.push(...tsDiagnostics);
    }
    return prior;
  };
}

function convertDiagnostic(diagnostic: SemanticDiagnostic, sourceFile: ts.SourceFile): ts.Diagnostic {
  const length = diagnostic.start !== undefined && diagnostic.end !== undefined ? diagnostic.end - diagnostic.start : 1;
  return {
    file: sourceFile,
    start: diagnostic.start,
    category: convertErrorCategory(diagnostic.category),
    length,
    messageText: diagnostic.text,
    code: TS_ERROR_CODE_FOR_HCM_ERROR,
  };
}
