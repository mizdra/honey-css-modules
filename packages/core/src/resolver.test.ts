import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { createResolver } from './resolver.js';

describe('createResolver', () => {
  describe('resolves relative path', () => {
    const resolver = createResolver({});
    test.each([
      ['./a.module.css', resolve('/app/request.module.css'), resolve('/app/a.module.css')],
      ['./dir/a.module.css', resolve('/app/request.module.css'), resolve('/app/dir/a.module.css')],
    ])('resolves %s from %s', (specifier, request, expected) => {
      expect(resolver(specifier, { request })).toBe(expected);
    });
  });
  describe('resolves absolute path', () => {
    const resolver = createResolver({});
    test.each([
      [resolve('/app/a.module.css'), resolve('/app/request.module.css'), resolve('/app/a.module.css')],
      [resolve('/app/dir/a.module.css'), resolve('/app/request.module.css'), resolve('/app/dir/a.module.css')],
    ])('resolves %s from %s', (specifier, request, expected) => {
      expect(resolver(specifier, { request })).toBe(expected);
    });
  });
  describe('resolves alias', () => {
    describe('alias is used if import specifiers start with alias', () => {
      const resolver = createResolver({ '@': resolve('/app/alias'), '#': resolve('/app/alias') });
      test.each([
        ['@/a.module.css', resolve('/app/request.module.css'), resolve('/app/alias/a.module.css')],
        ['./@/a.module.css', resolve('/app/request.module.css'), resolve('/app/@/a.module.css')],
        ['@/dir/a.module.css', resolve('/app/request.module.css'), resolve('/app/alias/dir/a.module.css')],
        ['@/a.module.css', resolve('/app/dir/request.module.css'), resolve('/app/alias/a.module.css')],
        ['#/a.module.css', resolve('/app/request.module.css'), resolve('/app/alias/a.module.css')],
      ])('resolves %s from %s', (specifier, request, expected) => {
        expect(resolver(specifier, { request })).toBe(expected);
      });
    });
    test('the first alias is used if multiple aliases match', () => {
      const resolver = createResolver({ '@': resolve('/app/alias1'), '@@': resolve('/app/alias2') });
      expect(resolver('@/a.module.css', { request: resolve('/app/request.module.css') })).toBe(
        resolve('/app/alias1/a.module.css'),
      );
    });
  });
  describe('does not resolve invalid path', () => {
    const resolver = createResolver({});
    test.each([
      ['http://example.com', resolve('/app/request.module.css')],
      ['package', resolve('/app/request.module.css')],
      ['@scope/package', resolve('/app/request.module.css')],
      ['~package', resolve('/app/request.module.css')],
      ['file:///app/a.module.css', resolve('/app/request.module.css')],
    ])('does not resolve %s from %s', (specifier, request) => {
      expect(resolver(specifier, { request })).toBe(undefined);
    });
  });
});
