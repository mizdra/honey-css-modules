import { execFileSync } from 'node:child_process';
import { accessSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ConfigImportError, ConfigNotFoundError, ConfigValidationError } from './error.js';

// TODO: Support `ts`, `mts` and `cts` extensions
const ALLOWED_CONFIG_FILE_EXTENSIONS = ['js', 'mjs', 'cjs'];

export interface HCMConfig {
  pattern: string;
  dtsOutDir: string;
  alias?: Record<string, string> | undefined;
  arbitraryExtensions?: boolean | undefined;
  dashedIdents?: boolean | undefined;
}

export function defineConfig(config: HCMConfig): HCMConfig {
  return config;
}

function assertAlias(alias: unknown): asserts alias is Record<string, string> {
  if (typeof alias !== 'object' || alias === null) {
    throw new ConfigValidationError('`alias` must be an object.');
  }
  for (const [key, value] of Object.entries(alias)) {
    if (typeof value !== 'string') {
      throw new ConfigValidationError(`\`alias.${key}\` must be a string.`);
    }
  }
}

/** @throws {ConfigValidationError} */
export function assertConfig(config: unknown): asserts config is HCMConfig {
  if (typeof config !== 'object' || config === null) {
    throw new ConfigValidationError('Config must be an object.');
  }
  if (!('pattern' in config)) throw new ConfigValidationError('`pattern` is required.');
  if (typeof config.pattern !== 'string') throw new ConfigValidationError('`pattern` must be a string.');
  if (!('dtsOutDir' in config)) throw new ConfigValidationError('`dtsOutDir` is required.');
  if (typeof config.dtsOutDir !== 'string') throw new ConfigValidationError('`dtsOutDir` must be a string.');
  if ('alias' in config) assertAlias(config.alias);
  if ('arbitraryExtensions' in config && typeof config.arbitraryExtensions !== 'boolean') {
    throw new ConfigValidationError('`arbitraryExtensions` must be a boolean.');
  }
  if ('dashedIdents' in config && typeof config.dashedIdents !== 'boolean') {
    throw new ConfigValidationError('`dashedIdents` must be a boolean.');
  }
}

/**
 * @throws {ConfigNotFoundError}
 * @throws {ConfigImportError}
 * @throws {ConfigValidationError}
 */
export function readConfigFile(cwd: string): HCMConfig {
  for (const ext of ALLOWED_CONFIG_FILE_EXTENSIONS) {
    const path = join(cwd, `hcm.config.${ext}`);
    try {
      accessSync(path); // check if the file exists before importing
    } catch {
      continue;
    }
    let module: object;
    try {
      // NOTE: On Windows, `path` is like `C:\path\to\hcm.config.js`.
      // However, `import(...)` does not accept a path like `C:\path\to\hcm.config.js`.
      // Therefore, we use `pathToFileURL` to convert it into a URL with the `file:///C:\path\to\hcm.config.js` scheme before importing.
      const resolvedPath = pathToFileURL(path).href;
      module = JSON.parse(
        execFileSync(
          'node',
          [
            '-e',
            // NOTE: The module loaded by `import` is cached by Node.js runtime. So the user can't change the config file without restarting the process.
            // This is an intentional limitation to simplify implementation.
            `import('${resolvedPath}')
            .then(m => process.stdout.write(
              JSON.stringify({
                default: m.default,
              }),
            ))`,
          ],
          { stdio: ['pipe', 'pipe', 'ignore'] },
        ).toString(),
      );
    } catch (error) {
      throw new ConfigImportError(path, error);
    }
    if (!('default' in module)) throw new ConfigValidationError('Config must be a default export.');
    assertConfig(module.default);
    return module.default;
  }
  throw new ConfigNotFoundError();
}

export interface ResolvedHCMConfig {
  pattern: string;
  dtsOutDir: string;
  alias: Record<string, string>;
  arbitraryExtensions: boolean;
  dashedIdents: boolean;
  cwd: string;
}

export function resolveConfig(config: HCMConfig, cwd: string): ResolvedHCMConfig {
  return {
    ...config,
    alias: config.alias ?? {},
    arbitraryExtensions: config.arbitraryExtensions ?? false,
    dashedIdents: config.dashedIdents ?? false,
    cwd,
  };
}
