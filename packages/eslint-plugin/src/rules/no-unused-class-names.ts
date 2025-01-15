/* eslint-disable @typescript-eslint/naming-convention */
import type { Rule } from 'eslint';

export const noUnusedClassNames: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow unused class names.',
      recommended: true,
      // TODO: Add a URL
      // url: '',
    },
    messages: {
      disallow: "'{{name}}' is defined but never used.",
    },
  },
  create(context) {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ClassSelector(node: any) {
        // TODO: Check if the class name is unused
        context.report({
          loc: node.loc,
          messageId: 'disallow',
          data: { name: node.name },
        });
      },
    };
  },
};
