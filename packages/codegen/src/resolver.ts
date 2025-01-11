import { dirname, isAbsolute, resolve } from 'node:path';
import ts from 'typescript';
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

export function createResolver(paths: Record<string, string[]>, cwd: string): Resolver {
  return (_specifier: string, options: ResolverOptions) => {
    let specifier = _specifier;

    const host: ts.ModuleResolutionHost = {
      ...ts.sys,
      fileExists: (fileName) => {
        if (fileName.endsWith('.module.d.css.ts')) {
          return ts.sys.fileExists(fileName.replace(/\.module\.d\.css\.ts$/u, '.module.css'));
        }
        return ts.sys.fileExists(fileName);
      },
    };
    const { resolvedModule } = ts.resolveModuleName(specifier, options.request, { paths, pathsBasePath: cwd }, host);
    if (resolvedModule) {
      // TODO: Logging that the paths is used.
      specifier = resolvedModule.resolvedFileName.replace(/\.module\.d\.css\.ts$/u, '.module.css');
    }
    // Return `undefined` if `specifier` is `'http://example.com'` or `'@scope/package'`
    // TODO: Logging that the specifier could not resolve.
    if (!isPosixRelativePath(specifier) && !isAbsolute(specifier)) return undefined;

    // Convert the specifier to an absolute path
    return resolve(dirname(options.request), specifier);
  };
}
