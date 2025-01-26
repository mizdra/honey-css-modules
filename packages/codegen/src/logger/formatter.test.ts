import { describe, expect, test } from 'vitest';
import type { SemanticDiagnostic, SyntacticDiagnostic } from '../parser/diagnostic.js';
import { formatDiagnostic } from './formatter';

const cwd = '/app';

describe('formatDiagnostic', () => {
  test('should format diagnostic without filename and start position', () => {
    const diagnostic: SemanticDiagnostic = { type: 'semantic', category: 'error', text: 'text' };
    const result = formatDiagnostic(diagnostic, cwd);
    expect(result).toMatchInlineSnapshot(`"error: text"`);
  });
  test('should format diagnostic with filename and start position', () => {
    const diagnostic: SyntacticDiagnostic = {
      type: 'syntactic',
      filename: '/app/path/to/file.ts',
      start: { line: 1, column: 2 },
      category: 'error',
      text: 'text',
    };
    const result = formatDiagnostic(diagnostic, cwd);
    expect(result.replaceAll('\\', '/')).toMatchInlineSnapshot(`"path/to/file.ts:1:2 - error: text"`);
  });
});
