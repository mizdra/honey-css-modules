import ts from 'typescript';
import { ConfigValidationError, TsConfigFileError, TsConfigFileNotFoundError } from './error.js';
import { basename, dirname, join, resolve } from './path.js';

export interface TsConfig {
  includes?: string[];
  excludes?: string[];
  options: {
    paths?: Record<string, string[]> | undefined;
  };
  hcmOptions: {
    dtsOutDir: string;
    arbitraryExtensions?: boolean | undefined;
    // dashedIdents?: boolean | undefined; // TODO: Support dashedIdents
  };
}

export function assertHCMOptions(hcmOptions: unknown): asserts hcmOptions is TsConfig['hcmOptions'] {
  if (typeof hcmOptions !== 'object' || hcmOptions === null) {
    throw new ConfigValidationError('`hcmOptions` must be an object.');
  }
  if (!('dtsOutDir' in hcmOptions)) throw new ConfigValidationError('`dtsOutDir` is required.');
  if (typeof hcmOptions.dtsOutDir !== 'string') throw new ConfigValidationError('`dtsOutDir` must be a string.');
  if ('arbitraryExtensions' in hcmOptions && typeof hcmOptions.arbitraryExtensions !== 'boolean') {
    throw new ConfigValidationError('`arbitraryExtensions` must be a boolean.');
  }
  if ('dashedIdents' in hcmOptions && typeof hcmOptions.dashedIdents !== 'boolean') {
    throw new ConfigValidationError('`dashedIdents` must be a boolean.');
  }
}

interface RawData {
  include?: string[];
  exclude?: string[];
  hcmOptions: {
    dtsOutDir: string;
    arbitraryExtensions?: boolean | undefined;
    // dashedIdents?: boolean | undefined; // TODO: Support dashedIdents
  };
}

function assertRawData(raw: object): asserts raw is RawData {
  if (!('hcmOptions' in raw)) throw new ConfigValidationError('tsconfig.json must have `hcmOptions`.');
  assertHCMOptions(raw.hcmOptions);
  // MEMO: `include` and `exclude` are validated in `ts.parseJsonConfigFileContent`, so we don't need to validate them here.
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
  const { configFileName, tsConfig } = readTsConfigFile(project);
  const rootDir = dirname(configFileName);
  return {
    configFileName,
    config: resolveConfig(tsConfig, rootDir),
  };
}

export function findTsConfigFile(project: string): string | undefined {
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
// TODO: Allow `extends` options to inherit `hcmOptions`
export function readTsConfigFile(project: string): { configFileName: string; tsConfig: TsConfig } {
  const configFileName = findTsConfigFile(project);
  if (!configFileName) throw new TsConfigFileNotFoundError();
  const configFile = ts.readConfigFile(configFileName.replaceAll('\\', '/'), ts.sys.readFile.bind(ts.sys));
  if (configFile.error) throw new TsConfigFileError(configFile.error);

  const config = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    dirname(configFileName),
    undefined,
    configFileName,
    undefined,
    [
      {
        extension: 'css',
        isMixedContent: false,
        scriptKind: ts.ScriptKind.Deferred,
      },
    ],
  );
  assertRawData(config.raw);
  return {
    configFileName,
    tsConfig: {
      ...('include' in config.raw ? { includes: config.raw.include } : {}),
      ...('exclude' in config.raw ? { excludes: config.raw.exclude } : {}),
      options: {
        ...('paths' in config.options ? { paths: config.options.paths } : {}),
      },
      hcmOptions: config.raw.hcmOptions,
    },
  };
}

export interface ResolvedHCMConfig {
  includes: string[];
  excludes: string[];
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

// https://github.com/microsoft/TypeScript/blob/caf1aee269d1660b4d2a8b555c2d602c97cb28d7/src/compiler/commandLineParser.ts#L3006
const defaultIncludeSpec = '**/*';

export function resolveConfig(tsConfig: TsConfig, rootDir: string): ResolvedHCMConfig {
  return {
    // If `include` is not specified, fallback to the default include spec.
    // ref: https://github.com/microsoft/TypeScript/blob/caf1aee269d1660b4d2a8b555c2d602c97cb28d7/src/compiler/commandLineParser.ts#L3102
    includes: (tsConfig.includes ?? [defaultIncludeSpec]).map((i) => join(rootDir, i)),
    excludes: (tsConfig.excludes ?? []).map((e) => join(rootDir, e)),
    dtsOutDir: join(rootDir, tsConfig.hcmOptions.dtsOutDir),
    paths: resolvePaths(tsConfig.options.paths, rootDir),
    arbitraryExtensions: tsConfig.hcmOptions.arbitraryExtensions ?? false,
    dashedIdents: false, // TODO: Support dashedIdents
    rootDir,
  };
}
