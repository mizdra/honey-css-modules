import { describe, expect, test } from 'vitest';
import { toNormalizedPath } from './path.js';

describe('toNormalizedPath', () => {
  test('should convert backslashes to slashes', () => {
    expect(toNormalizedPath('a\\b\\c')).toBe('a/b/c');
    expect(toNormalizedPath('C:\\\\a\\b\\c')).toBe('C:/a/b/c');
    expect(toNormalizedPath('\\\\server\\share\\file')).toBe('//server/share/file');
    expect(toNormalizedPath('\\\\?\\C:\\a\\b\\c')).toBe('//?/C:/a/b/c');
  });
});
