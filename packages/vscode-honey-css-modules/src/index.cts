/* eslint-disable no-console */

// eslint-disable-next-line @typescript-eslint/no-require-imports
import vscode = require('vscode');

exports.activate = function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "vscode-honey-css-modules" is now active!');

  vscode.languages.registerRenameProvider('css', {
    provideRenameEdits(_document, _position, newName, _token) {
      console.log('rename', newName);
      return null;
    },
  });

  const disposable = vscode.commands.registerCommand('vscode-honey-css-modules.helloWorld', () => {
    vscode.window.showInformationMessage('Hello World from vscode-honey-css-modules!');
  });

  context.subscriptions.push(disposable);
};

exports.deactivate = function deactivate() {};
