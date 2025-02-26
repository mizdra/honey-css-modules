#!/usr/bin/env node

import { SystemError } from '@css-modules-kit/core';
import { createLogger, parseCLIArgs, runCMK } from '../dist/index.js';

const cwd = process.cwd();
const logger = createLogger(cwd);
const args = parseCLIArgs(process.argv.slice(2), cwd, logger);

try {
  await runCMK(args.project, logger);
} catch (e) {
  if (e instanceof SystemError) {
    logger.logSystemError(e);
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  }
  throw e;
}
