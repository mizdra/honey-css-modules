import dedent from 'dedent';
import { describe, expect, test } from 'vitest';
import { assertHCMOptions, findTsConfigFile, readTsConfigFile, resolveConfig } from './config.js';
import { TsConfigFileError, TsConfigFileNotFoundError } from './error.js';
import { createIFF } from './test/fixture.js';

test('findTsConfigFile', async () => {
  const iff = await createIFF({
    'tsconfig.json': '{}',
    'tsconfig.src.json': '{}',
    'sub/tsconfig.json': '{}',
  });
  expect(findTsConfigFile(iff.rootDir)).toEqual(iff.paths['tsconfig.json']);
  expect(findTsConfigFile(iff.paths['tsconfig.src.json'])).toEqual(iff.paths['tsconfig.src.json']);
  expect(findTsConfigFile(iff.paths['sub'])).toEqual(iff.paths['sub/tsconfig.json']);
});

describe('readTsConfigFile', () => {
  test('returns a config object', async () => {
    const iff = await createIFF({
      'tsconfig.json': dedent`
        {
          "hcmOptions": {
            "pattern": "src/**/*.module.css",
            "dtsOutDir": "generated/hcm"
          }
        }
      `,
      'package.json': '{ "type": "module" }',
    });
    expect(readTsConfigFile(iff.rootDir)).toEqual({
      configFileName: iff.paths['tsconfig.json'],
      tsConfig: { options: {}, hcmOptions: { pattern: 'src/**/*.module.css', dtsOutDir: 'generated/hcm' } },
    });
  });
  test('throws error if no config file is found', async () => {
    const iff = await createIFF({});
    expect(() => readTsConfigFile(iff.rootDir)).toThrow(TsConfigFileNotFoundError);
  });
  test('throws error if config file has syntax errors', async () => {
    const iff = await createIFF({
      'tsconfig.json': '}',
    });
    expect(() => readTsConfigFile(iff.rootDir)).toThrow(TsConfigFileError);
  });
  test('throws error if config file does not have "hcmOptions"', async () => {
    const iff = await createIFF({
      'tsconfig.json': '{}',
    });
    expect(() => readTsConfigFile(iff.rootDir)).toThrowErrorMatchingInlineSnapshot(
      `[Error: tsconfig.json must have \`hcmOptions\`.]`,
    );
  });
});

test('assertHCMOptions', () => {
  expect(() => assertHCMOptions({})).toThrowErrorMatchingInlineSnapshot(`[Error: \`pattern\` is required.]`);
  expect(() => assertHCMOptions({ pattern: 1 })).toThrowErrorMatchingInlineSnapshot(
    `[Error: \`pattern\` must be a string.]`,
  );
  expect(() => assertHCMOptions({ pattern: 'str' })).toThrowErrorMatchingInlineSnapshot(
    `[Error: \`dtsOutDir\` is required.]`,
  );
  expect(() => assertHCMOptions({ pattern: 'str', dtsOutDir: 1 })).toThrowErrorMatchingInlineSnapshot(
    `[Error: \`dtsOutDir\` must be a string.]`,
  );
  expect(() => assertHCMOptions({ pattern: 'str', dtsOutDir: 'str' })).not.toThrow();
  expect(() =>
    assertHCMOptions({ pattern: 'str', dtsOutDir: 'str', arbitraryExtensions: 1 }),
  ).toThrowErrorMatchingInlineSnapshot(`[Error: \`arbitraryExtensions\` must be a boolean.]`);
  expect(() => assertHCMOptions({ pattern: 'str', dtsOutDir: 'str', arbitraryExtensions: true })).not.toThrow();
  expect(() =>
    assertHCMOptions({ pattern: 'str', dtsOutDir: 'str', dashedIdents: 1 }),
  ).toThrowErrorMatchingInlineSnapshot(`[Error: \`dashedIdents\` must be a boolean.]`);
  expect(() => assertHCMOptions({ pattern: 'str', dtsOutDir: 'str', dashedIdents: true })).not.toThrow();
});

describe('resolveConfig', () => {
  test('resolves options', () => {
    expect(
      resolveConfig(
        {
          options: {},
          hcmOptions: {
            pattern: 'src/**/*.module.css',
            dtsOutDir: 'generated',
          },
        },
        '/app',
      ),
    ).toStrictEqual({
      pattern: '/app/src/**/*.module.css',
      dtsOutDir: '/app/generated',
      arbitraryExtensions: false,
      paths: {},
      dashedIdents: false,
      rootDir: '/app',
    });
  });
  test('resolves paths', () => {
    expect(
      resolveConfig(
        {
          options: {
            paths: { '@/*': ['./*'] },
          },
          hcmOptions: {
            pattern: 'src/**/*.module.css',
            dtsOutDir: 'generated',
          },
        },
        '/app',
      ),
    ).toStrictEqual({
      pattern: '/app/src/**/*.module.css',
      dtsOutDir: '/app/generated',
      arbitraryExtensions: false,
      paths: { '@/*': ['/app/*'] },
      dashedIdents: false,
      rootDir: '/app',
    });
  });
});
