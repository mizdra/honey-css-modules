import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { ConfigImportError, ConfigNotFoundError } from './error.js';
import type { Resolver } from './resolver.js';

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

// TODO: Support `ts`, `mts` and `cts` extensions
const ALLOWED_CONFIG_FILE_EXTENSIONS = ['js', 'mjs', 'cjs'];

export async function readConfigFile(cwd: string): Promise<HCMConfig> {
  for (const ext of ALLOWED_CONFIG_FILE_EXTENSIONS) {
    const path = join(cwd, `hcm.config.${ext}`);
    try {
      // eslint-disable-next-line no-await-in-loop
      await access(path); // check if the file exists before importing
    } catch {
      continue;
    }
    try {
      // eslint-disable-next-line no-await-in-loop
      return (await import(path)).default;
    } catch (error) {
      throw new ConfigImportError(path, error);
    }
  }
  throw new ConfigNotFoundError();
}
