export class SystemError extends Error {
  code: string;
  constructor(code: string, message: string, cause?: unknown) {
    super(message, { cause });
    this.code = code;
  }
}

export class TsConfigFileNotFoundError extends SystemError {
  constructor() {
    super('TS_CONFIG_NOT_FOUND', 'No tsconfig.json found.');
  }
}

export class ConfigValidationError extends SystemError {
  constructor(message: string) {
    super('CONFIG_VALIDATION_ERROR', message);
  }
}
