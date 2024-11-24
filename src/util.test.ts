import { expect, test } from 'vitest';
import { getPosixRelativePath } from './util.js';

test('getPosixRelativePath', () => {
  expect(getPosixRelativePath('/test/1.css.d.ts', '/test/1.css')).toBe('./1.css');
  expect(getPosixRelativePath('/test/1.css.d.ts', '/test/dir/1.css')).toBe('./dir/1.css');
  expect(getPosixRelativePath('/test/1.css.d.ts', '/1.css')).toBe('../1.css');
});
