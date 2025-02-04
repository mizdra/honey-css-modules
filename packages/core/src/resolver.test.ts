import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { createResolver } from './resolver.js';

describe('createResolver', () => {
  describe('resolves relative path', () => {
    const resolve = createResolver({}, '/app');
    test.each([
      ['./a.module.css', '/app/request.module.css', '/app/a.module.css'],
      ['./dir/a.module.css', '/app/request.module.css', '/app/dir/a.module.css'],
    ])('resolves %s from %s', (specifier, request, expected) => {
      expect(resolve(specifier, { request })).toBe(path.resolve(expected));
    });
  });
  describe('resolves absolute path', () => {
    const resolve = createResolver({}, '/app');
    test.each([
      ['/app/a.module.css', '/app/request.module.css', '/app/a.module.css'],
      ['/app/dir/a.module.css', '/app/request.module.css', '/app/dir/a.module.css'],
    ])('resolves %s from %s', (specifier, request, expected) => {
      expect(resolve(specifier, { request })).toBe(path.resolve(expected));
    });
  });
  describe('resolves alias', () => {
    describe('alias is used if import specifiers start with alias', () => {
      const resolve = createResolver({ '@': './alias', '#': 'alias' }, '/app');
      test.each([
        ['@/a.module.css', '/app/request.module.css', '/app/alias/a.module.css'],
        ['./@/a.module.css', '/app/request.module.css', '/app/@/a.module.css'],
        ['@/dir/a.module.css', '/app/request.module.css', '/app/alias/dir/a.module.css'],
        ['@/a.module.css', '/app/dir/request.module.css', '/app/alias/a.module.css'],
        ['#/a.module.css', '/app/request.module.css', '/app/alias/a.module.css'],
      ])('resolves %s from %s', (specifier, request, expected) => {
        expect(resolve(specifier, { request })).toBe(path.resolve(expected));
      });
    });
    test('the first alias is used if multiple aliases match', () => {
      const resolve = createResolver({ '@': './alias1', '@@': './alias2' }, '/app');
      expect(resolve('@/a.module.css', { request: '/app/request.module.css' })).toBe(
        path.resolve('/app/alias1/a.module.css'),
      );
    });
  });
  describe('does not resolve invalid path', () => {
    const resolve = createResolver({}, '/app');
    test.each([
      ['http://example.com', '/app/request.module.css'],
      ['package', '/app/request.module.css'],
      ['@scope/package', '/app/request.module.css'],
      ['~package', '/app/request.module.css'],
      ['file:///app/a.module.css', '/app/request.module.css'],
    ])('does not resolve %s from %s', (specifier, request) => {
      expect(resolve(specifier, { request })).toBe(undefined);
    });
  });
});
