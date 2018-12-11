"use strict";
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';
const dbName = 'botframework';
const client = new MongoClient(url);

class MongoDbStorage {
  constructor(memory = {}) {
    this.memory = memory;
    this.etag = 1;
  }

  read(stateKeys) {
      return new Promise((resolve, reject) => {
          const theKey = stateKeys[0];
          const data = {};
          client.connect(function(err) {
            const db = client.db(dbName);
            const collection = db.collection('keys');
            collection.findOne({theKey}, function(err, result) {
              resolve(result);
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

      function saveItem(key, item) {
          const clone = Object.assign({}, item);
          clone.eTag = (that.etag++).toString();
          let data = {};
          data[key]=clone;
          client.connect(function(err) {
            console.log("Connected successfully to server");
            const db = client.db(dbName);
            insertDocuments(db,data, function() {
              client.close();
            });
          });          
      }
      return new Promise((resolve, reject) => {
          Object.keys(changes).forEach((key) => {
              const newItem = changes[key];
              const old = this.memory[key];
              if (!old || newItem.eTag === '*') {
                  saveItem(key, newItem);
              }
              else {
                  const oldItem = JSON.parse(old);
                  if (newItem.eTag === oldItem.eTag) {
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
