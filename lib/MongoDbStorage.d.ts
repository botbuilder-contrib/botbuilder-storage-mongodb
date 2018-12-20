import { Storage, StoreItems } from 'botbuilder';
import { Collection } from 'mongodb';
export interface MongoDbStorageSettings {
    url: string;
    database: string;
    collection: string;
}
interface MongoDocumentStoreItem {
    _id: string;
    state: any;
}
export declare class MongoDbStorage implements Storage {
    private settings;
    private client;
    constructor(settings: MongoDbStorageSettings);
    connect(): Promise<void>;
    read(stateKeys: string[]): Promise<StoreItems>;
    write(changes: StoreItems): Promise<void>;
    delete(keys: string[]): Promise<void>;
    static shouldSlam(etag: any): boolean;
    static createFilter(key: string, etag: any): {
        _id: string;
        'state.eTag'?: undefined;
    } | {
        _id: string;
        'state.eTag': any;
    };
    readonly Collection: Collection<MongoDocumentStoreItem>;
}
export {};
