import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

/**
 * Create a temporary workspace directory for testing
 */
export async function createTestWorkspace(): Promise<string> {
    const tempDir = path.join(os.tmpdir(), 'alternator-test-' + Date.now());
    await fs.promises.mkdir(tempDir, { recursive: true });
    return tempDir;
}

/**
 * Clean up a test workspace directory
 */
export async function cleanupTestWorkspace(workspacePath: string): Promise<void> {
    try {
        await fs.promises.rm(workspacePath, { recursive: true, force: true });
    } catch (error) {
        console.error('Failed to cleanup test workspace:', error);
    }
}

/**
 * Create a test file in the workspace
 */
export async function createTestFile(workspacePath: string, relativePath: string, content: string = ''): Promise<vscode.Uri> {
    const fullPath = path.join(workspacePath, relativePath);
    const dir = path.dirname(fullPath);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(fullPath, content);
    return vscode.Uri.file(fullPath);
}

/**
 * Open a file in the editor
 */
export async function openFile(uri: vscode.Uri, viewColumn?: vscode.ViewColumn): Promise<vscode.TextEditor> {
    const document = await vscode.workspace.openTextDocument(uri);
    return await vscode.window.showTextDocument(document, viewColumn);
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(condition: () => boolean | Promise<boolean>, timeout: number = 5000): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        if (await condition()) {
            return;
        }
        await sleep(100);
    }
    throw new Error('Timeout waiting for condition');
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get the currently active editor
 */
export function getActiveEditor(): vscode.TextEditor | undefined {
    return vscode.window.activeTextEditor;
}

/**
 * Execute a VS Code command
 */
export async function executeCommand(command: string, ...args: any[]): Promise<any> {
    return await vscode.commands.executeCommand(command, ...args);
}

/**
 * Mock Git extension API for testing
 */
export interface MockGitChange {
    uri: vscode.Uri;
    originalUri: vscode.Uri;
}

export interface MockRepository {
    state: {
        indexChanges: MockGitChange[];
        workingTreeChanges: MockGitChange[];
    };
    diffWithHEAD: (path: string) => Promise<string>;
    rootUri: { path: string };
}

export interface MockGitAPI {
    repositories: MockRepository[];
}

export function createMockGitExtension(repositories: MockRepository[]): any {
    return {
        getAPI: () => ({
            repositories
        })
    };
}

/**
 * Create a mock repository with changes
 */
export function createMockRepository(changes: { 
    indexChanges?: MockGitChange[], 
    workingTreeChanges?: MockGitChange[],
    diffWithHEAD?: (path: string) => Promise<string>,
    rootUri?: string
}): MockRepository {
    return {
        state: {
            indexChanges: changes.indexChanges || [],
            workingTreeChanges: changes.workingTreeChanges || []
        },
        diffWithHEAD: changes.diffWithHEAD || ((path: string) => Promise.resolve('@@ -1,5 +1,5 @@\n')),
        rootUri: { path: changes.rootUri || '/test/repo' }
    };
}

/**
 * Wait for extension to be activated
 */
export async function waitForExtensionActivation(): Promise<void> {
    const extension = vscode.extensions.getExtension('wingmen.alternator');
    if (!extension) {
        throw new Error('Extension not found');
    }
    
    if (!extension.isActive) {
        await extension.activate();
    }
    
    // Give the extension time to register commands
    await sleep(100);
}

/**
 * Get all open text editors
 */
export function getAllEditors(): readonly vscode.TextEditor[] {
    return vscode.window.visibleTextEditors;
}

/**
 * Close all editors
 */
export async function closeAllEditors(): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    // Wait for editors to close
    await waitFor(() => vscode.window.visibleTextEditors.length === 0);
}