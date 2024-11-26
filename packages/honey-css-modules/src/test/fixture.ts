import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineIFFCreator } from '@mizdra/inline-fixture-files';

const fixtureDir = join(tmpdir(), 'honey-css-modules', process.env['VITEST_POOL_ID']!);
export const createIFF = defineIFFCreator({ generateRootDir: () => join(fixtureDir, randomUUID()) });