import { relative } from 'node:path';
import { styleText } from 'node:util';
import type { Diagnostic, DiagnosticCategory, DiagnosticPosition, SystemError } from 'honey-css-modules-core';

export function formatDiagnostic(diagnostic: Diagnostic, cwd: string): string {
  let result = '';
  if (diagnostic.filename) {
    result += `${formatLocation(diagnostic.filename, diagnostic.start, cwd)} - `;
  }
  result += `${formatCategory(diagnostic.category)}: `;
  result += diagnostic.text;
  // TODO: Add source code if diagnostics has a location
  return result;
}

export function formatSystemError(error: SystemError): string {
  let result = '';
  result += `${formatCategory('error')}`;
  result += ' ';
  result += styleText('gray', error.code);
  result += ': ';
  result += error.message;
  // TODO: Include cause if exists
  return result;
}

function formatLocation(filename: string, start: DiagnosticPosition | undefined, cwd: string): string {
  let result = '';
  result += styleText('cyan', relative(cwd, filename));
  if (start !== undefined) {
    result += ':';
    result += styleText('yellow', start.line.toString());
    result += ':';
    result += styleText('yellow', start.column.toString());
  }
  return result;
}

function formatCategory(category: DiagnosticCategory): string {
  switch (category) {
    case 'error':
      return styleText('red', 'error');
    default:
      throw new Error(`Unknown diagnostic category: ${String(category)}`);
  }
}
