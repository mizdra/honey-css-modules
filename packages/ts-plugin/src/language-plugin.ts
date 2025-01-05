import type { LanguagePlugin, VirtualCode } from '@volar/language-core';
import type {} from '@volar/typescript';
import type { ResolvedHCMConfig } from 'honey-css-modules';
import { createDts, parseCSSModuleCode, type Resolver } from 'honey-css-modules';
import ts from 'typescript';

const LANGUAGE_ID = 'css-module';

export function createCSSModuleLanguagePlugin(
  config: ResolvedHCMConfig,
  resolver: Resolver,
  isExternalFile: (filename: string) => boolean,
): LanguagePlugin<string, VirtualCode> {
  return {
    getLanguageId(scriptId) {
      // TODO: Handle only .module.css. Ignore other CSS files.
      if (!scriptId.endsWith('.css')) return undefined;
      return LANGUAGE_ID;
    },
    createVirtualCode(scriptId, languageId, snapshot) {
      if (languageId !== LANGUAGE_ID) return undefined;

      const length = snapshot.getLength();
      const cssModule = snapshot.getText(0, length);
      const cssModuleFile = parseCSSModuleCode(cssModule, { filename: scriptId, dashedIdents: config.dashedIdents });
      const { code: dtsCode, mapping, linkedCodeMapping } = createDts(cssModuleFile, { resolver, isExternalFile });
      return {
        id: 'main',
        languageId: LANGUAGE_ID,
        snapshot: {
          getText: (start, end) => dtsCode.slice(start, end),
          getLength: () => dtsCode.length,
          getChangeRange: () => undefined,
        },
        // `mappings` are required to support "Go to definitions" and renaming
        mappings: [{ ...mapping, data: { navigation: true } }],
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
