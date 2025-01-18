import { readFile } from 'node:fs/promises';

export async function readTsText(cssModulePath: string): Promise<string | undefined> {
  // TODO: Make TypeScript file names customizable
  const paths = [cssModulePath.replace('.module.css', '.tsx'), cssModulePath.replace('.module.css', '.ts')];
  for (const path of paths) {
    try {
      // TODO: Cache the result of readFile
      // eslint-disable-next-line no-await-in-loop
      return await readFile(path, 'utf-8');
    } catch {
      continue;
    }
  }
  return undefined;
}

export function findUsedClassNames(tsText: string): Set<string> {
  // TODO: Support `styles['foo']` and `styles["foo"]`
  // TODO: Support `otherNameStyles.foo`
  const pattern = /styles\.([$_\p{ID_Start}][$\u200c\u200d\p{ID_Continue}]*)/gu;
  const usedClassNames = new Set<string>();
  let match;
  while ((match = pattern.exec(tsText)) !== null) {
    usedClassNames.add(match[1]!);
  }
  return usedClassNames;
}
