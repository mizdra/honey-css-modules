import type { LanguagePlugin, VirtualCode } from '@volar/language-core';
import type {} from '@volar/typescript';
import type { ResolvedHCMConfig } from 'honey-css-modules';
import { createDts, parseCSSModuleCode, type Resolver } from 'honey-css-modules';
import ts from 'typescript';

export const LANGUAGE_ID = 'css-module';

export function createCSSModuleLanguagePlugin(
  config: ResolvedHCMConfig,
  resolver: Resolver,
  isExternalFile: (filename: string) => boolean,
): LanguagePlugin<string, VirtualCode> {
  return {
    getLanguageId(scriptId) {
      if (isExternalFile(scriptId)) return undefined;
      return LANGUAGE_ID;
    },
    createVirtualCode(scriptId, languageId, snapshot) {
      if (languageId !== LANGUAGE_ID) return undefined;

      const length = snapshot.getLength();
      const cssModuleCode = snapshot.getText(0, length);
      const { cssModule } = parseCSSModuleCode(cssModuleCode, {
        filename: scriptId,
        dashedIdents: config.dashedIdents,
      });
      // TODO: Report diagnostics
      if (cssModule === undefined) return undefined;
      const { code: dtsCode, mapping, linkedCodeMapping } = createDts(cssModule, { resolver, isExternalFile });
      return {
        id: 'main',
        languageId: LANGUAGE_ID,
        snapshot: {
          getText: (start, end) => dtsCode.slice(start, end),
          getLength: () => dtsCode.length,
          getChangeRange: () => undefined,
        },
        // `mappings` are required to support "Go to Definition" and renaming
        mappings: [{ ...mapping, data: { navigation: true } }],
        // `linkedCodeMappings` are required to support "Go to Definition" and renaming for the imported tokens
        linkedCodeMappings: [{ ...linkedCodeMapping, data: undefined }],
      };
    },
    typescript: {
      extraFileExtensions: [
        {
          extension: 'css',
          isMixedContent: true,
          scriptKind: ts.ScriptKind.TS,
        },
      ],
      getServiceScript(root) {
        return {
          code: root,
          extension: ts.Extension.Ts,
          scriptKind: ts.ScriptKind.TS,
        };
      },
    },
  };
}
