const assert = require('assert');
const request = require('request');

const {
  MongoDbStorage,
} = require('../../lib/MongoDbStorage');

//require MongoClient to set up fakes and stubs, not actual database connectivity
const {
  ObjectId, MongoClient
} = require('mongodb');

const settings = {
  url: "mongodb://127.0.0.1:27017/",
  database: "botFrameworkStorage_TestDB",
  collection: "botFrameworkStorage_TestCollection"
};

describe('mongoDbStorage integration tests', async function () {
  let storage;
  let client;

  beforeEach(async function () {
    client = new MongoClient(settings.url, { useUnifiedTopology: true });
    await client.connect();
    const collection = client.db(settings.database).collection(settings.collection);
    storage = new MongoDbStorage(collection);
  });

  afterEach(async function () {
    await client.close();
  })

  function uniqueChange() {
    return {
      [new ObjectId().toHexString()]: {
        field1: Math.random() * 1000000
      }
    };
  };

  function idOf(changesObject) {
    return Object.keys(changesObject)[0];
  }

  function contentOf(changesObject) {
    return changesObject[idOf(changesObject)];
  }

  describe('write', async function () {
    it('should create a document', async function () {

      const subject = uniqueChange();
      await storage.write(subject);

      const actual = await storage.targetCollection.findOne({
        _id: idOf(subject)
      });

      assert.equal(actual.state.field1, contentOf(subject).field1);

    });
  });


  describe('read', function () {
    it('should return empty for non existent key', async function () {

      let actual = await storage.read(['__non_existent_key__']);

      assert.deepEqual(actual, {}, `unexpected non-empty object`);
    });

    it('should return existing document', async function () {

      const subject = uniqueChange();
      await storage.write(subject);

      const actual = await storage.read([idOf(subject)]);

      assert.equal(idOf(actual), idOf(subject));

    });

  });


  describe('delete', function (done) {
    it('should remove an existing document', async function () {

      const subject = uniqueChange();
      const testId = idOf(subject);
      await storage.write(subject);

      await storage.delete([testId]);

      const actual = await storage.targetCollection.findOne({
        _id: testId
      });

      assert.equal(actual, null, `Unexpected document found which should have been deleted. _id ${testId}`);

    });
  });

});
