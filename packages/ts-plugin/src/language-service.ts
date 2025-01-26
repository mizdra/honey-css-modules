import type { Language } from '@volar/language-core';
import type { SyntacticDiagnostic } from 'honey-css-modules';
import ts from 'typescript';
import { HCM_DATA_KEY, isCSSModuleScript } from './language-plugin.js';

const ERROR_CODE = 0;

export function proxyLanguageService(
  language: Language<string>,
  languageService: ts.LanguageService,
): ts.LanguageService {
  const proxy: ts.LanguageService = Object.create(null);

  for (const k of Object.keys(languageService) as (keyof ts.LanguageService)[]) {
    const x = languageService[k]!;
    // @ts-expect-error - JS runtime trickery which is tricky to type tersely
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    proxy[k] = (...args: {}[]) => x.apply(languageService, args);
  }

  proxy.getSyntacticDiagnostics = (fileName: string) => {
    const prior = languageService.getSyntacticDiagnostics(fileName);
    const script = language.scripts.get(fileName);
    if (!isCSSModuleScript(script)) return prior;

    const virtualCode = script.generated.root;
    const diagnostics = virtualCode[HCM_DATA_KEY].diagnostics;
    const sourceFile = languageService.getProgram()!.getSourceFile(fileName)!;
    const tsDiagnostics = diagnostics.map((diagnostic) => convertDiagnostic(diagnostic, sourceFile));
    return [...prior, ...tsDiagnostics];
  };

  return proxy;
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
    code: ERROR_CODE,
  };
}

function convertErrorCategory(category: 'error' | 'warning' | 'suggestion'): ts.DiagnosticCategory {
  switch (category) {
    case 'error':
      return ts.DiagnosticCategory.Error;
    case 'warning':
      return ts.DiagnosticCategory.Warning;
    case 'suggestion':
      return ts.DiagnosticCategory.Suggestion;
    default:
      throw new Error(`Unknown category: ${String(category)}`);
  }
}
