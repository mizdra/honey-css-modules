import { transform, type TransformResult } from 'lightningcss';
import { CSSModuleParseError } from './error.js';

export interface CSSModuleFile {
  /** Absolute path of the file */
  filename: string;
  /**
   * List of token names defined in the file.
   * @example
   * Consider the following file:
   * ```css
   * .foo { color: red }
   * .bar, .baz { color: red }
   * ```
   * The `localTokens` for this file would be `['foo', 'bar', 'baz']`.
   */
  localTokens: string[];
  /**
   * List of specifiers of other CSS Module files imported within the file.
   * The specifiers are strings before being resolved.
   * @example
   * Consider the following file:
   * ```css
   * @import './a.module.css';
   * @import '@/b.module.css';
   * ```
   * The `imports` for this file would be `['./a.module.css', '@/b.module.css']`.
   */
  imports: string[];
}

export interface ParseCSSModuleCodeOptions {
  filename: string;
  dashedIdents: boolean;
}

/**
 * @throws {CSSModuleParseError}
 */
export function parseCSSModuleCode(code: string, { filename, dashedIdents }: ParseCSSModuleCodeOptions): CSSModuleFile {
  let result: TransformResult;
  try {
    result = transform({
      filename,
      cssModules: { dashedIdents },
      code: Buffer.from(code),
      analyzeDependencies: true,
    });
  } catch (e) {
    throw new CSSModuleParseError(filename, e);
  }
  const { exports, dependencies } = result;
  return {
    filename,
    localTokens: Object.keys(exports ?? {}).sort(),
    imports: (dependencies ?? [])
      // `dependencies` includes `@import <dep>`, `background: url(<dep>)`, `background: image-set('./b.png')`, etc.
      // But, we only want the `@import <dep>` ones.
      // https://github.com/parcel-bundler/lightningcss/blob/c24fe64bc991be5862853aaed210f768fef90bf3/src/lib.rs#L26489-L26612
      .filter((dep) => dep.type === 'import')
      .map((dep) => dep.url),
  };
}
