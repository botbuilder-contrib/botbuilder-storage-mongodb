# State Storage for Bot Framework using MongoDB

This project provides a MongoDb storage mechanism for [Bot Framework-JS SDK V4.](https://github.com/Microsoft/botbuilder-js).

It allows you to store bot state in MongoDB, so that you can scale out your bot, and be more resilient to bot server failures.

![Build Status](https://dev.azure.com/BotBuilderPackages/mongoDBStorage/_apis/build/status/Pull%20Request%20Build?branchName=master)

## Requirements

* [NodeJS](https://nodejs.org/en/) 10.x is a requirement to install dependencies, build and run tests.
* MongoDB database.

## Installation

```bash
npm install botbuilder-storage-mongodb
```

## Sample Usage

```JavaScript
const mongoStorage = new MongoDbStorage({
  url : "mongodb://localhost:27017/",
  database: "botframework",
  collection: "botframework"
});

const conversationState = new ConversationState(mongoStorage);
```

See [example code](example/app.js) for more details.

## Configuration Options

| Field | Description | Value |
|--- |--- |--- |
|`url`| The URL of the mongo server| _Required_ |
|`database`| The name of the database where state will be stored | _Optional_. Default `"BotFramework"`|
|`collection` | The name of the collection where the state documents will be stored.| _Optional_. Default `"BotFrameworkState"` |

> &#X26A0; Caution: you **should not store Mongo URL in code!** Get the `url` from a configuration such as environment variable or a secrets store in your environment. It may contain sensitive password in the clear and should __never be stored in code__!

See [MongoDB Connection URI format](https://docs.mongodb.com/manual/reference/connection-string/) in the official documentation to learn more about the connection `url` parameter value.
