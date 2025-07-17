import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as testUtils from '../testUtils';

suite('Alternator File Navigation Commands Tests', () => {
    let workspacePath: string;
    let sandbox: sinon.SinonSandbox;

    setup(async () => {
        sandbox = sinon.createSandbox();
        
        // Create a test workspace
        workspacePath = await testUtils.createTestWorkspace();
        
        // Wait for extension to be ready
        await testUtils.waitForExtensionActivation();
        
        // Close all editors before each test
        await testUtils.closeAllEditors();
    });

    teardown(async () => {
        // Restore all stubs
        sandbox.restore();
        
        // Close all editors
        await testUtils.closeAllEditors();
        
        // Clean up test workspace
        await testUtils.cleanupTestWorkspace(workspacePath);
    });

    suite('Next File With Changes Command', () => {
        test('Should navigate to next file with changes', async () => {
            // Create test files
            const file1 = await testUtils.createTestFile(workspacePath, 'file1.txt', 'File 1 content');
            const file2 = await testUtils.createTestFile(workspacePath, 'file2.txt', 'File 2 content');
            const file3 = await testUtils.createTestFile(workspacePath, 'file3.txt', 'File 3 content');
            
            // Create mock Git changes for file1 and file3 (skipping file2)
            const mockGitExtension = testUtils.createMockGitExtension([
                testUtils.createMockRepository({
                    workingTreeChanges: [
                        { uri: file1, originalUri: file1 },
                        { uri: file3, originalUri: file3 }
                    ]
                })
            ]);

            // Stub the Git extension
            sandbox.stub(vscode.extensions, 'getExtension').returns({
                exports: mockGitExtension
            } as any);

            // Open file1
            await testUtils.openFile(file1);
            await testUtils.sleep(100);

            // Execute next file with changes command
            await testUtils.executeCommand('alternator.nextFileWithChanges');
            await testUtils.sleep(200);

            // Should navigate to file3 (next file with changes)
            const activeEditor = testUtils.getActiveEditor();
            assert.ok(activeEditor, 'Should have an active editor');
            assert.strictEqual(activeEditor.document.uri.fsPath, file3.fsPath, 'Should navigate to file3');
        });

        test('Should wrap around to first changed file when at last', async () => {
            // Create test files
            const file1 = await testUtils.createTestFile(workspacePath, 'a_first.txt', 'First file');
            const file2 = await testUtils.createTestFile(workspacePath, 'b_second.txt', 'Second file');
            const file3 = await testUtils.createTestFile(workspacePath, 'c_third.txt', 'Third file');
            
            // Create mock Git changes
            const mockGitExtension = testUtils.createMockGitExtension([
                testUtils.createMockRepository({
                    workingTreeChanges: [
                        { uri: file1, originalUri: file1 },
                        { uri: file2, originalUri: file2 },
                        { uri: file3, originalUri: file3 }
                    ]
                })
            ]);

            // Stub the Git extension
            sandbox.stub(vscode.extensions, 'getExtension').returns({
                exports: mockGitExtension
            } as any);

            // Open file3 (last changed file)
            await testUtils.openFile(file3);
            await testUtils.sleep(100);

            // Execute next file with changes command
            await testUtils.executeCommand('alternator.nextFileWithChanges');
            await testUtils.sleep(200);

            // Should wrap around to file1
            const activeEditor = testUtils.getActiveEditor();
            assert.ok(activeEditor, 'Should have an active editor');
            assert.strictEqual(activeEditor.document.uri.fsPath, file1.fsPath, 'Should wrap around to first file');
        });

        test('Should show message when no changed files exist', async () => {
            // Create test file
            const file1 = await testUtils.createTestFile(workspacePath, 'unchanged.txt', 'No changes');
            
            // Create mock Git extension with no changes
            const mockGitExtension = testUtils.createMockGitExtension([
                testUtils.createMockRepository({
                    workingTreeChanges: []
                })
            ]);

            // Stub the Git extension
            sandbox.stub(vscode.extensions, 'getExtension').returns({
                exports: mockGitExtension
            } as any);

            // Stub the information message
            const infoMessageStub = sandbox.stub(vscode.window, 'showInformationMessage');

            // Open file
            await testUtils.openFile(file1);

            // Execute command
            await testUtils.executeCommand('alternator.nextFileWithChanges');
            await testUtils.sleep(100);

            // Verify information message was shown
            assert.ok(infoMessageStub.calledWith('No changed files in the workspace'), 'Should show no changes message');
        });

        test('Should stay on current file if it is the only changed file', async () => {
            // Create test files
            const file1 = await testUtils.createTestFile(workspacePath, 'only_changed.txt', 'Only changed file');
            const file2 = await testUtils.createTestFile(workspacePath, 'unchanged.txt', 'Unchanged file');
            
            // Create mock Git changes for only file1
            const mockGitExtension = testUtils.createMockGitExtension([
                testUtils.createMockRepository({
                    workingTreeChanges: [
                        { uri: file1, originalUri: file1 }
                    ]
                })
            ]);

            // Stub the Git extension
            sandbox.stub(vscode.extensions, 'getExtension').returns({
                exports: mockGitExtension
            } as any);

            // Open file1
            await testUtils.openFile(file1);
            await testUtils.sleep(100);

            // Execute command
            await testUtils.executeCommand('alternator.nextFileWithChanges');
            await testUtils.sleep(200);

            // Should stay on file1
            const activeEditor = testUtils.getActiveEditor();
            assert.ok(activeEditor, 'Should have an active editor');
            assert.strictEqual(activeEditor.document.uri.fsPath, file1.fsPath, 'Should stay on the same file');
        });
    });

    suite('Previous File With Changes Command', () => {
        test('Should navigate to previous file with changes', async () => {
            // Create test files
            const file1 = await testUtils.createTestFile(workspacePath, 'file1.txt', 'File 1 content');
            const file2 = await testUtils.createTestFile(workspacePath, 'file2.txt', 'File 2 content');
            const file3 = await testUtils.createTestFile(workspacePath, 'file3.txt', 'File 3 content');
            
            // Create mock Git changes for file1 and file3 (skipping file2)
            const mockGitExtension = testUtils.createMockGitExtension([
                testUtils.createMockRepository({
                    workingTreeChanges: [
                        { uri: file1, originalUri: file1 },
                        { uri: file3, originalUri: file3 }
                    ]
                })
            ]);

            // Stub the Git extension
            sandbox.stub(vscode.extensions, 'getExtension').returns({
                exports: mockGitExtension
            } as any);

            // Open file3
            await testUtils.openFile(file3);
            await testUtils.sleep(100);

            // Execute previous file with changes command
            await testUtils.executeCommand('alternator.previousFileWithChanges');
            await testUtils.sleep(200);

            // Should navigate to file1 (previous file with changes)
            const activeEditor = testUtils.getActiveEditor();
            assert.ok(activeEditor, 'Should have an active editor');
            assert.strictEqual(activeEditor.document.uri.fsPath, file1.fsPath, 'Should navigate to file1');
        });

        test('Should wrap around to last changed file when at first', async () => {
            // Create test files
            const file1 = await testUtils.createTestFile(workspacePath, 'a_first.txt', 'First file');
            const file2 = await testUtils.createTestFile(workspacePath, 'b_second.txt', 'Second file');
            const file3 = await testUtils.createTestFile(workspacePath, 'c_third.txt', 'Third file');
            
            // Create mock Git changes
            const mockGitExtension = testUtils.createMockGitExtension([
                testUtils.createMockRepository({
                    workingTreeChanges: [
                        { uri: file1, originalUri: file1 },
                        { uri: file2, originalUri: file2 },
                        { uri: file3, originalUri: file3 }
                    ]
                })
            ]);

            // Stub the Git extension
            sandbox.stub(vscode.extensions, 'getExtension').returns({
                exports: mockGitExtension
            } as any);

            // Open file1 (first changed file)
            await testUtils.openFile(file1);
            await testUtils.sleep(100);

            // Execute previous file with changes command
            await testUtils.executeCommand('alternator.previousFileWithChanges');
            await testUtils.sleep(200);

            // Should wrap around to file3
            const activeEditor = testUtils.getActiveEditor();
            assert.ok(activeEditor, 'Should have an active editor');
            assert.strictEqual(activeEditor.document.uri.fsPath, file3.fsPath, 'Should wrap around to last file');
        });

        test('Should handle mixed index and working tree changes', async () => {
            // Create test files
            const stagedFile = await testUtils.createTestFile(workspacePath, 'staged.txt', 'Staged file');
            const workingFile = await testUtils.createTestFile(workspacePath, 'working.txt', 'Working file');
            const bothFile = await testUtils.createTestFile(workspacePath, 'both.txt', 'Both staged and working');
            
            // Create mock Git changes with mixed types
            const mockGitExtension = testUtils.createMockGitExtension([
                testUtils.createMockRepository({
                    indexChanges: [
                        { uri: stagedFile, originalUri: stagedFile },
                        { uri: bothFile, originalUri: bothFile }
                    ],
                    workingTreeChanges: [
                        { uri: workingFile, originalUri: workingFile },
                        { uri: bothFile, originalUri: bothFile }
                    ]
                })
            ]);

            // Stub the Git extension
            sandbox.stub(vscode.extensions, 'getExtension').returns({
                exports: mockGitExtension
            } as any);

            // Open workingFile
            await testUtils.openFile(workingFile);
            await testUtils.sleep(100);

            // Execute previous file with changes command
            await testUtils.executeCommand('alternator.previousFileWithChanges');
            await testUtils.sleep(200);

            // Should navigate to one of the other changed files
            const activeEditor = testUtils.getActiveEditor();
            assert.ok(activeEditor, 'Should have an active editor');
            assert.ok(
                activeEditor.document.uri.fsPath === stagedFile.fsPath || 
                activeEditor.document.uri.fsPath === bothFile.fsPath,
                'Should navigate to another changed file'
            );
        });

    });

    suite('Multi-Repository File Navigation', () => {
        test('Should navigate across files from multiple repositories', async () => {
            // Create test files in different "repositories"
            const repo1File1 = await testUtils.createTestFile(workspacePath, 'repo1/file1.txt', 'Repo 1 File 1');
            const repo1File2 = await testUtils.createTestFile(workspacePath, 'repo1/file2.txt', 'Repo 1 File 2');
            const repo2File1 = await testUtils.createTestFile(workspacePath, 'repo2/file1.txt', 'Repo 2 File 1');
            const repo2File2 = await testUtils.createTestFile(workspacePath, 'repo2/file2.txt', 'Repo 2 File 2');
            
            // Create mock Git extension with multiple repositories
            const mockGitExtension = testUtils.createMockGitExtension([
                testUtils.createMockRepository({
                    workingTreeChanges: [
                        { uri: repo1File1, originalUri: repo1File1 },
                        { uri: repo1File2, originalUri: repo1File2 }
                    ]
                }),
                testUtils.createMockRepository({
                    workingTreeChanges: [
                        { uri: repo2File1, originalUri: repo2File1 },
                        { uri: repo2File2, originalUri: repo2File2 }
                    ]
                })
            ]);

            // Stub the Git extension
            sandbox.stub(vscode.extensions, 'getExtension').returns({
                exports: mockGitExtension
            } as any);

            // Open repo1File1
            await testUtils.openFile(repo1File1);
            await testUtils.sleep(100);

            // Navigate multiple times to ensure we cross repository boundaries
            let visitedFiles = new Set<string>();
            visitedFiles.add(testUtils.getActiveEditor()!.document.uri.fsPath);

            for (let i = 0; i < 5; i++) {
                await testUtils.executeCommand('alternator.nextFileWithChanges');
                await testUtils.sleep(200);
                
                const currentFile = testUtils.getActiveEditor()?.document.uri.fsPath;
                if (currentFile) {
                    visitedFiles.add(currentFile);
                }
            }

            // Should have visited files from both repositories
            const hasRepo1Files = Array.from(visitedFiles).some(f => f.includes('repo1'));
            const hasRepo2Files = Array.from(visitedFiles).some(f => f.includes('repo2'));
            
            assert.ok(hasRepo1Files, 'Should visit files from repo1');
            assert.ok(hasRepo2Files, 'Should visit files from repo2');
            assert.ok(visitedFiles.size > 2, 'Should visit multiple files');
        });
    });
});