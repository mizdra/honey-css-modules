import { access, chmod } from 'node:fs/promises';
import dedent from 'dedent';
import { type Diagnostic } from 'honey-css-modules-core';
import { describe, expect, test, vi } from 'vitest';
import { ReadCSSModuleFileError } from './error.js';
import type { Logger } from './logger/logger.js';
import { runHCM } from './runner.js';
import { createIFF } from './test/fixture.js';

function formatDiagnostic(diagnostic: Diagnostic, rootDir: string) {
  return {
    ...diagnostic,
    text: diagnostic.text.replace(rootDir, '<rootDir>'),
    ...(diagnostic.fileName ? { fileName: diagnostic.fileName.replace(rootDir, '<rootDir>') } : {}),
  };
}
function formatDiagnostics(diagnostics: Diagnostic[], rootDir: string) {
  return diagnostics.map((diagnostic) => formatDiagnostic(diagnostic, rootDir));
}

class ProcessExitError extends Error {
  exitCode: string | number | null | undefined;
  constructor(exitCode: string | number | null | undefined) {
    super();
    this.exitCode = exitCode;
  }
}

vi.spyOn(process, 'exit').mockImplementation((code) => {
  throw new ProcessExitError(code);
});

function createLoggerSpy() {
  return {
    logDiagnostics: vi.fn(),
    logSystemError: vi.fn(),
  } satisfies Logger;
}

describe('runHCM', () => {
  test('generates .d.ts files', async () => {
    const iff = await createIFF({
      'tsconfig.json': dedent`
        {
          "hcmOptions": { "dtsOutDir": "generated" }
        }
      `,
      'src/a.module.css': '.a1 { color: red; }',
      'src/b.module.css': '.b1 { color: blue; }',
    });
    await runHCM(iff.rootDir, createLoggerSpy());
    expect(await iff.readFile('generated/src/a.module.css.d.ts')).toMatchInlineSnapshot(`
      "declare const styles = {
        a1: '' as readonly string,
      };
      export default styles;
      "
    `);
    expect(await iff.readFile('generated/src/b.module.css.d.ts')).toMatchInlineSnapshot(`
      "declare const styles = {
        b1: '' as readonly string,
      };
      export default styles;
      "
    `);
  });
  test('does not generate .d.ts files for files not matched by `pattern`', async () => {
    const iff = await createIFF({
      'tsconfig.json': dedent`
        {
          "hcmOptions": { "dtsOutDir": "generated" }
        }
      `,
      'src/a.module.css': '.a1 { color: red; }',
      'src/b.css': '.b1 { color: red; }',
    });
    await runHCM(iff.rootDir, createLoggerSpy());
    await expect(access(iff.join('generated/src/a.module.css.d.ts'))).resolves.not.toThrow();
    await expect(access(iff.join('generated/src/b.css.d.ts'))).rejects.toThrow();
  });
  test('does not generate types derived from files not matched by `pattern`', async () => {
    const iff = await createIFF({
      'tsconfig.json': dedent`
        {
          "hcmOptions": { "dtsOutDir": "generated" }
        }
      `,
      'src/a.module.css': '@import "./b.module.css"; @import "./c.css"',
      'src/b.module.css': '.b1 { color: blue; }',
      'src/c.css': '.c1 { color: red; }',
    });
    await runHCM(iff.rootDir, createLoggerSpy());
    expect(await iff.readFile('generated/src/a.module.css.d.ts')).toMatchInlineSnapshot(`
      "declare const styles = {
        ...(await import('./b.module.css')).default,
      };
      export default styles;
      "
    `);
  });
  test('warns when no files found by `pattern`', async () => {
    const iff = await createIFF({
      'tsconfig.json': dedent`
        {
          "hcmOptions": { "dtsOutDir": "generated" }
        }
      `,
    });
    const loggerSpy = createLoggerSpy();
    await runHCM(iff.rootDir, loggerSpy);
    expect(loggerSpy.logDiagnostics).toHaveBeenCalledTimes(1);
    expect(formatDiagnostics(loggerSpy.logDiagnostics.mock.calls[0]![1], iff.rootDir)).toMatchInlineSnapshot(`
      [
        {
          "category": "warning",
          "text": "The file specified in tsconfig.json not found.",
          "type": "semantic",
        },
      ]
    `);
  });
  test.runIf(process.platform !== 'win32')('throws error when failed to read CSS Module file', async () => {
    const iff = await createIFF({
      'tsconfig.json': dedent`
        {
          "hcmOptions": { "dtsOutDir": "generated" }
        }
      `,
      'src/a.module.css': '.a1 { color: red; }',
    });
    await chmod(iff.paths['src/a.module.css'], 0o200); // Remove read permission
    await expect(runHCM(iff.rootDir, createLoggerSpy())).rejects.toThrow(ReadCSSModuleFileError);
  });
  test('support ./ in `pattern`', async () => {
    const iff = await createIFF({
      'tsconfig.json': dedent`
        {
          "hcmOptions": { "dtsOutDir": "generated" }
        }
      `,
      'src/a.module.css': `@import './b.css'; .a1 { color: red; }`,
      'src/b.css': '.b1 { color: red; }',
    });
    await runHCM(iff.rootDir, createLoggerSpy());
    expect(await iff.readFile('generated/src/a.module.css.d.ts')).toMatchInlineSnapshot(`
      "declare const styles = {
        a1: '' as readonly string,
      };
      export default styles;
      "
    `);
    await expect(access(iff.join('generated/src/b.css.d.ts'))).rejects.toThrow();
  });
  test('reports semantic diagnostics in tsconfig.json', async () => {
    const iff = await createIFF({
      'tsconfig.json': dedent`
        {
          "hcmOptions": { "dtsOutDir": 1 }
        }
      `,
    });
    const loggerSpy = createLoggerSpy();
    await expect(runHCM(iff.rootDir, loggerSpy)).rejects.toThrow(ProcessExitError);
    expect(loggerSpy.logDiagnostics).toHaveBeenCalledTimes(1);
    expect(formatDiagnostics(loggerSpy.logDiagnostics.mock.calls[0]![1], iff.rootDir)).toMatchInlineSnapshot(`
      [
        {
          "category": "error",
          "fileName": "<rootDir>/tsconfig.json",
          "text": "\`dtsOutDir\` must be a string.",
          "type": "semantic",
        },
      ]
    `);
  });
  test('reports syntactic diagnostics in *.module.css', async () => {
    const iff = await createIFF({
      'tsconfig.json': dedent`
        {
          "hcmOptions": { "dtsOutDir": "generated" }
        }
      `,
      'src/a.module.css': '.a1 {',
      'src/b.module.css': '@value;',
    });
    const loggerSpy = createLoggerSpy();
    await expect(runHCM(iff.rootDir, loggerSpy)).rejects.toThrow(ProcessExitError);
    expect(loggerSpy.logDiagnostics).toHaveBeenCalledTimes(2);
    expect(formatDiagnostics(loggerSpy.logDiagnostics.mock.calls[0]![1], iff.rootDir)).toMatchInlineSnapshot(`
      [
        {
          "category": "error",
          "fileName": "<rootDir>/src/a.module.css",
          "start": 0,
          "text": "Unclosed block",
          "type": "syntactic",
        },
      ]
    `);
    expect(formatDiagnostics(loggerSpy.logDiagnostics.mock.calls[1]![1], iff.rootDir)).toMatchInlineSnapshot(`
      [
        {
          "category": "error",
          "end": 8,
          "fileName": "<rootDir>/src/b.module.css",
          "start": 0,
          "text": "\`@value\` is a invalid syntax.",
          "type": "syntactic",
        },
      ]
    `);
  });
  test('reports semantic diagnostics in *.module.css', async () => {
    const iff = await createIFF({
      'tsconfig.json': dedent`
        {
          "hcmOptions": { "dtsOutDir": "generated" }
        }
      `,
      'src/a.module.css': dedent`
        @value b_1, b_2 from "./b.module.css";
      `,
      'src/b.module.css': dedent`
        @value b_1: red;
        @import "./c.module.css";
      `,
    });
    const loggerSpy = createLoggerSpy();
    await expect(runHCM(iff.rootDir, loggerSpy)).rejects.toThrow(ProcessExitError);
    expect(loggerSpy.logDiagnostics).toHaveBeenCalledTimes(2);
    expect(formatDiagnostics(loggerSpy.logDiagnostics.mock.calls[0]![1], iff.rootDir)).toMatchInlineSnapshot(`
      [
        {
          "category": "error",
          "end": 15,
          "fileName": "<rootDir>/src/a.module.css",
          "start": 12,
          "text": "Module './b.module.css' has no exported token 'b_2'.",
          "type": "semantic",
        },
      ]
    `);
    expect(formatDiagnostics(loggerSpy.logDiagnostics.mock.calls[1]![1], iff.rootDir)).toMatchInlineSnapshot(`
      [
        {
          "category": "error",
          "end": 40,
          "fileName": "<rootDir>/src/b.module.css",
          "start": 26,
          "text": "Cannot import module './c.module.css'",
          "type": "semantic",
        },
      ]
    `);
  });
});
