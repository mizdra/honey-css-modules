import type * as ts from 'typescript/lib/tsserverlibrary';

const init: ts.server.PluginModuleFactory = (modules) => {
  const ts = modules.typescript;
  function create(info: ts.server.PluginCreateInfo) {
    // Set up decorator object
    const proxy: ts.LanguageService = Object.create(null);

    for (const k of Object.keys(info.languageService) as (keyof ts.LanguageService)[]) {
      const x = info.languageService[k]!;
      // @ts-expect-error - JS runtime trickery which is tricky to type tersely
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      proxy[k] = (...args: {}[]) => x.apply(info.languageService, args);
    }
    proxy.getCompletionsAtPosition = (fileName, position, options) => {
      const prior = info.languageService.getCompletionsAtPosition(fileName, position, options)!;
      prior.entries.push({
        name: 'Hello',
        kind: ts.ScriptElementKind.keyword,
        sortText: '0',
      });
      return prior;
    };
    return proxy;
  }
  return { create };
};

export = init;
