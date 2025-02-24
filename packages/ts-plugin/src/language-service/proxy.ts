import type { Language } from '@volar/language-core';
import { createExportBuilder, type MatchesPattern, type Resolver } from 'honey-css-modules-core';
import type ts from 'typescript';
import { HCM_DATA_KEY, isCSSModuleScript } from '../language-plugin.js';
import { getCodeFixesAtPosition } from './feature/code-fix.js';
import { getCompletionsAtPosition } from './feature/completion.js';
import { getApplicableRefactors, getEditsForRefactor } from './feature/refactor.js';
import { getSemanticDiagnostics } from './feature/semantic-diagnostic.js';
import { getSyntacticDiagnostics } from './feature/syntactic-diagnostic.js';

export function proxyLanguageService(
  language: Language<string>,
  languageService: ts.LanguageService,
  project: ts.server.Project,
  resolver: Resolver,
  matchesPattern: MatchesPattern,
): ts.LanguageService {
  const proxy: ts.LanguageService = Object.create(null);

  for (const k of Object.keys(languageService) as (keyof ts.LanguageService)[]) {
    const x = languageService[k]!;
    // @ts-expect-error - JS runtime trickery which is tricky to type tersely
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    proxy[k] = (...args: {}[]) => x.apply(languageService, args);
  }

  const getCSSModule = (path: string) => {
    const script = language.scripts.get(path);
    if (isCSSModuleScript(script)) {
      return script.generated.root[HCM_DATA_KEY].cssModule;
    }
    return undefined;
  };
  const exportBuilder = createExportBuilder({ getCSSModule, resolver, matchesPattern });

  proxy.getSyntacticDiagnostics = getSyntacticDiagnostics(language, languageService);
  proxy.getSemanticDiagnostics = getSemanticDiagnostics(
    language,
    languageService,
    exportBuilder,
    resolver,
    matchesPattern,
    getCSSModule,
  );
  proxy.getApplicableRefactors = getApplicableRefactors(languageService, project);
  proxy.getEditsForRefactor = getEditsForRefactor(languageService);
  proxy.getCompletionsAtPosition = getCompletionsAtPosition(languageService);
  proxy.getCodeFixesAtPosition = getCodeFixesAtPosition(language, languageService, project);

  return proxy;
}
