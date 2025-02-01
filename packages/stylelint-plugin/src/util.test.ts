import dedent from 'dedent';
import { expect, test } from 'vitest';
import { createIFF } from './test/fixture.js';
import { findComponentFile, findUsedTokenNames } from './util.js';

test('findComponentFile', async () => {
  const iff = await createIFF({
    'a.ts': `'a.ts'`,
    'b.tsx': `'b.tsx'`,
    'c.ts': `'c.ts'`,
    'c.tsx': `'c.tsx'`,
  });
  expect(await findComponentFile(iff.join('a.module.css'))).toStrictEqual({
    fileName: iff.paths['a.ts'],
    text: `'a.ts'`,
  });
  expect(await findComponentFile(iff.join('b.module.css'))).toStrictEqual({
    fileName: iff.paths['b.tsx'],
    text: `'b.tsx'`,
  });
  expect(await findComponentFile(iff.join('c.module.css'))).toStrictEqual({
    fileName: iff.paths['c.tsx'],
    text: `'c.tsx'`,
  });
  expect(await findComponentFile(iff.join('d.module.css'))).toBe(undefined);
});

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
