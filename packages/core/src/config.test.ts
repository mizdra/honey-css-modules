import dedent from 'dedent';
import { describe, expect, test } from 'vitest';
import { findTsConfigFile, normalizeConfig, readTsConfigFile } from './config.js';
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
      config: {
        includes: ['src'],
        excludes: ['src/test'],
        paths: undefined,
        dtsOutDir: 'generated/hcm',
        arbitraryExtensions: undefined,
      },
      diagnostics: [],
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
      config: {
        includes: ['src'],
        excludes: undefined,
        paths: undefined,
        dtsOutDir: 'generated/hcm',
        arbitraryExtensions: true,
      },
      diagnostics: [],
    });
  });
  test('returns a config object with diagnostics if config file has semantic errors', async () => {
    const iff = await createIFF({
      'tsconfig.json': dedent`
        {
          "include": ["src", 1],
          "exclude": ["src/test", 1],
          "compilerOptions": {
            "paths": {
              "@/*": ["./*", 1],
              "#/*": 1,
            }
          },
          "hcmOptions": {
            "dtsOutDir": 1,
            "arbitraryExtensions": 1
            //                     ^ error: "arbitraryExtensions" must be a boolean
          }
        }
      `,
      'package.json': '{ "type": "module" }',
    });
    // MEMO: The errors not derived from `hcmOptions` are not returned.
    expect(readTsConfigFile(iff.rootDir)).toStrictEqual({
      configFileName: iff.paths['tsconfig.json'],
      config: {
        includes: ['src'],
        excludes: ['src/test'],
        paths: { '@/*': ['./*'] },
        dtsOutDir: undefined,
        arbitraryExtensions: undefined,
      },
      diagnostics: [
        {
          type: 'semantic',
          category: 'error',
          text: '`dtsOutDir` must be a string.',
          fileName: iff.paths['tsconfig.json'],
        },
        {
          type: 'semantic',
          category: 'error',
          text: '`arbitraryExtensions` must be a boolean.',
          fileName: iff.paths['tsconfig.json'],
        },
      ],
    });
  });
  test('throws error if no config file is found', async () => {
    const iff = await createIFF({});
    expect(() => readTsConfigFile(iff.rootDir)).toThrow(TsConfigFileNotFoundError);
  });
});

describe('normalizeConfig', () => {
  const defaultConfig = {
    includes: undefined,
    excludes: undefined,
    paths: undefined,
    dtsOutDir: undefined,
    arbitraryExtensions: undefined,
  };
  test('resolves options', () => {
    expect(
      normalizeConfig(
        {
          ...defaultConfig,
          includes: ['src'],
          excludes: ['src/test'],
          dtsOutDir: 'generated',
        },
        '/app',
      ),
    ).toMatchInlineSnapshot(`
      {
        "arbitraryExtensions": false,
        "basePath": "/app",
        "dashedIdents": false,
        "dtsOutDir": "/app/generated",
        "excludes": [
          "/app/src/test",
        ],
        "includes": [
          "/app/src",
        ],
        "paths": {},
      }
    `);
  });
  test('resolves paths', () => {
    expect(
      normalizeConfig(
        {
          ...defaultConfig,
          paths: { '@/*': ['./*'] },
          dtsOutDir: 'generated',
        },
        '/app',
      ),
    ).toMatchInlineSnapshot(`
      {
        "arbitraryExtensions": false,
        "basePath": "/app",
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
      }
    `);
  });
});
