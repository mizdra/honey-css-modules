import path from 'node:path';
import type { ResolvedHCMConfig } from './config.js';

export function createIsExternalFile(config: ResolvedHCMConfig): (filename: string) => boolean {
  return (filename: string) =>
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    !path.matchesGlob(
      filename,
      path.join(config.cwd, config.pattern), // `pattern` is 'src/**/*.module.css', so convert it to '/project/src/**/*.module.css'
    );
}
