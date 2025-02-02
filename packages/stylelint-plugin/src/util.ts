import fs from 'node:fs/promises';

export async function readFile(path: string): Promise<string> {
  return fs.readFile(path, 'utf-8');
}
