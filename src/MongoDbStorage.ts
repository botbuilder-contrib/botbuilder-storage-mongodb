import { Storage, StoreItems } from 'botbuilder-core';
import {MongoClient} from 'mongodb';
export class MongoDbStorage implements Storage {
  settings:any;
  mongoClient: any;
  eTag: number;
  constructor(){
    this.settings = {
      url : 'mongodb://localhost:27017',
      database : 'dbName'
    }
    this.mongoClient = new MongoClient(this.settings.url);
    this.eTag = 1;
  }
 async read(stateKeys: string[]): Promise<StoreItems>{
    return new Promise<StoreItems>(async (resolve, reject) => {
      let self = this;
      const theKey = stateKeys[0];
      const data = {};
      this.mongoClient.connect((err) => {
        const db = self.mongoClient.db(self.settings.database);
        const collection = db.collection('keys');
        collection.findOne({name: theKey}, function(err, result) {
          if(result==null){
              resolve({});
          }
          else{
          resolve(result);
          }
          db.close();
        });
      }); 
    });
  }

  async write(changes: StoreItems): Promise<void> {
    return new Promise<void>( async (resolve, reject) => {
      const that = this;
      const insertDocuments = function(db,item, callback) {
        const collection = db.collection('keys');
        collection.insertMany([item], function(err, result) {
          callback(result);
        });
      }

      function getByKey(key){
          return new Promise((resolve,reject)=>{
            this.mongoClient.connect(function(err) {
                const db = this.mongoClient.db(this.settings.database);
                const collection = db.collection('keys');
                collection.findOne({name: key}, function(err, result) {
                  if(result==null){
                      resolve(null);
                  }
                  else{
                  resolve(result);
                  }
                  db.close();
                });
              }); 
          });
      }
      function addItem(key, item) {
          const clone = Object.assign({}, item);
          let data = {};
          data["name"]=key;
          data[key]=clone;
          data["eTag"]= clone.eTag;
          this.mongoClient.connect(function(err) {
            console.log("Connected successfully to server");
            const db = this.mongoClient.db(this.settings.database);
            insertDocuments(db,data, function() {
              this.mongoClient.close();
            });
          });          
      }
      function saveItem(foo, item) {
        var myquery = { name: foo };
        let data = {};
        data[foo]=item;
        var newvalues = { $set: data };
        this.mongoClient.connect(function(err) {
          console.log("Connected successfully to server");
          const db = this.mongoClient.db(this.settings.database);
          const collection = db.collection('keys');
          collection.updateOne(myquery, newvalues, function(err, result) {
            this.mongoClient.close();
          });
        });          
    }
      return new Promise(async (resolve, reject) => {
          Object.keys(changes).forEach(async (key) => {
              const newItem = changes[key];
              const old = await getByKey(key);
              
              if (!old) {
                addItem(key, newItem);
              }
              else {
                   if (newItem.eTag === old["eTag"] || newItem.eTag == "*") {
                      saveItem(key, newItem);
                  }
                  else {
                      reject(new Error(`Storage: error writing "${key}" due to eTag conflict.`));
                  }
              }
          });
          resolve();
      });
    });
  }

  delete(keys: string[]): Promise<void> {
    return new Promise<void>((resolve, reject)=>{
      resolve();
    });
  }
}
