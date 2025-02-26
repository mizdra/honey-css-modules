import { vi } from 'vitest';
import type { Logger } from '../logger/logger.js';

export function createLoggerSpy() {
  return {
    logDiagnostics: vi.fn(),
    logSystemError: vi.fn(),
    logMessage: vi.fn(),
  } satisfies Logger;
}
