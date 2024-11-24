#!/usr/bin/env node
// @ts-check

import { readConfigFile, runHCM } from '../dist/index.js';

// TODO: Improve error handling
await runHCM(await readConfigFile(process.cwd()));
