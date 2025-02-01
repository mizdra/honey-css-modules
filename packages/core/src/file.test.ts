import fs from 'node:fs/promises';
import { describe, expect, test } from 'vitest';
import { findComponentFile, isCSSModuleFile } from './file.js';
import { createIFF } from './test/fixture.js';

const readFile = async (path: string) => fs.readFile(path, 'utf-8');

describe('isCSSModuleFile', () => {
  test.each([
    ['a.module.css', true],
    ['a.module.scss', false],
    ['a.css', false],
  ])('%s', (input, expected) => {
    expect(isCSSModuleFile(input)).toBe(expected);
  });
});

test('findComponentFile', async () => {
  const iff = await createIFF({
    'a.jsx': `'a.jsx'`,
    'b.tsx': `'b.tsx'`,
    'c.jsx': `'c.jsx'`,
    'c.tsx': `'c.tsx'`,
  });
  expect(await findComponentFile(iff.join('a.module.css'), readFile)).toStrictEqual({
    fileName: iff.paths['a.jsx'],
    text: `'a.jsx'`,
  });
  expect(await findComponentFile(iff.join('b.module.css'), readFile)).toStrictEqual({
    fileName: iff.paths['b.tsx'],
    text: `'b.tsx'`,
  });
  expect(await findComponentFile(iff.join('c.module.css'), readFile)).toStrictEqual({
    fileName: iff.paths['c.tsx'],
    text: `'c.tsx'`,
  });
  expect(await findComponentFile(iff.join('d.module.css'), readFile)).toBe(undefined);
});
