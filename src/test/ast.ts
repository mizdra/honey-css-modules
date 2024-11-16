import type { AtRule, Root, Rule } from 'postcss';
import { parse } from 'postcss';
import type { ClassName } from 'postcss-selector-parser';
import selectorParser from 'postcss-selector-parser';

export function createRoot(code: string, from?: string): Root {
  return parse(code, { from: from || '/test/test.css' });
}

export function createAtImports(root: Root): AtRule[] {
  const results: AtRule[] = [];
  root.walkAtRules('import', (atImport) => {
    results.push(atImport);
  });
  return results;
}

export function createAtValues(root: Root): AtRule[] {
  const results: AtRule[] = [];
  root.walkAtRules('value', (atValue) => {
    results.push(atValue);
  });
  return results;
}

export function createClassSelectors(root: Root): { rule: Rule; classSelector: ClassName }[] {
  const results: { rule: Rule; classSelector: ClassName }[] = [];
  root.walkRules((rule) => {
    selectorParser((selectors) => {
      selectors.walk((selector) => {
        if (selector.type === 'class') {
          results.push({ rule, classSelector: selector });
        }
      });
    }).processSync(rule);
  });
  return results;
}
