import { Storage, StoreItems } from 'botbuilder';
import { MongoClient, Collection, ObjectID, MongoClientOptions } from 'mongodb';
import { connect } from 'tls';




export interface MongoDbStorageConfig {
  url: string;
  database?: string;
  collection?: string;
  options?: MongoClientOptions;
}

export class MongoDbStorageError extends Error {
  public static readonly NO_CONFIG_ERROR: MongoDbStorageError = new MongoDbStorageError('MongoDbStorageConfig is required.');
  public static readonly NO_URL_ERROR: MongoDbStorageError = new MongoDbStorageError('MongoDbStorageConfig.url is required.');
}

interface MongoDocumentStoreItem {
  _id: string;
  state: any;
}

export class MongoDbStorage implements Storage {
  private config: MongoDbStorageConfig;
  private client: MongoClient;
  static readonly DEFAULT_COLLECTION_NAME: string = "BotFrameworkState";
  static readonly DEFAULT_DB_NAME: string = "BotFramework";
  static readonly DEFAULT_OPTIONS: MongoClientOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true
  } as MongoClientOptions

  constructor(config: MongoDbStorageConfig) {
    this.config = MongoDbStorage.ensureConfig({ ...config });
  }

  public static ensureConfig(config: MongoDbStorageConfig): MongoDbStorageConfig {
    if (!config) {
      throw MongoDbStorageError.NO_CONFIG_ERROR;
    }

    if (!config.url || config.url.trim() === '') {
      throw MongoDbStorageError.NO_URL_ERROR;
    }

    if (!config.database || config.database.trim() == '') {
      config.database = MongoDbStorage.DEFAULT_DB_NAME;
    }

    if (!config.collection || config.collection.trim() == '') {
      config.collection = MongoDbStorage.DEFAULT_COLLECTION_NAME;
    }

    if (!config.options) {
      config.options = MongoDbStorage.DEFAULT_OPTIONS;
    }

    return config as MongoDbStorageConfig
  }

  public async connect(): Promise<MongoClient> {
    this.client = await MongoClient.connect(this.config.url, this.config.options);
    return this.client;
  }

  public async ensureConnected(): Promise<MongoClient> {
    if (!this.client) {
      await this.connect();
    }
    return this.client;
  }

  public async read(stateKeys: string[]): Promise<StoreItems> {
    if (!stateKeys || stateKeys.length == 0) {
      return {};
    }

    await this.ensureConnected();

    const docs = await this.Collection.find({ _id: { $in: stateKeys } });
    const storeItems: StoreItems = (await docs.toArray()).reduce((accum, item) => {
      accum[item._id] = item.state;
      return accum;
    }, {});

    return storeItems;
  }

  public async write(changes: StoreItems): Promise<void> {
    if (!changes || Object.keys(changes).length === 0) {
      return;
    }

    await this.ensureConnected();

    const operations = [];

    Object.keys(changes).forEach(key => {
      const state = changes[key];
      const shouldSlam = MongoDbStorage.shouldSlam(state.eTag);
      const oldETag = state.eTag;
      state.eTag = new ObjectID().toHexString();
      operations.push({
        updateOne: {
          filter: MongoDbStorage.createFilter(key, oldETag),
          update: {
            $set: {
              state: state,
              dt: new Date()
            }
          },
          upsert: shouldSlam
        }
      })
    })

    const bulkResults = await this.Collection.bulkWrite(operations);
    //TODO: process bulk results: if 0 modified, 0 upserted then throw exception because state was not mutated.
  }

  public async delete(keys: string[]): Promise<void> {
    if (!keys || keys.length == 0) {
      return;
    }
    await this.ensureConnected();
    await this.Collection.deleteMany({ _id: { $in: keys } });
  }

  public static shouldSlam(etag: any) {
    return (etag === '*' || !etag);
  }

  public static createFilter(key: string, etag: any) {
    if (this.shouldSlam(etag)) {
      return { _id: key };
    }
    return { _id: key, 'state.eTag': etag };
  }

  get Collection(): Collection<MongoDocumentStoreItem> {
    return this.client.db(this.config.database).collection(this.config.collection);
  }

  public async close() {
    if (this.client) {
      await this.client.close();
      delete this.client;
    }
  }
}
