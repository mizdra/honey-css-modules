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
    // eslint-disable-next-line max-params
    function findRenameLocationsRec(
      fileName: string,
      position: number,
      findInStrings: boolean,
      findInComments: boolean,
      preferences: boolean | ts.UserPreferences | undefined,
      renameRequestFromDefinition: boolean = false,
    ): ts.RenameLocation[] | undefined {
      const prior = languageService.findRenameLocations(
        fileName,
        position,
        findInStrings,
        findInComments,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        preferences as any,
      );
      if (prior === undefined) return undefined;

      return prior.flatMap((location) => {
        const tokenInfo = getTokenInfo(language, location);
        if (!tokenInfo || tokenInfo.hint !== TOKEN_HINT_IMPORT_VALUE_WITHOUT_ALIAS) return location;
        // `location` indicates one of the following.
        //
        // - The first `c_1` part of `c_1/*1*/: (await import('./c.module.css')).default.c_1,`
        //   - This is when rename is requested by the importer of the @value.
        //   - In this case, `location.contextSpan` is not `undefined`.
        // - The second `c_1` part of `c_1/*1*/: (await import('./c.module.css')).default.c_1,`
        //   - This is when rename is requested by the definition source of the @value.
        //   - In this case, `location.contextSpan` is `undefined`.
        if (location.contextSpan) {
          // A rename request from the importer of the @value rename it with `as`.
          return {
            ...location,
            ...(renameRequestFromDefinition ? {} : { prefixText: `${tokenInfo.name} as ` }),
          };
        } else {
          // A rename request from the definition source of the @value rename it without `as`.
          // The importer also renames the value with the same name.
          return (
            findRenameLocationsRec(
              location.fileName,
              location.textSpan.start,
              findInStrings,
              findInComments,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              preferences as any,
              true,
            ) ?? []
          );
        }
      });
    }
    return findRenameLocationsRec(fileName, position, findInStrings, findInComments, preferences);
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
  for (const [generatedOffset] of mapper.toGeneratedLocation(location.textSpan.start)) {
    const textWithHint = root.snapshot.getText(
      generatedOffset,
      generatedOffset + location.textSpan.length + TOKEN_HINT_LENGTH,
    );
    const hint = textWithHint.slice(location.textSpan.length);
    if (!hint.match(TOKEN_HINT_PATTERN)) continue;
    return {
      name: textWithHint.slice(0, location.textSpan.length),
      hint: hint as TokenHint,
    };
  }
  return undefined;
}
