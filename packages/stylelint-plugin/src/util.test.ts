import dedent from 'dedent';
import { expect, test } from 'vitest';
import { findUsedTokenNames } from './util.js';

test('findUsedTokenNames', () => {
  const code = dedent`
    import styles from './a.module.css';
    styles.foo;
    styles.bar;
    styles['baz'];
    styles["qux"];
    styles[\`quux\`];
    styles;
  `;
  const expected = new Set(['foo', 'bar']);
  expect(findUsedTokenNames(code)).toEqual(expected);
});
