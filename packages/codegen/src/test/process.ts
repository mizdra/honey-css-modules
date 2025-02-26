import { vi } from 'vitest';

export class ProcessExitError extends Error {
  exitCode: string | number | null | undefined;
  constructor(exitCode: string | number | null | undefined) {
    super();
    this.exitCode = exitCode;
  }
}

export function mockProcessExit() {
  vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new ProcessExitError(code);
  });
}
