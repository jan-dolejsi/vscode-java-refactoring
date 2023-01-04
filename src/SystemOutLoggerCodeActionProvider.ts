/*
 * Copyright (c) Jan Dolejsi 2022. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
'use strict';
import * as vscode from 'vscode';
import { LoggerArgumentProcessor } from './LoggerArgumentProcessor';
import { MethodCallArgumentParser, StringExpression } from './MethodCallArgumentParser';

/**
 * Provides code actions for converting System.out or .err to logger.
 */
export class SystemOutLoggerCodeActionProvider implements vscode.CodeActionProvider {

	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];

	public provideCodeActions(document: vscode.TextDocument, range: vscode.Range): vscode.CodeAction[] | undefined {
		const allPriorText = document.getText(new vscode.Range(new vscode.Position(0, 0), range.end));
		const lombokActive = !!allPriorText.match(/@Slf4j\b/);
		const systemOutMatch = this.getSystemOutArguments(document, range);
		if (!systemOutMatch) {
			return;
		}

		if (systemOutMatch.stream == SystemStream.ERR) {
			const replaceWithLoggerError = this.createCodeAction(document, systemOutMatch, lombokActive, 'error');
			replaceWithLoggerError.isPreferred = true;
			return [replaceWithLoggerError];
		}

		const replaceWithLoggerInfo = this.createCodeAction(document, systemOutMatch, lombokActive, 'info');
		// Marking a single fix as `preferred` means that users can apply it with a
		// single keyboard shortcut using the `Auto Fix` command.
		const replaceWithLoggerDebug = this.createCodeAction(document, systemOutMatch, lombokActive, 'debug');
		replaceWithLoggerDebug.isPreferred = true;
		const replaceWithLoggerTrace = this.createCodeAction(document, systemOutMatch, lombokActive, 'trace');

		return [
			replaceWithLoggerInfo,
			replaceWithLoggerDebug,
			replaceWithLoggerTrace,
		];
	}

	private createCodeAction(document: vscode.TextDocument, match: SystemOutArgumentMatch, lombokActive: boolean, severity: string): vscode.CodeAction {
		const loggerReference = lombokActive ? 'log' : 'logger';
		const fix = new vscode.CodeAction(`Convert to ${loggerReference}.${severity}`, vscode.CodeActionKind.QuickFix);
		fix.edit = this.createEdits(document, match, loggerReference, severity);
		return fix;
	}

	private createEdits(document: vscode.TextDocument, match: SystemOutArgumentMatch, loggerReference: string, severity: string): vscode.WorkspaceEdit | undefined {
		const edit = new vscode.WorkspaceEdit();
		if (match) {
			const methodEnd = match.start.translate(0, match.methodMatch.length);
			// replace method call
			edit.replace(document.uri, new vscode.Range(match.start, methodEnd), `${loggerReference}.${severity}`);
			// refactor arguments
			edit.replace(document.uri,
				new vscode.Range(
					methodEnd.translate({ characterDelta: +1 }),
					match.end.translate({ characterDelta: -1 })),
				this.refactorArguments(match.argument));
		}
		return edit;
	}

	private refactorArguments(argument: StringExpression): string {
		const processor = new LoggerArgumentProcessor(argument);
		return processor.getReplacementString();
	}

	private getSystemOutMatch(document: vscode.TextDocument, range: vscode.Range): SystemOutMatch | null {
		const start = range.start;
		const line = document.lineAt(start.line);
		const pattern = /\bSystem\.(out|err)\.(println|print)\b/;
		const match = line.text.match(pattern);
		return match && {
			start: start.with(start.line, match.index),
			methodMatch: match[0],
			stream: match[1] == 'out' ? SystemStream.OUT : SystemStream.ERR,
			method: match[2]
		};
	}

	private getSystemOutArguments(document: vscode.TextDocument, range: vscode.Range): SystemOutArgumentMatch | null {
		const match = this.getSystemOutMatch(document, range);
		if (!match) {
			return null;
		}
		const endOfMatch = match.start.translate(0, match.methodMatch.length);
		const remainingText = document.getText(new vscode.Range(endOfMatch, document.validatePosition(new vscode.Position(Number.MAX_VALUE, Number.MAX_VALUE))));

		// parse remainingText to find the ');' and extract arguments
		const parser = new MethodCallArgumentParser(remainingText);

		if (parser.isInvalidSyntax) {
			return null;
		}

		return {
			methodMatch: match.methodMatch,
			method: match.method,
			start: match.start,
			stream: match.stream,
			argument: parser.getArguments()[0] as StringExpression,
			end: document.positionAt(document.offsetAt(endOfMatch) + parser.length),
		};
	}
}

enum SystemStream {
	OUT, ERR
}

interface SystemOutMatch {
	/** Start of the `System.` call. */
	start: vscode.Position;
	/** Method form e.g. `System.err.print`. */
	methodMatch: string;
	/** Name of the output stream. */
	stream: SystemStream;
	/** Println or print. */
	method: string;
}

interface SystemOutArgumentMatch extends SystemOutMatch {
	/** Position of the closing parentheses. */
	end: vscode.Position;
	/** String expression argument. */
	argument: StringExpression;
}
