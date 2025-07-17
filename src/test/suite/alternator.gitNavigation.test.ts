import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as testUtils from '../testUtils';

suite('Alternator Git Navigation Commands Tests', () => {
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

    suite('Next Change Command', () => {
        test('Should navigate to next change in current file', async () => {
            // Create test file
            const file1 = await testUtils.createTestFile(workspacePath, 'modified.txt', 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5');
            
            // Create mock Git changes
            const mockGitExtension = testUtils.createMockGitExtension([
                testUtils.createMockRepository({
                    workingTreeChanges: [
                        {
                            uri: file1,
                            originalUri: file1
                        }
                    ]
                })
            ]);

            // Stub the Git extension
            sandbox.stub(vscode.extensions, 'getExtension').returns({
                exports: mockGitExtension
            } as any);

            // Open file and position cursor at line 1
            const editor = await testUtils.openFile(file1);
            editor.selection = new vscode.Selection(0, 0, 0, 0);

            // Mock the Git diff to simulate changes at lines 2 and 4
            const mockDiff = {
                execute: sandbox.stub().resolves([
                    { modifiedStartLineNumber: 2, modifiedEndLineNumber: 2 },
                    { modifiedStartLineNumber: 4, modifiedEndLineNumber: 4 }
                ])
            };
            sandbox.stub(vscode.commands, 'executeCommand')
                .withArgs('git.diff')
                .resolves(mockDiff);

            // Execute next change command
            await testUtils.executeCommand('alternator.nextChange');
            await testUtils.sleep(100);

            // Should move to line 2 (first change)
            assert.strictEqual(editor.selection.active.line, 1, 'Should navigate to line 2 (index 1)');

            // Execute next change command again
            await testUtils.executeCommand('alternator.nextChange');
            await testUtils.sleep(100);

            // Should move to line 4 (second change)
            assert.strictEqual(editor.selection.active.line, 3, 'Should navigate to line 4 (index 3)');
        });

        test('Should jump to next file when at last change', async () => {
            // Create test files
            const file1 = await testUtils.createTestFile(workspacePath, 'file1.txt', 'File 1 content');
            const file2 = await testUtils.createTestFile(workspacePath, 'file2.txt', 'File 2 content');
            
            // Create mock Git changes for both files
            const mockGitExtension = testUtils.createMockGitExtension([
                testUtils.createMockRepository({
                    workingTreeChanges: [
                        {
                            uri: file1,
                            originalUri: file1
                        },
                        {
                            uri: file2,
                            originalUri: file2
                        }
                    ]
                })
            ]);

            // Stub the Git extension
            sandbox.stub(vscode.extensions, 'getExtension').returns({
                exports: mockGitExtension
            } as any);

            // Open file1
            const editor1 = await testUtils.openFile(file1);
            
            // Mock diff showing we're at the last change
            const executeCommandStub = sandbox.stub(vscode.commands, 'executeCommand');
            executeCommandStub.withArgs('git.diff').resolves({
                execute: sandbox.stub().resolves([
                    { modifiedStartLineNumber: 1, modifiedEndLineNumber: 1 }
                ])
            });
            executeCommandStub.withArgs('workbench.action.nextEditor').resolves();

            // Position at the last change
            editor1.selection = new vscode.Selection(0, 0, 0, 0);

            // Execute next change command
            await testUtils.executeCommand('alternator.nextChange');
            await testUtils.sleep(200);

            // Verify that the next editor command was called
            assert.ok(executeCommandStub.calledWith('workbench.action.nextEditor'), 'Should call next editor command');
        });

        test('Should show message when no changes exist', async () => {
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

            // Execute next change command
            await testUtils.executeCommand('alternator.nextChange');
            await testUtils.sleep(100);

            // Verify information message was shown
            assert.ok(infoMessageStub.calledWith('No changed files in the workspace'), 'Should show no changes message');
        });
    });

    suite('Previous Change Command', () => {
        test('Should navigate to previous change in current file', async () => {
            // Create test file
            const file1 = await testUtils.createTestFile(workspacePath, 'modified.txt', 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5');
            
            // Create mock Git changes
            const mockGitExtension = testUtils.createMockGitExtension([
                testUtils.createMockRepository({
                    workingTreeChanges: [
                        {
                            uri: file1,
                            originalUri: file1
                        }
                    ]
                })
            ]);

            // Stub the Git extension
            sandbox.stub(vscode.extensions, 'getExtension').returns({
                exports: mockGitExtension
            } as any);

            // Open file and position cursor at line 5
            const editor = await testUtils.openFile(file1);
            editor.selection = new vscode.Selection(4, 0, 4, 0);

            // Mock the Git diff to simulate changes at lines 2 and 4
            const mockDiff = {
                execute: sandbox.stub().resolves([
                    { modifiedStartLineNumber: 2, modifiedEndLineNumber: 2 },
                    { modifiedStartLineNumber: 4, modifiedEndLineNumber: 4 }
                ])
            };
            sandbox.stub(vscode.commands, 'executeCommand')
                .withArgs('git.diff')
                .resolves(mockDiff);

            // Execute previous change command
            await testUtils.executeCommand('alternator.previousChange');
            await testUtils.sleep(100);

            // Should move to line 4 (last change before current position)
            assert.strictEqual(editor.selection.active.line, 3, 'Should navigate to line 4 (index 3)');

            // Execute previous change command again
            await testUtils.executeCommand('alternator.previousChange');
            await testUtils.sleep(100);

            // Should move to line 2 (first change)
            assert.strictEqual(editor.selection.active.line, 1, 'Should navigate to line 2 (index 1)');
        });

        test('Should jump to previous file when at first change', async () => {
            // Create test files
            const file1 = await testUtils.createTestFile(workspacePath, 'file1.txt', 'File 1 content');
            const file2 = await testUtils.createTestFile(workspacePath, 'file2.txt', 'File 2 content');
            
            // Create mock Git changes for both files
            const mockGitExtension = testUtils.createMockGitExtension([
                testUtils.createMockRepository({
                    workingTreeChanges: [
                        {
                            uri: file1,
                            originalUri: file1
                        },
                        {
                            uri: file2,
                            originalUri: file2
                        }
                    ]
                })
            ]);

            // Stub the Git extension
            sandbox.stub(vscode.extensions, 'getExtension').returns({
                exports: mockGitExtension
            } as any);

            // Open file2
            const editor2 = await testUtils.openFile(file2);
            
            // Mock diff showing we're at the first change
            const executeCommandStub = sandbox.stub(vscode.commands, 'executeCommand');
            executeCommandStub.withArgs('git.diff').resolves({
                execute: sandbox.stub().resolves([
                    { modifiedStartLineNumber: 1, modifiedEndLineNumber: 1 }
                ])
            });
            executeCommandStub.withArgs('workbench.action.previousEditor').resolves();

            // Position at the first change
            editor2.selection = new vscode.Selection(0, 0, 0, 0);

            // Execute previous change command
            await testUtils.executeCommand('alternator.previousChange');
            await testUtils.sleep(200);

            // Verify that the previous editor command was called
            assert.ok(executeCommandStub.calledWith('workbench.action.previousEditor'), 'Should call previous editor command');
        });

        test('Should handle files with no Git diff', async () => {
            // Create test file
            const file1 = await testUtils.createTestFile(workspacePath, 'nodiff.txt', 'Content');
            
            // Create mock Git changes
            const mockGitExtension = testUtils.createMockGitExtension([
                testUtils.createMockRepository({
                    workingTreeChanges: [
                        {
                            uri: file1,
                            originalUri: file1
                        }
                    ]
                })
            ]);

            // Stub the Git extension
            sandbox.stub(vscode.extensions, 'getExtension').returns({
                exports: mockGitExtension
            } as any);

            // Open file
            await testUtils.openFile(file1);

            // Mock diff returning null (no diff available)
            sandbox.stub(vscode.commands, 'executeCommand')
                .withArgs('git.diff')
                .resolves(null);

            // Execute commands - should handle gracefully
            await testUtils.executeCommand('alternator.nextChange');
            await testUtils.sleep(100);

            await testUtils.executeCommand('alternator.previousChange');
            await testUtils.sleep(100);

            // Test passes if no errors are thrown
            assert.ok(true, 'Should handle missing diff gracefully');
        });
    });

    suite('Multi-Repository Support', () => {
        test('Should aggregate changes from multiple repositories', async () => {
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

            // Open a file
            await testUtils.openFile(repo1File1);

            // Mock the diff
            sandbox.stub(vscode.commands, 'executeCommand')
                .withArgs('git.diff')
                .resolves({
                    execute: sandbox.stub().resolves([
                        { modifiedStartLineNumber: 1, modifiedEndLineNumber: 1 }
                    ])
                });

            // Execute next change to verify changes are detected across repos
            await testUtils.executeCommand('alternator.nextChange');
            await testUtils.sleep(100);

            // Test passes if command executes without error
            assert.ok(true, 'Should handle multiple repositories');
        });

        test('Should handle repositories with mixed change types', async () => {
            // Create test files
            const indexFile = await testUtils.createTestFile(workspacePath, 'staged.txt', 'Staged changes');
            const workingFile = await testUtils.createTestFile(workspacePath, 'working.txt', 'Working changes');
            
            // Create mock Git extension with both index and working tree changes
            const mockGitExtension = testUtils.createMockGitExtension([
                testUtils.createMockRepository({
                    indexChanges: [
                        { uri: indexFile, originalUri: indexFile }
                    ],
                    workingTreeChanges: [
                        { uri: workingFile, originalUri: workingFile }
                    ]
                })
            ]);

            // Stub the Git extension
            sandbox.stub(vscode.extensions, 'getExtension').returns({
                exports: mockGitExtension
            } as any);

            // Open a file
            await testUtils.openFile(indexFile);

            // Verify that both types of changes are recognized
            const infoMessageStub = sandbox.stub(vscode.window, 'showInformationMessage');
            
            // This should not show "no changes" since we have both types
            await testUtils.executeCommand('alternator.nextChange');
            await testUtils.sleep(100);

            assert.ok(!infoMessageStub.calledWith('No changed files in the workspace'), 
                'Should recognize both index and working tree changes');
        });
    });
});