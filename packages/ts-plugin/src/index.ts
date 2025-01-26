import { createLanguageServicePlugin } from '@volar/typescript/lib/quickstart/createLanguageServicePlugin.js';
import { createIsExternalFile, createResolver, readConfigFile, resolveConfig } from 'honey-css-modules-core';
import { createCSSModuleLanguagePlugin } from './language-plugin.js';
import { proxyLanguageService } from './language-service.js';

const plugin = createLanguageServicePlugin((ts, info) => {
  if (info.project.projectKind !== ts.server.ProjectKind.Configured) {
    info.project.projectService.logger.info(`[ts-honey-css-modules-plugin] tsconfig.json not found`);
    return { languagePlugins: [] };
  }
  const cwd = info.project.getCurrentDirectory();

  const readConfigResult = readConfigFile(cwd);
  if ('diagnostic' in readConfigResult) {
    // TODO: Log the diagnostic.
    return { languagePlugins: [] };
  }
  info.project.projectService.logger.info(
    `[ts-honey-css-modules-plugin] Loaded config: ${JSON.stringify(readConfigResult.config)}`,
  );

  const resolvedConfig = resolveConfig(readConfigResult.config, cwd);
  const resolver = createResolver(resolvedConfig.paths, resolvedConfig.cwd);
  const isExternalFile = createIsExternalFile(resolvedConfig);

  return {
    languagePlugins: [createCSSModuleLanguagePlugin(resolvedConfig, resolver, isExternalFile)],
    setup: (language) => {
      info.languageService = proxyLanguageService(language, info.languageService);
    },
  };
});

export = plugin;
