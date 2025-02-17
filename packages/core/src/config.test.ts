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
      'src/a.module.css': '',
      'tsconfig.json': dedent`
        {
          "hcmOptions": {
            "dtsOutDir": "generated/hcm"
          }
        }
      `,
      'package.json': '{ "type": "module" }',
    });
    expect(readTsConfigFile(iff.rootDir)).toEqual({
      configFileName: iff.paths['tsconfig.json'],
      tsConfig: { fileNames: [iff.paths['src/a.module.css']], options: {}, hcmOptions: { dtsOutDir: 'generated/hcm' } },
    });
  });
  describe('file matcher', () => {
    test('contains files that matched by include options', async () => {
      const iff = await createIFF({
        'src/a.module.css': '',
        'b.module.css': '',
        'tsconfig.json': dedent`
          {
            "include": ["src"],
            "hcmOptions": {
              "dtsOutDir": "generated/hcm"
            }
          }
        `,
      });
      expect(readTsConfigFile(iff.rootDir).tsConfig.fileNames).toEqual([iff.paths['src/a.module.css']]);
    });
    test('contains files that matched by files options', async () => {
      const iff = await createIFF({
        'src/a.module.css': '',
        'b.module.css': '',
        'tsconfig.json': dedent`
          {
            "include": ["src"],
            "files": ["b.module.css"],
            "hcmOptions": {
              "dtsOutDir": "generated/hcm"
            }
          }
        `,
      });
      expect(readTsConfigFile(iff.rootDir).tsConfig.fileNames.sort()).toEqual(
        [iff.paths['src/a.module.css'], iff.paths['b.module.css']].sort(),
      );
    });
    test('does not contain files that matched by exclude options', async () => {
      const iff = await createIFF({
        'src/test/a.module.css': '',
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
      expect(readTsConfigFile(iff.rootDir).tsConfig.fileNames).toEqual([]);
    });
    test('does not contain non css module files', async () => {
      const iff = await createIFF({
        'src/a.module.css': '',
        'src/a.css': '',
        'tsconfig.json': dedent`
          {
            "include": ["src"],
            "hcmOptions": {
              "dtsOutDir": "generated/hcm"
            }
          }
        `,
      });
      expect(readTsConfigFile(iff.rootDir).tsConfig.fileNames).toEqual([iff.paths['src/a.module.css']]);
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
          fileNames: [],
          options: {},
          hcmOptions: {
            dtsOutDir: 'generated',
          },
        },
        '/app',
      ),
    ).toStrictEqual({
      fileNames: [],
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
          fileNames: [],
          options: {
            paths: { '@/*': ['./*'] },
          },
          hcmOptions: {
            dtsOutDir: 'generated',
          },
        },
        '/app',
      ),
    ).toStrictEqual({
      fileNames: [],
      dtsOutDir: '/app/generated',
      arbitraryExtensions: false,
      paths: { '@/*': ['/app/*'] },
      dashedIdents: false,
      rootDir: '/app',
    });
  });
});
