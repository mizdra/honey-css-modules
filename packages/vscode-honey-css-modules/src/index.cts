/* eslint-disable no-console */

// eslint-disable-next-line @typescript-eslint/no-require-imports
import vscode = require('vscode');

exports.activate = function activate(_context: vscode.ExtensionContext) {
  console.log('[vscode-honey-css-modules] Activated');

  // By default, `vscode.typescript-language-features` is not activated when a user opens *.css in VS Code.
  // So, activate it manually.
  const tsExtension = vscode.extensions.getExtension('vscode.typescript-language-features');
  if (tsExtension) {
    console.log('[vscode-honey-css-modules] Activating `vscode.typescript-language-features`');
    tsExtension.activate();
  }

  // Both vscode.css-language-features and tsserver receive "rename" requests for *.css.
  // If more than one Provider receives a "rename" request, VS Code will use one of them.
  // In this case, vscode.css-language-features is used to rename. However, we do not want this.
  // Without rename in tsserver, we cannot rename class selectors across *.css and *.ts.
  //
  // Also, VS Code seems to send "references" requests to both vscode.css-language-features
  // and tsserver and merge the results of both. Thus, when a user executes "Find all references"
  // on a class selector, the same class selector appears twice.
  //
  // To avoid this, we advise users to disable vscode.css-language-features.
  //
  // NOTE: It might be a good idea to dynamically monkey-patch vscode.css-language-features
  //       so that vscode.css-language-features ignores *.module.css.
  const cssExtension = vscode.extensions.getExtension('vscode.css-language-features');
  if (cssExtension) {
    vscode.window
      .showWarningMessage(
        'To use "honey-css-modules" extension, please disable "CSS Language Features" extension.',
        'Show "CSS Language Features" extension',
      )
      .then((selected) => {
        if (selected) {
          vscode.commands.executeCommand('workbench.extensions.search', '@builtin css-language-features');
        }
      });
  }
};

exports.deactivate = function deactivate() {};
