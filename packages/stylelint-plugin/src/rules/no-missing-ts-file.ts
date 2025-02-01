import type { Rule } from 'stylelint';
import stylelint from 'stylelint';
import { readTsFile } from '../util.js';

// TODO: Report cjs-module-lexer compatibility problem to stylelint
const { createPlugin, utils } = stylelint;

const ruleName = 'honey-css-modules/no-missing-ts-file';

const messages = utils.ruleMessages(ruleName, {
  disallow: () => `The corresponding TypeScript file is not found.`,
});

const meta = {
  url: 'https://github.com/mizdra/honey-css-modules/blob/main/packages/stylelint-plugin-honey-css-modules/docs/rules/no-missing-ts-file.md',
};

const ruleFunction: Rule = (_primaryOptions, _secondaryOptions, _context) => {
  return async (root, result) => {
    if (root.source?.input.file === undefined) return;
    const cssModuleFileName = root.source.input.file;

    if (!cssModuleFileName.endsWith('.module.css')) return;

    const tsFile = await readTsFile(cssModuleFileName);

    if (tsFile === undefined) {
      utils.report({
        result,
        ruleName,
        message: messages.disallow(),
        node: root,
        index: 0,
        endIndex: 0,
      });
    }
  };
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = meta;

export const noMissingTsFile = createPlugin(ruleName, ruleFunction);
