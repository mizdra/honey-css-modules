import { dirname, relative, win32 } from 'node:path';

export function getPosixRelativePath(fromFilePath: string, toFilePath: string): string {
  const resolved = relative(dirname(fromFilePath), toFilePath).replaceAll(win32.sep, '/');
  if (resolved.startsWith('..')) {
    return resolved;
  } else {
    return `./${resolved}`;
  }
}

export function isPosixRelativePath(path: string): boolean {
  return path.startsWith(`./`) || path.startsWith(`../`);
}
