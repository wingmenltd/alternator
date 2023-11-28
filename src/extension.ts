import * as vscode from "vscode";

// Map of viewColumn to an array of file URIs
let lastActiveFilesPerGroup: Map<number, vscode.Uri[]> = new Map();

export function activate(context: vscode.ExtensionContext) {
  // Initialize with the current active editor if it exists
  const currentEditor = vscode.window.activeTextEditor;
  if (
    currentEditor &&
    currentEditor.document.uri &&
    currentEditor.viewColumn !== undefined
  ) {
    updateLastActiveFiles(currentEditor.document.uri, currentEditor.viewColumn);
  }

  let disposable = vscode.commands.registerCommand(
    "alternator.switch",
    async () => {
      const activeEditor = vscode.window.activeTextEditor;
      if (!activeEditor) {
        return; // No active editor
      }

      // Save the current file
      await vscode.workspace.saveAll(false);

      const viewColumn = activeEditor.viewColumn || -1; // -1 if no viewColumn assigned
      const lastActiveFiles = lastActiveFilesPerGroup.get(viewColumn);

      // Switch to the last active file within the same group, if available
      if (lastActiveFiles && lastActiveFiles.length > 0) {
        const fileToOpen = lastActiveFiles[1];
        const document = await vscode.workspace.openTextDocument(fileToOpen);
        console.log("SWITCHING TO", fileToOpen, document);
        await vscode.window.showTextDocument(document, viewColumn);
      }
    }
  );

  context.subscriptions.push(disposable);

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor && editor.document.uri && editor.viewColumn !== undefined) {
      updateLastActiveFiles(editor.document.uri, editor.viewColumn);
    }
  });
}

export function deactivate() {}

function updateLastActiveFiles(currentUri: vscode.Uri, viewColumn: number) {
  if (!lastActiveFilesPerGroup.has(viewColumn)) {
    lastActiveFilesPerGroup.set(viewColumn, []);
  }

  const lastActiveFiles = lastActiveFilesPerGroup.get(viewColumn);
  if (
    lastActiveFiles &&
    (lastActiveFiles.length === 0 ||
      lastActiveFiles[0].toString() !== currentUri.toString())
  ) {
    console.log("pushing url", currentUri.toString());
    lastActiveFiles.unshift(currentUri);

    // Ensure we only track the last two files per group
    if (lastActiveFiles.length > 2) {
      lastActiveFiles.pop();
    }
  }
}
