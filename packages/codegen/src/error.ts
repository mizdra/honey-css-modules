export class ConfigNotFoundError extends Error {
  code = 'CONFIG_NOT_FOUND';
  constructor() {
    super('No config file found. Did you forget to create hcm.config.{js,mjs,cjs}?');
  }
}

export class ConfigImportError extends Error {
  code = 'CONFIG_IMPORT_ERROR';
  constructor(path: string, cause: unknown) {
    super(`Failed to import config file (${path}).`, { cause });
  }
}

export class ConfigValidationError extends Error {
  code = 'CONFIG_VALIDATION_ERROR';
}

export class WriteDtsFileError extends Error {
  code = 'WRITE_DTS_FILE_ERROR';
  constructor(filename: string, cause: unknown) {
    super(`Failed to write .d.ts file (${filename}).`, { cause });
  }
}

export class ReadCSSModuleFileError extends Error {
  code = 'READ_CSS_MODULE_FILE_ERROR';
  constructor(filename: string, cause: unknown) {
    super(`Failed to read CSS Module file (${filename}).`, { cause });
  }
}
