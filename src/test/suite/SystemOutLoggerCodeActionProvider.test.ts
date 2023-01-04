/*
 * Copyright (c) Jan Dolejsi 2022. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as assert from 'assert';
import { expect } from 'chai';
import { before } from 'mocha';

import * as vscode from 'vscode';
import { SystemOutLoggerCodeActionProvider } from '../../SystemOutLoggerCodeActionProvider';
import { assertStrictEqualDecorated } from './testUtils';

let refactoringProvider: SystemOutLoggerCodeActionProvider;

suite('SystemOutLoggerCodeActionProvider Test Suite', () => {

	let tokenSource: vscode.CancellationTokenSource;

	before(async () => {
		vscode.window.showInformationMessage('Start all tests.');
		tokenSource = new vscode.CancellationTokenSource();
		refactoringProvider = new SystemOutLoggerCodeActionProvider();
	});

	test('Refactors out.println(string)', async () => {
		const initialText = `\tSystem.out.println("Simple");`;
		const expectedText = `\tlogger.debug("Simple");`;
		await testRefactoring(initialText, expectedText, 3);
	});

	test('Refactors out.print(string)', async () => {
		const initialText = `\tSystem.out.print("Simple");`;
		const expectedText = `\tlogger.debug("Simple");`;
		await testRefactoring(initialText, expectedText, 3);
	});

	test('Refactors out.print(int)', async () => {
		const initialText = `\tSystem.out.print(123);`;
		const expectedText = `\tlogger.debug("{}", 123);`;
		await testRefactoring(initialText, expectedText, 3);
	});

	
	test('Refactors out.print(int) with lombok', async () => {
		const initialText = `@Slf4j\tSystem.out.print(123);`;
		const expectedText = `@Slf4j\tlog.debug("{}", 123);`;
		await testRefactoring(initialText, expectedText, 3, '@Slf4j\tS'.length);
	});

	test('Refactors out.print(var1)', async () => {
		const initialText = `\tSystem.out.print(var1);`;
		const expectedText = `\tlogger.debug("{}", var1);`;
		await testRefactoring(initialText, expectedText, 3);
	});

	test('Refactors err.println(string)', async () => {
		const initialText = `\tSystem.err.print("Simple");`;
		const expectedText = `\tlogger.error("Simple");`;
		await testRefactoring(initialText, expectedText, 1);
	});

	test('Refactors and removes whitespace out.println(string)', async () => {
		const initialText = `\tSystem.out.println( "Simple"   \n);`;
		const expectedText = `\tlogger.debug("Simple");`;
		await testRefactoring(initialText, expectedText, 3);
	});

	test('Refactors out.println(string + string)', async () => {
		const initialText = `\tSystem.out.println("Simple" + '1');`;
		const expectedText = `\tlogger.debug("Simple1");`;
		await testRefactoring(initialText, expectedText, 3);
	});

	test('Refactors out.println(string + int)', async () => {
		const initialText = `\tSystem.out.println("Simple " + 1);`;
		const expectedText = `\tlogger.debug("Simple {}", 1);`;
		await testRefactoring(initialText, expectedText, 3);
	});

	test('Refactors out.println(string + var + string + var)', async () => {
		const initialText = `\tSystem.out.println("Var1=" + var1 + ", var2=" + var2);`;
		const expectedText = `\tlogger.debug("Var1={}, var2={}", var1, var2);`;
		await testRefactoring(initialText, expectedText, 3);
	});

	test('Refactors out.println(methodCall("arg", 123))', async () => {
		const initialText = `\tSystem.out.println(methodCall("arg", 123));`;
		const expectedText = `\tlogger.debug("{}", methodCall("arg", 123));`;
		await testRefactoring(initialText, expectedText, 3);
	});

	test('Does not refactor unfinished', async () => {
		const initialText = `\tSystem.out.println("Simple "`;
		const expectedText = `N/A`;
		await testRefactoring(initialText, expectedText, 0);
	});

	test('Does not refactor unfinished2', async () => {
		const initialText = `\tSystem.out.println(call("Simple "`;
		const expectedText = `N/A`;
		await testRefactoring(initialText, expectedText, 0);
	});

	test('Does not refactor missing arguments', async () => {
		const initialText = `\tSystem.out.println   `;
		const expectedText = `N/A`;
		await testRefactoring(initialText, expectedText, 0);
	});
});


async function testRefactoring(initialText: string, expectedText: string, expectedCodeActions: number, cursorPosition=1): Promise<void> {
    // we do not want the extension to actually load (it takes too much time), so use a fake language
    const doc = await vscode.workspace.openTextDocument({ language: 'java-do-not-load-extensions', content: initialText });
    const editor = await vscode.window.showTextDocument(doc);
    
    // move the cursor into the text
    await vscode.commands.executeCommand("cursorMove", { to: 'right', by: 'character', value: cursorPosition });
    const startSelectionBefore = editor.selection.start;
    
    // WHEN
	const codeActions = refactoringProvider.provideCodeActions(doc, editor.selection);
	if (expectedCodeActions === 0) {
		expect(codeActions, "code actions").is.undefined;
		return;
	}
	expect(codeActions, "code actions").is.not.undefined;
	expect(codeActions, "code actions").to.have.length(expectedCodeActions);

	const preferredCodeActions = codeActions!.filter(ca => ca.isPreferred);
	expect(preferredCodeActions, "preferred code actions").to.have.length(1);
	const preferredCodeAction = preferredCodeActions[0];
	expect(preferredCodeAction.edit).to.not.be.undefined;
	if (preferredCodeAction.edit!.entries()) {
		const wsEdits = preferredCodeAction.edit!.entries();
		const docEdits = wsEdits.filter(wse=>wse[0].toString() === doc.uri.toString()).flatMap(wse => wse[1]);
        await editor.edit(builder => reBuild(builder, docEdits));
    }
    else {
        assert.fail('no edits returned');
    }

    // THEN
    const startSelectionAfter = editor.selection.start;
    const textAfter = doc.getText();
    assertStrictEqualDecorated(textAfter, expectedText, "document text should be refactored");
    assert.deepStrictEqual(startSelectionAfter, startSelectionBefore, "cursor position should be the same");
}

function reBuild(builder: vscode.TextEditorEdit, edits: vscode.TextEdit[]): void {
    edits.forEach(edit =>
        builder.replace(edit.range, edit.newText));
}