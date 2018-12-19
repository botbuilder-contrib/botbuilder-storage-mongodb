import { Storage, StoreItems } from 'botbuilder';
import { MongoClient, Collection } from 'mongodb';

export interface MongoDbStorageSettings {
  url: string;
  database: string;
  collection: string;
}

interface MongoDocumentStoreItem {
  _id: string;
  state: any;
}

export class MongoDbStorage implements Storage {
  private settings: any;
  private client: any;

  constructor(settings: MongoDbStorageSettings) {
    if (!settings) {
      throw new Error('The settings parameter is required.');
    }
    if (!settings.url || settings.url.trim() === '') {
      throw new Error('The settings url required.');
    }
    if (!settings.database || settings.database.trim() === '') {
      throw new Error('The settings dataBase name is required.');
    }
    if (!settings.collection || settings.collection.trim() === '') {
      settings.collection = 'botframeworkstate';
    }
    this.settings = { ...settings };
  }

  public async connect() {
    this.client = await MongoClient.connect(this.settings.url, { useNewUrlParser: true })
  }

  public async read(stateKeys: string[]): Promise<StoreItems> {
    if (!stateKeys || stateKeys.length == 0) {
      return {};
    }

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

    const operations = [];

    Object.keys(changes).forEach(key => {
      const state = changes[key];
      operations.push({
        updateOne: {
          filter: MongoDbStorage.createFilter(key, state.eTag),
          update: {
            $set: {
              state: state,
              dt: new Date()
            }
          },
          upsert: true
        }
      })
    })

    const bulkResults = await this.Collection.bulkWrite(operations);
    /// TODO: process results to properly communicate failure.

  }

  public async delete(keys: string[]): Promise<void> {
    await this.Collection.deleteMany({ _id: { $in: keys } });
  }

  public static createFilter(key: string, etag: any) {
    if (etag === '*' || !etag) {
      return { _id: key };
    }
    return { _id: key, 'state.eTag': etag };
  }
  get Collection(): Collection<MongoDocumentStoreItem> {
    return this.client.db(this.settings.database).collection(this.settings.collection);
  }
}
