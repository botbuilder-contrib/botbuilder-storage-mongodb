import { MongoClientOptions } from 'mongodb';
export interface MongoDbStorageConfig {
  url: string;
  database?: string;
  collection?: string;
  clientOptions?: MongoClientOptions;
}
