import { createLanguageServicePlugin } from '@volar/typescript/lib/quickstart/createLanguageServicePlugin.js';
import type { HCMConfig } from 'honey-css-modules';
import { createIsExternalFile, createResolver, readConfigFile, resolveConfig } from 'honey-css-modules';
import { ConfigNotFoundError } from 'honey-css-modules';
import { createCSSModuleLanguagePlugin } from './language-plugin.js';

const plugin = createLanguageServicePlugin((ts, info) => {
  if (info.project.projectKind !== ts.server.ProjectKind.Configured) {
    info.project.projectService.logger.info(`[ts-honey-css-modules-plugin] tsconfig.json not found`);
    return {
      languagePlugins: [],
    };
  }
  const cwd = info.project.getCurrentDirectory();

  let config: HCMConfig;
  try {
    config = readConfigFile(cwd);
    info.project.projectService.logger.info(`[ts-honey-css-modules-plugin] Loaded config: ${JSON.stringify(config)}`);
  } catch (error) {
    // If the config file is not found, disable the plugin.
    if (error instanceof ConfigNotFoundError) {
      return { languagePlugins: [] };
    }
    throw error;
  }

  // const { proxyLanguageService } = await import('./language-service.js');
  const resolvedConfig = resolveConfig(config, cwd);
  const resolver = createResolver(resolvedConfig.alias, resolvedConfig.cwd);
  const isExternalFile = createIsExternalFile(resolvedConfig);

  return {
    languagePlugins: [createCSSModuleLanguagePlugin(resolvedConfig, resolver, isExternalFile)],
    // TODO: Support language service for CSS modules
    // setup: (language) => {
    //   info.languageService = proxyLanguageService(ts, language, info.languageService);
    // },
  };
});

export = plugin;
