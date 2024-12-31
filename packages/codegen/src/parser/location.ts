export interface Position {
  /**
   * The line number in the source file. It is 1-based.
   * This is compatible with postcss and tsserver.
   */
  // TODO: Maybe it should be deleted since it is not used
  line: number;
  /**
   * The column number in the source file. It is 1-based.
   * This is compatible with postcss and tsserver.
   */
  // TODO: Maybe it should be deleted since it is not used
  column: number;
  /** The offset in the source file. It is 0-based. */
  offset: number;
}

export interface Location {
  /**
   * The starting position of the node. It is inclusive.
   * This is compatible with postcss and tsserver.
   */
  start: Position;
  /**
   * The ending position of the node. It is exclusive.
   * This is compatible with tsserver, but not postcss.
   */
  // TODO: Maybe it should be deleted since it is not used
  end: Position;
}
