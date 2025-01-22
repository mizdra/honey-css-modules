import type { Position } from './location.js';

export interface Diagnostic {
  /** Starting file position at which text applies. */
  start: Position;
  /**  The last file position at which the text applies. */
  end: Position;
  /** Text of diagnostic message. */
  text: string;
  /** The category of the diagnostic message, e.g. "error", "warning", or "suggestion". */
  category: 'error' | 'warning' | 'suggestion';
}
