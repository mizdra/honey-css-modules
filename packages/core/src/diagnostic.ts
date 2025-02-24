export type DiagnosticCategory = 'error' | 'warning';

export type Diagnostic = SemanticDiagnostic | SyntacticDiagnostic;

interface DiagnosticBase {
  /** Text of diagnostic message. */
  text: string;
  /** The category of the diagnostic message. */
  category: DiagnosticCategory;
}

export interface SemanticDiagnostic extends DiagnosticBase {
  type: 'semantic';
  /** The filename of the file in which the diagnostic occurred */
  fileName?: string;
  /** Starting file offset at which text applies. It is inclusive. */
  start?: number;
  /**  The last file offset at which the text applies. It is exclusive. */
  end?: number;
}

export interface SyntacticDiagnostic extends DiagnosticBase {
  type: 'syntactic';
  /** The filename of the file in which the diagnostic occurred */
  fileName: string;
  /** Starting file offset at which text applies. It is inclusive. */
  start: number;
  /**  The last file offset at which the text applies. It is exclusive. */
  end?: number;
}
