export async function findComponentFile(
  cssModuleFileName: string,
  readFile: (path: string) => Promise<string>,
): Promise<{ fileName: string; text: string } | undefined> {
  const paths = [cssModuleFileName.replace('.module.css', '.tsx'), cssModuleFileName.replace('.module.css', '.jsx')];
  for (const path of paths) {
    try {
      // TODO: Cache the result of readFile
      // eslint-disable-next-line no-await-in-loop
      const text = await readFile(path);
      return { fileName: path, text };
    } catch {
      continue;
    }
  }
  return undefined;
}
