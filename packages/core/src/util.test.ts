import dedent from 'dedent';
import { describe, expect, it } from 'vitest';
import { getLineAndColumnFromOffset, getOffsetFromLineAndColumn } from './util.js';

describe('getLineAndColumnFromOffset', () => {
  it('should return line and column for single line text', () => {
    const text = 'hello world';
    expect(getLineAndColumnFromOffset(text, 0)).toEqual({ line: 1, column: 1 });
    expect(getLineAndColumnFromOffset(text, 5)).toEqual({ line: 1, column: 6 });
    expect(getLineAndColumnFromOffset(text, 11)).toEqual({ line: 1, column: 12 });
  });
  it('should return line and column for multi line text', () => {
    const text = dedent`
      hello
      world
      goodbye
    `;
    expect(getLineAndColumnFromOffset(text, 0)).toEqual({ line: 1, column: 1 });
    expect(getLineAndColumnFromOffset(text, 5)).toEqual({ line: 1, column: 6 });
    expect(getLineAndColumnFromOffset(text, 6)).toEqual({ line: 2, column: 1 });
    expect(getLineAndColumnFromOffset(text, 11)).toEqual({ line: 2, column: 6 });
    expect(getLineAndColumnFromOffset(text, 12)).toEqual({ line: 3, column: 1 });
    expect(getLineAndColumnFromOffset(text, 19)).toEqual({ line: 3, column: 8 });
  });
  it('should handle empty text', () => {
    expect(getLineAndColumnFromOffset('', 0)).toEqual({ line: 1, column: 1 });
  });
  it('should handle text with consecutive newlines', () => {
    const text = dedent`
      hello

      world
    `;
    expect(getLineAndColumnFromOffset(text, 6)).toEqual({ line: 2, column: 1 });
    expect(getLineAndColumnFromOffset(text, 7)).toEqual({ line: 3, column: 1 });
  });
});

describe('getOffsetFromLineAndColumn', () => {
  it('should return offset for single line text', () => {
    const text = 'hello world';
    expect(getOffsetFromLineAndColumn(text, 1, 1)).toBe(0);
    expect(getOffsetFromLineAndColumn(text, 1, 6)).toBe(5);
    expect(getOffsetFromLineAndColumn(text, 1, 12)).toBe(11);
  });
  it('should return offset for multi line text', () => {
    const text = dedent`
      hello
      world
      goodbye
    `;
    expect(getOffsetFromLineAndColumn(text, 1, 1)).toBe(0);
    expect(getOffsetFromLineAndColumn(text, 1, 6)).toBe(5);
    expect(getOffsetFromLineAndColumn(text, 2, 1)).toBe(6);
    expect(getOffsetFromLineAndColumn(text, 2, 6)).toBe(11);
    expect(getOffsetFromLineAndColumn(text, 3, 1)).toBe(12);
    expect(getOffsetFromLineAndColumn(text, 3, 8)).toBe(19);
  });
  it('should handle empty text', () => {
    expect(getOffsetFromLineAndColumn('', 1, 1)).toBe(0);
  });
  it('should handle text with consecutive newlines', () => {
    const text = dedent`
      hello

      world
    `;
    expect(getOffsetFromLineAndColumn(text, 2, 1)).toBe(6);
    expect(getOffsetFromLineAndColumn(text, 3, 1)).toBe(7);
  });
});
