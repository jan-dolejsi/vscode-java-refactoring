/*
 * Copyright (c) Jan Dolejsi 2022. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
'use strict';

import { } from 'vscode';


export function throwForUndefined<T>(part: string): T {
    throw new Error(`No ${part} defined.`);
}

export function assertDefined<T>(value: T | undefined, message: string): T {
    if (value === undefined || value === null) {
        throw new Error("Assertion error: " + message);
    }
    else {
        return value;
    }
}