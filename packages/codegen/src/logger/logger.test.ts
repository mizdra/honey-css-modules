import { type Diagnostic, SystemError } from 'honey-css-modules-core';
import { describe, expect, test, vi } from 'vitest';
import { createLogger } from './logger.js';

const stderrWriteSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

const cwd = '/app';

describe('createLogger', () => {
  test('logDiagnostics', () => {
    const logger = createLogger(cwd);
    const diagnostics: Diagnostic[] = [
      { type: 'semantic', text: 'text1', category: 'error' },
      { type: 'semantic', text: 'text2', category: 'error' },
    ];
    logger.logDiagnostics('', diagnostics);
    expect(stderrWriteSpy).toHaveBeenCalledWith('error: text1\n\nerror: text2\n\n');
  });
  test('logSystemError', () => {
    const logger = createLogger(cwd);
    logger.logSystemError(new SystemError('CODE', 'message'));
    expect(stderrWriteSpy).toHaveBeenCalledWith('error CODE: message\n');
  });
});
