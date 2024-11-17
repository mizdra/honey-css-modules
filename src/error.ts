import type { AtRule } from 'postcss';

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

export class AtValueInvalidError extends Error {
  code = 'AT_VALUE_INVALID';
  constructor(atValue: AtRule) {
    super(`\`${atValue.toString()}\` is invalid!`);
  }
}

export class ConfigValidationError extends Error {
  code = 'CONFIG_VALIDATION_ERROR';
}

export class CSSModuleParseError extends Error {
  code = 'CSS_MODULE_PARSE_ERROR';
  constructor(filename: string, cause: unknown) {
    super(`Failed to parse CSS Module file (${filename}).`, { cause });
  }
}

export class ScopeError extends Error {
  code = 'SCOPE_ERROR';
}
