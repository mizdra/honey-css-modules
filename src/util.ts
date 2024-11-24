import { dirname, relative } from 'node:path';

export function getRelativePath(fromFilePath: string, toFilePath: string): string {
  const resolved = relative(dirname(fromFilePath), toFilePath);
  if (resolved.startsWith('..')) {
    return resolved;
  } else {
    return `./${resolved}`;
  }
}
