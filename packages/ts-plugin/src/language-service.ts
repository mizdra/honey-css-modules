import type { Language } from '@volar/language-core';
import ts from 'typescript';

export function proxyLanguageService(
  _ts: typeof ts,
  _language: Language<string>,
  languageService: ts.LanguageService,
): ts.LanguageService {
  const proxy: ts.LanguageService = Object.create(null);

  for (const k of Object.keys(languageService) as (keyof ts.LanguageService)[]) {
    const x = languageService[k]!;
    // @ts-expect-error - JS runtime trickery which is tricky to type tersely
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    proxy[k] = (...args: {}[]) => x.apply(languageService, args);
  }
  proxy.getCompletionsAtPosition = (fileName, position, options) => {
    const prior = languageService.getCompletionsAtPosition(fileName, position, options)!;
    prior.entries.push({
      name: 'Hello',
      kind: ts.ScriptElementKind.keyword,
      sortText: '0',
    });
    return prior;
  };
  return proxy;
}
