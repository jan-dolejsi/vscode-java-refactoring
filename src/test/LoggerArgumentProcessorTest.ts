/* --------------------------------------------------------------------------------------------
 * Copyright (c) Jan Dolejsi. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { expect } from 'chai';
import { LoggerArgumentProcessor } from '../LoggerArgumentProcessor';
import { NumericLiteral, StringLiteral, VariableAtom } from '../MethodCallArgumentParser';

describe('LoggerArgumentProcessor', () => {

    describe('#getReplacementString', () => {

        it('should process single character arg', () => {
            // GIVEN
            const atom0 = `a`;

            // WHEN
            const processor = new LoggerArgumentProcessor({
                atoms: [new StringLiteral(atom0)]
            });

            // THEN
            expect(processor.getMessage(), "message").to.equal(atom0);
            const expected = `"a"`;
            expect(processor.getReplacementString(), "replacement").to.equal(expected);
        });

        it('should process single integer arg', () => {
            // GIVEN
            const atom0 = 123;
            // WHEN
            const processor = new LoggerArgumentProcessor({
                atoms: [new NumericLiteral(atom0)]
            });

            // THEN
            expect(processor.getMessage(), "message").to.equal("{}");
            const expected = `"{}", 123`;
            expect(processor.getReplacementString(), "replacement").to.equal(expected);
        });

        it('should process single variable arg', () => {
            // GIVEN
            const atom0 = `var1`;
            // WHEN
            const processor = new LoggerArgumentProcessor({
                atoms: [new VariableAtom(atom0)]
            });

            // THEN
            expect(processor.getMessage(), "message").to.equal(`{}`);
            expect(processor.getReplacementString(), "replacement").to.equal(`"{}", var1`);
        });

        it('should process single literal arg incl escaped double-quotes', () => {
            // GIVEN
            const atom0 = `Text is \\"double-quoted\\"`;
            // WHEN
            const processor = new LoggerArgumentProcessor({
                atoms: [new StringLiteral(atom0)]
            });

            // THEN
            expect(processor.getMessage(), "message").to.equal(atom0);
            const expected = `"${atom0}"`;
            expect(processor.getReplacementString(), "replacement").to.equal(expected);
        });

        it('should process two literal args: string and char', () => {
            // GIVEN
            const atom0 = `Text`;
            const atom1 = `1`;
            // WHEN
            const processor = new LoggerArgumentProcessor({
                atoms: [
                    new StringLiteral(atom0),
                    new StringLiteral(atom1)
                ]
            });

            // THEN
            expect(processor.getMessage(), "message").to.equal(atom0 + atom1);
            const expected = `"Text1"`;
            expect(processor.getReplacementString(), "replacement").to.equal(expected);
        });

        it('should process two literal args: string and int', () => {
            // GIVEN
            const atom0 = `Text `;
            const atom1 = 1;
            // WHEN
            const processor = new LoggerArgumentProcessor({
                atoms: [
                    new StringLiteral(atom0),
                    new NumericLiteral(atom1)]
            });

            const expectedMessage = "Text {}";
            // THEN
            expect(processor.getMessage(), "message").to.equal(expectedMessage);
            const expected = `"${expectedMessage}", ${atom1}`;
            expect(processor.getReplacementString(), "replacement").to.equal(expected);
        });

        it('should process two literal args: string and float', () => {
            // GIVEN
            const atom0 = `Text `;
            const atom1 = 3.14;
            // WHEN
            const processor = new LoggerArgumentProcessor({
                atoms: [
                    new StringLiteral(atom0),
                    new NumericLiteral(atom1)]
            });

            // THEN
            const expectedMessage = "Text {}";
            // THEN
            expect(processor.getMessage(), "message").to.equal(expectedMessage);
            const expected = `"${expectedMessage}", ${atom1}`;
            expect(processor.getReplacementString(), "replacement").to.equal(expected);
        });

        it('should process two literal args and two variable args', () => {
            // GIVEN
            const atom0 = `Var1=`;
            const atom1 = 3.14;
            const atom2 = ', var2=';
            const atom3 = 123;
            // WHEN
            const processor = new LoggerArgumentProcessor({
                atoms: [
                    new StringLiteral(atom0),
                    new NumericLiteral(atom1),
                    new StringLiteral(atom2),
                    new NumericLiteral(atom3),
                ]
            });

            // THEN
            const expectedMessage = `Var1={}, var2={}`;
            expect(processor.getMessage(), "message").to.equal(expectedMessage);
            const expected = `"${expectedMessage}", ${atom1}, ${atom3}`;
            expect(processor.getReplacementString(), "replacement").to.equal(expected);
        });

        it('should process method call', () => {
            // GIVEN
            const atom0 = `methodCall("Simple")`;
            // WHEN
            const processor = new LoggerArgumentProcessor({
                atoms: [new VariableAtom(atom0)]
            });

            // THEN
            expect(processor.getMessage(), "message").to.equal("{}");
            const expected = `"{}", ${atom0}`;
            expect(processor.getReplacementString(), "replacement").to.equal(expected);
        });
    });
});
