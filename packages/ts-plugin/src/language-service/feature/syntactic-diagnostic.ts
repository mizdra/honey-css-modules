import type { Language } from '@volar/language-core';
import type { SyntacticDiagnostic } from 'honey-css-modules-core';
import ts from 'typescript';
import { HCM_DATA_KEY, isCSSModuleScript } from '../../language-plugin.js';
import { convertErrorCategory, TS_ERROR_CODE_FOR_HCM_ERROR } from '../../util.js';

export function getSyntacticDiagnostics(
  language: Language<string>,
  languageService: ts.LanguageService,
): ts.LanguageService['getSyntacticDiagnostics'] {
  return (fileName: string) => {
    const prior = languageService.getSyntacticDiagnostics(fileName);
    const script = language.scripts.get(fileName);
    if (isCSSModuleScript(script)) {
      const virtualCode = script.generated.root;
      const diagnostics = virtualCode[HCM_DATA_KEY].diagnostics;
      const sourceFile = languageService.getProgram()!.getSourceFile(fileName)!;
      const tsDiagnostics = diagnostics.map((diagnostic) => convertDiagnostic(diagnostic, sourceFile));
      prior.push(...tsDiagnostics);
    }
    return prior;
  };
}

function convertDiagnostic(diagnostic: SyntacticDiagnostic, sourceFile: ts.SourceFile): ts.DiagnosticWithLocation {
  const start = ts.getPositionOfLineAndCharacter(sourceFile, diagnostic.start.line - 1, diagnostic.start.column - 1);
  const length =
    diagnostic.end ?
      ts.getPositionOfLineAndCharacter(sourceFile, diagnostic.end.line - 1, diagnostic.end.column - 1) - start
    : 1;
  return {
    file: sourceFile,
    start,
    category: convertErrorCategory(diagnostic.category),
    length,
    messageText: diagnostic.text,
    code: TS_ERROR_CODE_FOR_HCM_ERROR,
  };
}
