import dedent from 'dedent';
import { describe, expect, test } from 'vitest';
import { createClassSelectors, createRoot } from '../test/ast.js';
import { getTokenLocationOfClassSelector } from './location.js';

describe('getTokenLocationOfClassSelector', () => {
  test('basic', () => {
    const [basic] = createClassSelectors(
      createRoot(dedent`
        .basic {}
      `),
    );
    expect(getTokenLocationOfClassSelector(basic!.rule, basic!.classSelector)).toMatchInlineSnapshot(`
      {
        "end": {
          "column": 7,
          "line": 1,
          "offset": 6,
        },
        "start": {
          "column": 2,
          "line": 1,
          "offset": 1,
        },
      }
    `);
  });
  test('cascading', () => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const [cascading_1, cascading_2] = createClassSelectors(
      createRoot(dedent`
        .cascading {}
        .cascading {}
      `),
    );
    expect(getTokenLocationOfClassSelector(cascading_1!.rule, cascading_1!.classSelector)).toMatchInlineSnapshot(`
      {
        "end": {
          "column": 11,
          "line": 1,
          "offset": 10,
        },
        "start": {
          "column": 2,
          "line": 1,
          "offset": 1,
        },
      }
    `);
    expect(getTokenLocationOfClassSelector(cascading_2!.rule, cascading_2!.classSelector)).toMatchInlineSnapshot(`
      {
        "end": {
          "column": 11,
          "line": 2,
          "offset": 24,
        },
        "start": {
          "column": 2,
          "line": 2,
          "offset": 15,
        },
      }
    `);
  });
  test('pseudo_class', () => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const [pseudo_class_1, pseudo_class_2, pseudo_class_3] = createClassSelectors(
      createRoot(dedent`
        .pseudo_class_1 {}
        .pseudo_class_2:hover {}
        :not(.pseudo_class_3) {}
      `),
    );
    expect(getTokenLocationOfClassSelector(pseudo_class_1!.rule, pseudo_class_1!.classSelector)).toMatchInlineSnapshot(`
      {
        "end": {
          "column": 16,
          "line": 1,
          "offset": 15,
        },
        "start": {
          "column": 2,
          "line": 1,
          "offset": 1,
        },
      }
    `);
    expect(getTokenLocationOfClassSelector(pseudo_class_2!.rule, pseudo_class_2!.classSelector)).toMatchInlineSnapshot(`
      {
        "end": {
          "column": 16,
          "line": 2,
          "offset": 34,
        },
        "start": {
          "column": 2,
          "line": 2,
          "offset": 20,
        },
      }
    `);
    expect(getTokenLocationOfClassSelector(pseudo_class_3!.rule, pseudo_class_3!.classSelector)).toMatchInlineSnapshot(`
      {
        "end": {
          "column": 21,
          "line": 3,
          "offset": 64,
        },
        "start": {
          "column": 7,
          "line": 3,
          "offset": 50,
        },
      }
    `);
  });
  test('multiple_selector', () => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const [multiple_selector_1, multiple_selector_2] = createClassSelectors(
      createRoot(dedent`
        .multiple_selector_1.multiple_selector_2 {}
      `),
    );
    expect(getTokenLocationOfClassSelector(multiple_selector_1!.rule, multiple_selector_1!.classSelector))
      .toMatchInlineSnapshot(`
        {
          "end": {
            "column": 21,
            "line": 1,
            "offset": 20,
          },
          "start": {
            "column": 2,
            "line": 1,
            "offset": 1,
          },
        }
      `);
    expect(getTokenLocationOfClassSelector(multiple_selector_2!.rule, multiple_selector_2!.classSelector))
      .toMatchInlineSnapshot(`
        {
          "end": {
            "column": 41,
            "line": 1,
            "offset": 40,
          },
          "start": {
            "column": 22,
            "line": 1,
            "offset": 21,
          },
        }
      `);
  });

  test('combinator', () => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const [combinator_1, combinator_2] = createClassSelectors(
      createRoot(dedent`
        .combinator_1 + .combinator_2 {}
      `),
    );
    expect(getTokenLocationOfClassSelector(combinator_1!.rule, combinator_1!.classSelector)).toMatchInlineSnapshot(`
      {
        "end": {
          "column": 14,
          "line": 1,
          "offset": 13,
        },
        "start": {
          "column": 2,
          "line": 1,
          "offset": 1,
        },
      }
    `);
    expect(getTokenLocationOfClassSelector(combinator_2!.rule, combinator_2!.classSelector)).toMatchInlineSnapshot(`
      {
        "end": {
          "column": 30,
          "line": 1,
          "offset": 29,
        },
        "start": {
          "column": 18,
          "line": 1,
          "offset": 17,
        },
      }
    `);
  });
  test('at_rule', () => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const [at_rule] = createClassSelectors(
      createRoot(dedent`
        @supports (display: flex) {
          @media screen and (min-width: 900px) {
            .at_rule {}
          }
        }
      `),
    );
    expect(getTokenLocationOfClassSelector(at_rule!.rule, at_rule!.classSelector)).toMatchInlineSnapshot(`
      {
        "end": {
          "column": 13,
          "line": 3,
          "offset": 81,
        },
        "start": {
          "column": 6,
          "line": 3,
          "offset": 74,
        },
      }
    `);
  });
  test('selector_list', () => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const [selector_list_1, selector_list_2] = createClassSelectors(
      createRoot(dedent`
        .selector_list_1, .selector_list_2 {}
      `),
    );
    expect(getTokenLocationOfClassSelector(selector_list_1!.rule, selector_list_1!.classSelector))
      .toMatchInlineSnapshot(`
        {
          "end": {
            "column": 17,
            "line": 1,
            "offset": 16,
          },
          "start": {
            "column": 2,
            "line": 1,
            "offset": 1,
          },
        }
      `);
    expect(getTokenLocationOfClassSelector(selector_list_2!.rule, selector_list_2!.classSelector))
      .toMatchInlineSnapshot(`
        {
          "end": {
            "column": 35,
            "line": 1,
            "offset": 34,
          },
          "start": {
            "column": 20,
            "line": 1,
            "offset": 19,
          },
        }
      `);
  });
  test('local_class_name', () => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const [local_class_name_1, local_class_name_2, local_class_name_3, local_class_name_4] = createClassSelectors(
      createRoot(dedent`
        :local .local_class_name_1 {}
        :local {
          .local_class_name_2 {}
          .local_class_name_3 {}
        }
        :local(.local_class_name_4) {}
      `),
    );
    expect(getTokenLocationOfClassSelector(local_class_name_1!.rule, local_class_name_1!.classSelector))
      .toMatchInlineSnapshot(`
        {
          "end": {
            "column": 27,
            "line": 1,
            "offset": 26,
          },
          "start": {
            "column": 9,
            "line": 1,
            "offset": 8,
          },
        }
      `);
    expect(getTokenLocationOfClassSelector(local_class_name_2!.rule, local_class_name_2!.classSelector))
      .toMatchInlineSnapshot(`
        {
          "end": {
            "column": 22,
            "line": 3,
            "offset": 60,
          },
          "start": {
            "column": 4,
            "line": 3,
            "offset": 42,
          },
        }
      `);
    expect(getTokenLocationOfClassSelector(local_class_name_3!.rule, local_class_name_3!.classSelector))
      .toMatchInlineSnapshot(`
        {
          "end": {
            "column": 22,
            "line": 4,
            "offset": 85,
          },
          "start": {
            "column": 4,
            "line": 4,
            "offset": 67,
          },
        }
      `);
    expect(getTokenLocationOfClassSelector(local_class_name_4!.rule, local_class_name_4!.classSelector))
      .toMatchInlineSnapshot(`
        {
          "end": {
            "column": 27,
            "line": 6,
            "offset": 117,
          },
          "start": {
            "column": 9,
            "line": 6,
            "offset": 99,
          },
        }
      `);
  });
  test('with_newline', () => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const [with_newline_1, with_newline_2, with_newline_3] = createClassSelectors(
      createRoot(dedent`
        .with_newline_1,
        .with_newline_2
          + .with_newline_3, {}
      `),
    );
    expect(getTokenLocationOfClassSelector(with_newline_1!.rule, with_newline_1!.classSelector)).toMatchInlineSnapshot(`
      {
        "end": {
          "column": 16,
          "line": 1,
          "offset": 15,
        },
        "start": {
          "column": 2,
          "line": 1,
          "offset": 1,
        },
      }
    `);
    expect(getTokenLocationOfClassSelector(with_newline_2!.rule, with_newline_2!.classSelector)).toMatchInlineSnapshot(`
      {
        "end": {
          "column": 16,
          "line": 2,
          "offset": 32,
        },
        "start": {
          "column": 2,
          "line": 2,
          "offset": 18,
        },
      }
    `);
    expect(getTokenLocationOfClassSelector(with_newline_3!.rule, with_newline_3!.classSelector)).toMatchInlineSnapshot(`
      {
        "end": {
          "column": 20,
          "line": 3,
          "offset": 52,
        },
        "start": {
          "column": 6,
          "line": 3,
          "offset": 38,
        },
      }
    `);
  });
});
