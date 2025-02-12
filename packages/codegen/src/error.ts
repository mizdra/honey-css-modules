import { SystemError } from 'honey-css-modules-core';

export class WriteDtsFileError extends SystemError {
  constructor(fileName: string, cause: unknown) {
    super('WRITE_DTS_FILE_ERROR', `Failed to write .d.ts file ${fileName}.`, { cause });
  }
}

export class ReadCSSModuleFileError extends SystemError {
  constructor(fileName: string, cause: unknown) {
    super('READ_CSS_MODULE_FILE_ERROR', `Failed to read CSS Module file ${fileName}.`, { cause });
  }
}

export class GlobError extends SystemError {
  constructor(pattern: string, cause: unknown) {
    super('GLOB_ERROR', `Failed to retrieve files by glob pattern ${pattern}.`, { cause });
  }
}
