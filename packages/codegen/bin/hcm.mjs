#!/usr/bin/env node

import { readConfigFile } from 'honey-css-modules-core';
import { createLogger, runHCM } from '../dist/index.js';

const cwd = process.cwd();
const logger = createLogger(cwd);
const readConfigResult = readConfigFile(cwd);
if ('diagnostic' in readConfigResult) {
  logger.logDiagnostics([readConfigResult.diagnostic]);
  // eslint-disable-next-line n/no-process-exit
  process.exit(1);
}

// TODO: Improve error handling
await runHCM(readConfigResult.config, cwd, logger);
