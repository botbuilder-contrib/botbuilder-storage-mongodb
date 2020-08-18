const assert = require('assert');
const { MongoDbStorage } = require('../../lib/MongoDbStorage');
const { MongoDbStorageError } = require('../../lib/MongoDbStorageError');
const { MongoDocumentStoreItem } = require('../../lib/MongoDocumentStoreItem');
const sinon = require('sinon');

//require MongoClient to set up fakes and stubs, not actual database connectivity
const {
  MongoClient
} = require('mongodb');


const getSettings = () => ({
  url: "mongodb://localhost:27017/",
  database: "botframework",
  collection: "botframeworkstate"
});

describe('MongoDbStorage ', function () {
  describe('input verification', function () {
    it('should return empty object when null is passed in to read()', async function () {
      const storage = new MongoDbStorage(getSettings());
      const storeItems = await storage.read(null);
      assert.deepEqual(storeItems, {}, `did not receive empty object, instead received ${JSON.stringify(storeItems)}`);
    });

    it('should return empty object when no keys are passed in to read()', async function () {
      const storage = new MongoDbStorage(getSettings());
      const storeItems = await storage.read([]);
      assert.deepEqual(storeItems, {}, `did not receive empty object, instead received ${JSON.stringify(storeItems)}`);
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

  describe('createFilter', function () {
    it('omits etag if etag is *', async function () {
      const actual = MongoDbStorage.createFilter('k', '*');
      assert.deepEqual(actual, {
        _id: 'k'
      });
    });

    it('omits etag if etag is null', async function () {
      const actual = MongoDbStorage.createFilter('k', null);
      assert.deepEqual(actual, {
        _id: 'k'
      });
    });

    it('includes etag if etag is valid', async function () {
      const actual = MongoDbStorage.createFilter('k', '0xff44');
      assert.deepEqual(actual, {
        _id: 'k',
        'state.eTag': '0xff44'
      });
    });
  });

  describe('shouldSlam', function () {
    it('returns truthy if etag is *', async function () {
      const actual = MongoDbStorage.shouldSlam('*');
      assert.ok(actual);
    });

    it('returns truthy if etag is omitted', async function () {
      const actual = MongoDbStorage.shouldSlam();
      assert.ok(actual);
    });

    it('returns falsy if etag exists', async function () {
      const actual = MongoDbStorage.shouldSlam("a_fake_etag");
      assert.ok(actual === false);
    });
  });

  describe('createQuery', function () {
    it('composes query with items in array', function () {
      const actual = MongoDbStorage.createQuery(['a', 'b'])
      assert.deepStrictEqual(actual, { _id: { '$in': ['a', 'b'] } })

    })
  })

  describe('packStorageItems', function () {
    it('should return storeItems as a dictionary', function () {
      //arrange
      const subject = [{
        _id: 'abc',
        state: 'some_state'
      },
      {
        _id: '123',
        state: {
          foo: 'bar'
        }
      }
      ];

      const expected = {
        'abc': 'some_state',
        '123': {
          foo: 'bar'
        }
      };
      //act

      let storeItems = MongoDbStorage.packStoreItems(subject);

      //assert
      assert.deepEqual(storeItems, expected);
    });
  });

  describe('read', async function (done) {
    it('should return storeItems as a dictionary', async function () {
      //arrange


      const collection = {
        find: function (q) {
          return {
            toArray: function () {
              return [{
                _id: 'abc',
                state: 'some_state'
              },
              {
                _id: '123',
                state: {
                  foo: 'bar'
                }
              },
              {
                _id: '456',
                state: 1234
              }
              ];
            }
          };
        }
      };

      const storage = new MongoDbStorage(collection);

      const keys = ['abc', '123', '456'];

      const expected = {
        'abc': 'some_state',
        '123': {
          foo: 'bar'
        },
        '456': 1234
      };

      //act
      let storeItems = await storage.read(keys);

      //assert
      assert.deepEqual(storeItems, expected);
    });
  });

  describe('write', async function (done) {
    it('calls bulkWrite', async function () {
      //arrange
      const collection = { bulkWrite: sinon.fake() }
      const target = new MongoDbStorage(collection)
      //act
      await target.write({
        'key_one': {
          item: "foo",
          eTag: "*"
        }
      });
      //assert
      assert.ok(collection.bulkWrite.called);
    })
  })
  describe('createBulkOperations', function () {
    it('creates options with updateOne for each key in changes object.', function () {
      //arrange
      const changes = {
        'key_one': {
          item: "foo",
          eTag: "*"
        },
        'key_two': {
          item: "foo",
          eTag: "*"
        }
      };

      const actual = MongoDbStorage.createBulkOperations(changes);

      //assert
      assert.equal(actual[0].updateOne.filter._id, "key_one");
      assert.equal(actual[1].updateOne.filter._id, "key_two");
    });

    it('sets upsert property to true if shouldSlam.', async function () {
      //arrange

      const changes = {
        'key_one': {
          item: "foo",
          eTag: "*"
        }
      };

      //act
      const actual = MongoDbStorage.createBulkOperations(changes);

      //assert
      assert.ok(actual[0].updateOne.upsert);
    });

    it('sets upsert property to false if !shouldSlam.', async function () {
      //arrange
      const changes = {
        'key_one': {
          item: "foo",
          eTag: "123456"
        }
      };

      //act
      const actual = MongoDbStorage.createBulkOperations(changes);

      //assert
      assert.ok(actual[0].updateOne.upsert == false);
    });

    it('creates $set property with item value', async function () {
      //arrange
      const changes = {
        'key_one': {
          item: "foo",
          eTag: "*"
        }
      };

      //act
      const actual = MongoDbStorage.createBulkOperations(changes);

      //assert
      assert.deepEqual(actual[0].updateOne.update.$set.state.item, changes.key_one.item);
    });
   
    it('updates dt field to current date', async function () {
      //arrange
      const changes = {
        'key_one': {
          item: "foo",
          eTag: "*"
        }
      };

      //act
      const actual = MongoDbStorage.createBulkOperations(changes);

      //assert
      assert.deepStrictEqual(actual[0].updateOne.update.$currentDate, {dt: {$type: 'date'}});
    });
  });

  describe('delete', async function (done) {
    it('calls delete with keys query', async function () {
      //arrange
      let query = null;
      const storage = new MongoDbStorage({ deleteMany: function (q) { query = q } });
      const keys = ['123', 'aaa', 'bbb'];

      //act
      await storage.delete(keys);

      //assert
      assert.deepStrictEqual(query, {
        _id: {
          $in: keys
        }
      });
    });
  });

  describe('getCollection', function(){
    it('uses default DB and Collection names', function(){
      //arrange
      collectionFake = sinon.fake();
      dbFake = sinon.fake.returns({collection: collectionFake});
      
      //act
      MongoDbStorage.getCollection({db: dbFake});
      
      //assert
      assert.ok(dbFake.calledWith(MongoDbStorage.DEFAULT_DB_NAME));
      assert.ok(collectionFake.calledWith(MongoDbStorage.DEFAULT_COLLECTION_NAME));
    })

    it('overrides default DB and Collection names when supplied', function(){
      //arrange
      collectionFake = sinon.fake();
      dbFake = sinon.fake.returns({collection: collectionFake});
      
      //act
      MongoDbStorage.getCollection({db: dbFake},dbName='db1', collectionName = 'collection1');
      
      //assert
      assert.ok(dbFake.calledWith('db1'));
      assert.ok(collectionFake.calledWith('collection1'));
    })
  })

});
