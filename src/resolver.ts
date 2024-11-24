import { dirname, isAbsolute, join, resolve } from 'node:path';
import { isPosixRelativePath } from './util.js';

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
  return (_specifier: string, options: ResolverOptions) => {
    let specifier = _specifier;
    for (const [key, value] of Object.entries(alias)) {
      if (specifier.startsWith(key)) {
        // TODO: Logging that the alias is used.
        specifier = specifier.replace(key, join(cwd, value));
        break;
      }
    }
    // Return `undefined` if `specifier` is `'http://example.com'` or `'@scope/package'`
    // TODO: Logging that the specifier could not resolve.
    if (!isPosixRelativePath(specifier) && !isAbsolute(specifier)) return undefined;

    // Convert the specifier to an absolute path
    return resolve(dirname(options.request), specifier);
  };
}
