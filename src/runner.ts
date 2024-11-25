// eslint-disable-next-line n/no-unsupported-features/node-builtins -- TODO: Require Node.js version which have stable glob API
import { glob, readFile } from 'node:fs/promises';
// eslint-disable-next-line n/no-unsupported-features/node-builtins -- TODO: Require Node.js version which have stable matchesGlob API
import { join, matchesGlob } from 'node:path';
import { type HCMConfig, resolveConfig, type ResolvedHCMConfig } from './config.js';
import { createDtsCode } from './dts-creator.js';
import { writeDtsFile } from './dts-writer.js';
import { ReadCSSModuleFileError } from './error.js';
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
  const dtsCode = createDtsCode(cssModuleFile, { resolver, isExternalFile });
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
export async function runHCM(config: HCMConfig): Promise<void> {
  const resolvedConfig = resolveConfig(config);
  const { pattern, alias, cwd } = resolvedConfig;
  const resolver = createResolver(alias, cwd);
  const isExternalFile = (filename: string) =>
    !matchesGlob(
      filename,
      join(cwd, pattern), // `pattern` is 'src/**/*.module.css', so convert it to '/project/src/**/*.module.css'
    );

  const promises: Promise<void>[] = [];
  for await (const filename of glob(pattern, { cwd })) {
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
