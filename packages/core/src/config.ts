import ts from 'typescript';
import { ConfigValidationError, TsConfigFileNotFoundError } from './error.js';
import { basename, dirname, join, resolve } from './path.js';

/**
 * The config loaded from `tsconfig.json`.
 * This is unnormalized. Paths are relative, and some options may be omitted.
 */
interface UnnormalizedTsConfig {
  includes?: string[];
  excludes?: string[];
  paths?: Record<string, string[]> | undefined;
  dtsOutDir?: string;
  arbitraryExtensions?: boolean | undefined;
  // dashedIdents?: boolean | undefined; // TODO: Support dashedIdents
}

/**
 * The config used by honey-css-modules.
 * This is normalized. Paths are resolved from relative to absolute, and default values are set for missing options.
 */
export interface HCMConfig {
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

export function assertHCMOptions(
  hcmOptions: unknown,
): asserts hcmOptions is Pick<UnnormalizedTsConfig, 'dtsOutDir' | 'arbitraryExtensions'> {
  if (typeof hcmOptions !== 'object' || hcmOptions === null) {
    throw new ConfigValidationError('`hcmOptions` must be an object.');
  }
  if ('dtsOutDir' in hcmOptions && typeof hcmOptions.dtsOutDir !== 'string') {
    throw new ConfigValidationError('`dtsOutDir` must be a string.');
  }
  if ('arbitraryExtensions' in hcmOptions && typeof hcmOptions.arbitraryExtensions !== 'boolean') {
    throw new ConfigValidationError('`arbitraryExtensions` must be a boolean.');
  }
  if ('dashedIdents' in hcmOptions && typeof hcmOptions.dashedIdents !== 'boolean') {
    throw new ConfigValidationError('`dashedIdents` must be a boolean.');
  }
}

/**
 * The validated data of `ts.ParsedCommandLine['raw']`.
 */
interface ValidatedRawData {
  extends?: string | string[];
  include?: string[];
  exclude?: string[];
  hcmOptions?: {
    dtsOutDir?: string;
    arbitraryExtensions?: boolean | undefined;
    // dashedIdents?: boolean | undefined; // TODO: Support dashedIdents
  };
}

function assertRawData(raw: object): asserts raw is ValidatedRawData {
  if ('hcmOptions' in raw) assertHCMOptions(raw.hcmOptions);
  // MEMO: `include` and `exclude` are validated in `ts.parseJsonConfigFileContent`, so we don't need to validate them here.
}

function assertUnnormalizedTsConfig(
  tsConfig: UnnormalizedTsConfig,
): asserts tsConfig is RequireField<UnnormalizedTsConfig, 'dtsOutDir'> {
  if (!tsConfig.dtsOutDir) throw new ConfigValidationError('`dtsOutDir` is required.');
}

interface ReadConfigFileResult {
  configFileName: string;
  config: HCMConfig;
}

/**
 * @param project The path to the project directory or the path to `tsconfig.json`. It is absolute.
 * @throws {TsConfigFileNotFoundError}
 * @throws {ConfigValidationError}
 */
export function readConfigFile(project: string): ReadConfigFileResult {
  const { configFileName, tsConfig } = readTsConfigFile(project);
  // TODO: Check diagnostics
  assertUnnormalizedTsConfig(tsConfig);
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

function mergeTsConfig(base: UnnormalizedTsConfig, overrides: UnnormalizedTsConfig): UnnormalizedTsConfig {
  const result: UnnormalizedTsConfig = { ...base };
  if (overrides.includes) result.includes = overrides.includes;
  if (overrides.excludes) result.excludes = overrides.excludes;
  if (overrides.paths) result.paths = overrides.paths;
  if (overrides.dtsOutDir) result.dtsOutDir = overrides.dtsOutDir;
  if (overrides.arbitraryExtensions) result.arbitraryExtensions = overrides.arbitraryExtensions;
  return result;
}

/**
 * @throws {TsConfigFileNotFoundError}
 * @throws {ConfigValidationError}
 */
export function readTsConfigFile(project: string): {
  configFileName: string;
  tsConfig: UnnormalizedTsConfig;
  diagnostics: ts.Diagnostic[];
} {
  const diagnostics: ts.Diagnostic[] = [];
  const configFileName = findTsConfigFile(project);
  if (!configFileName) throw new TsConfigFileNotFoundError();
  const tsConfigSourceFile = ts.readJsonConfigFile(configFileName, ts.sys.readFile.bind(ts.sys));
  const config = ts.parseJsonSourceFileConfigFileContent(
    tsConfigSourceFile,
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
  diagnostics.push(...config.errors);

  assertRawData(config.raw);
  const raw = config.raw;
  const hcmOptions = config.raw.hcmOptions;

  let tsConfig: UnnormalizedTsConfig = {
    ...('include' in raw ? { includes: raw.include } : {}),
    ...('exclude' in raw ? { excludes: raw.exclude } : {}),
    ...('paths' in config.options ? { paths: config.options.paths } : {}),
    ...(hcmOptions && 'dtsOutDir' in hcmOptions ? { dtsOutDir: hcmOptions.dtsOutDir } : {}),
    ...(hcmOptions && 'arbitraryExtensions' in hcmOptions ?
      { arbitraryExtensions: hcmOptions.arbitraryExtensions }
    : {}),
  };

  // Inherit options from the base config
  if (tsConfigSourceFile.extendedSourceFiles) {
    for (const extendedSourceFile of tsConfigSourceFile.extendedSourceFiles) {
      const { tsConfig: baseConfig, diagnostics } = readTsConfigFile(extendedSourceFile);
      diagnostics.push(...diagnostics);
      tsConfig = mergeTsConfig(baseConfig, tsConfig);
    }
  }

  return { configFileName, tsConfig, diagnostics };
}

function resolvePaths(paths: Record<string, string[]> | undefined, cwd: string): Record<string, string[]> {
  if (paths === undefined) return {};
  const resolvedPaths: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(paths)) {
    resolvedPaths[key] = value.map((path) => join(cwd, path));
  }
  return resolvedPaths;
}

type RequireField<T, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;
// https://github.com/microsoft/TypeScript/blob/caf1aee269d1660b4d2a8b555c2d602c97cb28d7/src/compiler/commandLineParser.ts#L3006
const defaultIncludeSpec = '**/*';

export function resolveConfig(tsConfig: RequireField<UnnormalizedTsConfig, 'dtsOutDir'>, rootDir: string): HCMConfig {
  return {
    // If `include` is not specified, fallback to the default include spec.
    // ref: https://github.com/microsoft/TypeScript/blob/caf1aee269d1660b4d2a8b555c2d602c97cb28d7/src/compiler/commandLineParser.ts#L3102
    includes: (tsConfig.includes ?? [defaultIncludeSpec]).map((i) => join(rootDir, i)),
    excludes: (tsConfig.excludes ?? []).map((e) => join(rootDir, e)),
    dtsOutDir: join(rootDir, tsConfig.dtsOutDir),
    paths: resolvePaths(tsConfig.paths, rootDir),
    arbitraryExtensions: tsConfig.arbitraryExtensions ?? false,
    dashedIdents: false, // TODO: Support dashedIdents
    rootDir,
  };
}
