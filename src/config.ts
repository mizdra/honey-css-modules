import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { ConfigImportError, ConfigNotFoundError, ConfigValidationError } from './error.js';
import type { Resolver } from './resolver.js';

// TODO: Support `ts`, `mts` and `cts` extensions
const ALLOWED_CONFIG_FILE_EXTENSIONS = ['js', 'mjs', 'cjs'];

export interface HCMConfig {
  pattern: string;
  dtsOutDir: string;
  resolver?: Resolver | undefined;
  alias?: Record<string, string> | undefined;
  arbitraryExtensions?: boolean | undefined;
  dashedIdents?: boolean | undefined;
  logLevel?: 'debug' | 'info' | 'silent' | undefined;
  cwd?: string | undefined;
}

export function defineConfig(config: HCMConfig): HCMConfig {
  return config;
}

function assertResolver(resolver: unknown): asserts resolver is Resolver {
  if (typeof resolver !== 'function') {
    throw new ConfigValidationError('`resolver` must be a function.');
  }
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

function assertLogLevel(logLevel: unknown): asserts logLevel is 'debug' | 'info' | 'silent' {
  if (logLevel !== 'debug' && logLevel !== 'info' && logLevel !== 'silent') {
    throw new ConfigValidationError('`logLevel` must be one of `debug`, `info`, or `silent`.');
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
  if ('resolver' in config) assertResolver(config.resolver);
  if ('alias' in config) assertAlias(config.alias);
  if ('arbitraryExtensions' in config && typeof config.arbitraryExtensions !== 'boolean') {
    throw new ConfigValidationError('`arbitraryExtensions` must be a boolean.');
  }
  if ('dashedIdents' in config && typeof config.dashedIdents !== 'boolean') {
    throw new ConfigValidationError('`dashedIdents` must be a boolean.');
  }
  if ('logLevel' in config) assertLogLevel(config.logLevel);
  if ('cwd' in config && typeof config.cwd !== 'string') {
    throw new ConfigValidationError('`cwd` must be a string.');
  }
}

/**
 * @throws {ConfigNotFoundError}
 * @throws {ConfigImportError}
 * @throws {ConfigValidationError}
 */
export async function readConfigFile(cwd: string): Promise<HCMConfig> {
  for (const ext of ALLOWED_CONFIG_FILE_EXTENSIONS) {
    const path = join(cwd, `hcm.config.${ext}`);
    try {
      // eslint-disable-next-line no-await-in-loop
      await access(path); // check if the file exists before importing
    } catch {
      continue;
    }
    let module: object;
    try {
      // eslint-disable-next-line no-await-in-loop
      module = await import(path);
    } catch (error) {
      throw new ConfigImportError(path, error);
    }
    if (!('default' in module)) throw new ConfigValidationError('Config must be a default export.');
    assertConfig(module.default);
    return module.default;
  }
  throw new ConfigNotFoundError();
}
