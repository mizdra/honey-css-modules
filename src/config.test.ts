import dedent from 'dedent';
import { describe, expect, it } from 'vitest';
import { readConfigFile } from './config.js';
import { ConfigImportError, ConfigNotFoundError } from './error.js';
import { createIFF } from './test/fixture.js';

describe('readConfigFile', () => {
  it('returns a config object', async () => {
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
  it('falls back to other file extensions', async () => {
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
  it('throws a ConfigNotFoundError if no config file is found', async () => {
    const iff = await createIFF({});
    await expect(readConfigFile(iff.rootDir)).rejects.toThrow(ConfigNotFoundError);
  });
  it('throws error if config file has syntax errors', async () => {
    const iff = await createIFF({
      'hcm.config.js': dedent`
        export SYNTAX_ERROR;
      `,
    });
    await expect(readConfigFile(iff.rootDir)).rejects.toThrow(ConfigImportError);
  });
});
