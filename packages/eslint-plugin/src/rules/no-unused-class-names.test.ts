import css from '@eslint/css';
import parser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';
import { test } from 'vitest';
import { noUnusedClassNames } from './no-unused-class-names.js';

test('no-unused-class-names', () => {
  const ruleTester = new RuleTester({
    plugins: { css },
    languageOptions: { parser },
    language: 'css/css',
  });
  ruleTester.run('no-unused-class-names', noUnusedClassNames, {
    valid: [],
    invalid: [
      {
        code: '.local {}',
        errors: [{ messageId: 'disallow', data: { name: 'local' }, line: 1, column: 1, endLine: 1, endColumn: 7 }],
      },
    ],
  });
});
