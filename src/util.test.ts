import { expect, test } from 'vitest';
import { getRelativePath } from './util.js';

test('getRelativePath', () => {
  expect(getRelativePath('/test/1.css.d.ts', '/test/1.css')).toBe('./1.css');
  expect(getRelativePath('/test/1.css.d.ts', '/test/dir/1.css')).toBe('./dir/1.css');
  expect(getRelativePath('/test/1.css.d.ts', '/1.css')).toBe('../1.css');
});
