import dedent from 'dedent';
import { describe, expect, test } from 'vitest';
import { assertConfig, readConfigFile } from './config.js';
import { ConfigImportError, ConfigNotFoundError } from './error.js';
import { createIFF } from './test/fixture.js';

describe('readConfigFile', () => {
  test('returns a config object', async () => {
    const iff = await createIFF({
      'hcm.config.js': dedent`
        export default {
          pattern: 'src/**/*.module.css',
          dtsOutDir: 'generated/hcm',
        };
      `,
    });
    expect(await readConfigFile(iff.rootDir)).toEqual({
      pattern: 'src/**/*.module.css',
      dtsOutDir: 'generated/hcm',
    });
  });
  test('falls back to other file extensions', async () => {
    const iff = await createIFF({
      'hcm.config.cjs': dedent`
        module.exports = {
          pattern: 'src/**/*.module.css',
          dtsOutDir: 'generated/hcm',
        };
      `,
    });
    expect(await readConfigFile(iff.rootDir)).toEqual({
      pattern: 'src/**/*.module.css',
      dtsOutDir: 'generated/hcm',
    });
    await iff.addFixtures({
      'hcm.config.mjs': dedent`
        export default {
          pattern: 'src/**/*.module.css',
          dtsOutDir: 'generated/hcm',
        };
      `,
    });
    expect(await readConfigFile(iff.rootDir)).toEqual({
      pattern: 'src/**/*.module.css',
      dtsOutDir: 'generated/hcm',
    });
  });
  test('throws a ConfigNotFoundError if no config file is found', async () => {
    const iff = await createIFF({});
    await expect(readConfigFile(iff.rootDir)).rejects.toThrow(ConfigNotFoundError);
  });
  test('throws error if config file has syntax errors', async () => {
    const iff = await createIFF({
      'hcm.config.js': dedent`
        export SYNTAX_ERROR;
      `,
    });
    await expect(readConfigFile(iff.rootDir)).rejects.toThrow(ConfigImportError);
  });
  test('throws error if config file has no default export', async () => {
    const iff = await createIFF({
      'hcm.config.js': 'export const config = {};',
    });
    await expect(readConfigFile(iff.rootDir)).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Config must be a default export.]`,
    );
  });
});

test('assertConfig', () => {
  expect(() => assertConfig({})).toThrowErrorMatchingInlineSnapshot(`[Error: \`pattern\` is required.]`);
  expect(() => assertConfig({ pattern: 1 })).toThrowErrorMatchingInlineSnapshot(
    `[Error: \`pattern\` must be a string.]`,
  );
  expect(() => assertConfig({ pattern: 'str' })).toThrowErrorMatchingInlineSnapshot(
    `[Error: \`dtsOutDir\` is required.]`,
  );
  expect(() => assertConfig({ pattern: 'str', dtsOutDir: 1 })).toThrowErrorMatchingInlineSnapshot(
    `[Error: \`dtsOutDir\` must be a string.]`,
  );
  expect(() => assertConfig({ pattern: 'str', dtsOutDir: 'str' })).not.toThrow();
  expect(() => assertConfig({ pattern: 'str', dtsOutDir: 'str', resolver: {} })).toThrowErrorMatchingInlineSnapshot(
    `[Error: \`resolver\` must be a function.]`,
  );
  expect(() => assertConfig({ pattern: 'str', dtsOutDir: 'str', resolver: () => {} })).not.toThrow();
  expect(() => assertConfig({ pattern: 'str', dtsOutDir: 'str', alias: 1 })).toThrowErrorMatchingInlineSnapshot(
    `[Error: \`alias\` must be an object.]`,
  );
  expect(() => assertConfig({ pattern: 'str', dtsOutDir: 'str', alias: {} })).not.toThrow();
  expect(() =>
    assertConfig({ pattern: 'str', dtsOutDir: 'str', alias: { str: 1 } }),
  ).toThrowErrorMatchingInlineSnapshot(`[Error: \`alias.str\` must be a string.]`);
  expect(() => assertConfig({ pattern: 'str', dtsOutDir: 'str', alias: { str: 'str' } })).not.toThrow();
  expect(() =>
    assertConfig({ pattern: 'str', dtsOutDir: 'str', arbitraryExtensions: 1 }),
  ).toThrowErrorMatchingInlineSnapshot(`[Error: \`arbitraryExtensions\` must be a boolean.]`);
  expect(() => assertConfig({ pattern: 'str', dtsOutDir: 'str', arbitraryExtensions: true })).not.toThrow();
  expect(() => assertConfig({ pattern: 'str', dtsOutDir: 'str', dashedIdents: 1 })).toThrowErrorMatchingInlineSnapshot(
    `[Error: \`dashedIdents\` must be a boolean.]`,
  );
  expect(() => assertConfig({ pattern: 'str', dtsOutDir: 'str', dashedIdents: true })).not.toThrow();
  expect(() => assertConfig({ pattern: 'str', dtsOutDir: 'str', logLevel: 1 })).toThrowErrorMatchingInlineSnapshot(
    `[Error: \`logLevel\` must be one of \`debug\`, \`info\`, or \`silent\`.]`,
  );
  expect(() => assertConfig({ pattern: 'str', dtsOutDir: 'str', logLevel: 'debug' })).not.toThrow();
  expect(() => assertConfig({ pattern: 'str', dtsOutDir: 'str', cwd: 1 })).toThrowErrorMatchingInlineSnapshot(
    `[Error: \`cwd\` must be a string.]`,
  );
  expect(() => assertConfig({ pattern: 'str', dtsOutDir: 'str', cwd: 'str' })).not.toThrow();
});
