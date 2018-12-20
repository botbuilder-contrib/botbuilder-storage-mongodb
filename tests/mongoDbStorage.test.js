const assert = require('assert');
const { MongoDbStorage } = require('../lib/MongoDbStorage');

const getSettings = () => ({
    url : "mongodb://localhost:27017/",
    database: "botframework",
    collection: "botframeworkstate"
  });


describe('MongoDbStorage - Input verification', function () {
    it('should return empty object when null is passed in to read()', async function () {
        const storage = new MongoDbStorage(getSettings());
        const storeItems = await storage.read(null);
        assert.deepEqual(storeItems, {}, `did not receive empty object, instead received ${ JSON.stringify(storeItems) }`);
    });

    it('should return empty object when no keys are passed in to read()', async function () {
        const storage = new MongoDbStorage(getSettings());
        const storeItems = await storage.read([]);
        assert.deepEqual(storeItems, {}, `did not receive empty object, instead received ${ JSON.stringify(storeItems) }`);
    });

    it('should not blow up when no changes are passed in to write()', async function () {
        const storage = new MongoDbStorage(getSettings());
        const storeItems = await storage.write({});
    });

    it('should not blow up when null is passed in to write()', async function () {
        const storage = new MongoDbStorage(getSettings());
        const storeItems = await storage.write(null);
    });

    it('should not blow up when no keys are passed in to delete()', async function () {
        const storage = new MongoDbStorage(getSettings());
        const storeItems = await storage.delete([]);
    });

    it('should not blow up when null is passed in to delete()', async function () {
        const storage = new MongoDbStorage(getSettings());
        const storeItems = await storage.delete(null);
    });
});

describe('MongoDbStorage - Create filter tests', function () {
    describe('createFilter', function(){
        it('omits etag if etag is *', async function () {
            const actual = MongoDbStorage.createFilter('k','*');
            assert.deepEqual(actual, {_id: 'k'});  
        });
    
        it('omits etag if etag is null', async function () {   
            const actual = MongoDbStorage.createFilter('k',null);
            assert.deepEqual(actual, {_id: 'k'});  
        });
    
        it('includes etag if etag is valid', async function () {
            const actual = MongoDbStorage.createFilter('k','0xff44');
            assert.deepEqual(actual, {_id: 'k', 'state.eTag': '0xff44'});  
        });
    })
});