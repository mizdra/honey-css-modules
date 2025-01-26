import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { globIterate } from 'glob';
import { type HCMConfig, resolveConfig, type ResolvedHCMConfig } from './config.js';
import { createDts } from './dts-creator.js';
import { writeDtsFile } from './dts-writer.js';
import { ReadCSSModuleFileError } from './error.js';
import { createIsExternalFile } from './external-file.js';
import type { Logger } from './logger/logger.js';
import { parseCSSModuleCode } from './parser/css-module-parser.js';
import type { Diagnostic } from './parser/diagnostic.js';
import { createResolver, type Resolver } from './resolver.js';

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
  const { pattern, paths } = resolvedConfig;
  const resolver = createResolver(paths, cwd);
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
