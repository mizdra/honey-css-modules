import dedent from 'dedent';
import { describe, expect, test } from 'vitest';
import { assertConfig, findConfigFile, readRawConfigFile, resolveConfig } from './config.js';
import { TsConfigFileError, TsConfigFileNotFoundError } from './error.js';
import { createIFF } from './test/fixture.js';

test('findConfigFile', async () => {
  const iff = await createIFF({
    'tsconfig.json': '{}',
    'tsconfig.src.json': '{}',
    'sub/tsconfig.json': '{}',
  });
  expect(findConfigFile(iff.rootDir)).toEqual(iff.paths['tsconfig.json']);
  expect(findConfigFile(iff.paths['tsconfig.src.json'])).toEqual(iff.paths['tsconfig.src.json']);
  expect(findConfigFile(iff.paths['sub'])).toEqual(iff.paths['sub/tsconfig.json']);
});

describe('readRawConfigFile', () => {
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
    expect(readRawConfigFile(iff.rootDir)).toEqual({
      configFileName: iff.paths['tsconfig.json'],
      rawConfig: { pattern: 'src/**/*.module.css', dtsOutDir: 'generated/hcm' },
    });
  });
  test('throws error if no config file is found', async () => {
    const iff = await createIFF({});
    expect(() => readRawConfigFile(iff.rootDir)).toThrow(TsConfigFileNotFoundError);
  });
  test('throws error if config file has syntax errors', async () => {
    const iff = await createIFF({
      'tsconfig.json': '}',
    });
    expect(() => readRawConfigFile(iff.rootDir)).toThrow(TsConfigFileError);
  });
  test('throws error if config file does not have "hcmOptions"', async () => {
    const iff = await createIFF({
      'tsconfig.json': '{}',
    });
    expect(() => readRawConfigFile(iff.rootDir)).toThrowErrorMatchingInlineSnapshot(
      `[Error: tsconfig.json must have \`hcmOptions\`.]`,
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
  expect(() => assertConfig({ pattern: 'str', dtsOutDir: 'str', paths: 1 })).toThrowErrorMatchingInlineSnapshot(
    `[Error: \`paths\` must be an object.]`,
  );
  expect(() => assertConfig({ pattern: 'str', dtsOutDir: 'str', paths: {} })).not.toThrow();
  expect(() =>
    assertConfig({ pattern: 'str', dtsOutDir: 'str', paths: { '@/*': 1 } }),
  ).toThrowErrorMatchingInlineSnapshot(`[Error: \`paths["@/*"]\` must be an array.]`);
  expect(() =>
    assertConfig({ pattern: 'str', dtsOutDir: 'str', paths: { '@/*': [1] } }),
  ).toThrowErrorMatchingInlineSnapshot(`[Error: \`paths["@/*"][0]\` must be a string.]`);
  expect(() => assertConfig({ pattern: 'str', dtsOutDir: 'str', paths: { '@/*': ['./*'] } })).not.toThrow();
  expect(() =>
    assertConfig({ pattern: 'str', dtsOutDir: 'str', arbitraryExtensions: 1 }),
  ).toThrowErrorMatchingInlineSnapshot(`[Error: \`arbitraryExtensions\` must be a boolean.]`);
  expect(() => assertConfig({ pattern: 'str', dtsOutDir: 'str', arbitraryExtensions: true })).not.toThrow();
  expect(() => assertConfig({ pattern: 'str', dtsOutDir: 'str', dashedIdents: 1 })).toThrowErrorMatchingInlineSnapshot(
    `[Error: \`dashedIdents\` must be a boolean.]`,
  );
  expect(() => assertConfig({ pattern: 'str', dtsOutDir: 'str', dashedIdents: true })).not.toThrow();
});

describe('resolveConfig', () => {
  test('resolves options', () => {
    expect(
      resolveConfig(
        {
          pattern: 'src/**/*.module.css',
          dtsOutDir: 'generated',
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
          pattern: 'src/**/*.module.css',
          dtsOutDir: 'generated',
          paths: { '@/*': ['./*'] },
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
