/*
 * Copyright (c) Jan Dolejsi 2022. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
'use strict';

import { StringExpression, ExpressionAtom } from './MethodCallArgumentParser';

export class LoggerArgumentProcessor {

	private variableAtoms: ExpressionAtom[] = [];
	private message = '';

	constructor(expression: StringExpression) {
		const atoms = expression.atoms;
		for (let i = 0; i < atoms.length; i++) {
			const atom = atoms[i];
			if (atom.isString) {
				this.message += atom.toString();
			} else {
				// replace the variable atoms by the `{}` placeholder
				this.message += "{}";
				this.variableAtoms.push(atom);
			}
		}
	}

	public getMessage(): string {
		return this.message;
	}

	public getReplacementString(): string {
		const loggerArgs = [`"${this.message}"`].concat(this.variableAtoms.map(s => s.toString()));
		return loggerArgs.join(', ');
	}
}