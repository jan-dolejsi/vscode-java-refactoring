/*
 * Copyright (c) Jan Dolejsi 2022. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
'use strict';

export class MethodCallArgumentParser {

	private readonly argumentAtoms: ExpressionAtom[] = [];
	
	private _isInvalidSyntax = false;
	public get isInvalidSyntax(): boolean {
		return this._isInvalidSyntax;
	}

	private _length: number;
	public get length(): number {
		return this._length;
	}

	constructor(methodArguments: string) {
		let wasInside = false;
		let bracketLevel = 0;
		// when it is undefined, we are outside of the atoms
		let quote: string | undefined = undefined;
		let i = 0;
		let argument = '';
		
		let prevCh = '';
		for (; i < methodArguments.length; i++) {
			const ch = methodArguments[i];

			switch (ch) {
				case '(':
					bracketLevel++;
					wasInside = true;
					if (bracketLevel > 1) {
						argument += ch;
					}
					break;
				case ')':
					if (bracketLevel > 1) {
						argument += ch;
					}
					bracketLevel--;
					break;
				// todo: handle line comments
				// todo: handle block comments
				default:
					if (bracketLevel == 1) {
						if (!quote) {
							// we are outside the atoms
							if (ch === '"' || ch === "'") {
								quote = ch;
								argument += ch;
							} else if (ch.match(/\s+/)) {
								// ignore whitespace
							} else if (ch === '+') {
								// close argument / start new argument
								this.argumentAtoms.push(ExpressionAtom.createAtom(argument));
								argument = '';
							} else {
								// variable
								argument += ch;
							}
						} else {
							if (ch === quote && prevCh !== "\\") {
								// string literal is now closed
								quote = undefined;
								argument += ch;
							} else {
								// we are inside a string literal
								argument += ch;
							}
						}
					} else {
						argument += ch;
					}
			}

			if (bracketLevel == 0 && wasInside) {
				// end of the method arguments
				break;
			}

			prevCh = ch;
		}

		if (bracketLevel > 0 || !wasInside) {
			this._isInvalidSyntax = true;
		}

		// add the last argument
		this.argumentAtoms.push(ExpressionAtom.createAtom(argument));
		this._length = i + 1;
	}

	public getArguments(): Expression[] {
		const arg0: StringExpression = {
			atoms: this.argumentAtoms
		};
		return [arg0];
	}
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Expression {

}

export abstract class ExpressionAtom {
	abstract get isConstant(): boolean;
	abstract get isString(): boolean;
	abstract get isNumeric(): boolean;
	abstract toString(): string;

	static createAtom(text: string): ExpressionAtom {
		if (text.match(/^\s*("|')/)) {
			return new StringLiteral(text.substring(1, text.length - 1));
		} else if (text.match(/^\s*\d/)) {
			if (text.match(/[\\.e]/)) {
				return new NumericLiteral(Number.parseFloat(text));
			} else {
				return new NumericLiteral(Number.parseInt(text));
			}
		} else {
			return new VariableAtom(text.trim());
		}
	}
}

export class StringLiteral extends ExpressionAtom {	
	constructor(public readonly value: string) {
		super();
	}
	get isConstant(): boolean {
		return true;
	}
	get isString(): boolean {
		return true;
	}
	get isNumeric(): boolean {
		return false;
	}
	toString(): string {
		return this.value;
	}
}

export class NumericLiteral extends ExpressionAtom {	
	constructor(public readonly value: number) {
		super();
	}
	get isConstant(): boolean {
		return true;
	}
	get isString(): boolean {
		return false;
	}
	get isNumeric(): boolean {
		return true;
	}
	toString(): string {
		return this.value.toString();
	}
}

export class VariableAtom extends ExpressionAtom {
	constructor(public readonly variable: string) {
		super();
	}
	get isConstant(): boolean {
		return false;
	}
	get isString(): boolean {
		return false;
	}
	get isNumeric(): boolean {
		return false;
	}
	toString(): string {
		return this.variable;
	}
}

export interface StringExpression {
	atoms: ExpressionAtom[];
}