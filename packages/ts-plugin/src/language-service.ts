import type { Language } from '@volar/language-core';
import { TOKEN_HINT_IMPORT_VALUE_WITHOUT_ALIAS } from 'honey-css-modules';
import type ts from 'typescript';
import { LANGUAGE_ID } from './language-plugin.js';

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

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  proxy.findRenameLocations = (fileName, position, findInStrings, findInComments, preferences) => {
    const prior = languageService.findRenameLocations(
      fileName,
      position,
      findInStrings,
      findInComments,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      preferences as any,
    );
    if (prior === undefined) return undefined;

    // If the token is `@value ... from '...'` and not alias with `as`, set the prefixText to `<originalName> as `.
    return prior.map((location) => {
      const script = language.scripts.get(location.fileName);
      if (!script || script.languageId !== LANGUAGE_ID) return location;

      const root = script.generated!.root;
      const mapper = language.maps.get(root, script);

      // Get token position in .d.ts file
      const generatedStartFirst = mapper.toGeneratedLocation(location.textSpan.start).next();
      if (generatedStartFirst.done) return location;
      // NOTE: Technically, one source position can have multiple generated positions. However, honey-css-modules only sets one generated position.
      //       So, we can safely get the first generated position.
      const generatedStart = generatedStartFirst.value[0];

      const text = root.snapshot.getText(
        generatedStart,
        generatedStart + location.textSpan.length + TOKEN_HINT_IMPORT_VALUE_WITHOUT_ALIAS.length,
      );
      if (text.endsWith(TOKEN_HINT_IMPORT_VALUE_WITHOUT_ALIAS)) {
        return {
          ...location,
          prefixText: `${text.slice(0, location.textSpan.length)} as `,
        };
      }
      return location;
    });
  };
  return proxy;
}
