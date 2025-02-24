// eslint-disable-next-line no-restricted-imports
import type { ParsedPath } from 'node:path';
// eslint-disable-next-line no-restricted-imports
import nodePath from 'node:path';
import ts from 'typescript';

export function toNormalizedPath(path: string): string {
  return ts.server.toNormalizedPath(path);
}

export function join(...paths: string[]): string {
  return toNormalizedPath(nodePath.join(...paths));
}

export function resolve(...paths: string[]): string {
  return toNormalizedPath(nodePath.resolve(...paths));
}

export function relative(from: string, to: string): string {
  return toNormalizedPath(nodePath.relative(from, to));
}

export function dirname(path: string): string {
  return toNormalizedPath(nodePath.dirname(path));
}

export function basename(path: string): string {
  return toNormalizedPath(nodePath.basename(path));
}

export function parse(path: string): ParsedPath {
  const { root, dir, base, name, ext } = nodePath.parse(path);
  return { root: toNormalizedPath(root), dir: toNormalizedPath(dir), base, name, ext };
}

// eslint-disable-next-line n/no-unsupported-features/node-builtins, @typescript-eslint/unbound-method
export const matchesGlob = nodePath.matchesGlob;

// eslint-disable-next-line @typescript-eslint/unbound-method
export const isAbsolute = nodePath.isAbsolute;
