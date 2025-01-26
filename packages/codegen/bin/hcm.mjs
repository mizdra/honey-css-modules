#!/usr/bin/env node

import { readConfigFile, SystemError } from 'honey-css-modules-core';
import { createLogger, runHCM } from '../dist/index.js';

const cwd = process.cwd();
const logger = createLogger(cwd);
try {
  await runHCM(readConfigFile(cwd), cwd, logger);
} catch (e) {
  if (e instanceof SystemError) {
    logger.logSystemError(e);
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  }
  throw e;
}
