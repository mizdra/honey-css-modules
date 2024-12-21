/* eslint-disable @typescript-eslint/no-require-imports */
import quickstartModule = require('@volar/typescript/lib/quickstart/createAsyncLanguageServicePlugin.js');
import path = require('path');
import ts = require('typescript/lib/tsserverlibrary');

const init = quickstartModule.createAsyncLanguageServicePlugin(['.css'], ts.ScriptKind.TS, async (ts, info) => {
  if (info.project.projectKind !== ts.server.ProjectKind.Configured) {
    info.project.projectService.logger.info(`[ts-honey-css-modules-plugin] tsconfig.json not found`);
    return {
      languagePlugins: [],
    };
  }
  const cwd = info.project.getCurrentDirectory();
  const { readConfigFile, createResolver, resolveConfig } = await import('honey-css-modules');
  const { createCSSModuleLanguagePlugin } = await import('./language-plugin.js');

  // prettier-ignore
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  let config: import('honey-css-modules', { with: { "resolution-mode": "import" }}).HCMConfig;
  try {
    config = await readConfigFile(cwd);
    info.project.projectService.logger.info(`[ts-honey-css-modules-plugin] Loaded config: ${JSON.stringify(config)}`);
  } catch (_error) {
    info.project.projectService.logger.info(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      `[ts-honey-css-modules-plugin] Config file not found: ${(_error as any).message}`,
    );
    // TODO: Error handling
    return {
      languagePlugins: [],
    };
  }

  // const { proxyLanguageService } = await import('./language-service.js');
  const resolvedConfig = resolveConfig(config);
  const resolver = createResolver(resolvedConfig.alias, resolvedConfig.cwd);
  const isExternalFile = (filename: string) =>
    !path.matchesGlob(
      filename,
      path.join(cwd, resolvedConfig.pattern), // `pattern` is 'src/**/*.module.css', so convert it to '/project/src/**/*.module.css'
    );

  return {
    languagePlugins: [createCSSModuleLanguagePlugin(resolvedConfig, resolver, isExternalFile)],
    // TODO: Support language service for CSS modules
    // setup: (language) => {
    //   info.languageService = proxyLanguageService(ts, language, info.languageService);
    // },
  };
});

export = init;
