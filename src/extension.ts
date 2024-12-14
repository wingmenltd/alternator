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

  let disposable1 = vscode.commands.registerCommand(
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
        await vscode.window.showTextDocument(document, viewColumn);
      }
    }
  );

  let disposable2 = vscode.commands.registerCommand(
    "alternator.nextChange",
    async () => {
      await goToNextDiff();
    }
  );

  let disposable3 = vscode.commands.registerCommand(
    "alternator.previousChange",
    async () => {
      await goToPreviousDiff();
    }
  );

  context.subscriptions.push(disposable1, disposable2, disposable3);

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor && editor.document.uri && editor.viewColumn !== undefined) {
      updateLastActiveFiles(editor.document.uri, editor.viewColumn);
    }
  });
}

export function deactivate() {}

const orderFiles = (a: any, b: any): number => {
  const filenameA = a.uri.path.toLowerCase().split("/");
  const filenameB = b.uri.path.toLowerCase().split("/");

  for (let i = 0; i < Math.max(filenameA.length, filenameB.length); i++) {
    const partA = filenameA[i];
    const partB = filenameB[i];

    if (partA === partB) {
      continue;
    }

    if (
      (i === filenameA.length - 1 && i === filenameB.length - 1) ||
      (i < filenameA.length - 1 && i < filenameB.length - 1 && partA !== partB)
    ) {
      if (partA < partB) {
        return -1;
      }
      return 1;
    }

    if (i === filenameA.length - 1) {
      return -1;
    }

    if (i === filenameB.length - 1) {
      return 1;
    }
  }

  return 0;
};

const getChangedFiles = async () => {
  const gitExtension =
    vscode.extensions.getExtension<any>("vscode.git")!.exports;
  const git = gitExtension.getAPI(1);
  const workspaceUri = vscode.workspace.workspaceFolders?.map(
    (ws) => ws.uri
  )[0];
  const activeRepo =
    git.getRepository(workspaceUri?.path) || git.repositories[0];

  // Get the changes with their original data
  const changes = await activeRepo.state.workingTreeChanges;

  const changedFiles = changes.map((change: any) => {
    // Get the diff details for each change
    const diffDetails = change.originalUri
      ? activeRepo.diffWithHEAD(change.uri.fsPath)
      : activeRepo.diffWithWorkingTree(change.uri.fsPath);

    return {
      uri: change.uri,
      path: change.uri.path,
      // We'll update this once we have the diff details
      firstChangeLine: 0,
      diffDetails: diffDetails,
    };
  });

  // Wait for all diff details to be resolved
  const filesWithDiffs = await Promise.all(
    changedFiles.map(async (file: any) => {
      const diff = await file.diffDetails;
      // Extract the line number and add 3 to skip the GIT unified diff context lines
      const firstChangeLine = diff ? parseInt(diff.split("@@ -")[1]) + 3 : 0;
      return {
        ...file,
        firstChangeLine: Math.max(firstChangeLine - 1, 0), // Convert to 0-based line number
      };
    })
  );

  return filesWithDiffs.sort(orderFiles);
};

const openPreviousFile = async () => {
  const changedFiles = await getChangedFiles();
  var activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    return;
  }
  const currentFilename = activeEditor.document.uri.path;
  const currentIndex = changedFiles.findIndex(
    (file: any) => file.path === currentFilename
  );
  // Cycle to the last file if we're at the beginning
  const previousFile =
    currentIndex === 0
      ? changedFiles[changedFiles.length - 1]
      : changedFiles[currentIndex - 1];

  const isPreview = vscode.window.tabGroups.activeTabGroup.activeTab?.isPreview;
  if (!isPreview) {
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
  }
  await vscode.commands.executeCommand(
    "workbench.action.files.openFile",
    previousFile
  );
  await vscode.commands.executeCommand(
    "workbench.action.editor.previousChange"
  );
};

const openNextFile = async () => {
  const changedFiles = await getChangedFiles();
  var activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    return;
  }
  const currentFilename = activeEditor.document.uri.path;
  const currentIndex = changedFiles.findIndex(
    (file: any) => file.path === currentFilename
  );
  // Cycle to the first file if we're at the end
  const nextFile =
    currentIndex === changedFiles.length - 1
      ? changedFiles[0]
      : changedFiles[currentIndex + 1];

  const isPreview = vscode.window.tabGroups.activeTabGroup.activeTab?.isPreview;
  if (!isPreview) {
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
  }
  const uri = vscode.Uri.file(nextFile.path);

  const document = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(document, {
    selection: new vscode.Selection(
      nextFile.firstChangeLine || 0,
      0,
      nextFile.firstChangeLine || 0,
      0
    ),
  });
};

const goToNextDiff = async () => {
  var activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    return;
  }

  const lineBefore = activeEditor.selection.active.line;
  await vscode.commands.executeCommand("workbench.action.editor.nextChange");
  const lineAfter = activeEditor.selection.active.line;

  if (!(lineAfter > lineBefore)) {
    await openNextFile();
  }
};

const goToPreviousDiff = async () => {
  var activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    return;
  }

  const lineBefore = activeEditor.selection.active.line;
  await vscode.commands.executeCommand(
    "workbench.action.compareEditor.previousChange"
  );
  const lineAfter = activeEditor.selection.active.line;

  if (!(lineAfter < lineBefore)) {
    await openPreviousFile();
  }
};

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
    lastActiveFiles.unshift(currentUri);

    // Ensure we only track the last two files per editor group
    if (lastActiveFiles.length > 2) {
      lastActiveFiles.pop();
    }
  }
}
