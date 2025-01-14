/* eslint-disable no-console */

import fs from 'node:fs';
import path from 'node:path';
import * as vscode from 'vscode';

export function activate(_context: vscode.ExtensionContext) {
  console.log('[vscode-honey-css-modules] Activated');

  // By default, `vscode.typescript-language-features` is not activated when a user opens *.css in VS Code.
  // So, activate it manually.
  const tsExtension = vscode.extensions.getExtension('vscode.typescript-language-features');
  if (tsExtension) {
    console.log('[vscode-honey-css-modules] Activating `vscode.typescript-language-features`');
    tsExtension.activate();
  }
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
// To avoid this, we patch vscode.css-language-features to disable rename and references.
const cssExtension = vscode.extensions.getExtension('vscode.css-language-features');
if (cssExtension) {
  const readFileSync = fs.readFileSync;
  const serverDirectory = path.join(cssExtension.extensionPath, 'server');
  console.log(serverDirectory);

  // @ts-expect-error
  fs.readFileSync = (...args) => {
    if (typeof args[0] !== 'string') return readFileSync(...args);
    console.log(args[0]);

    if (path.dirname(args[0]) === serverDirectory) {
      let text = readFileSync(...args).toString();
      if (text.includes('referencesProvider:!0,') || text.includes('renameProvider:!0,')) {
        text = text.replaceAll(',referencesProvider:!0,', ',referencesProvider:!1,');
        text = text.replaceAll(',renameProvider:!0,', ',renameProvider:!1,');
        console.log(`[vscode-honey-css-modules] Patched ${args[0]}`);
      }
      return text;
    }
    return readFileSync(...args);
  };
}
