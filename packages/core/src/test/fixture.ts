import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
// @ts-expect-error -- `require(esm)` is not supported by tsc, so ignore the error
import { defineIFFCreator } from '@mizdra/inline-fixture-files';
import { join } from '../path.js';

const fixtureDir = join(tmpdir(), 'css-modules-kit', process.env['VITEST_POOL_ID']!);
export const createIFF = defineIFFCreator({
  generateRootDir: () => join(fixtureDir, randomUUID()),
  unixStylePath: true,
});
