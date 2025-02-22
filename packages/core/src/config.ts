import ts from 'typescript';
import type { SemanticDiagnostic } from './diagnostic.js';
import { TsConfigFileNotFoundError } from './error.js';
import { basename, dirname, join, resolve } from './path.js';

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

/**
 * The config loaded from `tsconfig.json`.
 * This is unnormalized. Paths are relative, and some options may be omitted.
 */
interface UnnormalizedHCMConfig {
  includes: string[] | undefined;
  excludes: string[] | undefined;
  paths: Record<string, string[]> | undefined;
  dtsOutDir: string | undefined;
  arbitraryExtensions: boolean | undefined;
}

/**
 * The validated data of `ts.ParsedCommandLine['raw']`.
 */
interface ParsedRawData {
  config: UnnormalizedHCMConfig;
  diagnostics: SemanticDiagnostic[];
}

// eslint-disable-next-line complexity
function parseRawData(raw: unknown, configFileName: string): ParsedRawData {
  const result: ParsedRawData = {
    config: {
      includes: undefined,
      excludes: undefined,
      dtsOutDir: undefined,
      paths: undefined,
      arbitraryExtensions: undefined,
    },
    diagnostics: [],
  };
  if (typeof raw !== 'object' || raw === null) return result;
  if ('include' in raw) {
    if (Array.isArray(raw.include)) {
      const includes = raw.include.filter((i) => typeof i === 'string');
      result.config.includes = includes;
    }
    // MEMO: The errors for this option are reported by `tsc` or `tsserver`, so we don't need to report.
  }
  if ('exclude' in raw) {
    if (Array.isArray(raw.exclude)) {
      const excludes = raw.exclude.filter((e) => typeof e === 'string');
      result.config.excludes = excludes;
    }
    // MEMO: The errors for this option are reported by `tsc` or `tsserver`, so we don't need to report.
  }
  if ('compilerOptions' in raw && typeof raw.compilerOptions === 'object' && raw.compilerOptions !== null) {
    if ('paths' in raw.compilerOptions) {
      if (typeof raw.compilerOptions.paths === 'object' && raw.compilerOptions.paths !== null) {
        const paths: Record<string, string[]> = {};
        for (const [key, value] of Object.entries(raw.compilerOptions.paths)) {
          if (Array.isArray(value)) {
            const resolvedValue = value.filter((v) => typeof v === 'string');
            paths[key] = resolvedValue;
          }
        }
        result.config.paths = paths;
      }
      // MEMO: The errors for this option are reported by `tsc` or `tsserver`, so we don't need to report.
    }
  }
  if ('hcmOptions' in raw && typeof raw.hcmOptions === 'object' && raw.hcmOptions !== null) {
    if ('dtsOutDir' in raw.hcmOptions) {
      if (typeof raw.hcmOptions.dtsOutDir === 'string') {
        result.config.dtsOutDir = raw.hcmOptions.dtsOutDir;
      } else {
        result.diagnostics.push({
          type: 'semantic',
          category: 'error',
          text: '`dtsOutDir` must be a string.',
          fileName: configFileName,
        });
      }
    }
    if ('arbitraryExtensions' in raw.hcmOptions) {
      if (typeof raw.hcmOptions.arbitraryExtensions === 'boolean') {
        result.config.arbitraryExtensions = raw.hcmOptions.arbitraryExtensions;
      } else {
        result.diagnostics.push({
          type: 'semantic',
          category: 'error',
          text: '`arbitraryExtensions` must be a boolean.',
          fileName: configFileName,
        });
      }
    }
  }
  return result;
}
export { parseRawData as parseRawDataForTest };

interface ReadConfigFileResult {
  configFileName: string;
  config: HCMConfig;
  diagnostics: SemanticDiagnostic[];
}

/**
 * Reads the `tsconfig.json` file and returns the normalized config.
 * Even if the `tsconfig.json` file contains syntax or semantic errors,
 * this function attempts to parse as much as possible and still returns a valid config.
 *
 * @param project The absolute path to the project directory or the path to `tsconfig.json`.
 * @throws {TsConfigFileNotFoundError}
 */
export function readConfigFile(project: string): ReadConfigFileResult {
  const { configFileName, config, diagnostics } = readTsConfigFile(project);
  const rootDir = dirname(configFileName);
  return {
    configFileName,
    config: normalizeConfig(config, rootDir),
    diagnostics,
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
 */
// TODO: Allow `extends` options to inherit `hcmOptions`
export function readTsConfigFile(project: string): {
  configFileName: string;
} & ParsedRawData {
  const configFileName = findTsConfigFile(project);
  if (!configFileName) throw new TsConfigFileNotFoundError();

  const configFile = ts.readConfigFile(configFileName, ts.sys.readFile.bind(ts.sys));
  // MEMO: `configFile.error` contains a syntax error for `tsconfig.json`.
  // However, it is ignored so that ts-plugin will work even if `tsconfig.json` is somewhat broken.
  // Also, this error is reported to the user by `tsc` or `tsserver`.
  // We discard it since there is no need to report it from honey-css-modules.

  const parsedCommandLine = ts.parseJsonConfigFileContent(
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
  const parsedRawData = parseRawData(parsedCommandLine.raw, configFileName);
  return {
    configFileName,
    ...parsedRawData,
  };
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

export function normalizeConfig(config: UnnormalizedHCMConfig, rootDir: string): HCMConfig {
  return {
    // If `include` is not specified, fallback to the default include spec.
    // ref: https://github.com/microsoft/TypeScript/blob/caf1aee269d1660b4d2a8b555c2d602c97cb28d7/src/compiler/commandLineParser.ts#L3102
    includes: (config.includes ?? [defaultIncludeSpec]).map((i) => join(rootDir, i)),
    excludes: (config.excludes ?? []).map((e) => join(rootDir, e)),
    dtsOutDir: join(rootDir, config.dtsOutDir ?? 'generated'),
    paths: resolvePaths(config.paths, rootDir),
    arbitraryExtensions: config.arbitraryExtensions ?? false,
    dashedIdents: false, // TODO: Support dashedIdents
    rootDir,
  };
}
