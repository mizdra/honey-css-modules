import { describe, expect, test } from 'vitest';
import { createRoot, createRules } from '../test/ast.js';
import { parseRule as _parseRule } from './rule-parser.js';

function parseRule(ruleStr: string): string[] {
  const [rule] = createRules(createRoot(ruleStr));
  return _parseRule(rule!).map((classSelector) => classSelector.name);
}

describe('parseRule', () => {
  test('The default mode is local and the class names are local by default', () => {
    expect(parseRule('.local1 {}')).toStrictEqual(['local1']);
  });
  describe('`:local(...)` and `:global(...)`', () => {
    test('The class names wrapped by `:global(...)` is global', () => {
      expect(parseRule('.local1 :global(.global1 :is(.global2)) .local2 {}')).toStrictEqual(['local1', 'local2']);
    });
    test('The class names wrapped by `:local(...)` is local', () => {
      expect(parseRule(':local(.local1 :is(.local2)) {}')).toStrictEqual(['local1', 'local2']);
      // If honey-css-modules supports `:local` and `:global`, the following test should pass.
      // expect(parseRule(':global .global1 :local(.local1 :is(.local2)) .global2 {}')).toStrictEqual([
      //   'local1',
      //   'local2',
      // ]);
    });
    test('An error is thrown when `:local(...)` or `:global(...)` is nested', () => {
      expect(() => parseRule(':local(:global(.a)) {}')).toThrowErrorMatchingInlineSnapshot(
        `[Error: A \`:global\` is not allowed inside of \`:local(...)\`.]`,
      );
      expect(() => parseRule(':global(:local(.a)) {}')).toThrowErrorMatchingInlineSnapshot(
        `[Error: A \`:local\` is not allowed inside of \`:global(...)\`.]`,
      );
      expect(() => parseRule(':local(:local(.a)) {}')).toThrowErrorMatchingInlineSnapshot(
        `[Error: A \`:local\` is not allowed inside of \`:local(...)\`.]`,
      );
      expect(() => parseRule(':global(:global(.a)) {}')).toThrowErrorMatchingInlineSnapshot(
        `[Error: A \`:global\` is not allowed inside of \`:global(...)\`.]`,
      );
    });
    test('`:local()` and `:global()` is allowed', () => {
      // postcss-modules does not allow it, but honey-css-modules allows it.
      // Because allowing it does not harm users.
      expect(parseRule(':local() {}')).toStrictEqual([]);
      expect(parseRule(':global() {}')).toStrictEqual([]);
      expect(parseRule(':local( ) {}')).toStrictEqual([]);
    });
  });
  describe('`:local` and `:global`', () => {
    // The :local and :global specifications are complex. Therefore, honey-css-modules does not support them.
    test('An error is thrown when using `:local` or `:global`', () => {
      expect(() => parseRule(':local .local1 {}')).toThrowErrorMatchingInlineSnapshot(
        `[Error: \`:local\` (without any arguments) is not supported. Use \`:local(...)\` instead.]`,
      );
      expect(() => parseRule(':global .global1 {}')).toThrowErrorMatchingInlineSnapshot(
        `[Error: \`:global\` (without any arguments) is not supported. Use \`:global(...)\` instead.]`,
      );
    });
    // test('`:global` changes the mode to global and the following class names are global', () => {
    //   expect(parseRule('.local1 :global .global1 .global2 {}')).toStrictEqual(['local1']);
    // });
    // test('`:local` changes the mode to local and the following class names are local', () => {
    //   expect(parseRule(':global .global1 :local .local1 .local2 {}')).toStrictEqual(['local1', 'local2']);
    // });
    // test('`global` and `local` can be used in any selector', () => {
    //   expect(parseRule(':is(:global .global1 :local .local1) .local2 {}')).toStrictEqual(['local1', 'local2']);
    // });
    // test('`:local` and `:global` is only in effect within that selector', () => {
    //   expect(parseRule(':is(:global .global1) .local1 {}')).toStrictEqual(['local1']);
    // });
    // test('In multiple selector, the selector must match the mode of the previous selector', () => {
    //   expect(() => parseRule('.local1, :global .global1 {}')).toThrowError();
    //   expect(() => parseRule(':global, .local1 {}')).toThrowError();
    //   expect(parseRule('.local1, .local2 {}')).toStrictEqual(['local1', 'local2']);
    //   expect(parseRule(':local, :local {}')).toStrictEqual([]);
    //   expect(parseRule(':global, :global {}')).toStrictEqual([]);
    //   // The mode of the head of the previous selector is local, but the mode of the tail is global. So, it does not throw an error.
    //   expect(parseRule('.local1 :global .global1, :global .global2 {}')).toStrictEqual(['local1']);
    //   // For some reason, different scopes are allowed in the non-root selector list...😇
    //   expect(parseRule(':is(:global .global1, :local .local1) {}')).toStrictEqual(['local1']);
    //   // For some reason, in a non-root selector list, the next selector takes over the scope from the previous selector...😇
    //   expect(parseRule(':is(:global .global1, .global2) {}')).toStrictEqual([]);
    // });
  });
});
