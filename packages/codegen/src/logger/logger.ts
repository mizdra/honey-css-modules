import type { Diagnostic, SystemError } from '@css-modules-kit/core';
import { formatDiagnostic, formatSystemError } from './formatter.js';

export interface Logger {
  logDiagnostics(diagnostics: Diagnostic[]): void;
  logSystemError(error: SystemError): void;
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
    logSystemError(error: SystemError): void {
      process.stderr.write(`${formatSystemError(error)}\n`);
    },
  };
}
