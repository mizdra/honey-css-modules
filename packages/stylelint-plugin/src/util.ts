import fs from 'node:fs/promises';
import { TOKEN_CONSUMER_PATTERN } from 'honey-css-modules-core';

export async function readFile(path: string): Promise<string> {
  return fs.readFile(path, 'utf-8');
}

export function findUsedTokenNames(componentText: string): Set<string> {
  const usedClassNames = new Set<string>();
  let match;
  while ((match = TOKEN_CONSUMER_PATTERN.exec(componentText)) !== null) {
    usedClassNames.add(match[1]!);
  }
  return usedClassNames;
}
