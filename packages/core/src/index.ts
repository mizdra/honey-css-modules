export type { HCMConfig } from './config.js';
export { readConfigFile } from './config.js';
export { TsConfigFileNotFoundError, SystemError } from './error.js';
export {
  parseCSSModule,
  type ParseCSSModuleOptions,
  type CSSModule,
  type Token,
  type AtImportTokenImporter,
  type TokenImporter,
  type AtValueTokenImporter,
  type AtValueTokenImporterValue,
  type ParseCSSModuleResult,
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
  CSS_MODULE_EXTENSION,
  getCssModuleFileName,
  isComponentFileName,
  isCSSModuleFile,
  findComponentFile,
  type MatchesPattern,
  createMatchesPattern,
  getFileNamesByPattern,
} from './file.js';
export { checkCSSModule } from './checker.js';
export { type ExportBuilder, createExportBuilder } from './export-builder.js';
export {
  toNormalizedPath,
  join,
  resolve,
  relative,
  dirname,
  basename,
  parse,
  matchesGlob,
  isAbsolute,
} from './path.js';
export { createCSSModuleLanguagePlugin, isCSSModuleScript, HCM_DATA_KEY } from './language-plugin.js';
