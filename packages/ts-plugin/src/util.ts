import ts from 'typescript';

/** The error code used by tsserver to display the honey-css-modules error in the editor. */
// NOTE: Use any other number than 1002 or later, as they are reserved by TypeScript's built-in errors.
// ref: https://github.com/microsoft/TypeScript/blob/220706eb0320ff46fad8bf80a5e99db624ee7dfb/src/compiler/diagnosticMessages.json
export const TS_ERROR_CODE_FOR_HCM_ERROR = 0;

export function convertErrorCategory(category: 'error' | 'warning' | 'suggestion'): ts.DiagnosticCategory {
  switch (category) {
    case 'error':
      return ts.DiagnosticCategory.Error;
    case 'warning':
      return ts.DiagnosticCategory.Warning;
    case 'suggestion':
      return ts.DiagnosticCategory.Suggestion;
    default:
      throw new Error(`Unknown category: ${String(category)}`);
  }
}
