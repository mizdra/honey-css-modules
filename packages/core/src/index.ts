export { defineConfig, type HCMConfig, readConfigFile, type ResolvedHCMConfig } from './config.js';
export { ConfigNotFoundError, ConfigImportError, ConfigValidationError, SystemError } from './error.js';
export {
  parseCSSModule,
  type ParseCSSModuleOptions,
  type CSSModule,
  type Token,
  type AtImportTokenImporter,
  type TokenImporter,
  type AtValueTokenImporter,
  type AtValueTokenImporterValue,
} from './parser/css-module-parser.js';
export { type Location, type Position } from './parser/location.js';
export { parseRule } from './parser/rule-parser.js';
export {
  type Diagnostic,
  type SemanticDiagnostic,
  type SyntacticDiagnostic,
  type DiagnosticCategory,
  type DiagnosticPosition,
} from './diagnostic.js';
export { type CreateDtsOptions, createDts, STYLES_EXPORT_NAME } from './dts-creator.js';
export { createResolver, type Resolver } from './resolver.js';
export {
  getCssModuleFileName,
  isComponentFileName,
  isCSSModuleFile,
  findComponentFile,
  type MatchesPattern,
  createMatchesPattern,
} from './file.js';
