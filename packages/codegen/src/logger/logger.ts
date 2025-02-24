import type { Diagnostic, SystemError } from 'honey-css-modules-core';
import { formatDiagnostic, formatSystemError } from './formatter.js';

export interface Logger {
  logDiagnostics(sourceText: string, diagnostics: Diagnostic[]): void;
  logSystemError(error: SystemError): void;
}

export function createLogger(cwd: string): Logger {
  return {
    logDiagnostics(text: string, diagnostics: Diagnostic[]): void {
      let result = '';
      for (const diagnostic of diagnostics) {
        result += `${formatDiagnostic(text, diagnostic, cwd)}\n\n`;
      }
      process.stderr.write(result);
    },
    logSystemError(error: SystemError): void {
      process.stderr.write(`${formatSystemError(error)}\n`);
    },
  };
}
