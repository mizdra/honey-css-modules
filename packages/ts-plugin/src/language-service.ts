import type { Language } from '@volar/language-core';
import type { TokenHint } from 'honey-css-modules';
import { TOKEN_HINT_IMPORT_VALUE_WITHOUT_ALIAS, TOKEN_HINT_LENGTH, TOKEN_HINT_PATTERN } from 'honey-css-modules';
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
      const tokenInfo = getTokenInfo(language, location);
      if (tokenInfo && tokenInfo.hint === TOKEN_HINT_IMPORT_VALUE_WITHOUT_ALIAS) {
        return {
          ...location,
          prefixText: `${tokenInfo.name} as `,
        };
      }
      return location;
    });
  };
  return proxy;
}

interface TokenInfo {
  /** The token name. */
  name: string;
  /** The token hint. */
  hint: TokenHint;
}

function getTokenInfo(language: Language<string>, location: ts.DocumentSpan): TokenInfo | undefined {
  const script = language.scripts.get(location.fileName);
  if (!script || script.languageId !== LANGUAGE_ID) return undefined;

  const root = script.generated!.root;
  const mapper = language.maps.get(root, script);

  // Get token position in .d.ts file
  const generatedStartFirst = mapper.toGeneratedLocation(location.textSpan.start).next();
  if (generatedStartFirst.done) return undefined;

  // NOTE: Technically, one source position can have multiple generated positions. However, honey-css-modules only sets one generated position.
  //       So, we can safely get the first generated position.
  const generatedStart = generatedStartFirst.value[0];

  const textWithHint = root.snapshot.getText(
    generatedStart,
    generatedStart + location.textSpan.length + TOKEN_HINT_LENGTH,
  );
  const hint = textWithHint.slice(location.textSpan.length);
  if (!hint.match(TOKEN_HINT_PATTERN)) return undefined;
  return {
    name: textWithHint.slice(0, location.textSpan.length),
    hint: hint as TokenHint,
  };
}
