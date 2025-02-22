import dedent from 'dedent';
import { describe, expect, test } from 'vitest';
import { assertHCMOptions, findTsConfigFile, readTsConfigFile, resolveConfig } from './config.js';
import { TsConfigFileNotFoundError } from './error.js';
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
          "include": ["src"],
          "exclude": ["src/test"],
          "hcmOptions": {
            "dtsOutDir": "generated/hcm"
          }
        }
      `,
    });
    expect(readTsConfigFile(iff.rootDir)).toStrictEqual({
      configFileName: iff.paths['tsconfig.json'],
      tsConfig: {
        includes: ['src'],
        excludes: ['src/test'],
        dtsOutDir: 'generated/hcm',
      },
    });
  });
  test('returns a config object if config file has syntax errors', async () => {
    const iff = await createIFF({
      'tsconfig.json': dedent`
        {
          "include": ["src"]
          //                ^ error: ',' is missing
          "hcmOptions": {
            "dtsOutDir": "generated/hcm"
            //                          ^ error: ',' is missing
            "arbitraryExtensions": true
          }
        }
      `,
    });
    expect(readTsConfigFile(iff.rootDir)).toStrictEqual({
      configFileName: iff.paths['tsconfig.json'],
      tsConfig: {
        includes: ['src'],
        dtsOutDir: 'generated/hcm',
        arbitraryExtensions: true,
      },
    });
  });
  test('throws error if no config file is found', async () => {
    const iff = await createIFF({});
    expect(() => readTsConfigFile(iff.rootDir)).toThrow(TsConfigFileNotFoundError);
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
  expect(() => assertHCMOptions({})).toThrowErrorMatchingInlineSnapshot(`[Error: \`dtsOutDir\` is required.]`);
  expect(() => assertHCMOptions({ dtsOutDir: 1 })).toThrowErrorMatchingInlineSnapshot(
    `[Error: \`dtsOutDir\` must be a string.]`,
  );
  expect(() => assertHCMOptions({ dtsOutDir: 'str' })).not.toThrow();
  expect(() => assertHCMOptions({ dtsOutDir: 'str', arbitraryExtensions: 1 })).toThrowErrorMatchingInlineSnapshot(
    `[Error: \`arbitraryExtensions\` must be a boolean.]`,
  );
  expect(() => assertHCMOptions({ dtsOutDir: 'str', arbitraryExtensions: true })).not.toThrow();
  expect(() => assertHCMOptions({ dtsOutDir: 'str', dashedIdents: 1 })).toThrowErrorMatchingInlineSnapshot(
    `[Error: \`dashedIdents\` must be a boolean.]`,
  );
  expect(() => assertHCMOptions({ dtsOutDir: 'str', dashedIdents: true })).not.toThrow();
});

describe('resolveConfig', () => {
  test('resolves options', () => {
    expect(
      resolveConfig(
        {
          includes: ['src'],
          excludes: ['src/test'],
          dtsOutDir: 'generated',
        },
        '/app',
      ),
    ).toMatchInlineSnapshot(`
      {
        "arbitraryExtensions": false,
        "dashedIdents": false,
        "dtsOutDir": "/app/generated",
        "excludes": [
          "/app/src/test",
        ],
        "includes": [
          "/app/src",
        ],
        "paths": {},
        "rootDir": "/app",
      }
    `);
  });
  test('resolves paths', () => {
    expect(
      resolveConfig(
        {
          paths: { '@/*': ['./*'] },
          dtsOutDir: 'generated',
        },
        '/app',
      ),
    ).toMatchInlineSnapshot(`
      {
        "arbitraryExtensions": false,
        "dashedIdents": false,
        "dtsOutDir": "/app/generated",
        "excludes": [],
        "includes": [
          "/app/**/*",
        ],
        "paths": {
          "@/*": [
            "/app/*",
          ],
        },
        "rootDir": "/app",
      }
    `);
  });
});
