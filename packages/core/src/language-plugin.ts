import type { LanguagePlugin, SourceScript, VirtualCode } from '@volar/language-core';
import type {} from '@volar/typescript';
import ts from 'typescript';
import type { HCMConfig } from './config.js';
import type { SyntacticDiagnostic } from './diagnostic.js';
import { createDts } from './dts-creator.js';
import type { MatchesPattern } from './file.js';
import type { CSSModule } from './parser/css-module-parser.js';
import { parseCSSModule } from './parser/css-module-parser.js';
import type { Resolver } from './resolver.js';

export const LANGUAGE_ID = 'css-module';

export const HCM_DATA_KEY = Symbol('honey-css-modules-data');

interface CSSModuleVirtualCode extends VirtualCode {
  [HCM_DATA_KEY]: {
    cssModule: CSSModule;
    diagnostics: SyntacticDiagnostic[];
  };
}

export interface CSSModuleScript extends SourceScript<string> {
  generated: SourceScript<string>['generated'] & {
    root: CSSModuleVirtualCode;
  };
}

export function createCSSModuleLanguagePlugin(
  config: HCMConfig,
  resolver: Resolver,
  matchesPattern: MatchesPattern,
): LanguagePlugin<string, VirtualCode> {
  return {
    getLanguageId(scriptId) {
      if (!matchesPattern(scriptId)) return undefined;
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
      const { text, mapping, linkedCodeMapping } = createDts(cssModule, { resolver, matchesPattern });
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
          cssModule,
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
