import dedent from 'dedent';
import { describe, expect, test } from 'vitest';
import { CSSModuleParseError } from './error.js';
import { parseCSSModuleCode, type ParseCSSModuleCodeOptions } from './parser.js';

const options: ParseCSSModuleCodeOptions = { filename: '/test.module.css', dashedIdents: false };

describe('parseCSSModuleCode', () => {
  test('parses CSS module code', () => {
    const parsed = parseCSSModuleCode(
      dedent`
        @import './a.module.css';
        .a { color: red }
      `,
      options,
    );
    expect(parsed).toMatchInlineSnapshot(`
      {
        "filename": "/test.module.css",
        "imports": [
          "./a.module.css",
        ],
        "localTokens": [
          "a",
        ],
      }
    `);
  });
  describe('localTokens', () => {
    test('collects local tokens', () => {
      const parsed = parseCSSModuleCode(
        dedent`
          .a { color: red }
          .b, .c { color: red }
          .d {
            color: red;
            .e { color: red }
            & .f { color: red }
          }
        `,
        options,
      );
      expect(parsed).toMatchInlineSnapshot(`
        {
          "filename": "/test.module.css",
          "imports": [],
          "localTokens": [
            "a",
            "b",
            "c",
            "d",
            "e",
            "f",
          ],
        }
      `);
    });
    test('collects local tokens as CSS variables if dashedIdents is true', () => {
      const code = ':root { --a: red; }';
      const parsed1 = parseCSSModuleCode(code, { ...options, dashedIdents: false });
      expect(parsed1.localTokens).toEqual([]);
      const parsed2 = parseCSSModuleCode(code, { ...options, dashedIdents: true });
      expect(parsed2.localTokens).toEqual(['--a']);
    });
  });
  describe('localTokens', () => {
    test('collects imports', () => {
      const parsed = parseCSSModuleCode(
        dedent`
        @import './a.module.css';
        @import 'https://example.com/b.module.css';
        @import url('./c.module.css');
        @import url(./d.module.css);
        @import './e.module.css' print;
        .a { color: red }
        .b, .c { color: red }
        .d {
          color: red;
          .e { color: red }
          & .f { color: red }
        }
      `,
        options,
      );
      expect(parsed.imports).toMatchInlineSnapshot(`
      [
        "./a.module.css",
        "https://example.com/b.module.css",
        "./c.module.css",
        "./d.module.css",
        "./e.module.css",
      ]
    `);
    });
    test("does not collects non-@import's dependencies as imports", () => {
      const parsed = parseCSSModuleCode(
        dedent`
        .a {
          /* url dependency */
          background: url('./a.png');
          background: image-set('./b.png');
        }
      `,
        options,
      );
      expect(parsed.imports.length).toBe(0);
    });
  });
  test('throws errors if @value is used', () => {
    const code = '@value a: red';
    expect(() => parseCSSModuleCode(code, options)).toThrow(CSSModuleParseError);
  });
});
