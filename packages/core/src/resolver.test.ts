import { describe, expect, test } from 'vitest';
import { createResolver } from './resolver.js';
import { createIFF } from './test/fixture.js';

describe('createResolver', async () => {
  const iff = await createIFF({
    'request.module.css': '',
    'a.module.css': '',
    'dir/a.module.css': '',
    'paths1/a.module.css': '',
    'paths2/b.module.css': '',
    'paths3/c.module.css': '',
  });
  const request = iff.paths['request.module.css'];
  test('resolves relative path', () => {
    const resolve = createResolver({}, iff.rootDir);
    expect(resolve('./a.module.css', { request })).toBe(iff.paths['a.module.css']);
    expect(resolve('./dir/a.module.css', { request })).toBe(iff.paths['dir/a.module.css']);
  });
  describe('resolves paths', () => {
    test('paths is used if import specifiers start with paths', () => {
      const resolve = createResolver({ '@/*': ['./paths1/*', './paths2/*'], '#/*': ['./paths3/*'] }, iff.rootDir);
      expect(resolve('@/a.module.css', { request })).toBe(iff.paths['paths1/a.module.css']);
      expect(resolve('@/b.module.css', { request })).toBe(iff.paths['paths2/b.module.css']);
      expect(resolve('#/c.module.css', { request })).toBe(iff.paths['paths3/c.module.css']);
      expect(resolve('@/d.module.css', { request })).toBe(undefined);
    });
  });
  test('does not resolve invalid path', () => {
    const resolve = createResolver({}, iff.rootDir);
    expect(resolve('http://example.com', { request })).toBe(undefined);
    expect(resolve('package', { request })).toBe(undefined);
    expect(resolve('@scope/package', { request })).toBe(undefined);
    expect(resolve('~package', { request })).toBe(undefined);
  });
});
