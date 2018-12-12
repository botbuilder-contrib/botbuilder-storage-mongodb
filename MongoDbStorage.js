"use strict";
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';
const dbName = 'botframework';
const client = new MongoClient(url);
let etag = 1;
class MongoDbStorage {
  constructor(memory = {}) {
    this.memory = memory;
  }

  read(stateKeys) {
      return new Promise((resolve, reject) => {
          const theKey = stateKeys[0];
          const data = {};
          client.connect(function(err) {
            const db = client.db(dbName);
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

  write(changes) {
      const that = this;
      const insertDocuments = function(db,item, callback) {
        const collection = db.collection('keys');
        collection.insertMany([item], function(err, result) {
          callback(result);
        });
      }

      function getByKey(key){
          return new Promise((resolve,reject)=>{
            client.connect(function(err) {
                const db = client.db(dbName);
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
          data.eTag= clone.eTag;
          client.connect(function(err) {
            console.log("Connected successfully to server");
            const db = client.db(dbName);
            insertDocuments(db,data, function() {
              client.close();
            });
          });          
      }
      function saveItem(foo, item) {
        var myquery = { name: foo };
        let data = {};
        data[foo]=item;
        var newvalues = { $set: data };
        client.connect(function(err) {
          console.log("Connected successfully to server");
          const db = client.db(dbName);
          const collection = db.collection('keys');
          collection.updateOne(myquery, newvalues, function(err, result) {
            client.close();
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
                   if (newItem.eTag === old.eTag || newItem.eTag == "*") {
                      saveItem(key, newItem);
                  }
                  else {
                      reject(new Error(`Storage: error writing "${key}" due to eTag conflict.`));
                  }
              }
          });
          resolve();
      });
  }

  delete(keys) {
      return new Promise((resolve, reject) => {
          keys.forEach((key) => this.memory[key] = undefined);
          resolve();
      });
  }
}
exports.MongoDbStorage = MongoDbStorage;
