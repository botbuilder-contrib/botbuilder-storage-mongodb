 const assert = require('assert');
 const {
   MongoDbStorage,
   MongoDbStorageError,
   MongoDbStorageConfig
 } = require('../../lib/MongoDbStorage');

 //require MongoClient to set up fakes and stubs, not actual database connectivity
 const {
   MongoClient,
   ObjectID
 } = require('mongodb');

 const settings = {
   url: "mongodb://127.0.0.1:27017/",
   database: "__botframework",
   collection: "__botframeworkstate"
 };

 describe('MongoDbStorage Integration', async function () {
   after(function () {
     //global.asyncDump();
   });

   function uniqueChange() {
     return {
       [new ObjectID().toHexString]: {
         field1: 1
       }
     };
   };

   function getStorage() {
     const storage = new MongoDbStorage(settings);
     return storage;
   }

   describe('write', async function () {
     it('should create a document', async function () {
       const storage = getStorage();
       const subject = uniqueChange();
       await storage.write(subject);

       const doc = await storage.Collection.find({
         _id: 'marklar'
       });
       await storage.close();
       assert.deepEqual(doc, {}, `failed miserably!`);
     });
   });


   //  describe('read', function (done) {

   //    it('is implemented', function (done) {
   //      assert.fail(`Not implemented`)
   //    })

   //  });


   //  describe('delete', function (done) {
   //    it('is implemented', function (done) {
   //      assert.fail(`Not implemented`)
   //    })
   //  });

 });