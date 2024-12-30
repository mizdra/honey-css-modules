import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { globIterate } from 'glob';
import { type HCMConfig, resolveConfig, type ResolvedHCMConfig } from './config.js';
import { createDts } from './dts-creator.js';
import { writeDtsFile } from './dts-writer.js';
import { ReadCSSModuleFileError } from './error.js';
import { createIsExternalFile } from './external-file.js';
import { parseCSSModuleCode } from './parser/css-module-parser.js';
import { createResolver, type Resolver } from './resolver.js';

/**
 * @throws {ReadCSSModuleFileError} When failed to read CSS Module file.
 * @throws {CSSModuleParseError}
 * @throws {AtValueInvalidError}
 * @throws {ScopeError}
 * @throws {ResolveError}
 * @throws {WriteDtsFileError}
 */
async function processFile(
  filename: string,
  { dashedIdents, dtsOutDir, cwd, arbitraryExtensions }: ResolvedHCMConfig,
  resolver: Resolver,
  isExternalFile: (filename: string) => boolean,
): Promise<void> {
  let code: string;
  try {
    code = await readFile(filename, 'utf-8');
  } catch (error) {
    throw new ReadCSSModuleFileError(filename, error);
  }
  const cssModuleFile = parseCSSModuleCode(code, { filename, dashedIdents });
  const { code: dtsCode } = createDts(cssModuleFile, { resolver, isExternalFile });
  await writeDtsFile(dtsCode, filename, {
    outDir: dtsOutDir,
    cwd,
    arbitraryExtensions,
  });
}

/**
 * Run honey-css-modules .d.ts generation.
 * @param config Configuration object.
 * @throws {ReadCSSModuleFileError} When failed to read CSS Module file.
 * @throws {CSSModuleParseError}
 * @throws {AtValueInvalidError}
 * @throws {ScopeError}
 * @throws {ResolveError}
 * @throws {WriteDtsFileError}
 */
export async function runHCM(config: HCMConfig, cwd: string): Promise<void> {
  const resolvedConfig = resolveConfig(config, cwd);
  const { pattern, alias } = resolvedConfig;
  const resolver = createResolver(alias, cwd);
  const isExternalFile = createIsExternalFile(resolvedConfig);

  const promises: Promise<void>[] = [];
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
  await Promise.all(promises);
  // TODO: Logging completion message
}
