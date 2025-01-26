import type { Diagnostic } from 'honey-css-modules-core';
import { formatDiagnostic } from './formatter.js';

export interface Logger {
  logDiagnostics(diagnostics: Diagnostic[]): void;
}

export function createLogger(cwd: string): Logger {
  return {
    logDiagnostics(diagnostics: Diagnostic[]): void {
      let result = '';
      for (const diagnostic of diagnostics) {
        result += `${formatDiagnostic(diagnostic, cwd)}\n\n`;
      }
      process.stderr.write(result);
    },
  };
}
