import * as assert from 'assert';
import * as vscode from 'vscode';
import * as testUtils from '../testUtils';

suite('Extension Activation Tests', () => {
	test('Extension should be present', () => {
		const extension = vscode.extensions.getExtension('wingmen.alternator');
		assert.ok(extension, 'Extension should be found');
	});

	test('Extension should activate', async () => {
		const extension = vscode.extensions.getExtension('wingmen.alternator');
		assert.ok(extension, 'Extension should be found');
		
		await extension!.activate();
		assert.ok(extension!.isActive, 'Extension should be active');
	});

	test('Commands should be registered', async () => {
		await testUtils.waitForExtensionActivation();
		
		const commands = await vscode.commands.getCommands();
		
		const expectedCommands = [
			'alternator.switch',
			'alternator.nextChange',
			'alternator.previousChange',
			'alternator.nextFileWithChanges',
			'alternator.previousFileWithChanges'
		];
		
		for (const cmd of expectedCommands) {
			assert.ok(commands.includes(cmd), `Command ${cmd} should be registered`);
		}
	});
});
