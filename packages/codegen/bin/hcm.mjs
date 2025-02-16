#!/usr/bin/env node

import { readConfigFile, SystemError } from 'honey-css-modules-core';
import { createLogger, runHCM } from '../dist/index.js';

// TODO: Support `--help` option
// TODO: Support `--version` option
// TODO: Support `--project` option

const cwd = process.cwd();
const logger = createLogger(cwd);
try {
  const readResult = readConfigFile(cwd);
  await runHCM(readResult.config, logger);
} catch (e) {
  if (e instanceof SystemError) {
    logger.logSystemError(e);
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  }
  throw e;
}
