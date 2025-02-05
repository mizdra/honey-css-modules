// eslint-disable-next-line n/no-unsupported-features/node-builtins -- TODO: Require Node.js version which have stable glob API
import { glob, readFile } from 'node:fs/promises';
import type { Diagnostic, MatchesPattern, ResolvedHCMConfig, Resolver } from 'honey-css-modules-core';
import { createDts, createMatchesPattern, createResolver, parseCSSModule } from 'honey-css-modules-core';
import { writeDtsFile } from './dts-writer.js';
import { ReadCSSModuleFileError } from './error.js';
import type { Logger } from './logger/logger.js';

/**
 * @throws {ReadCSSModuleFileError} When failed to read CSS Module file.
 * @throws {WriteDtsFileError}
 */
async function processFile(
  fileName: string,
  { dashedIdents, dtsOutDir, rootDir, arbitraryExtensions }: ResolvedHCMConfig,
  resolver: Resolver,
  matchesPattern: MatchesPattern,
): Promise<Diagnostic[]> {
  let text: string;
  try {
    text = await readFile(fileName, 'utf-8');
  } catch (error) {
    throw new ReadCSSModuleFileError(fileName, error);
  }
  const { cssModule, diagnostics } = parseCSSModule(text, { fileName, dashedIdents, safe: false });
  if (diagnostics.length > 0) {
    return diagnostics;
  }
  const dts = createDts(cssModule, { resolver, matchesPattern });
  await writeDtsFile(dts.text, fileName, {
    outDir: dtsOutDir,
    rootDir,
    arbitraryExtensions,
  });
  return [];
}

/**
 * Run honey-css-modules .d.ts generation.
 * @throws {ReadCSSModuleFileError} When failed to read CSS Module file.
 * @throws {WriteDtsFileError}
 */
export async function runHCM(config: ResolvedHCMConfig, logger: Logger): Promise<void> {
  const resolver = createResolver(config.alias);
  const matchesPattern = createMatchesPattern(config);

  const promises: Promise<Diagnostic[]>[] = [];
  for await (const fileName of glob(config.pattern)) {
    promises.push(processFile(fileName, config, resolver, matchesPattern));
  }
  const diagnostics = (await Promise.all(promises)).flat();
  if (diagnostics.length > 0) {
    logger.logDiagnostics(diagnostics);
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  }
  // TODO: Logging completion message
}
