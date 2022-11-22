/*
 * Copyright (c) Jan Dolejsi 2022. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
'use strict';

import * as fs from 'fs';

/**
 * Creates directory (optionally recursively) 
 * @param path path for the directory to create
 * @param options `fs.mkdir` options
 */
export async function mkdirIfDoesNotExist(path: fs.PathLike, options: fs.MakeDirectoryOptions | undefined | null | number | string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        fs.mkdir(path, options, err => {
            if (err && err.code !== 'EEXIST') {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}