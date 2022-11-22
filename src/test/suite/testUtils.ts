/*
 * Copyright (c) Jan Dolejsi 2022. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as assert from 'assert';
import * as path from 'path';
import * as os from 'os';
import * as tmp from 'tmp-promise';
import { Disposable, workspace, ExtensionContext, Memento, extensions, Event, FileType, Uri, ConfigurationTarget, EnvironmentVariableCollection, EnvironmentVariableMutator, ExtensionMode, SecretStorage, SecretStorageChangeEvent, ExtensionKind } from 'vscode';
import { assertDefined } from '../../utils';

export function assertStrictEqualDecorated(actualText: string, expectedText: string, message: string): void {
    assert.strictEqual(decorate(actualText), decorate(expectedText), message);
}

export function decorate(text: string): string {
    return text
        .split(' ').join('·')
        .split('\t').join('→')
        .split('\r').join('⤵')
        .split('\n').join('⤶');
}

class MockMemento implements Memento {
    map: Map<string, unknown>;
    constructor() {
        this.map = new Map<string, unknown>();
    }
    keys(): readonly string[] {
        throw new Error('Method not implemented.');
    }
    // will be needed for a future version of VS Code?
    // get keys(): string[] {
    //     return [...this.map.keys()];
    // }
    get<T>(key: string, defaultValue?: T): T {
        return (this.map.get(key) as T) ?? assertDefined(defaultValue, "Default value not specified");
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async update(key: string, value: any): Promise<void> {
        this.map.set(key, value);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setKeysForSync(keys: readonly string[]): void {
        console.warn(`Key syncing not supported in mock. ${keys}`);
    }
}

class MockSecretStorage implements SecretStorage {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async get(_key: string): Promise<string | undefined> {
        return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async store(_key: string, _value: string): Promise<void> {
        return void(0);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async delete(_key: string): Promise<void>{
        return void (0);
    }

    get onDidChange(): Event<SecretStorageChangeEvent> {
        throw new Error('Unsupported.');
    }
}

class MockEnvironmentVariableCollection implements EnvironmentVariableCollection {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [Symbol.iterator](): Iterator<[variable: string, mutator: EnvironmentVariableMutator], any, undefined> {
        throw new Error('Method not implemented.');
    }
    persistent = true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    replace(_variable: string, _value: string): void {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    append(_variable: string, _value: string): void {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    prepend(_variable: string, _value: string): void {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    get(_variable: string): EnvironmentVariableMutator {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    forEach(callback: (variable: string, mutator: EnvironmentVariableMutator, collection: EnvironmentVariableCollection) => any, thisArg?: any): void {
        throw new Error(`Method not implemented. ${callback}, ${thisArg}`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    delete(_variable: string): void {
        throw new Error('Method not implemented.');
    }
    clear(): void {
        throw new Error('Method not implemented.');
    }
    
}

export async function createTestExtensionContext(): Promise<ExtensionContext> {
    const storage = await tmp.dir({ prefix: 'extensionTestStoragePath' });
    // simulate the space in the 'Application\ Support' on MacOS
    const globalStoragePrefix = os.platform() === 'darwin' ? 'extensionGlobalTest StoragePath' : 'extensionGlobalTestStoragePath';
    const globalStorage = await tmp.dir({ prefix: globalStoragePrefix });
    const log = await tmp.file({ mode: 0o644, prefix: 'extensionTests', postfix: 'log' });

    return {
        asAbsolutePath: function (path: string): string { throw new Error(`Unsupported. ` + path); },
        extensionPath: '.',
        // extensionRuntime: ExtensionRuntime.Node,
        storagePath: storage.path,
        storageUri: Uri.file(storage.path),
        subscriptions: new Array<Disposable>(),
        globalState: new MockMemento(),
        workspaceState: new MockMemento(),
        globalStoragePath: globalStorage.path,
        globalStorageUri: Uri.file(globalStorage.path),
        logPath: log.path,
        logUri: Uri.file(log.path),
        environmentVariableCollection: new MockEnvironmentVariableCollection(),
        extension: {
            id: "jan-dolejsi.pddl",
            extensionUri: Uri.file(process.cwd()),
            extensionPath: process.cwd(),
            isActive: true,
            packageJSON: {},
            extensionKind: ExtensionKind.UI,
            exports: null,
            activate(): Thenable<unknown> {
                throw new Error('Method not implemented.');
            }
        },
        extensionMode: ExtensionMode.Development,
        extensionUri: Uri.file(process.cwd()),
        secrets: new MockSecretStorage(),
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function activateExtension(): Promise<any> {
    const thisExtension = assertDefined(extensions.getExtension("jan-dolejsi.java-refactoring"), `Extension 'jan-dolejsi.java-refactoring' not found`);
    if (!thisExtension.isActive) {
        return await thisExtension.activate();
    }
}

/**
 * Awaits a `T` event.
 * @param event event emitter to subscribe to 
 * @param param1 action to execute after subscribing to the event and filter to apply to events
 */
export async function waitFor<T>(event: Event<T>, { action: workload, filter }: { action?: () => void; filter?: (event: T) => boolean } = {}): Promise<T> {
    return new Promise<T>(resolve => {
        const subscription = event(e => {
            if ((filter && filter(e)) ?? true) {
                resolve(e);
                subscription.dispose();
            }
        });

        // if the workload action is defined, call it
        workload && workload();
    });
}

/**
 * Deletes all files in the workspace folder(s) recursively. 
 */
export async function clearWorkspaceFolder(): Promise<void> {

    if (!workspace.workspaceFolders) {
        console.warn('No workspace folder is open.');
        return;
    }
    else {

        const workspaceFolderDeletions = workspace.workspaceFolders.map(async wf => {
            const workspaceFolderEntries = await workspace.fs.readDirectory(wf.uri);

            const fileDeletions = workspaceFolderEntries
                .filter(entry => entry[0] !== '.gitkeep')
                .map(async entry => {
                    const [fileName, fileType] = entry;
                    const fileAbsPath = path.join(wf.uri.fsPath, fileName);
                    console.log(`Deleting ${fileAbsPath}/**`);
                    const recursive = fileType === FileType.Directory;
                    return await workspace.fs.delete(Uri.file(fileAbsPath), { recursive: recursive, useTrash: false });
                });

            await Promise.all(fileDeletions);
        });

        await Promise.all(workspaceFolderDeletions);
    }
}
