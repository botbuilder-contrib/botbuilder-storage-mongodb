import { Storage, StoreItems } from 'botbuilder';
import { Collection, ObjectId, MongoClient, BulkWriteResult } from 'mongodb';
import { MongoDbStorageError } from './MongoDbStorageError';
import { MongoDocumentStoreItem } from './MongoDocumentStoreItem';

export class MongoDbStorage implements Storage {
  static readonly DEFAULT_COLLECTION_NAME: string = "BotFrameworkState";
  static readonly DEFAULT_DB_NAME: string = "BotFramework";

  protected readonly targetCollection: Collection<MongoDocumentStoreItem>;

  constructor(collection: Collection<MongoDocumentStoreItem>) {
    this.targetCollection = collection;
  }

  public async read(stateKeys: string[]): Promise<StoreItems> {
    if (!stateKeys || stateKeys.length == 0) {
      return {};
    }

    const docs = await (await this.targetCollection.find(MongoDbStorage.createQuery(stateKeys))).toArray();

    const storeItems: StoreItems = MongoDbStorage.packStoreItems(docs);

    return storeItems;
  }

  public async write(changes: StoreItems): Promise<void> {
    if (!changes || Object.keys(changes).length === 0) {
      return;
    }

    const operations = MongoDbStorage.createBulkOperations(changes);

    await this.targetCollection.bulkWrite(operations);    
  }

  public async delete(keys: string[]): Promise<void> {
    if (!keys || keys.length == 0) {
      return;
    }
    await this.targetCollection.deleteMany(MongoDbStorage.createQuery(keys));
  }

  public static packStoreItems(items: MongoDocumentStoreItem[]): StoreItems {
    return items.reduce((accum, item) => {
      accum[item._id] = item.state;
      return accum;
    }, {});
  }

  public static createQuery(stateKeys: string[]) {
    return { _id: { $in: stateKeys } };
  }

  public static createBulkOperations(changes: StoreItems) {
    const operations = [];

    Object.keys(changes).forEach(key => {
      const state = changes[key];
      const shouldSlam = MongoDbStorage.shouldSlam(state.eTag);
      const oldETag = state.eTag;
      state.eTag = new ObjectId().toHexString();
      operations.push({
        updateOne: {
          filter: MongoDbStorage.createFilter(key, oldETag),
          update: {
            $set: {
              state: state
            },
            $currentDate: {
              dt: { $type: 'date' }
            }
          },
          upsert: shouldSlam
        }
      });
    });
    return operations;
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

  public static getCollection(client: MongoClient, dbName: string = MongoDbStorage.DEFAULT_DB_NAME, collectionName: string = MongoDbStorage.DEFAULT_COLLECTION_NAME): Collection<MongoDocumentStoreItem> {
    return client.db(dbName).collection(collectionName)
  }
}
