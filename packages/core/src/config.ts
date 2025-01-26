import { execFileSync } from 'node:child_process';
import { accessSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  createConfigImportDiagnostic,
  createConfigNotFoundDiagnostic,
  createConfigValidationDiagnostic,
  type Diagnostic,
} from './parser/diagnostic.js';

// TODO: Support `ts`, `mts` and `cts` extensions
const ALLOWED_CONFIG_FILE_EXTENSIONS = ['js', 'mjs', 'cjs'];

class ConfigValidationError extends Error {
  code = 'CONFIG_VALIDATION_ERROR';
}

export interface HCMConfig {
  pattern: string;
  dtsOutDir: string;
  paths?: Record<string, string[]> | undefined;
  arbitraryExtensions?: boolean | undefined;
  dashedIdents?: boolean | undefined;
}

export function defineConfig(config: HCMConfig): HCMConfig {
  return config;
}

function assertPaths(paths: unknown): asserts paths is Record<string, string[]> {
  if (typeof paths !== 'object' || paths === null) {
    throw new ConfigValidationError('`paths` must be an object.');
  }
  for (const [key, array] of Object.entries(paths)) {
    if (!Array.isArray(array)) {
      throw new ConfigValidationError(`\`paths[${JSON.stringify(key)}]\` must be an array.`);
    }
    for (let i = 0; i < array.length; i++) {
      if (typeof array[i] !== 'string') {
        throw new ConfigValidationError(`\`paths[${JSON.stringify(key)}][${i}]\` must be a string.`);
      }
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
  if ('paths' in config) assertPaths(config.paths);
  if ('arbitraryExtensions' in config && typeof config.arbitraryExtensions !== 'boolean') {
    throw new ConfigValidationError('`arbitraryExtensions` must be a boolean.');
  }
  if ('dashedIdents' in config && typeof config.dashedIdents !== 'boolean') {
    throw new ConfigValidationError('`dashedIdents` must be a boolean.');
  }
}

type ReadConfigFileResult = { config: HCMConfig } | { diagnostic: Diagnostic };

/**
 * @throws {ConfigNotFoundError}
 * @throws {ConfigImportError}
 * @throws {ConfigValidationError}
 */
export function readConfigFile(cwd: string): ReadConfigFileResult {
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
      return { diagnostic: createConfigImportDiagnostic(path, error) };
    }
    if (!('default' in module))
      return { diagnostic: createConfigValidationDiagnostic('Config must be a default export.') };
    try {
      assertConfig(module.default);
    } catch (error) {
      if (error instanceof ConfigValidationError)
        return { diagnostic: createConfigValidationDiagnostic(error.message) };
      throw error;
    }
    return { config: module.default };
  }
  return { diagnostic: createConfigNotFoundDiagnostic() };
}

export interface ResolvedHCMConfig {
  pattern: string;
  dtsOutDir: string;
  paths: Record<string, string[]>;
  arbitraryExtensions: boolean;
  dashedIdents: boolean;
  cwd: string;
}

export function resolveConfig(config: HCMConfig, cwd: string): ResolvedHCMConfig {
  return {
    ...config,
    paths: config.paths ?? {},
    arbitraryExtensions: config.arbitraryExtensions ?? false,
    dashedIdents: config.dashedIdents ?? false,
    cwd,
  };
}
