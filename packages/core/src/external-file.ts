import path from 'node:path';
import type { ResolvedHCMConfig } from './config.js';

export type MatchesPattern = (fileName: string) => boolean;

export function createMatchesPattern(config: ResolvedHCMConfig): MatchesPattern {
  return (fileName: string) =>
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    path.matchesGlob(fileName, config.pattern);
}
