import type { Language } from '@volar/language-core';
import type { IsExternalFile, Resolver } from 'honey-css-modules-core';
import type ts from 'typescript';
import { getCodeFixesAtPosition } from './feature/code-fix.js';
import { getCompletionsAtPosition } from './feature/completion.js';
import { getApplicableRefactors, getEditsForRefactor } from './feature/refactor.js';
import { getSemanticDiagnostics } from './feature/semantic-diagnostic.js';
import { getSyntacticDiagnostics } from './feature/syntactic-diagnostic.js';

// eslint-disable-next-line max-params
export function proxyLanguageService(
  language: Language<string>,
  languageService: ts.LanguageService,
  languageServiceHost: ts.LanguageServiceHost,
  project: ts.server.Project,
  resolver: Resolver,
  isExternalFile: IsExternalFile,
): ts.LanguageService {
  const proxy: ts.LanguageService = Object.create(null);

  for (const k of Object.keys(languageService) as (keyof ts.LanguageService)[]) {
    const x = languageService[k]!;
    // @ts-expect-error - JS runtime trickery which is tricky to type tersely
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    proxy[k] = (...args: {}[]) => x.apply(languageService, args);
  }

  proxy.getSyntacticDiagnostics = getSyntacticDiagnostics(language, languageService);
  proxy.getSemanticDiagnostics = getSemanticDiagnostics(
    language,
    languageService,
    languageServiceHost,
    resolver,
    isExternalFile,
  );
  proxy.getApplicableRefactors = getApplicableRefactors(languageService, project);
  proxy.getEditsForRefactor = getEditsForRefactor(languageService);
  proxy.getCompletionsAtPosition = getCompletionsAtPosition(languageService);
  proxy.getCodeFixesAtPosition = getCodeFixesAtPosition(language, languageService, project);

  return proxy;
}
