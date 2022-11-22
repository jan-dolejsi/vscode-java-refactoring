/*
 * Copyright (c) Jan Dolejsi 2022. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
'use strict';

import * as vscode from 'vscode';
import { SystemOutLoggerCodeActionProvider } from './SystemOutLoggerCodeActionProvider';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider('java', new SystemOutLoggerCodeActionProvider(), {
			providedCodeActionKinds: SystemOutLoggerCodeActionProvider.providedCodeActionKinds
		}));
}