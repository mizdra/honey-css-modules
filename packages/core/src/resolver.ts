import { isAbsolute, join, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export interface ResolverOptions {
  /** The file that imports the specifier. It is a absolute path. */
  request: string;
}

/**
 * A resolver function that resolves import specifiers.
 * @param specifier The import specifier.
 * @param options The options.
 * @returns The resolved import specifier. It is a absolute path. If the import specifier cannot be resolved, return `undefined`.
 */
export type Resolver = (specifier: string, options: ResolverOptions) => string | undefined;

export function createResolver(alias: Record<string, string>, cwd: string): Resolver {
  return (specifier: string, options: ResolverOptions) => {
    for (const [key, value] of Object.entries(alias)) {
      if (specifier.startsWith(key)) {
        // NOTE: On Windows, `normalize(...)` to replace `/` with `\\` and then resolve the alias.
        // TODO: Logging that the alias is used.
        return normalize(specifier).replace(key, join(cwd, value));
      }
    }
    if (isAbsolute(specifier)) {
      return specifier;
    } else if (isRelativeSpecifier(specifier)) {
      // Convert the specifier to an absolute path
      // NOTE: Node.js resolves relative specifier with standard relative URL resolution semantics. So we will follow that here as well.
      // ref: https://nodejs.org/docs/latest-v23.x/api/esm.html#terminology
      return fileURLToPath(new URL(specifier, pathToFileURL(options.request)).href);
    } else {
      // Do not support URL or bare specifiers
      // TODO: Logging that the specifier could not resolve.
      return undefined;
    }
  };
}

/**
 * Check if the specifier is a relative specifier.
 * @see https://nodejs.org/docs/latest-v23.x/api/esm.html#terminology
 */
function isRelativeSpecifier(specifier: string): boolean {
  return specifier.startsWith('./') || specifier.startsWith('../');
}
