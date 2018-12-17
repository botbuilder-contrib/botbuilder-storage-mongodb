import { Storage, StoreItems } from 'botbuilder-core';
import {MongoClient} from 'mongodb';

export class MongoDbStorage implements Storage {
  settings:any;
  client:any;
  eTag: number;
  constructor(settings){
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
  
  async read(stateKeys: string[]): Promise<StoreItems>{
    return new Promise<StoreItems>(async (resolve, reject) => {
      const storeItems: StoreItems = {};
      for(let i =0;i<stateKeys.length;i++){
        const key = stateKeys[i];
        const document : any = await this.getByKey(key);
        if(document){
          storeItems[key] = document.value;
        }
      }
      resolve(storeItems);
    });
  }
  
  async write(changes: StoreItems): Promise<void> {
    return new Promise<void>( async (resolve, reject) => {
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

  delete(keys: string[]): Promise<void> {
    return new Promise<void>((resolve, reject)=>{
      resolve();
    });
  }
  async getCollection() : Promise<any>{
    return new Promise(async (resolve, reject) => {
      if(!this.client){
        this.client = await MongoClient.connect(this.settings.url, { useNewUrlParser: true })
      }
      resolve(this.client.db(this.settings.database).collection(this.settings.collection));
    }); 
  }

  getByKey(key){
    return new Promise(async (resolve,reject)=>{
      let collection = await this.getCollection();
      collection.findOne({_id: key}, function(err, result) {
        resolve(result);
      });
    });
  }

  async insertDocument(key, item, resolve) {
    const clone = Object.assign({}, item);
    const data = {
      _id : key,
      value : clone,
      eTag : clone.eTag
    };
    const collection = await this.getCollection();
    collection.insertMany([data], function(err, result) {
      resolve(result);
    });          
  }  

  async updateDocument(key, item,resolve) {
    const query = { _id: key };
    const clone = Object.assign({}, item);
    const data = {
      _id : key,
      value : clone,
      eTag : clone.eTag
    };
    const updateStatement = { $set: data };
    const collection = await this.getCollection();
    collection.updateOne(query, updateStatement, function(err, result) {
      resolve();
    });
  } 
}
