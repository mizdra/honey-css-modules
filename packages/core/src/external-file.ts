import path from 'node:path';
import type { ResolvedHCMConfig } from './config.js';

export type IsExternalFile = (fileName: string) => boolean;

export function createIsExternalFile(config: ResolvedHCMConfig): IsExternalFile {
  return (fileName: string) =>
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    !path.matchesGlob(
      fileName,
      path.join(config.cwd, config.pattern), // `pattern` is 'src/**/*.module.css', so convert it to '/project/src/**/*.module.css'
    );
}
