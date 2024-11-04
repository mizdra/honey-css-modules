import { expect, test } from 'vitest';
import { add } from './math.js';

test('add', () => {
  expect(add(1, 2)).toBe(3);
});
