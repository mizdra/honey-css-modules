import { createSimpleProject } from '@volar/language-server/lib/project/simpleProject';
import { createConnection, createServer } from '@volar/language-server/node';
import { create as createCssService } from 'volar-service-css';

// MEMO: Maybe @volar/language-server and volar-service-css are not needed. We may only need vscode-css-languageservice.

const connection = createConnection();
const server = createServer(connection);

connection.listen();

connection.onInitialize((params) => {
  const cssService = createCssService({
    getCustomData(_context) {
      // TODO: Load user defined custom data
      return [
        {
          provideProperties: () => [],
          provideAtDirectives: () => [{ name: '@value', description: 'Define values with CSS Modules' }],
          providePseudoClasses: () => [],
          providePseudoElements: () => [],
        },
      ];
    },
  });

  // Disable rename provider due to conflict with ts-plugin
  // TODO: Allow rename operations that do not conflict with ts-plugin
  // TODO: Do not disable provider in CSS files that are not CSS Modules
  delete cssService.capabilities.renameProvider;
  // Disable references provider due to conflict with ts-plugin
  // TODO: Allow references operations that do not conflict with ts-plugin
  // TODO: Do not disable provider in CSS files that are not CSS Modules
  delete cssService.capabilities.referencesProvider;

  return server.initialize(params, createSimpleProject([]), [cssService]);
});

connection.onInitialized(server.initialized.bind(server));
connection.onShutdown(server.shutdown.bind(server));
