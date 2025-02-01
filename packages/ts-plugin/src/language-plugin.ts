import type { LanguagePlugin, SourceScript, VirtualCode } from '@volar/language-core';
import type {} from '@volar/typescript';
import type { IsExternalFile, ResolvedHCMConfig, Resolver, SyntacticDiagnostic } from 'honey-css-modules-core';
import { createDts, parseCSSModule } from 'honey-css-modules-core';
import ts from 'typescript';

export const LANGUAGE_ID = 'css-module';

export const HCM_DATA_KEY = Symbol('honey-css-modules-data');

interface CSSModuleVirtualCode extends VirtualCode {
  [HCM_DATA_KEY]: {
    diagnostics: SyntacticDiagnostic[];
  };
}

export interface CSSModuleScript extends SourceScript<string> {
  generated: SourceScript<string>['generated'] & {
    root: CSSModuleVirtualCode;
  };
}

export function createCSSModuleLanguagePlugin(
  config: ResolvedHCMConfig,
  resolver: Resolver,
  isExternalFile: IsExternalFile,
): LanguagePlugin<string, VirtualCode> {
  return {
    getLanguageId(scriptId) {
      if (isExternalFile(scriptId)) return undefined;
      return LANGUAGE_ID;
    },
    createVirtualCode(scriptId, languageId, snapshot): CSSModuleVirtualCode | undefined {
      if (languageId !== LANGUAGE_ID) return undefined;

      const length = snapshot.getLength();
      const cssModuleCode = snapshot.getText(0, length);
      const { cssModule, diagnostics } = parseCSSModule(cssModuleCode, {
        fileName: scriptId,
        dashedIdents: config.dashedIdents,
        // The CSS in the process of being written in an editor often contains invalid syntax.
        // So, ts-plugin uses a fault-tolerant Parser to parse CSS.
        safe: true,
      });
      // TODO: Report diagnostics
      if (cssModule === undefined) return undefined;
      const { text, mapping, linkedCodeMapping } = createDts(cssModule, { resolver, isExternalFile });
      return {
        id: 'main',
        languageId: LANGUAGE_ID,
        snapshot: {
          getText: (start, end) => text.slice(start, end),
          getLength: () => text.length,
          getChangeRange: () => undefined,
        },
        // `mappings` are required to support "Go to Definition" and renaming
        mappings: [{ ...mapping, data: { navigation: true } }],
        // `linkedCodeMappings` are required to support "Go to Definition" and renaming for the imported tokens
        linkedCodeMappings: [{ ...linkedCodeMapping, data: undefined }],
        [HCM_DATA_KEY]: {
          diagnostics,
        },
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

export function isCSSModuleScript(script: SourceScript<string> | undefined): script is CSSModuleScript {
  return (
    !!script && script.languageId === LANGUAGE_ID && !!script.generated?.root && HCM_DATA_KEY in script.generated.root
  );
}
