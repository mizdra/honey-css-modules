import fs from 'node:fs/promises';

export async function readFile(path: string): Promise<string> {
  return fs.readFile(path, 'utf-8');
}

export function findUsedTokenNames(componentText: string): Set<string> {
  // TODO: Support `styles['foo']` and `styles["foo"]`
  // TODO: Support `otherNameStyles.foo`
  const pattern = /styles\.([$_\p{ID_Start}][$\u200c\u200d\p{ID_Continue}]*)/gu;
  const usedClassNames = new Set<string>();
  let match;
  while ((match = pattern.exec(componentText)) !== null) {
    usedClassNames.add(match[1]!);
  }
  return usedClassNames;
}
