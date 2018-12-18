import { Storage, StoreItems } from 'botbuilder';
export interface MongoDbStorageSettings {
    url: string;
    database: string;
    collection: string;
}
export declare class MongoDbStorage implements Storage {
    private settings;
    private client;
    private eTag;
    constructor(settings: MongoDbStorageSettings);
    read(stateKeys: string[]): Promise<StoreItems>;
    write(changes: StoreItems): Promise<void>;
    delete(keys: string[]): Promise<void>;
    private getCollection;
    private getByKey;
    private insertDocument;
    private updateDocument;
}
