import { access, readFile, symlink } from 'node:fs/promises';
import type { Diagnostic } from 'honey-css-modules-core';
import { describe, expect, test, vi } from 'vitest';
import type { Logger } from './logger/logger.js';
import { runHCM } from './runner.js';
import { createIFF } from './test/fixture.js';

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
  } satisfies Logger;
}

describe('runHCM', () => {
  test('generates .d.ts files', async () => {
    const iff = await createIFF({
      'src/a.module.css': '.a1 { color: red; }',
      'src/b.module.css': '.b1 { color: blue; }',
    });
    await runHCM({ pattern: 'src/**/*.module.css', dtsOutDir: 'generated' }, iff.rootDir, createLoggerSpy());
    expect(await readFile(iff.join('generated/src/a.module.css.d.ts'), 'utf-8')).toMatchInlineSnapshot(`
      "declare const styles = {
        a1: '' as readonly string,
      };
      export default styles;
      "
    `);
    expect(await readFile(iff.join('generated/src/b.module.css.d.ts'), 'utf-8')).toMatchInlineSnapshot(`
      "declare const styles = {
        b1: '' as readonly string,
      };
      export default styles;
      "
    `);
  });
  test('does not generate .d.ts files for files not matched by `pattern`', async () => {
    const iff = await createIFF({
      'src/a.module.css': '.a1 { color: red; }',
      'src/b.css': '.b1 { color: red; }',
    });
    await runHCM({ pattern: 'src/**/*.module.css', dtsOutDir: 'generated' }, iff.rootDir, createLoggerSpy());
    await expect(access(iff.join('generated/src/a.module.css.d.ts'))).resolves.not.toThrow();
    await expect(access(iff.join('generated/src/b.css.d.ts'))).rejects.toThrow();
  });
  test('does not generate types derived from files not matched by `pattern`', async () => {
    const iff = await createIFF({
      'src/a.module.css': '@import "./b.module.css"; @import "./c.css"',
      'src/b.module.css': '.b1 { color: blue; }',
      'src/c.css': '.c1 { color: red; }',
    });
    await runHCM({ pattern: 'src/**/*.module.css', dtsOutDir: 'generated' }, iff.rootDir, createLoggerSpy());
    expect(await readFile(iff.join('generated/src/a.module.css.d.ts'), 'utf-8')).toMatchInlineSnapshot(`
      "declare const styles = {
        ...(await import('./b.module.css')).default,
      };
      export default styles;
      "
    `);
  });
  test('support ./ in `pattern`', async () => {
    const iff = await createIFF({
      'src/a.module.css': `@import './b.css'; .a1 { color: red; }`,
      'src/b.css': '.b1 { color: red; }',
    });
    await runHCM({ pattern: './src/**/*.module.css', dtsOutDir: 'generated' }, iff.rootDir, createLoggerSpy());
    expect(await readFile(iff.join('generated/src/a.module.css.d.ts'), 'utf-8')).toMatchInlineSnapshot(`
      "declare const styles = {
        a1: '' as readonly string,
      };
      export default styles;
      "
    `);
    await expect(access(iff.join('generated/src/b.css.d.ts'))).rejects.toThrow();
  });
  test('reports diagnostics', async () => {
    const iff = await createIFF({
      'src/a.module.css': '.a1 {',
      'src/b.module.css': '@value;',
    });
    await symlink(iff.join('nonexistent.module.css'), iff.join('src/c.module.css'));
    const loggerSpy = createLoggerSpy();
    await expect(
      runHCM({ pattern: 'src/**/*.module.css', dtsOutDir: 'generated' }, iff.rootDir, loggerSpy),
    ).rejects.toThrow(ProcessExitError);
    expect(loggerSpy.logDiagnostics).toHaveBeenCalledTimes(1);
    expect(sortDiagnostics(loggerSpy.logDiagnostics.mock.calls[0]![0])).toStrictEqual(
      sortDiagnostics([
        {
          type: 'syntactic',
          category: 'error',
          filename: iff.paths['src/a.module.css'],
          start: {
            column: 1,
            line: 1,
          },
          text: 'Unclosed block',
        },
        {
          type: 'syntactic',
          category: 'error',
          filename: iff.paths['src/b.module.css'],
          start: {
            column: 1,
            line: 1,
          },
          end: {
            column: 8,
            line: 1,
          },
          text: '`@value` is a invalid syntax.',
        },
        {
          type: 'system',
          category: 'error',
          text: expect.stringContaining('Failed to read file'),
          cause: expect.any(Error),
        },
      ]),
    );
  });
});

function sortDiagnostics(diagnostics: Diagnostic[]) {
  return diagnostics.sort((a, b) => {
    const aFilename = 'filename' in a ? a.filename : '';
    const bFilename = 'filename' in b ? b.filename : '';
    const aLine = 'start' in a ? a.start?.line : 0;
    const bLine = 'start' in b ? b.start?.line : 0;
    const aColumn = 'start' in a ? a.start?.column : 0;
    const bColumn = 'start' in b ? b.start?.column : 0;
    return aFilename.localeCompare(bFilename) || aLine - bLine || aColumn - bColumn;
  });
}
