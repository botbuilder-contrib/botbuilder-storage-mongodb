"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
class MongoDbStorage {
    constructor() {
        this.settings = {
            url: 'mongodb://localhost:27017',
            database: 'dbName'
        };
        this.mongoClient = new mongodb_1.MongoClient(this.settings.url);
        this.eTag = 1;
    }
    read(stateKeys) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const theKey = stateKeys[0];
                const data = {};
                this.mongoClient.connect(function (err) {
                    const db = this.mongoClient.db(this.settings.database);
                    const collection = db.collection('keys');
                    collection.findOne({ name: theKey }, function (err, result) {
                        if (result == null) {
                            resolve({});
                        }
                        else {
                            resolve(result);
                        }
                        db.close();
                    });
                });
            }));
        });
    }
    write(changes) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const that = this;
                const insertDocuments = function (db, item, callback) {
                    const collection = db.collection('keys');
                    collection.insertMany([item], function (err, result) {
                        callback(result);
                    });
                };
                function getByKey(key) {
                    return new Promise((resolve, reject) => {
                        this.mongoClient.connect(function (err) {
                            const db = this.mongoClient.db(this.settings.database);
                            const collection = db.collection('keys');
                            collection.findOne({ name: key }, function (err, result) {
                                if (result == null) {
                                    resolve(null);
                                }
                                else {
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
                    data["name"] = key;
                    data[key] = clone;
                    data["eTag"] = clone.eTag;
                    this.mongoClient.connect(function (err) {
                        console.log("Connected successfully to server");
                        const db = this.mongoClient.db(this.settings.database);
                        insertDocuments(db, data, function () {
                            this.mongoClient.close();
                        });
                    });
                }
                function saveItem(foo, item) {
                    var myquery = { name: foo };
                    let data = {};
                    data[foo] = item;
                    var newvalues = { $set: data };
                    this.mongoClient.connect(function (err) {
                        console.log("Connected successfully to server");
                        const db = this.mongoClient.db(this.settings.database);
                        const collection = db.collection('keys');
                        collection.updateOne(myquery, newvalues, function (err, result) {
                            this.mongoClient.close();
                        });
                    });
                }
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    Object.keys(changes).forEach((key) => __awaiter(this, void 0, void 0, function* () {
                        const newItem = changes[key];
                        const old = yield getByKey(key);
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
                    }));
                    resolve();
                }));
            }));
        });
    }
    delete(keys) {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }
}
exports.MongoDbStorage = MongoDbStorage;
//# sourceMappingURL=MongoDbStorage.js.map