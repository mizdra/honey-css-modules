import { createLanguageServicePlugin } from '@volar/typescript/lib/quickstart/createLanguageServicePlugin.js';
import type { ResolvedHCMConfig } from 'honey-css-modules-core';
import { createIsProjectFile, createResolver, readConfigFile } from 'honey-css-modules-core';
import { ConfigNotFoundError } from 'honey-css-modules-core';
import { createCSSModuleLanguagePlugin } from './language-plugin.js';
import { proxyLanguageService } from './language-service/proxy.js';

const plugin = createLanguageServicePlugin((ts, info) => {
  if (info.project.projectKind !== ts.server.ProjectKind.Configured) {
    info.project.projectService.logger.info(`[ts-honey-css-modules-plugin] tsconfig.json not found`);
    return { languagePlugins: [] };
  }
  const cwd = info.project.getCurrentDirectory();

  let config: ResolvedHCMConfig;
  try {
    config = readConfigFile(cwd);
    info.project.projectService.logger.info(`[ts-honey-css-modules-plugin] Loaded config: ${JSON.stringify(config)}`);
  } catch (error) {
    // If the config file is not found, disable the plugin.
    // TODO: Improve error handling
    if (error instanceof ConfigNotFoundError) {
      return { languagePlugins: [] };
    }
    throw error;
  }

  const resolver = createResolver(config.alias);
  const isProjectFile = createIsProjectFile(config);

  return {
    languagePlugins: [createCSSModuleLanguagePlugin(config, resolver, isProjectFile)],
    setup: (language) => {
      info.languageService = proxyLanguageService(language, info.languageService, info.project);
    },
  };
});

export = plugin;
