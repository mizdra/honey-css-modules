import fs from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { findComponentFile, getCssModuleFileName, isComponentFileName, isCSSModuleFile } from './file.js';
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

test('getCssModuleFileName', () => {
  expect(getCssModuleFileName(resolve('/path/to/file.tsx'))).toBe(resolve('/path/to/file.module.css'));
  expect(getCssModuleFileName(resolve('/path/to/file.ts'))).toBe(resolve('/path/to/file.module.css'));
});

describe('isComponentFileName', () => {
  test.each([
    ['Button.tsx', true],
    ['Button.jsx', true],
    ['math.ts', false],
    ['page.tsx', true],
  ])('%s', (input, expected) => {
    expect(isComponentFileName(input)).toBe(expected);
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
