export class SystemError extends Error {
  code: string;
  constructor(code: string, message: string, cause?: unknown) {
    super(message, { cause });
    this.code = code;
  }
}

export class ConfigNotFoundError extends SystemError {
  constructor() {
    super('CONFIG_NOT_FOUND', 'No config file found. Did you forget to create hcm.config.{js,mjs,cjs}?');
  }
}

export class ConfigImportError extends SystemError {
  constructor(path: string, cause: unknown) {
    super('CONFIG_IMPORT_ERROR', `Failed to import config file (${path}).`, { cause });
  }
}

export class ConfigValidationError extends SystemError {
  constructor(message: string) {
    super('CONFIG_VALIDATION_ERROR', message);
  }
}
