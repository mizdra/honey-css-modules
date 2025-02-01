import type { Language } from '@volar/language-core';
import type ts from 'typescript';
import { getCodeFixesAtPosition } from './feature/code-fix.js';
import { getCompletionsAtPosition } from './feature/completion.js';
import { getApplicableRefactors, getEditsForRefactor } from './feature/refactor.js';
import { getSyntacticDiagnostics } from './feature/syntactic-diagnostic.js';

export function proxyLanguageService(
  language: Language<string>,
  languageService: ts.LanguageService,
  project: ts.server.Project,
): ts.LanguageService {
  const proxy: ts.LanguageService = Object.create(null);

  for (const k of Object.keys(languageService) as (keyof ts.LanguageService)[]) {
    const x = languageService[k]!;
    // @ts-expect-error - JS runtime trickery which is tricky to type tersely
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    proxy[k] = (...args: {}[]) => x.apply(languageService, args);
  }

  proxy.getSyntacticDiagnostics = getSyntacticDiagnostics(language, languageService);
  proxy.getApplicableRefactors = getApplicableRefactors(languageService, project);
  proxy.getEditsForRefactor = getEditsForRefactor(languageService);
  proxy.getCompletionsAtPosition = getCompletionsAtPosition(languageService);
  proxy.getCodeFixesAtPosition = getCodeFixesAtPosition(language, languageService, project);

  return proxy;
}
