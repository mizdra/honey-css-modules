import { basename } from 'node:path';
import { parseRule } from 'honey-css-modules-core';
import type { Rule } from 'stylelint';
import stylelint from 'stylelint';
import { findComponentFile, findUsedTokenNames } from '../util.js';

// TODO: Report cjs-module-lexer compatibility problem to stylelint
const { createPlugin, utils } = stylelint;

const ruleName = 'honey-css-modules/no-unused-class-names';

const messages = utils.ruleMessages(ruleName, {
  disallow: (className: string, componentFileName: string) =>
    `'${className}' is defined but never used in ${basename(componentFileName)}.`,
});

const meta = {
  url: 'https://github.com/mizdra/honey-css-modules/blob/main/packages/stylelint-plugin-honey-css-modules/docs/rules/no-unused-class-names.md',
};

const ruleFunction: Rule = (_primaryOptions, _secondaryOptions, _context) => {
  return async (root, result) => {
    if (root.source?.input.file === undefined) return;
    const cssModuleFileName = root.source.input.file;

    if (!cssModuleFileName.endsWith('.module.css')) return;

    const componentFile = await findComponentFile(cssModuleFileName);

    // If the corresponding component file is not found, it is treated as a CSS Module file shared by the entire project.
    // It is difficult to determine where class names in a shared CSS Module file are used. Therefore, it is
    // assumed that all class names are used.
    if (componentFile === undefined) return;

    const usedTokenNames = findUsedTokenNames(componentFile.text);

    root.walkRules((rule) => {
      const { classSelectors } = parseRule(rule);

      for (const classSelector of classSelectors) {
        if (!usedTokenNames.has(classSelector.name)) {
          utils.report({
            result,
            ruleName,
            message: messages.disallow(classSelector.name, componentFile.fileName),
            node: rule,
            index: classSelector.loc.start.offset,
            endIndex: classSelector.loc.end.offset,
            word: classSelector.name,
          });
        }
      }
    });
  };
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = meta;

export const noUnusedClassNames = createPlugin(ruleName, ruleFunction);
