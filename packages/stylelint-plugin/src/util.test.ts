import dedent from 'dedent';
import { expect, test } from 'vitest';
import { createIFF } from './test/fixture.js';
import { findUsedClassNames, readTsText } from './util.js';

test('readTsText', async () => {
  const iff = await createIFF({
    'a.ts': `'a.ts'`,
    'b.tsx': `'b.tsx'`,
    'c.ts': `'c.ts'`,
    'c.tsx': `'c.tsx'`,
  });
  expect(await readTsText(iff.join('a.module.css'))).toBe(`'a.ts'`);
  expect(await readTsText(iff.join('b.module.css'))).toBe(`'b.tsx'`);
  expect(await readTsText(iff.join('c.module.css'))).toBe(`'c.tsx'`);
  expect(await readTsText(iff.join('d.module.css'))).toBe(undefined);
});

test('findUsedClassNames', () => {
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
  expect(findUsedClassNames(code)).toEqual(expected);
});
