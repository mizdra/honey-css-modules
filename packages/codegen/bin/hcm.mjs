#!/usr/bin/env node
// @ts-check

import { readConfigFile, runHCM } from '../dist/index.js';

const cwd = process.cwd();
// TODO: Improve error handling
await runHCM(readConfigFile(cwd), cwd);
