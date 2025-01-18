import dedent from 'dedent';
import { expect, test } from 'vitest';
import { createIFF } from './test/fixture.js';
import { findUsedClassNames, readTsFile } from './util.js';

test('readTsText', async () => {
  const iff = await createIFF({
    'a.ts': `'a.ts'`,
    'b.tsx': `'b.tsx'`,
    'c.ts': `'c.ts'`,
    'c.tsx': `'c.tsx'`,
  });
  expect(await readTsFile(iff.join('a.module.css'))).toStrictEqual({ path: iff.paths['a.ts'], text: `'a.ts'` });
  expect(await readTsFile(iff.join('b.module.css'))).toStrictEqual({ path: iff.paths['b.tsx'], text: `'b.tsx'` });
  expect(await readTsFile(iff.join('c.module.css'))).toStrictEqual({ path: iff.paths['c.tsx'], text: `'c.tsx'` });
  expect(await readTsFile(iff.join('d.module.css'))).toBe(undefined);
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
