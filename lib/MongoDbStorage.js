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
class MongoDbStorageError extends Error {
}
MongoDbStorageError.NO_CONFIG_ERROR = new MongoDbStorageError('MongoDbStorageConfig is required.');
MongoDbStorageError.NO_URL_ERROR = new MongoDbStorageError('MongoDbStorageConfig.url is required.');
exports.MongoDbStorageError = MongoDbStorageError;
class MongoDbStorage {
    constructor(config) {
        this.config = MongoDbStorage.ensureConfig(Object.assign({}, config));
    }
    static ensureConfig(config) {
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
        return config;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.client = yield mongodb_1.MongoClient.connect(this.config.url, { useNewUrlParser: true });
            return this.client;
        });
    }
    ensureConnected() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                yield this.connect();
            }
            return this.client;
        });
    }
    read(stateKeys) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!stateKeys || stateKeys.length == 0) {
                return {};
            }
            yield this.ensureConnected();
            const docs = yield this.Collection.find({ _id: { $in: stateKeys } });
            const storeItems = (yield docs.toArray()).reduce((accum, item) => {
                accum[item._id] = item.state;
                return accum;
            }, {});
            return storeItems;
        });
    }
    write(changes) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!changes || Object.keys(changes).length === 0) {
                return;
            }
            yield this.ensureConnected();
            const operations = [];
            Object.keys(changes).forEach(key => {
                const state = changes[key];
                const shouldSlam = MongoDbStorage.shouldSlam(state.eTag);
                const oldETag = state.eTag;
                state.eTag = new mongodb_1.ObjectID().toHexString();
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
                });
            });
            const bulkResults = yield this.Collection.bulkWrite(operations);
            //TODO: process bulk results: if 0 modified, 0 upserted then throw exception because state was not mutated.
        });
    }
    delete(keys) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!keys || keys.length == 0) {
                return;
            }
            yield this.ensureConnected();
            yield this.Collection.deleteMany({ _id: { $in: keys } });
        });
    }
    static shouldSlam(etag) {
        return (etag === '*' || !etag);
    }
    static createFilter(key, etag) {
        if (this.shouldSlam(etag)) {
            return { _id: key };
        }
        return { _id: key, 'state.eTag': etag };
    }
    get Collection() {
        return this.client.db(this.config.database).collection(this.config.collection);
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.client) {
                yield this.client.close();
                delete this.client;
            }
        });
    }
}
MongoDbStorage.DEFAULT_COLLECTION_NAME = "BotFrameworkState";
MongoDbStorage.DEFAULT_DB_NAME = "BotFramework";
exports.MongoDbStorage = MongoDbStorage;
//# sourceMappingURL=MongoDbStorage.js.map