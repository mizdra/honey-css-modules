// eslint-disable-next-line n/no-unsupported-features/node-builtins -- TODO: Require Node.js version which have stable glob API
import { glob, readFile } from 'node:fs/promises';
import type {
  CSSModule,
  MatchesPattern,
  ResolvedHCMConfig,
  Resolver,
  SyntacticDiagnostic,
} from 'honey-css-modules-core';
import { createDts, createMatchesPattern, createResolver, parseCSSModule } from 'honey-css-modules-core';
import type { ParseCSSModuleResult } from '../../core/src/parser/css-module-parser.js';
import { writeDtsFile } from './dts-writer.js';
import { ReadCSSModuleFileError } from './error.js';
import type { Logger } from './logger/logger.js';

/**
 * @throws {ReadCSSModuleFileError} When failed to read CSS Module file.
 */
async function parseCSSModuleByFileName(
  fileName: string,
  { dashedIdents }: ResolvedHCMConfig,
): Promise<ParseCSSModuleResult> {
  let text: string;
  try {
    text = await readFile(fileName, 'utf-8');
  } catch (error) {
    throw new ReadCSSModuleFileError(fileName, error);
  }
  return parseCSSModule(text, { fileName, dashedIdents, safe: false });
}

/**
 * @throws {WriteDtsFileError}
 */
async function writeDtsByCSSModule(
  cssModule: CSSModule,
  { dtsOutDir, rootDir, arbitraryExtensions }: ResolvedHCMConfig,
  resolver: Resolver,
  matchesPattern: MatchesPattern,
): Promise<void> {
  const dts = createDts(cssModule, { resolver, matchesPattern });
  await writeDtsFile(dts.text, cssModule.fileName, {
    outDir: dtsOutDir,
    rootDir,
    arbitraryExtensions,
  });
}

/**
 * Run honey-css-modules .d.ts generation.
 * @throws {ReadCSSModuleFileError} When failed to read CSS Module file.
 * @throws {WriteDtsFileError}
 */
export async function runHCM(config: ResolvedHCMConfig, logger: Logger): Promise<void> {
  const resolver = createResolver(config.alias);
  const matchesPattern = createMatchesPattern(config);

  const cssModuleMap = new Map<string, CSSModule>();
  const syntacticDiagnostics: SyntacticDiagnostic[] = [];

  // TODO: Handle errors for glob
  const fileNames = await Array.fromAsync(glob(config.pattern));
  const parseResults = await Promise.all(fileNames.map(async (fileName) => parseCSSModuleByFileName(fileName, config)));
  for (const parseResult of parseResults) {
    cssModuleMap.set(parseResult.cssModule.fileName, parseResult.cssModule);
    syntacticDiagnostics.push(...parseResult.diagnostics);
  }

  if (syntacticDiagnostics.length > 0) {
    logger.logDiagnostics(syntacticDiagnostics);
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  }

  await Promise.all(
    parseResults.map(async (parseResult) =>
      writeDtsByCSSModule(parseResult.cssModule, config, resolver, matchesPattern),
    ),
  );
  // TODO: Logging completion message
}
