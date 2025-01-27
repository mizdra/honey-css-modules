import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { globIterate } from 'glob';
import type { Diagnostic, HCMConfig, ResolvedHCMConfig, Resolver } from 'honey-css-modules-core';
import {
  createDts,
  createIsExternalFile,
  createResolver,
  parseCSSModuleCode,
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
  filename: string,
  { dashedIdents, dtsOutDir, cwd, arbitraryExtensions }: ResolvedHCMConfig,
  resolver: Resolver,
  isExternalFile: (filename: string) => boolean,
): Promise<Diagnostic[]> {
  let code: string;
  try {
    code = await readFile(filename, 'utf-8');
  } catch (error) {
    throw new ReadCSSModuleFileError(filename, error);
  }
  const { cssModule, diagnostics } = parseCSSModuleCode(code, { filename, dashedIdents, safe: false });
  if (diagnostics.length > 0) {
    return diagnostics;
  }
  const { code: dtsCode } = createDts(cssModule, { resolver, isExternalFile });
  await writeDtsFile(dtsCode, filename, {
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
  for await (const filename of globIterate(pattern, { cwd })) {
    promises.push(
      processFile(
        join(cwd, filename), // `filename` is 'src/a.module.css', so convert it to '/project/src/a.module.css'
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
