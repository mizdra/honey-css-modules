// eslint-disable-next-line n/no-unsupported-features/node-builtins -- TODO: Require Node.js version which have stable glob API
import { glob, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Diagnostic, HCMConfig, IsExternalFile, ResolvedHCMConfig, Resolver } from 'honey-css-modules-core';
import { createDts, createIsExternalFile, createResolver, parseCSSModule, resolveConfig } from 'honey-css-modules-core';
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

  const promises: Promise<Diagnostic[]>[] = [];
  for await (const fileName of glob(pattern, { cwd })) {
    promises.push(
      processFile(
        join(cwd, fileName), // `fileName` is 'src/a.module.css', so convert it to '/project/src/a.module.css'
        resolvedConfig,
        resolver,
        isExternalFile,
      ),
    );
  }
  const diagnostics = (await Promise.all(promises)).flat();
  if (diagnostics.length > 0) {
    logger.logDiagnostics(diagnostics);
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  }
  // TODO: Logging completion message
}
