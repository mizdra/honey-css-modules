import type { Language } from '@volar/language-core';
import type { IsExternalFile, Resolver, SemanticDiagnostic } from 'honey-css-modules-core';
import { checkCSSModule } from 'honey-css-modules-core';
import ts from 'typescript';
import { HCM_DATA_KEY, isCSSModuleScript } from '../../language-plugin.js';
import { convertErrorCategory, TS_ERROR_CODE_FOR_HCM_ERROR } from '../../util.js';

export function getSemanticDiagnostics(
  language: Language<string>,
  languageService: ts.LanguageService,
  languageServiceHost: ts.LanguageServiceHost,
  resolver: Resolver,
  isExternalFile: IsExternalFile,
): ts.LanguageService['getSemanticDiagnostics'] {
  return (fileName: string) => {
    const prior = languageService.getSemanticDiagnostics(fileName);
    const script = language.scripts.get(fileName);
    if (isCSSModuleScript(script)) {
      const virtualCode = script.generated.root;
      const cssModule = virtualCode[HCM_DATA_KEY].cssModule;
      const diagnostics = checkCSSModule(
        cssModule,
        resolver,
        isExternalFile,
        languageServiceHost.fileExists.bind(languageServiceHost),
      );
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
    code: TS_ERROR_CODE_FOR_HCM_ERROR,
  };
}
