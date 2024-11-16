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

export class CSSModuleParseError extends Error {
  code = 'CSS_MODULE_PARSE_ERROR';
  constructor(filename: string, cause: unknown) {
    super(`Failed to parse CSS Module file (${filename}).`, { cause });
  }
}
