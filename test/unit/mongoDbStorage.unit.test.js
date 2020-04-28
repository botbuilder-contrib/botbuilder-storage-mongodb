const assert = require('assert');
const { MongoDbStorage } = require('../../lib/MongoDbStorage');
const { MongoDbStorageError } = require('../../lib/MongoDbStorageError');

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

  describe('ensureConfig', function () {

    it('should throw an error if config is not passed in', function () {
      const actual = () => MongoDbStorage.ensureConfig();
      assert.throws(actual, MongoDbStorageError.NO_CONFIG_ERROR);
    });

    it('should throw an error if config is empty', function () {
      const actual = () => MongoDbStorage.ensureConfig({});
      assert.throws(actual, MongoDbStorageError.NO_URL_ERROR);
    });

    it('should use supplied database name', function () {
      const expected = 'someDb';
      const actual = MongoDbStorage.ensureConfig({
        url: 'u',
        database: expected
      });
      assert.equal(actual.database, expected);
    });

    it('should use default database name', function () {
      const expected = MongoDbStorage.DEFAULT_DB_NAME;
      const actual = MongoDbStorage.ensureConfig({
        url: 'u',
      });
      assert.equal(actual.database, expected, 'Expected default database name');
    });

    it('should use default collection name', function () {
      const expected = MongoDbStorage.DEFAULT_COLLECTION_NAME;
      const actual = MongoDbStorage.ensureConfig({
        url: 'u',
      });
      assert.equal(actual.collection, expected, 'Expected default collection name');
    });

    it('should use supplied collection name', function () {
      const expected = 'someCollection';
      const actual = MongoDbStorage.ensureConfig({
        url: 'u',
        collection: expected
      });
      assert.equal(actual.collection, expected, 'Expected default collection name');
    });

    it('should use default MongoClientOptions', function () {
      const expected = MongoDbStorage.DEFAULT_CLIENT_OPTIONS;
      const actual = MongoDbStorage.ensureConfig({ url: 'u' });
      assert.equal(actual.clientOptions, expected);
    });

  });
  
  describe('connect', async function () {
    it('should call MongoClient.connect.', async function () {
      //arrange
      sinon.stub(MongoClient, "connect");
      const settings = {
        url: 'fake_url',
        database: 'fake_db'
      };
      const storage = new MongoDbStorage(settings);

      //act
      await storage.connect();

      //assert
      assert(MongoClient.connect.calledOnce);

      //cleanup
      MongoClient.connect.restore();
    });

    it('should call MongoClient.connect with passed in url', async function () {
      //arrange
      sinon.stub(MongoClient, "connect");
      const storage = new MongoDbStorage({
        url: 'fake_url',
        database: 'fake_db'
      });

      //act
      await storage.connect();

      //assert
      assert.equal('fake_url', MongoClient.connect.getCall(0).args[0]);

      //cleanup
      MongoClient.connect.restore();
    });

    it('should call MongoClient.connect with useNewUrlParser = true option', async function () {
      //arrange
      sinon.stub(MongoClient, "connect");
      const storage = new MongoDbStorage({
        url: 'fake_url',
        database: 'fake_db'
      });

      //act
      await storage.connect();

      //assert
      assert.ok(MongoClient.connect.getCall(0).args[1].useNewUrlParser);

      //cleanup
      MongoClient.connect.restore();
    });
  });

  describe('ensureConnected', async function () {
    it('should call connect if client does not exist.', async function () {
      //arrange
      const storage = new MongoDbStorage({
        url: 'fake_url',
        database: 'fake_db'
      });
      sinon.stub(storage, "connect");

      //act
      await storage.ensureConnected();

      //assert
      assert(storage.connect.calledOnce);

      //cleanup
      storage.connect.restore();
    });
    it('should not call connect if client exists.', async function () {
      //arrange
      const storage = new MongoDbStorage({
        url: 'fake_url',
        database: 'fake_db'
      });
      sinon.stub(storage, "connect");

      //act
      storage.client = "fake_client";
      await storage.ensureConnected();

      //assert
      assert(!storage.connect.calledOnce);

      //cleanup
      storage.connect.restore();
    });
  });
  describe('read', async function (done) {
    it('should call Collection.find with query that includes keys that are passed in', async function () {
      //arrange

      const storage = new MongoDbStorage({
        url: 'fake_url',
        database: 'fake_db'
      });
      sinon.stub(MongoClient, "connect");
      let query = null;
      stub1 = sinon.stub(storage, 'Collection').value({
        find: function (q) {
          return {
            toArray: function () {
              query = q;
              return [];
            }
          };
        }
      });
      const keys = ['abc', '123', '456'];

      //act
      await storage.connect();
      await storage.read(keys);

      //assert
      assert.deepEqual(query, {
        _id: {
          $in: keys
        }
      });

      //cleanup
      MongoClient.connect.restore();
    });

    it('should return storeItems as a dictionary', async function () {
      //arrange

      const storage = new MongoDbStorage({
        url: 'fake_url',
        database: 'fake_db'
      });
      sinon.stub(MongoClient, "connect");
      stub1 = sinon.stub(storage, 'Collection').value({
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
      });
      const keys = ['abc', '123', '456'];
      const expected = {
        'abc': 'some_state',
        '123': {
          foo: 'bar'
        },
        '456': 1234
      };
      //act
      await storage.connect();
      let storeItems = await storage.read(keys);

      //assert
      assert.deepEqual(storeItems, expected);

      //cleanup
      MongoClient.connect.restore();
    });
  });

  describe('read', async function (done) {
    it('should call Collection.find with query that includes keys that are passed in', async function () {
      //arrange

      const storage = new MongoDbStorage({
        url: 'fake_url',
        database: 'fake_db'
      });
      sinon.stub(MongoClient, "connect");
      let query = null;
      stub1 = sinon.stub(storage, 'Collection').value({
        find: function (q) {
          return {
            toArray: function () {
              query = q;
              return [];
            }
          };
        }
      });
      const keys = ['abc', '123', '456'];

      //act
      await storage.connect();
      await storage.read(keys);

      //assert
      assert.deepEqual(query, {
        _id: {
          $in: keys
        }
      });

      //cleanup
      MongoClient.connect.restore();
    });

    it('should return storeItems as a dictionary', async function () {
      //arrange

      const storage = new MongoDbStorage({
        url: 'fake_url',
        database: 'fake_db'
      });
      sinon.stub(MongoClient, "connect");
      stub1 = sinon.stub(storage, 'Collection').value({
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
      });
      const keys = ['abc', '123', '456'];
      const expected = {
        'abc': 'some_state',
        '123': {
          foo: 'bar'
        },
        '456': 1234
      };
      //act
      await storage.connect();
      let storeItems = await storage.read(keys);

      //assert
      assert.deepEqual(storeItems, expected);

      //cleanup
      MongoClient.connect.restore();
    });
  });

  describe('write', async function (done) {
    it('creates options with updateOne for each key in changes object.', async function () {
      //arrange
      let operations = null;
      const storage = new MongoDbStorage({
        url: 'fake_url',
        database: 'fake_db'
      });
      sinon.stub(MongoClient, "connect");
      stub1 = sinon.stub(storage, 'Collection').value({
        bulkWrite: function (o) {
          operations = o;
        }
      });
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

      //act
      await storage.connect();
      await storage.write(changes);

      //assert
      assert.equal(operations[0].updateOne.filter._id, "key_one");
      assert.equal(operations[1].updateOne.filter._id, "key_two");

      //cleanup
      MongoClient.connect.restore();
    });

    it('creates sets upsert property to true if shouldSlam.', async function () {
      //arrange
      let operations = null;
      const storage = new MongoDbStorage({
        url: 'fake_url',
        database: 'fake_db'
      });
      sinon.stub(MongoClient, "connect");
      stub1 = sinon.stub(storage, 'Collection').value({
        bulkWrite: function (o) {
          operations = o;
        }
      });
      const changes = {
        'key_one': {
          item: "foo",
          eTag: "*"
        }
      };

      //act
      await storage.connect();
      await storage.write(changes);

      //assert
      assert.ok(operations[0].updateOne.upsert);

      //cleanup
      MongoClient.connect.restore();
    });
    it('creates sets upsert property to false if !shouldSlam.', async function () {
      //arrange
      let operations = null;
      const storage = new MongoDbStorage({
        url: 'fake_url',
        database: 'fake_db'
      });
      sinon.stub(MongoClient, "connect");
      stub1 = sinon.stub(storage, 'Collection').value({
        bulkWrite: function (o) {
          operations = o;
        }
      });
      const changes = {
        'key_one': {
          item: "foo",
          eTag: "123456"
        }
      };

      //act
      await storage.connect();
      await storage.write(changes);

      //assert
      assert.ok(operations[0].updateOne.upsert == false);

      //cleanup
      MongoClient.connect.restore();
    });

    it('creates $set property with correct state update values', async function () {
      //arrange
      let operations = null;
      const storage = new MongoDbStorage({
        url: 'fake_url',
        database: 'fake_db'
      });
      sinon.stub(MongoClient, "connect");
      stub1 = sinon.stub(storage, 'Collection').value({
        bulkWrite: function (o) {
          operations = o;
        }
      });
      const changes = {
        'key_one': {
          item: "foo",
          eTag: "*"
        }
      };

      //act
      await storage.connect();
      await storage.write(changes);

      //assert
      assert.deepEqual(operations[0].updateOne.update.$set.state.item, "foo");

      //cleanup
      MongoClient.connect.restore();
    });
  });

  describe('delete', async function (done) {
    it('creates options with updateOne for each key in changes object.', async function () {
      //arrange
      let query = null;
      const storage = new MongoDbStorage({
        url: 'fake_url',
        database: 'fake_db'
      });
      sinon.stub(MongoClient, "connect");
      stub1 = sinon.stub(storage, 'Collection').value({
        deleteMany: function (q) {
          query = q;
        }
      });
      const keys = ['123', 'aaa', 'bbb'];
      //act
      await storage.connect();
      await storage.delete(keys);

      //assert
      assert.deepEqual(query, {
        _id: {
          $in: keys
        }
      });

      //cleanup
      MongoClient.connect.restore();
    });
  });

  describe('collection property', async function (done) {
    it('calls MongoClient.db with database name', async function () {
      //arrange
      let database = null;
      const storage = new MongoDbStorage({
        url: 'fake_url',
        database: 'fake_db'
      });

      storage.client = {
        db: function (d) {
          database = d;
          return {
            collection: function () { }
          }
        }
      };

      //act
      let collection = storage.Collection;

      //assert
      assert.equal(database, "fake_db");
    });
    it('calls MongoClient.db.collection with collection name', async function () {
      //arrange
      let collectionName = 'fake_collection_' + new Date();
      let actual = null;
      const storage = new MongoDbStorage({
        url: 'fake_url',
        database: 'fake_db',
        collection: collectionName
      });

      storage.client = {
        db: function (d) {
          return {
            collection: function (c) {
              actual = c;
            }
          }
        }
      };

      //act
      let collection = storage.Collection;

      //assert
      assert.equal(actual, collectionName);
    });
  });

  describe('close', function () {
    it('Closes existing client', async function () {
      var target = new MongoDbStorage(getSettings());
      let subject = {

        isClosed: false,
        close: function () {
          this.isClosed = true;
        }
      }
      target.client = subject;

      target.close();

      assert.ok(subject.isClosed);
    })

    it('Skips closing if no client', async function () {
      var target = new MongoDbStorage(getSettings());

      target.client = null;

      target.close();

      assert.ok(!target.client);
    })
  })
});
