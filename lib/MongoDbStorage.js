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
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.client = yield mongodb_1.MongoClient.connect(this.settings.url, { useNewUrlParser: true });
        });
    }
    read(stateKeys) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!stateKeys || stateKeys.length == 0) {
                return {};
            }
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
            const operations = [];
            Object.keys(changes).forEach(key => {
                operations.push({
                    updateOne: {
                        filter: {
                            _id: key
                        },
                        update: {
                            $set: {
                                state: changes[key],
                                dt: new Date()
                            }
                        },
                        upsert: true
                    }
                });
            });
            yield this.Collection.bulkWrite(operations);
        });
    }
    delete(keys) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.Collection.deleteMany({ _id: { $in: keys } });
        });
    }
    get Collection() {
        return this.client.db(this.settings.database).collection(this.settings.collection);
    }
}
exports.MongoDbStorage = MongoDbStorage;
//# sourceMappingURL=MongoDbStorage.js.map