import { Storage, StoreItems } from 'botbuilder';
import {MongoClient} from 'mongodb';

export interface MongoDbStorageSettings {
  url: string;
  database: string;
  collection: string;
}

interface MongoDocumentStoreItem {
  _id: string;
  data: any;
  eTag: string;
}
export class MongoDbStorage implements Storage {
  private settings:any;
  private client:any;
  private eTag: number;

  constructor(settings : MongoDbStorageSettings){
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
    this.settings = {...settings};   
    this.eTag = 1;
  }
  
  public async read(stateKeys: string[]): Promise<StoreItems>{
    return new Promise<StoreItems>(async (resolve, reject) => {
      if (!stateKeys || stateKeys.length == 0) {
        return resolve({});
      }
      const storeItems: StoreItems = {};
      for(let i =0;i<stateKeys.length;i++){
        const key = stateKeys[i];
        const document : MongoDocumentStoreItem = await this.getByKey(key);
        if(document){
          storeItems[key] = document.data;
        }
      }
      resolve(storeItems);
    });
  }
  
  public async write(changes: StoreItems): Promise<void> {
    if (!changes || Object.keys(changes).length === 0) {
      return Promise.resolve();
    }

    return new Promise<void>( async (resolve: any, reject: any) => {
      Object.keys(changes).forEach(async (key) => {
        const newItem = changes[key];
        const old : any = await this.getByKey(key);
        if (!old){ 
          this.insertDocument(key, newItem, resolve);
        }
        else if(newItem.eTag === old.eTag || newItem.eTag == "*") {
          this.updateDocument(key,newItem,resolve);
        }
        else {
          reject(new Error(`Storage: error writing "${key}" due to eTag conflict.`));
        }
      });      
    });
  }

  public delete(keys: string[]): Promise<void> {
    return new Promise<void>((resolve, reject)=>{
      resolve();
    });
  }

  private async getCollection() : Promise<any>{
    return new Promise(async (resolve, reject) => {
      if(!this.client){
        this.client = await MongoClient.connect(this.settings.url, { useNewUrlParser: true })
      }
      resolve(this.client.db(this.settings.database).collection(this.settings.collection));
    }); 
  }

  private getByKey(key) : Promise<MongoDocumentStoreItem>{
    return new Promise(async (resolve,reject)=>{
      let collection = await this.getCollection();
      collection.findOne({_id: key}, function(err, result) {
        resolve(result);
      });
    });
  }

  private async insertDocument(key, item, resolve) {
    const clone = Object.assign({}, item);
    const document : MongoDocumentStoreItem = {
      _id : key,
      data : clone,
      eTag : clone.eTag
    };
    const collection = await this.getCollection();
    collection.insertMany([document], function(err, result) {
      resolve(result);
    });          
  }  

  private async updateDocument(key, item,resolve) {
    const query = { _id: key };
    const clone = Object.assign({}, item);
    const document : MongoDocumentStoreItem = {
      _id : key,
      data : clone,
      eTag : clone.eTag
    };
    const updateStatement = { $set: document };
    const collection = await this.getCollection();
    collection.updateOne(query, updateStatement, function(err, result) {
      resolve();
    });
  } 
}
