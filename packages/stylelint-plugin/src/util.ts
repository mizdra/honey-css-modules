import fs from 'node:fs/promises';

/**
 * The syntax pattern for consuming tokens imported from CSS Module.
 * @example `styles.foo`
 */
// TODO: Support `styles['foo']` and `styles["foo"]`
// TODO: Support `otherNameStyles.foo`
const TOKEN_CONSUMER_PATTERN = /styles\.([$_\p{ID_Start}][$\u200c\u200d\p{ID_Continue}]*)/gu;

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
