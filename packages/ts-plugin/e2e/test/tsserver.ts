import serverHarness from '@typescript/server-harness';
import type { server } from 'typescript';
import type ts from 'typescript';

interface Tsserver {
  sendUpdateOpen(args: server.protocol.UpdateOpenRequest['arguments']): Promise<server.protocol.Response>;
  sendDefinitionAndBoundSpan(
    args: server.protocol.FileLocationRequestArgs,
  ): Promise<server.protocol.DefinitionInfoAndBoundSpanResponse>;
  sendReferences(args: server.protocol.ReferencesRequest['arguments']): Promise<server.protocol.ReferencesResponse>;
  sendRename(args: server.protocol.RenameRequest['arguments']): Promise<server.protocol.RenameResponse>;
  sendSemanticDiagnosticsSync(
    args: server.protocol.SemanticDiagnosticsSyncRequest['arguments'],
  ): Promise<server.protocol.SemanticDiagnosticsSyncResponse>;
  sendSyntacticDiagnosticsSync(
    args: server.protocol.SyntacticDiagnosticsSyncRequest['arguments'],
  ): Promise<server.protocol.SyntacticDiagnosticsSyncResponse>;
  sendGetEditsForFileRename(
    args: server.protocol.GetEditsForFileRenameRequest['arguments'],
  ): Promise<server.protocol.GetEditsForFileRenameResponse>;
}

export function launchTsserver(): Tsserver {
  const server = serverHarness.launchServer(
    require.resolve('typescript/lib/tsserver.js'),
    [
      '--disableAutomaticTypingAcquisition',
      '--globalPlugins',
      'ts-honey-css-modules-plugin',
      '--pluginProbeLocations',
      __dirname,
    ],
    [],
  );
  let seq = 0;
  async function sendRequest(
    command: string,
    args?: unknown,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    const res: server.protocol.Response = await server.message({
      seq: seq++,
      type: 'request',
      command,
      arguments: args,
    });
    if (!res.success) {
      throw new Error(`Expected success response, got ${JSON.stringify(res)}`);
    }
    return res;
  }

  return {
    sendUpdateOpen: async (args) => sendRequest('updateOpen', args),
    sendDefinitionAndBoundSpan: async (args) => sendRequest('definitionAndBoundSpan', args),
    sendReferences: async (args) => sendRequest('references', args),
    sendRename: async (args) => sendRequest('rename', args),
    sendSemanticDiagnosticsSync: async (args) => sendRequest('semanticDiagnosticsSync', args),
    sendSyntacticDiagnosticsSync: async (args) => sendRequest('syntacticDiagnosticsSync', args),
    sendGetEditsForFileRename: async (args) => sendRequest('getEditsForFileRename', args),
  };
}

export function formatPath(path: string) {
  // In windows, tsserver returns paths with '/' instead of '\\'.
  return path.replaceAll('\\', '/');
}

export function simplifyDefinitions(definitions: readonly ts.server.protocol.DefinitionInfo[]) {
  return definitions.map((definition) => {
    return {
      file: formatPath(definition.file),
      start: definition.start,
      end: definition.end,
    };
  });
}
export function sortDefinitions(definitions: readonly ts.server.protocol.DefinitionInfo[]) {
  return definitions.toSorted((a, b) => {
    return a.file.localeCompare(b.file) || a.start.line - b.start.line || a.start.offset - b.start.offset;
  });
}
