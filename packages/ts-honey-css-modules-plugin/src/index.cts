/* eslint-disable @typescript-eslint/no-require-imports */
import quickstartModule = require('@volar/typescript/lib/quickstart/createAsyncLanguageServicePlugin.js');
import ts = require('typescript/lib/tsserverlibrary');

const init = quickstartModule.createAsyncLanguageServicePlugin(['.css'], ts.ScriptKind.TS, async (ts, info) => {
  const create = (await import('./index.js')).default;
  return create(ts, info);
});

export = init;
