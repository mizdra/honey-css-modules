// eslint-disable-next-line n/no-unsupported-features/node-builtins -- TODO: Require Node.js version which have stable glob API
import { glob, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  Diagnostic,
  FileExists,
  HCMConfig,
  IsExternalFile,
  ResolvedHCMConfig,
  Resolver,
} from 'honey-css-modules-core';
import {
  checkCSSModule,
  createDts,
  createIsExternalFile,
  createResolver,
  parseCSSModule,
  resolveConfig,
} from 'honey-css-modules-core';
import { writeDtsFile } from './dts-writer.js';
import { ReadCSSModuleFileError } from './error.js';
import type { Logger } from './logger/logger.js';

/**
 * @throws {ReadCSSModuleFileError} When failed to read CSS Module file.
 * @throws {WriteDtsFileError}
 */
async function processFile(
  fileName: string,
  { dashedIdents, dtsOutDir, cwd, arbitraryExtensions }: ResolvedHCMConfig,
  resolver: Resolver,
  isExternalFile: IsExternalFile,
  fileExists: FileExists,
): Promise<Diagnostic[]> {
  let text: string;
  try {
    text = await readFile(fileName, 'utf-8');
  } catch (error) {
    throw new ReadCSSModuleFileError(fileName, error);
  }
  const { cssModule, diagnostics: syntacticDiagnostics } = parseCSSModule(text, {
    fileName,
    dashedIdents,
    safe: false,
  });
  const semanticDiagnostics = checkCSSModule(cssModule, resolver, isExternalFile, fileExists);
  const diagnostics = [...syntacticDiagnostics, ...semanticDiagnostics];
  if (diagnostics.length > 0) {
    return diagnostics;
  }
  const dts = createDts(cssModule, { resolver, isExternalFile });
  await writeDtsFile(dts.text, fileName, {
    outDir: dtsOutDir,
    cwd,
    arbitraryExtensions,
  });
  return [];
}

/**
 * Run honey-css-modules .d.ts generation.
 * @throws {ReadCSSModuleFileError} When failed to read CSS Module file.
 * @throws {WriteDtsFileError}
 */
export async function runHCM(config: HCMConfig, cwd: string, logger: Logger): Promise<void> {
  const resolvedConfig = resolveConfig(config, cwd);
  const { pattern, alias } = resolvedConfig;
  const resolver = createResolver(alias, cwd);
  const isExternalFile = createIsExternalFile(resolvedConfig);

  const fileNames = (await Array.fromAsync(glob(pattern, { cwd })))
    // Convert 'src/a.module.css' to '/project/src/a.module.css'
    .map((fileName) => join(cwd, fileName));
  const fileExists: FileExists = (path: string) => fileNames.includes(path);

  const processFilePromises = fileNames.map(async (fileName) =>
    processFile(fileName, resolvedConfig, resolver, isExternalFile, fileExists),
  );

  const diagnostics = (await Promise.all(processFilePromises)).flat();
  if (diagnostics.length > 0) {
    logger.logDiagnostics(diagnostics);
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  }
  // TODO: Logging completion message
}
