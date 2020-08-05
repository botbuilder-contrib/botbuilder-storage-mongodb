# State Storage for Bot Framework using MongoDB

This project provides a MongoDb storage mechanism for [Bot Framework-JS SDK V4.](https://github.com/Microsoft/botbuilder-js).

It allows you to store bot state in MongoDB, so that you can scale out your bot, and be more resilient to bot server failures.

![Build Status](https://dev.azure.com/BotBuilderPackages/mongoDBStorage/_apis/build/status/Pull%20Request%20Build?branchName=master)

## Requirements

* [NodeJS](https://nodejs.org/en/) 13.x was used to create and test this library.
* MongoDB database, or a database exposing basic MongoDB syntax.

## Installation

```bash
npm install botbuilder-storage-mongodb
```

## Sample Usage

```JavaScript
(async () => {
  const mongoClient = new MongoClient("mongodb://localhost:27017/", { useUnifiedTopology: true });
  await mongoClient.connect();
  const collection = MongoDbStorage.getCollection(mongoClient);
  const mongoStorage = new MongoDbStorage(collection);

  // now we have a storage component instantiated:
  const conversationState = new ConversationState(mongoStorage);

  //... rest of your code
})();

```

See [example code](example/app.js) for more details.

## Specifying Mongo Collection

The convenience method `MongoDbStorage.getCollection(mongoClient)` returns a MongoDB Collection object. It leverages default values `MongoDbStorage.DEFAULT_DB_NAME` and `MongoDbStorage.DEFAULT_COLLECTION_NAME` for the database and collection names respectively, resulting in the default collection `BotFreamework.BotFrameworkState`.

You may alternatively call the method and supply `dbName` and `collectionName` to suit your needs:

```javascript
  MongoDbStorage.getCollection(mongoClient, 'MyDbName','MyCollectionName')
  // collection "MyCollectionName" in the database "MyDbName"
```

> If using the method `MongoDbStorage.getCollection(mongoClient)` to obtain a collection, the `mongoClient` object must already be instantiated and connected!


You can also skip using the convenience method and supply a [`Collection`](https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html) instance to the constructor by obtaining a collection reference from your application configured to your liking. One reason you may want or need to do so is if you want to provide collection specific options not exposed by the convenience method.


> &#X26A0; Caution: you **should not store Mongo URL in code!** Get the `url` from a configuration such as environment variable or a secrets store in your environment. It may contain sensitive password in the clear and should __never be stored in code__!

See [MongoDB Connection URI format](https://docs.mongodb.com/manual/reference/connection-string/) in the official documentation to learn more about the connection `url` parameter value.
