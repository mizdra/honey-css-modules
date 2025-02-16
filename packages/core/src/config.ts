import { basename, dirname, join, resolve } from 'node:path';
import ts from 'typescript';
import { ConfigValidationError, TsConfigFileError, TsConfigFileNotFoundError } from './error.js';

export interface HCMConfig {
  pattern: string;
  dtsOutDir: string;
  paths?: Record<string, string[]> | undefined;
  arbitraryExtensions?: boolean | undefined;
  // dashedIdents?: boolean | undefined; // TODO: Support dashedIdents
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

interface ReadConfigFileResult {
  configFileName: string;
  config: ResolvedHCMConfig;
}

/**
 * @param project The path to the project directory or the path to `tsconfig.json`. It is absolute.
 * @throws {TsConfigFileNotFoundError}
 * @throws {TsConfigFileError}
 * @throws {ConfigValidationError}
 */
export function readConfigFile(project: string): ReadConfigFileResult {
  const { configFileName, rawConfig } = readRawConfigFile(project);
  const rootDir = dirname(configFileName);
  return {
    configFileName,
    config: resolveConfig(rawConfig, rootDir),
  };
}

export function findConfigFile(project: string): string | undefined {
  const configFile =
    ts.sys.directoryExists(project) ?
      ts.findConfigFile(project, ts.sys.fileExists.bind(ts.sys), 'tsconfig.json')
    : ts.findConfigFile(dirname(project), ts.sys.fileExists.bind(ts.sys), basename(project));
  if (!configFile) return undefined;
  return resolve(configFile);
}

/**
 * @throws {TsConfigFileNotFoundError}
 * @throws {TsConfigFileError}
 * @throws {ConfigValidationError}
 */
// TODO: Read `compilerOptions.paths` instead of `hcmOptions.paths`
// TODO: Read `include`/`exclude`/`files` instead of `hcmOptions.pattern`
// TODO: Allow `extends` options to inherit `hcmOptions`
export function readRawConfigFile(project: string): { configFileName: string; rawConfig: HCMConfig } {
  const configFileName = findConfigFile(project);
  if (!configFileName) throw new TsConfigFileNotFoundError();
  const configFile = ts.readConfigFile(configFileName.replaceAll('\\', '/'), ts.sys.readFile.bind(ts.sys));
  if (configFile.error) throw new TsConfigFileError(configFile.error);

  const config = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    dirname(configFileName),
    undefined,
    configFileName,
  );
  if (!('hcmOptions' in config.raw)) throw new ConfigValidationError('tsconfig.json must have `hcmOptions`.');
  const hcmOptions = config.raw.hcmOptions;
  assertConfig(hcmOptions);
  return { configFileName, rawConfig: hcmOptions };
}

export interface ResolvedHCMConfig {
  pattern: string;
  dtsOutDir: string;
  paths: Record<string, string[]>;
  arbitraryExtensions: boolean;
  dashedIdents: boolean;
  /**
   * The root directory of the project. This is used to determine the output directory of the d.ts file.
   *
   * For example, let’s say you have some input files:
   * ```
   * .
   * ├── tsconfig.json
   * ├── src
   * │   ├── a.module.css
   * │   ├── b.module.css
   * │   ├── sub
   * │   │   ├── c.module.css
   * ```
   *
   * If you set `rootDir` to `src`, the output files will be:
   * ```
   * .
   * ├── dist
   * │   ├── a.module.css.d.ts
   * │   ├── b.module.css.d.ts
   * │   ├── sub
   * │   │   ├── c.module.css.d.ts
   * ```
   *
   * If you set `rootDir` to `.` (the project root), the output files will be:
   * ```
   * .
   * ├── dist
   * │   ├── src
   * │   │   ├── a.module.css.d.ts
   * │   │   ├── b.module.css.d.ts
   * │   │   ├── sub
   * │   │   │   ├── c.module.css.d.ts
   * ```
   */
  rootDir: string;
}

function resolvePaths(paths: Record<string, string[]> | undefined, cwd: string): Record<string, string[]> {
  if (paths === undefined) return {};
  const resolvedPaths: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(paths)) {
    resolvedPaths[key] = value.map((path) => join(cwd, path));
  }
  return resolvedPaths;
}

export function resolveConfig(config: HCMConfig, rootDir: string): ResolvedHCMConfig {
  return {
    pattern: join(rootDir, config.pattern),
    dtsOutDir: join(rootDir, config.dtsOutDir),
    paths: resolvePaths(config.paths, rootDir),
    arbitraryExtensions: config.arbitraryExtensions ?? false,
    dashedIdents: false, // TODO: Support dashedIdents
    rootDir,
  };
}
