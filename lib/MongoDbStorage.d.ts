import { Storage, StoreItems } from 'botbuilder';
import { MongoClient, Collection } from 'mongodb';
export interface MongoDbStorageConfig {
    url: string;
    database?: string;
    collection?: string;
}
export declare class MongoDbStorageError extends Error {
    static readonly NO_CONFIG_ERROR: MongoDbStorageError;
    static readonly NO_URL_ERROR: MongoDbStorageError;
}
interface MongoDocumentStoreItem {
    _id: string;
    state: any;
}
export declare class MongoDbStorage implements Storage {
    private config;
    private client;
    static readonly DEFAULT_COLLECTION_NAME: string;
    static readonly DEFAULT_DB_NAME: string;
    constructor(config: MongoDbStorageConfig);
    static ensureConfig(config: MongoDbStorageConfig): MongoDbStorageConfig;
    connect(): Promise<MongoClient>;
    ensureConnected(): Promise<MongoClient>;
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
    close(): Promise<void>;
}
export {};
