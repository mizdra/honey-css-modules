import { createTypeScriptInferredChecker } from '@volar/kit';
import type { CSSModule, HCMConfig, MatchesPattern, Resolver } from 'honey-css-modules-core';
import {
  createCSSModuleLanguagePlugin,
  createDts,
  createMatchesPattern,
  createResolver,
  getFileNamesByPattern,
  HCM_DATA_KEY,
  isCSSModuleScript,
  readConfigFile,
  toNormalizedPath,
} from 'honey-css-modules-core';
import ts from 'typescript';
import { create as createTypeScriptService } from 'volar-service-typescript';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver-types';
import { URI } from 'vscode-uri';
import { writeDtsFile } from './dts-writer.js';
import type { Logger } from './logger/logger.js';

/**
 * @throws {WriteDtsFileError}
 */
async function writeDtsByCSSModule(
  cssModule: CSSModule,
  { dtsOutDir, basePath, arbitraryExtensions }: HCMConfig,
  resolver: Resolver,
  matchesPattern: MatchesPattern,
): Promise<void> {
  const dts = createDts(cssModule, { resolver, matchesPattern });
  await writeDtsFile(dts.text, cssModule.fileName, {
    outDir: dtsOutDir,
    basePath,
    arbitraryExtensions,
  });
}

/**
 * Run honey-css-modules .d.ts generation.
 * @param project The absolute path to the project directory or the path to `tsconfig.json`.
 * @throws {GlobError} When failed to retrieve files by glob pattern.
 * @throws {ReadCSSModuleFileError} When failed to read CSS Module file.
 * @throws {WriteDtsFileError}
 */
export async function runHCM(project: string, logger: Logger): Promise<void> {
  const config = readConfigFile(project);
  if (config.diagnostics.length > 0) {
    logger.logDiagnostics(config.diagnostics);
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  }

  const resolver = createResolver(config.paths);
  const matchesPattern = createMatchesPattern(config);
  const asFileName = (scriptId: URI) => {
    const path = toNormalizedPath(scriptId.fsPath);
    return path;
  };

  const fileNames = getFileNamesByPattern(config);
  if (fileNames.length === 0) {
    logger.logDiagnostics([
      {
        type: 'semantic',
        category: 'warning',
        text: `The file specified in tsconfig.json not found.`,
      },
    ]);
    return;
  }

  const checker = createTypeScriptInferredChecker(
    [createCSSModuleLanguagePlugin(config, resolver, matchesPattern, asFileName)],
    [...createTypeScriptService(ts)],
    () => fileNames,
    config.compilerOptions,
  );

  let hasError = false;
  const cssModules: CSSModule[] = [];
  for (const fileName of fileNames) {
    const script = checker.language.scripts.get(URI.file(fileName));
    if (isCSSModuleScript(script)) {
      const hcmData = script.generated.root[HCM_DATA_KEY];
      const syntacticDiagnostics: Diagnostic[] = hcmData.diagnostics.map((d) => {
        return Diagnostic.create(
          {
            start: { line: d.start.line - 1, character: d.start.column - 1 },
            end:
              d.end ?
                { line: d.end.line - 1, character: d.end.column - 1 }
              : { line: d.start.line - 1, character: d.start.column - 1 },
          },
          d.text,
          d.category === 'error' ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning,
          0,
          'honey-css-modules',
        );
      });
      if (syntacticDiagnostics.length > 0) {
        hasError = true;
        logger.logError(checker.printErrors(fileName, syntacticDiagnostics));
      }
    }
  }
  if (hasError) {
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  }

  for (const fileName of fileNames) {
    // eslint-disable-next-line no-await-in-loop
    const semanticDiagnostics = await checker.check(fileName);
    if (semanticDiagnostics.length > 0) {
      hasError = true;
      logger.logError(checker.printErrors(fileName, semanticDiagnostics));
    }
  }

  if (hasError) {
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  }

  for (const cssModule of cssModules) {
    // eslint-disable-next-line no-await-in-loop
    await writeDtsByCSSModule(cssModule, config, resolver, matchesPattern);
  }
}
