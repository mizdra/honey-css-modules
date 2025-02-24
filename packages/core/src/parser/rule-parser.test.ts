import dedent from 'dedent';
import { describe, expect, test } from 'vitest';
import { createRoot, createRules } from '../test/ast.js';
import { parseRule } from './rule-parser.js';

function parseRuleSimply(ruleStr: string): string[] {
  const [rule] = createRules(createRoot(ruleStr));
  return parseRule(rule!).classSelectors.map((classSelector) => classSelector.name);
}

describe('parseRule', () => {
  test('collect local class selectors', () => {
    const rules = createRules(
      createRoot(dedent`
        .basic {}
        .cascading {}
        .cascading {}
        .pseudo_class_1 {}
        .pseudo_class_2:hover {}
        :not(.pseudo_class_3) {}
        .multiple_selector_1.multiple_selector_2 {}
        .combinator_1 + .combinator_2 {}
        @supports (display: flex) {
          @media screen and (min-width: 900px) {
            .at_rule {}
          }
        }
        .selector_list_1, .selector_list_2 {}
        :local(.local_class_name_1) {}
        .with_newline_1,
        .with_newline_2
          + .with_newline_3, {}
      `),
    );
    const result = rules.map(parseRule);
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "classSelectors": [
            {
              "loc": {
                "end": 6,
                "start": 1,
              },
              "name": "basic",
            },
          ],
          "diagnostics": [],
        },
        {
          "classSelectors": [
            {
              "loc": {
                "end": 20,
                "start": 11,
              },
              "name": "cascading",
            },
          ],
          "diagnostics": [],
        },
        {
          "classSelectors": [
            {
              "loc": {
                "end": 34,
                "start": 25,
              },
              "name": "cascading",
            },
          ],
          "diagnostics": [],
        },
        {
          "classSelectors": [
            {
              "loc": {
                "end": 53,
                "start": 39,
              },
              "name": "pseudo_class_1",
            },
          ],
          "diagnostics": [],
        },
        {
          "classSelectors": [
            {
              "loc": {
                "end": 72,
                "start": 58,
              },
              "name": "pseudo_class_2",
            },
          ],
          "diagnostics": [],
        },
        {
          "classSelectors": [
            {
              "loc": {
                "end": 102,
                "start": 88,
              },
              "name": "pseudo_class_3",
            },
          ],
          "diagnostics": [],
        },
        {
          "classSelectors": [
            {
              "loc": {
                "end": 127,
                "start": 108,
              },
              "name": "multiple_selector_1",
            },
            {
              "loc": {
                "end": 147,
                "start": 128,
              },
              "name": "multiple_selector_2",
            },
          ],
          "diagnostics": [],
        },
        {
          "classSelectors": [
            {
              "loc": {
                "end": 164,
                "start": 152,
              },
              "name": "combinator_1",
            },
            {
              "loc": {
                "end": 180,
                "start": 168,
              },
              "name": "combinator_2",
            },
          ],
          "diagnostics": [],
        },
        {
          "classSelectors": [
            {
              "loc": {
                "end": 265,
                "start": 258,
              },
              "name": "at_rule",
            },
          ],
          "diagnostics": [],
        },
        {
          "classSelectors": [
            {
              "loc": {
                "end": 291,
                "start": 276,
              },
              "name": "selector_list_1",
            },
            {
              "loc": {
                "end": 309,
                "start": 294,
              },
              "name": "selector_list_2",
            },
          ],
          "diagnostics": [],
        },
        {
          "classSelectors": [
            {
              "loc": {
                "end": 339,
                "start": 321,
              },
              "name": "local_class_name_1",
            },
          ],
          "diagnostics": [],
        },
        {
          "classSelectors": [
            {
              "loc": {
                "end": 359,
                "start": 345,
              },
              "name": "with_newline_1",
            },
            {
              "loc": {
                "end": 376,
                "start": 362,
              },
              "name": "with_newline_2",
            },
            {
              "loc": {
                "end": 396,
                "start": 382,
              },
              "name": "with_newline_3",
            },
          ],
          "diagnostics": [],
        },
      ]
    `);
  });
  describe('`:local(...)` and `:global(...)`', () => {
    test('The class names wrapped by `:global(...)` is global', () => {
      expect(parseRuleSimply('.local1 :global(.global1 :is(.global2)) .local2 {}')).toStrictEqual(['local1', 'local2']);
    });
    test('The class names wrapped by `:local(...)` is local', () => {
      expect(parseRuleSimply(':local(.local1 :is(.local2)) {}')).toStrictEqual(['local1', 'local2']);
      // If honey-css-modules supports `:local` and `:global`, the following test should pass.
      // expect(parseRuleSimply(':global .global1 :local(.local1 :is(.local2)) .global2 {}')).toStrictEqual([
      //   'local1',
      //   'local2',
      // ]);
    });
    test('reports diagnostics when `:local(...)` or `:global(...)` is nested', () => {
      const rules = createRules(
        createRoot(dedent`
          :local(:global(.a)) {}
          :global(:local(.a)) {}
          :local(:local(.a)) {}
          :global(:global(.a)) {}
        `),
      );
      const result = rules.map(parseRule);
      expect(result).toMatchInlineSnapshot(`
        [
          {
            "classSelectors": [],
            "diagnostics": [
              {
                "category": "error",
                "end": 18,
                "fileName": "/test/test.css",
                "start": 7,
                "text": "A \`:global(...)\` is not allowed inside of \`:local(...)\`.",
                "type": "syntactic",
              },
            ],
          },
          {
            "classSelectors": [],
            "diagnostics": [
              {
                "category": "error",
                "end": 41,
                "fileName": "/test/test.css",
                "start": 31,
                "text": "A \`:local(...)\` is not allowed inside of \`:global(...)\`.",
                "type": "syntactic",
              },
            ],
          },
          {
            "classSelectors": [],
            "diagnostics": [
              {
                "category": "error",
                "end": 63,
                "fileName": "/test/test.css",
                "start": 53,
                "text": "A \`:local(...)\` is not allowed inside of \`:local(...)\`.",
                "type": "syntactic",
              },
            ],
          },
          {
            "classSelectors": [],
            "diagnostics": [
              {
                "category": "error",
                "end": 87,
                "fileName": "/test/test.css",
                "start": 76,
                "text": "A \`:global(...)\` is not allowed inside of \`:global(...)\`.",
                "type": "syntactic",
              },
            ],
          },
        ]
      `);
    });
    test('`:local()` and `:global()` is allowed', () => {
      // postcss-modules does not allow it, but honey-css-modules allows it.
      // Because allowing it does not harm users.
      const rules = createRules(
        createRoot(dedent`
          :local() {}
          :global() {}
          :local( ) {}
        `),
      );
      const result = rules.map(parseRule);
      expect(result).toMatchInlineSnapshot(`
        [
          {
            "classSelectors": [],
            "diagnostics": [],
          },
          {
            "classSelectors": [],
            "diagnostics": [],
          },
          {
            "classSelectors": [],
            "diagnostics": [],
          },
        ]
      `);
    });
  });
  describe('`:local` and `:global`', () => {
    // The :local and :global specifications are complex. Therefore, honey-css-modules does not support them.
    test('reports diagnostics when using `:local` or `:global`', () => {
      const rules = createRules(
        createRoot(dedent`
          :local .local1 {}
          :global .global1 {}
        `),
      );
      const result = rules.map(parseRule);
      expect(result).toMatchInlineSnapshot(`
        [
          {
            "classSelectors": [
              {
                "loc": {
                  "end": 14,
                  "start": 8,
                },
                "name": "local1",
              },
            ],
            "diagnostics": [
              {
                "category": "error",
                "end": 6,
                "fileName": "/test/test.css",
                "start": 0,
                "text": "\`:local\` is not supported. Use \`:local(...)\` instead.",
                "type": "syntactic",
              },
            ],
          },
          {
            "classSelectors": [
              {
                "loc": {
                  "end": 34,
                  "start": 27,
                },
                "name": "global1",
              },
            ],
            "diagnostics": [
              {
                "category": "error",
                "end": 25,
                "fileName": "/test/test.css",
                "start": 18,
                "text": "\`:global\` is not supported. Use \`:global(...)\` instead.",
                "type": "syntactic",
              },
            ],
          },
        ]
      `);
    });
    // test('`:global` changes the mode to global and the following class names are global', () => {
    //   expect(parseRuleSimply('.local1 :global .global1 .global2 {}')).toStrictEqual(['local1']);
    // });
    // test('`:local` changes the mode to local and the following class names are local', () => {
    //   expect(parseRuleSimply(':global .global1 :local .local1 .local2 {}')).toStrictEqual(['local1', 'local2']);
    // });
    // test('`global` and `local` can be used in any selector', () => {
    //   expect(parseRuleSimply(':is(:global .global1 :local .local1) .local2 {}')).toStrictEqual(['local1', 'local2']);
    // });
    // test('`:local` and `:global` is only in effect within that selector', () => {
    //   expect(parseRuleSimply(':is(:global .global1) .local1 {}')).toStrictEqual(['local1']);
    // });
    // test('In multiple selector, the selector must match the mode of the previous selector', () => {
    //   expect(() => parseRuleSimply('.local1, :global .global1 {}')).toThrowError();
    //   expect(() => parseRuleSimply(':global, .local1 {}')).toThrowError();
    //   expect(parseRuleSimply('.local1, .local2 {}')).toStrictEqual(['local1', 'local2']);
    //   expect(parseRuleSimply(':local, :local {}')).toStrictEqual([]);
    //   expect(parseRuleSimply(':global, :global {}')).toStrictEqual([]);
    //   // The mode of the head of the previous selector is local, but the mode of the tail is global. So, it does not throw an error.
    //   expect(parseRuleSimply('.local1 :global .global1, :global .global2 {}')).toStrictEqual(['local1']);
    //   // For some reason, different scopes are allowed in the non-root selector list...😇
    //   expect(parseRuleSimply(':is(:global .global1, :local .local1) {}')).toStrictEqual(['local1']);
    //   // For some reason, in a non-root selector list, the next selector takes over the scope from the previous selector...😇
    //   expect(parseRuleSimply(':is(:global .global1, .global2) {}')).toStrictEqual([]);
    // });
  });
  test('disallow class names that are not valid JavaScript identifiers', () => {
    const rules = createRules(
      createRoot(dedent`
        .a-1 .a_\u0032 {}
      `),
    );
    const result = rules.map(parseRule);
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "classSelectors": [],
          "diagnostics": [
            {
              "category": "error",
              "end": 4,
              "fileName": "/test/test.css",
              "start": 0,
              "text": "\`a-1\` is not allowed because it is not a valid JavaScript identifier.",
              "type": "syntactic",
            },
            {
              "category": "error",
              "end": 14,
              "fileName": "/test/test.css",
              "start": 5,
              "text": "\`a_\\u0032\` is not allowed because it is not a valid JavaScript identifier.",
              "type": "syntactic",
            },
          ],
        },
      ]
    `);
  });
});
