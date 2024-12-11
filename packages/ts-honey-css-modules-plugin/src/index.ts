import path from 'node:path';
import { createLanguageServicePlugin } from '@volar/typescript/lib/quickstart/createLanguageServicePlugin.js';
import { createResolver, readConfigFile, resolveConfig } from 'honey-css-modules';
import { createCSSModuleLanguagePlugin } from './language-plugin.js';

const init = createLanguageServicePlugin((ts, info) => {
  if (info.project.projectKind !== ts.server.ProjectKind.Configured) {
    info.project.projectService.logger.info(`[ts-honey-css-modules-plugin] tsconfig.json not found`);
    return {
      languagePlugins: [],
    };
  }
  // const { proxyLanguageService } = await import('./language-service.js');
  const resolvedConfig = resolveConfig(info.config);
  const resolver = createResolver(resolvedConfig.alias, resolvedConfig.cwd);
  const isExternalFile = (filename: string) =>
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    !path.matchesGlob(
      filename,
      path.join(cwd, resolvedConfig.pattern), // `pattern` is 'src/**/*.module.css', so convert it to '/project/src/**/*.module.css'
    );

  const cwd = info.project.getCurrentDirectory();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let config: any;
  try {
    config = readConfigFile(cwd);
    // log
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

  return {
    languagePlugins: [createCSSModuleLanguagePlugin(config, resolver, isExternalFile)],
    // TODO: Support language service for CSS modules
    // setup: (language) => {
    //   info.languageService = proxyLanguageService(ts, language, info.languageService);
    // },
  };
});

module.exports = init;
