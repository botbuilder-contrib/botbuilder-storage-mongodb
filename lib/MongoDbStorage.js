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
    constructor(settings) {
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
        this.settings = Object.assign({}, settings);
        this.eTag = 1;
    }
    read(stateKeys) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const storeItems = {};
                for (let i = 0; i < stateKeys.length; i++) {
                    const key = stateKeys[i];
                    const document = yield this.getByKey(key);
                    if (document) {
                        storeItems[key] = document.data;
                    }
                }
                resolve(storeItems);
            }));
        });
    }
    write(changes) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                Object.keys(changes).forEach((key) => __awaiter(this, void 0, void 0, function* () {
                    const newItem = changes[key];
                    const old = yield this.getByKey(key);
                    if (!old) {
                        this.insertDocument(key, newItem, resolve);
                    }
                    else if (newItem.eTag === old.eTag || newItem.eTag == "*") {
                        this.updateDocument(key, newItem, resolve);
                    }
                    else {
                        reject(new Error(`Storage: error writing "${key}" due to eTag conflict.`));
                    }
                }));
            }));
        });
    }
    delete(keys) {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }
    getCollection() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (!this.client) {
                    this.client = yield mongodb_1.MongoClient.connect(this.settings.url, { useNewUrlParser: true });
                }
                resolve(this.client.db(this.settings.database).collection(this.settings.collection));
            }));
        });
    }
    getByKey(key) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            let collection = yield this.getCollection();
            collection.findOne({ _id: key }, function (err, result) {
                resolve(result);
            });
        }));
    }
    insertDocument(key, item, resolve) {
        return __awaiter(this, void 0, void 0, function* () {
            const clone = Object.assign({}, item);
            const document = {
                _id: key,
                data: clone,
                eTag: clone.eTag
            };
            const collection = yield this.getCollection();
            collection.insertMany([document], function (err, result) {
                resolve(result);
            });
        });
    }
    updateDocument(key, item, resolve) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = { _id: key };
            const clone = Object.assign({}, item);
            const document = {
                _id: key,
                data: clone,
                eTag: clone.eTag
            };
            const updateStatement = { $set: document };
            const collection = yield this.getCollection();
            collection.updateOne(query, updateStatement, function (err, result) {
                resolve();
            });
        });
    }
}
exports.MongoDbStorage = MongoDbStorage;
//# sourceMappingURL=MongoDbStorage.js.map