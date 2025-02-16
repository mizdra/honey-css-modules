import { createLanguageServicePlugin } from '@volar/typescript/lib/quickstart/createLanguageServicePlugin.js';
import type { ResolvedHCMConfig } from 'honey-css-modules-core';
import { createMatchesPattern, createResolver, readConfigFile } from 'honey-css-modules-core';
import { ConfigNotFoundError } from 'honey-css-modules-core';
import { createCSSModuleLanguagePlugin } from './language-plugin.js';
import { proxyLanguageService } from './language-service/proxy.js';

const plugin = createLanguageServicePlugin((ts, info) => {
  if (info.project.projectKind !== ts.server.ProjectKind.Configured) {
    info.project.projectService.logger.info(`[ts-honey-css-modules-plugin] info: Project is not configured`);
    return { languagePlugins: [] };
  }
  const cwd = info.project.getCurrentDirectory();

  let config: ResolvedHCMConfig;
  try {
    config = readConfigFile(cwd);
    // TODO: Print the config file path
    info.project.projectService.logger.info(
      `[ts-honey-css-modules-plugin] info: Config file is found in '${config.rootDir}'`,
    );
  } catch (error) {
    // If the config file is not found, disable the plugin.
    if (error instanceof ConfigNotFoundError) {
      return { languagePlugins: [] };
    } else {
      let msg = `[ts-honey-css-modules-plugin] error: Fail to read config file`;
      if (error instanceof Error) {
        msg += `\n: ${error.message}`;
        msg += `\n${error.stack}`;
      }
      info.project.projectService.logger.info(msg);
      return { languagePlugins: [] };
    }
  }

  const resolver = createResolver(config.paths);
  const matchesPattern = createMatchesPattern(config);

  return {
    languagePlugins: [createCSSModuleLanguagePlugin(config, resolver, matchesPattern)],
    setup: (language) => {
      info.languageService = proxyLanguageService(
        language,
        info.languageService,
        info.project,
        resolver,
        matchesPattern,
      );
    },
  };
});

export = plugin;
