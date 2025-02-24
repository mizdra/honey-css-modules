import { styleText } from 'node:util';
import {
  type Diagnostic,
  type DiagnosticCategory,
  getLineAndColumnFromOffset,
  relative,
  type SystemError,
} from 'honey-css-modules-core';

export function formatDiagnostic(text: string, diagnostic: Diagnostic, cwd: string): string {
  let result = '';
  if (diagnostic.fileName) {
    result += `${formatLocation(text, diagnostic.fileName, diagnostic.start, cwd)} - `;
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

function formatLocation(text: string, fileName: string, start: number | undefined, cwd: string): string {
  let result = '';
  result += styleText('cyan', relative(cwd, fileName));
  if (start !== undefined) {
    const { line, column } = getLineAndColumnFromOffset(text, start);
    result += ':';
    result += styleText('yellow', line.toString());
    result += ':';
    result += styleText('yellow', column.toString());
  }
  return result;
}

function formatCategory(category: DiagnosticCategory): string {
  switch (category) {
    case 'error':
      return styleText('red', 'error');
    case 'warning':
      return styleText('yellow', 'warning');
    default:
      throw new Error(`Unknown diagnostic category: ${String(category)}`);
  }
}
