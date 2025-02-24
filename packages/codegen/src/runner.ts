import { readFile } from 'node:fs/promises';
import type { CSSModule, HCMConfig, MatchesPattern, ParseCSSModuleResult, Resolver } from 'honey-css-modules-core';
import {
  checkCSSModule,
  createDts,
  createExportBuilder,
  createMatchesPattern,
  createResolver,
  getFileNamesByPattern,
  parseCSSModule,
  readConfigFile,
} from 'honey-css-modules-core';
import { writeDtsFile } from './dts-writer.js';
import { ReadCSSModuleFileError } from './error.js';
import type { Logger } from './logger/logger.js';

/**
 * @throws {ReadCSSModuleFileError} When failed to read CSS Module file.
 */
async function parseCSSModuleByFileName(fileName: string, { dashedIdents }: HCMConfig): Promise<ParseCSSModuleResult> {
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
    logger.logDiagnostics(config.text, config.diagnostics);
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  }

  const resolver = createResolver(config.paths);
  const matchesPattern = createMatchesPattern(config);

  const cssModuleMap = new Map<string, CSSModule>();

  const fileNames = getFileNamesByPattern(config);
  if (fileNames.length === 0) {
    logger.logDiagnostics('', [
      {
        type: 'semantic',
        category: 'warning',
        text: `The file specified in tsconfig.json not found.`,
      },
    ]);
    return;
  }
  let hasError = false;
  const parseResults = await Promise.all(fileNames.map(async (fileName) => parseCSSModuleByFileName(fileName, config)));
  for (const { cssModule, diagnostics } of parseResults) {
    cssModuleMap.set(cssModule.fileName, cssModule);
    if (diagnostics.length > 0) {
      hasError = true;
      logger.logDiagnostics(cssModule.text, diagnostics);
    }
  }

  // eslint-disable-next-line n/no-process-exit
  if (hasError) process.exit(1);

  const getCSSModule = (path: string) => cssModuleMap.get(path);
  const exportBuilder = createExportBuilder({ getCSSModule, matchesPattern, resolver });
  for (const { cssModule } of parseResults) {
    const diagnostics = checkCSSModule(cssModule, exportBuilder, matchesPattern, resolver, getCSSModule);
    if (diagnostics.length > 0) {
      hasError = true;
      logger.logDiagnostics(cssModule.text, diagnostics);
    }
  }

  // eslint-disable-next-line n/no-process-exit
  if (hasError) process.exit(1);

  await Promise.all(
    parseResults.map(async (parseResult) =>
      writeDtsByCSSModule(parseResult.cssModule, config, resolver, matchesPattern),
    ),
  );
}
