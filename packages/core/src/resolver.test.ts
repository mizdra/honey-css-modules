import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { createResolver } from './resolver.js';

describe('createResolver', () => {
  test('resolves relative path', () => {
    const resolve = createResolver({}, '/app');
    expect(resolve('./a.module.css', { request: '/app/request.module.css' })).toBe(path.resolve('/app/a.module.css'));
    expect(resolve('./dir/a.module.css', { request: '/app/request.module.css' })).toBe(
      path.resolve('/app/dir/a.module.css'),
    );
  });
  describe('resolves alias', () => {
    test('alias is used if import specifiers start with alias', () => {
      const resolve = createResolver({ '@': './alias', '#': 'alias' }, '/app');
      expect(resolve('@/a.module.css', { request: '/app/request.module.css' })).toBe(
        path.resolve('/app/alias/a.module.css'),
      );
      expect(resolve('./@/a.module.css', { request: '/app/request.module.css' })).toBe(
        path.resolve('/app/@/a.module.css'),
      );
      expect(resolve('@/dir/a.module.css', { request: '/app/request.module.css' })).toBe(
        path.resolve('/app/alias/dir/a.module.css'),
      );
      expect(resolve('@/a.module.css', { request: '/app/dir/request.module.css' })).toBe(
        path.resolve('/app/alias/a.module.css'),
      );
      expect(resolve('#/a.module.css', { request: '/app/request.module.css' })).toBe(
        path.resolve('/app/alias/a.module.css'),
      );
    });
    test('the first alias is used if multiple aliases match', () => {
      const resolve = createResolver({ '@': './alias1', '@@': './alias2' }, '/app');
      expect(resolve('@/a.module.css', { request: '/app/request.module.css' })).toBe(
        path.resolve('/app/alias1/a.module.css'),
      );
    });
  });
  test('does not resolve invalid path', () => {
    const resolve = createResolver({}, '/app');
    expect(resolve('http://example.com', { request: '/app/request.module.css' })).toBe(undefined);
    expect(resolve('package', { request: '/app/request.module.css' })).toBe(undefined);
    expect(resolve('@scope/package', { request: '/app/request.module.css' })).toBe(undefined);
    expect(resolve('~package', { request: '/app/request.module.css' })).toBe(undefined);
  });
});
