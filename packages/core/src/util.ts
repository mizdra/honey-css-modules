export function isPosixRelativePath(path: string): boolean {
  return path.startsWith(`./`) || path.startsWith(`../`);
}

/**
 * The syntax pattern for consuming tokens imported from CSS Module.
 * @example `styles.foo`
 */
// TODO: Support `styles['foo']` and `styles["foo"]`
// TODO: Support `otherNameStyles.foo`
export const TOKEN_CONSUMER_PATTERN = /styles\.([$_\p{ID_Start}][$\u200c\u200d\p{ID_Continue}]*)/gu;
