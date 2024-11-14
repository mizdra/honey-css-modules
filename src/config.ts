import type { Resolver } from './resolver.js';

export interface HCMConfig {
  pattern: string;
  dtsOutDir: string;
  resolver?: Resolver | undefined;
  alias?: Record<string, string> | undefined;
  arbitraryExtensions?: boolean | undefined;
  logLevel?: 'debug' | 'info' | 'silent' | undefined;
  cwd?: string | undefined;
}
export function defineConfig(config: HCMConfig): HCMConfig {
  return config;
}
