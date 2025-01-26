import { SystemError } from 'honey-css-modules-core';

export class WriteDtsFileError extends SystemError {
  constructor(filename: string, cause: unknown) {
    super('WRITE_DTS_FILE_ERROR', `Failed to write .d.ts file ${filename}.`, { cause });
  }
}

export class ReadCSSModuleFileError extends SystemError {
  constructor(filename: string, cause: unknown) {
    super('READ_CSS_MODULE_FILE_ERROR', `Failed to read CSS Module file ${filename}.`, { cause });
  }
}
