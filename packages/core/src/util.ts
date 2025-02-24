export function isPosixRelativePath(path: string): boolean {
  return path.startsWith(`./`) || path.startsWith(`../`);
}

/**
 * Calculate line and column numbers from an offset position in text.
 * Both line and column numbers are 1-based.
 */
export function getLineAndColumnFromOffset(text: string, offset: number): { line: number; column: number } {
  let line = 1;
  let lastNewLine = -1;

  for (let i = 0; i < offset; i++) {
    if (text[i] === '\n') {
      line++;
      lastNewLine = i;
    }
  }

  const column = offset - lastNewLine;
  return { line, column };
}

/**
 * Calculate offset from line and column numbers in text.
 * Both line and column numbers are 1-based.
 */
export function getOffsetFromLineAndColumn(text: string, line: number, column: number): number {
  let currentLine = 1;
  let offset = 0;

  // Find the start of the target line
  while (currentLine < line && offset < text.length) {
    if (text[offset] === '\n') {
      currentLine++;
    }
    offset++;
  }

  // Add the column offset (subtract 1 because column is 1-based)
  offset += column - 1;

  return offset;
}
