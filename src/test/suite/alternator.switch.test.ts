import * as assert from 'assert';
import * as vscode from 'vscode';
import * as testUtils from '../testUtils';
import * as extension from '../../extension';

suite('Alternator Switch Command Tests', () => {
    let workspacePath: string;

    setup(async () => {
        // Create a test workspace
        workspacePath = await testUtils.createTestWorkspace();
        
        // Wait for extension to be ready
        await testUtils.waitForExtensionActivation();
        
        // Close all editors before each test
        await testUtils.closeAllEditors();
        
        // Clear file history from previous tests
        extension.clearFileHistory();
    });

    teardown(async () => {
        // Close all editors
        await testUtils.closeAllEditors();
        
        // Clean up test workspace
        await testUtils.cleanupTestWorkspace(workspacePath);
    });

    test('Should switch between two files in the same editor group', async () => {
        // Create test files
        const file1 = await testUtils.createTestFile(workspacePath, 'file1.txt', 'Content of file 1');
        const file2 = await testUtils.createTestFile(workspacePath, 'file2.txt', 'Content of file 2');

        // Open file1
        const editor1 = await testUtils.openFile(file1);
        assert.strictEqual(editor1.document.uri.fsPath, file1.fsPath);

        // Wait a bit to ensure file tracking
        await testUtils.sleep(100);

        // Open file2
        const editor2 = await testUtils.openFile(file2);
        assert.strictEqual(editor2.document.uri.fsPath, file2.fsPath);

        // Wait a bit to ensure file tracking
        await testUtils.sleep(100);

        // Execute switch command - should go back to file1
        await testUtils.executeCommand('alternator.switch');
        await testUtils.sleep(100);

        const activeEditor1 = testUtils.getActiveEditor();
        assert.ok(activeEditor1, 'Should have an active editor after switch');
        assert.strictEqual(activeEditor1.document.uri.fsPath, file1.fsPath, 'Should switch to file1');

        // Execute switch command again - should go back to file2
        await testUtils.executeCommand('alternator.switch');
        await testUtils.sleep(100);

        const activeEditor2 = testUtils.getActiveEditor();
        assert.ok(activeEditor2, 'Should have an active editor after second switch');
        assert.strictEqual(activeEditor2.document.uri.fsPath, file2.fsPath, 'Should switch back to file2');
    });

    test('Should handle switching with only one file open', async () => {
        // Create and open a single test file
        const file1 = await testUtils.createTestFile(workspacePath, 'single.txt', 'Single file content');
        await testUtils.openFile(file1);

        // Execute switch command - should show info message
        await testUtils.executeCommand('alternator.switch');
        
        // Verify we're still on the same file
        const activeEditor = testUtils.getActiveEditor();
        assert.ok(activeEditor, 'Should still have an active editor');
        assert.strictEqual(activeEditor.document.uri.fsPath, file1.fsPath, 'Should remain on the same file');
    });

    test('Should maintain separate history per editor group', async () => {
        // Create test files
        const file1 = await testUtils.createTestFile(workspacePath, 'group1-file1.txt', 'Group 1 File 1');
        const file2 = await testUtils.createTestFile(workspacePath, 'group1-file2.txt', 'Group 1 File 2');
        const file3 = await testUtils.createTestFile(workspacePath, 'group2-file1.txt', 'Group 2 File 1');
        const file4 = await testUtils.createTestFile(workspacePath, 'group2-file2.txt', 'Group 2 File 2');

        // Open files in first group
        await testUtils.openFile(file1, vscode.ViewColumn.One);
        await testUtils.sleep(100);
        await testUtils.openFile(file2, vscode.ViewColumn.One);
        await testUtils.sleep(100);

        // Open files in second group
        await testUtils.openFile(file3, vscode.ViewColumn.Two);
        await testUtils.sleep(100);
        await testUtils.openFile(file4, vscode.ViewColumn.Two);
        await testUtils.sleep(100);

        // Switch in group 2 (currently active)
        await testUtils.executeCommand('alternator.switch');
        await testUtils.sleep(100);

        let activeEditor = testUtils.getActiveEditor();
        assert.strictEqual(activeEditor?.document.uri.fsPath, file3.fsPath, 'Should switch to file3 in group 2');

        // Make group 1 active
        await vscode.window.showTextDocument(file2, { viewColumn: vscode.ViewColumn.One });
        await testUtils.sleep(100);

        // Switch in group 1
        await testUtils.executeCommand('alternator.switch');
        await testUtils.sleep(100);

        activeEditor = testUtils.getActiveEditor();
        assert.strictEqual(activeEditor?.document.uri.fsPath, file1.fsPath, 'Should switch to file1 in group 1');
    });

    test('Should close preview tabs before switching', async () => {
        // Create test files
        const file1 = await testUtils.createTestFile(workspacePath, 'preview1.txt', 'Preview 1');
        const file2 = await testUtils.createTestFile(workspacePath, 'preview2.txt', 'Preview 2');
        const file3 = await testUtils.createTestFile(workspacePath, 'preview3.txt', 'Preview 3');

        // Open files (by default they open as preview)
        await testUtils.openFile(file1);
        await testUtils.sleep(100);
        await testUtils.openFile(file2);
        await testUtils.sleep(100);
        await testUtils.openFile(file3);
        await testUtils.sleep(100);

        // Get initial editor count
        const initialEditorCount = testUtils.getAllEditors().length;

        // Switch back to file2
        await testUtils.executeCommand('alternator.switch');
        await testUtils.sleep(200);

        // Check that we're on file2
        const activeEditor = testUtils.getActiveEditor();
        assert.strictEqual(activeEditor?.document.uri.fsPath, file2.fsPath, 'Should switch to file2');

        // Verify that preview tabs were managed (editor count should be reasonable)
        const finalEditorCount = testUtils.getAllEditors().length;
        assert.ok(finalEditorCount <= initialEditorCount, 'Should not accumulate excessive tabs');
    });

    test('Should save all files before switching', async () => {
        // Create test files
        const file1 = await testUtils.createTestFile(workspacePath, 'save1.txt', 'Original content 1');
        const file2 = await testUtils.createTestFile(workspacePath, 'save2.txt', 'Original content 2');

        // Open and modify file1
        const editor1 = await testUtils.openFile(file1);
        await editor1.edit(edit => {
            edit.replace(new vscode.Range(0, 0, 0, 0), 'Modified ');
        });
        assert.ok(editor1.document.isDirty, 'File1 should be dirty');

        await testUtils.sleep(100);

        // Open and modify file2
        const editor2 = await testUtils.openFile(file2);
        await editor2.edit(edit => {
            edit.replace(new vscode.Range(0, 0, 0, 0), 'Modified ');
        });
        assert.ok(editor2.document.isDirty, 'File2 should be dirty');

        await testUtils.sleep(100);

        // Execute switch command
        await testUtils.executeCommand('alternator.switch');
        await testUtils.sleep(200);

        // Check that files were saved
        const doc1 = await vscode.workspace.openTextDocument(file1);
        const doc2 = await vscode.workspace.openTextDocument(file2);
        
        assert.ok(!doc1.isDirty, 'File1 should be saved');
        assert.ok(!doc2.isDirty, 'File2 should be saved');
        assert.ok(doc1.getText().includes('Modified'), 'File1 changes should be saved');
        assert.ok(doc2.getText().includes('Modified'), 'File2 changes should be saved');
    });

    test('Should handle file ordering correctly', async () => {
        // Create test files with different names to test ordering
        const fileA = await testUtils.createTestFile(workspacePath, 'a_file.txt', 'File A');
        const fileZ = await testUtils.createTestFile(workspacePath, 'z_file.txt', 'File Z');
        const fileM = await testUtils.createTestFile(workspacePath, 'm_file.txt', 'File M');

        // Open files in a specific order
        await testUtils.openFile(fileZ);
        await testUtils.sleep(100);
        await testUtils.openFile(fileA);
        await testUtils.sleep(100);
        await testUtils.openFile(fileM);
        await testUtils.sleep(100);

        // Switch should go to the previously active file (fileA)
        await testUtils.executeCommand('alternator.switch');
        await testUtils.sleep(100);

        const activeEditor = testUtils.getActiveEditor();
        assert.strictEqual(activeEditor?.document.uri.fsPath, fileA.fsPath, 'Should switch to previously active file');

        // Switch again should go back to fileM
        await testUtils.executeCommand('alternator.switch');
        await testUtils.sleep(100);

        const activeEditor2 = testUtils.getActiveEditor();
        assert.strictEqual(activeEditor2?.document.uri.fsPath, fileM.fsPath, 'Should switch back');
    });
});