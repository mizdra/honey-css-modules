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
