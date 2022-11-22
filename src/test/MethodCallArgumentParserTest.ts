/* --------------------------------------------------------------------------------------------
 * Copyright (c) Jan Dolejsi. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { expect } from 'chai';
import { MethodCallArgumentParser, NumericLiteral, StringExpression } from '../MethodCallArgumentParser';

describe('MethodCallArgumentParser', () => {

    describe('#constructor', () => {

        it('refuses to parse invalid syntax', () => {
            // GIVEN
            const atom0 = `a`;
            const args = `('${atom0}'`;
            // WHEN
            const parser = new MethodCallArgumentParser(args);

            // THEN
            expect(parser.isInvalidSyntax, "invalid syntax").to.be.true;
        });

        it('should parse single character arg', () => {
            // GIVEN
            const atom0 = `a`;
            const args = `('${atom0}')`;
            // WHEN
            const parser = new MethodCallArgumentParser(args);

            // THEN
            expect(parser.isInvalidSyntax, "invalid syntax").to.be.false;
            expect(parser.length, "args string length").to.equal(args.length);
            expect(parser.getArguments()).to.have.length(1);
            const argumentAtoms = parser.getArguments()[0] as StringExpression;
            expect(argumentAtoms.atoms, "arg atoms").to.have.length(1);
            expect(argumentAtoms.atoms[0].isConstant, "atom0 isConstant").to.be.true;
            expect(argumentAtoms.atoms[0].isNumeric, "atom0 isNumeric").to.be.false;
            expect(argumentAtoms.atoms[0].isString, "atom0 isString").to.be.true;
            expect(argumentAtoms.atoms[0].toString(), "atom0").to.equal(atom0);
        });

        it('should parse single integer arg', () => {
            // GIVEN
            const atom0 = 123;
            const args = `(${atom0})`;
            // WHEN
            const parser = new MethodCallArgumentParser(args);

            // THEN
            expect(parser.isInvalidSyntax, "invalid syntax").to.be.false;
            expect(parser.length, "args string length").to.equal(args.length);
            expect(parser.getArguments()).to.have.length(1);
            const argumentAtoms = parser.getArguments()[0] as StringExpression;
            expect(argumentAtoms.atoms, "arg atoms").to.have.length(1);
            expect(argumentAtoms.atoms[0].isConstant, "atom0 isConstant").to.be.true;
            expect(argumentAtoms.atoms[0].isNumeric, "atom0 isNumeric").to.be.true;
            expect(argumentAtoms.atoms[0].isString, "atom0 isString").to.be.false;
            expect((argumentAtoms.atoms[0] as NumericLiteral).value, "atom0").to.equal(atom0);
            expect(argumentAtoms.atoms[0].toString(), "atom0").to.equal("" + atom0);
        });

        it('should parse single string literal arg', () => {
            // GIVEN
            const atom0 = `Simple`;
            // WHEN
            const parser = new MethodCallArgumentParser(`("${atom0}")`);

            // THEN
            expect(parser.isInvalidSyntax, "invalid syntax").to.be.false;
            expect(parser.getArguments()).to.have.length(1);
            const argumentAtoms = parser.getArguments()[0] as StringExpression;
            expect(argumentAtoms.atoms, "arg atoms").to.have.length(1);
            expect(argumentAtoms.atoms[0].isConstant, "atom0 isConstant").to.be.true;
            expect(argumentAtoms.atoms[0].isNumeric, "atom0 isNumeric").to.be.false;
            expect(argumentAtoms.atoms[0].isString, "atom0 isString").to.be.true;
            expect(argumentAtoms.atoms[0].toString(), "atom0").to.equal(atom0);
        });

        it('should parse single variable arg', () => {
            // GIVEN
            const atom0 = `var1`;
            // WHEN
            const parser = new MethodCallArgumentParser(`(${atom0})`);

            // THEN
            expect(parser.isInvalidSyntax, "invalid syntax").to.be.false;
            expect(parser.getArguments()).to.have.length(1);
            const argumentAtoms = parser.getArguments()[0] as StringExpression;
            expect(argumentAtoms.atoms, "arg atoms").to.have.length(1);
            expect(argumentAtoms.atoms[0].isConstant, "atom0 isConstant").to.be.false;
            expect(argumentAtoms.atoms[0].isNumeric, "atom0 isNumeric").to.be.false;
            expect(argumentAtoms.atoms[0].isString, "atom0 isString").to.be.false;
            expect(argumentAtoms.atoms[0].toString(), "atom0").to.equal(atom0);
        });

        it('should parse single literal arg incl escaped double-quotes', () => {
            // GIVEN
            const atom0 = `Text is \\"double-quoted\\"`;
            // WHEN
            const parser = new MethodCallArgumentParser(`("${atom0}")`);

            // THEN
            expect(parser.isInvalidSyntax, "invalid syntax").to.be.false;
            expect(parser.getArguments()).to.have.length(1);
            const argumentAtoms = parser.getArguments()[0] as StringExpression;

            expect(argumentAtoms.atoms, "arg atoms").to.have.length(1);
            expect(argumentAtoms.atoms[0].isConstant, "atom0 isConstant").to.be.true;
            expect(argumentAtoms.atoms[0].toString(), "atom0").to.equal(atom0);
        });

        it('should parse single literal arg incl single-quotes', () => {
            // GIVEN
            const atom0 = `Text is 'single-quoted'`;
            // WHEN
            const parser = new MethodCallArgumentParser(`("${atom0}")`);

            // THEN
            expect(parser.isInvalidSyntax, "invalid syntax").to.be.false;
            expect(parser.getArguments()).to.have.length(1);
            const argumentAtoms = parser.getArguments()[0] as StringExpression;

            expect(argumentAtoms.atoms, "arg atoms").to.have.length(1);
            expect(argumentAtoms.atoms[0].isConstant, "atom0 isConstant").to.be.true;
            expect(argumentAtoms.atoms[0].toString(), "atom0").to.equal(atom0);
        });

        it('should parse single literal arg surrounded by whitespace', () => {
            // GIVEN
            const atom0 = `surrounded`;
            // WHEN
            const parser = new MethodCallArgumentParser(`(\n\t"${atom0}"\n)`);

            // THEN
            expect(parser.isInvalidSyntax, "invalid syntax").to.be.false;
            expect(parser.getArguments()).to.have.length(1);
            const argumentAtoms = parser.getArguments()[0] as StringExpression;

            expect(argumentAtoms.atoms, "arg atoms").to.have.length(1);
            expect(argumentAtoms.atoms[0].isConstant, "atom0 isConstant").to.be.true;
            expect(argumentAtoms.atoms[0].toString(), "atom0").to.equal(atom0);
        });

        it('should parse two literal args: string and char', () => {
            // GIVEN
            const atom0 = `Text`;
            const atom1 = `1`;
            // WHEN
            const parser = new MethodCallArgumentParser(`("${atom0}" + '${atom1}')`);

            // THEN
            expect(parser.isInvalidSyntax, "invalid syntax").to.be.false;
            expect(parser.getArguments()).to.have.length(1);
            const argumentAtoms = parser.getArguments()[0] as StringExpression;

            expect(argumentAtoms.atoms, "arg atoms").to.have.length(2);
            expect(argumentAtoms.atoms[0].isConstant, "atom0 isConstant").to.be.true;
            expect(argumentAtoms.atoms[0].toString(), "atom0").to.equal(atom0);
            expect(argumentAtoms.atoms[1].isConstant, "atom1 isConstant").to.be.true;
            expect(argumentAtoms.atoms[1].isString, "atom1 isConstant").to.be.true;
            expect(argumentAtoms.atoms[1].toString(), "atom1").to.equal(atom1);
        });

        it('should parse two literal args: string and int', () => {
            // GIVEN
            const atom0 = `Text`;
            const atom1 = 1;
            // WHEN
            const parser = new MethodCallArgumentParser(`("${atom0}" + ${atom1})`);

            // THEN
            expect(parser.isInvalidSyntax, "invalid syntax").to.be.false;
            expect(parser.getArguments()).to.have.length(1);
            const argumentAtoms = parser.getArguments()[0] as StringExpression;

            expect(argumentAtoms.atoms, "arg atoms").to.have.length(2);
            expect(argumentAtoms.atoms[0].isConstant, "atom0 isConstant").to.be.true;
            expect(argumentAtoms.atoms[0].toString(), "atom0").to.equal(atom0);
            expect(argumentAtoms.atoms[1].isConstant, "atom1 isConstant").to.be.true;
            expect(argumentAtoms.atoms[1].isNumeric, "atom1 isConstant").to.be.true;
            expect((argumentAtoms.atoms[1] as NumericLiteral).value, "atom1").to.equal(atom1);
        });

        it('should parse two literal args: string and float', () => {
            // GIVEN
            const atom0 = `Text`;
            const atom1 = 3.14;
            // WHEN
            const parser = new MethodCallArgumentParser(`("${atom0}" + ${atom1})`);

            // THEN
            expect(parser.isInvalidSyntax, "invalid syntax").to.be.false;
            expect(parser.getArguments()).to.have.length(1);
            const argumentAtoms = parser.getArguments()[0] as StringExpression;
            expect(argumentAtoms.atoms, "arg atoms").to.have.length(2);
            expect(argumentAtoms.atoms[0].isConstant, "atom0 isConstant").to.be.true;
            expect(argumentAtoms.atoms[0].toString(), "atom0").to.equal(atom0);
            expect(argumentAtoms.atoms[1].isConstant, "atom1 isConstant").to.be.true;
            expect((argumentAtoms.atoms[1] as NumericLiteral).value, "atom1").to.equal(atom1);
        });

        it('should parse two literal args and two variable args', () => {
            // GIVEN
            const atom0 = `Var1=`;
            const atom1 = 3.14;
            const atom2 = ', var2=';
            const atom3 = 123;
            // WHEN
            const parser = new MethodCallArgumentParser(`("${atom0}" + ${atom1} + "${atom2}" + ${atom3})`);

            // THEN
            expect(parser.isInvalidSyntax, "invalid syntax").to.be.false;
            expect(parser.getArguments()).to.have.length(1);
            const argumentAtoms = parser.getArguments()[0] as StringExpression;
            expect(argumentAtoms.atoms, "arg atoms").to.have.length(4);
            expect(argumentAtoms.atoms[0].isConstant, "atom0 isConstant").to.be.true;
            expect(argumentAtoms.atoms[0].toString(), "atom0").to.equal(atom0);
            expect(argumentAtoms.atoms[1].isConstant, "atom1 isConstant").to.be.true;
            expect((argumentAtoms.atoms[1] as NumericLiteral).value, "atom1").to.equal(atom1);
        });

        it('should parse method call', () => {
            // GIVEN
            const atom0 = `methodCall("Simple")`;
            const args = `(${atom0})`;
            // WHEN
            const parser = new MethodCallArgumentParser(args);

            // THEN
            expect(parser.isInvalidSyntax, "invalid syntax").to.be.false;
            expect(parser.length, "args string length").to.equal(args.length);
            expect(parser.getArguments()).to.have.length(1);
            const argumentAtoms = parser.getArguments()[0] as StringExpression;
            expect(argumentAtoms.atoms, "arg atoms").to.have.length(1);
            expect(argumentAtoms.atoms[0].isConstant, "atom0 isConstant").to.be.false;
            expect(argumentAtoms.atoms[0].isNumeric, "atom0 isNumeric").to.be.false;
            expect(argumentAtoms.atoms[0].isString, "atom0 isString").to.be.false;
            expect(argumentAtoms.atoms[0].toString(), "atom0").to.equal(atom0);
        });
    });
});
