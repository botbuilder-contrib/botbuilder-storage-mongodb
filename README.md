## MongoDb Storage for Bot Framework

This project provides a MongoDb storage mechanism for [Bot Framework-JS SDK V4.](https://github.com/Microsoft/botbuilder-js)

![Build Status](https://dev.azure.com/BotBuilderPackages/mongoDBStorage/_apis/build/status/Pull%20Request%20Build?branchName=master)
#### Installation (coming soon. Not yet on NPM registry)
```npm install botbuilder-mongo-storage```

### Requirements
* BotFramework SDK 4.0 
* [NodeJS](https://nodejs.org/en/) 10.x is a requirement to install dependencies, build and run tests.

Note: You do not need typescript installed globally, the project installs the typescript compiler locally and uses it in the build process.

####  Sample Usage
```JavaScript
const mongoStorage = new MongoDbStorage({
  url : "mongodb://localhost:27017/",
  database: "botframework",
  collection: "botframework"
});
const conversationState = new ConversationState(mongoStorage);
```
#### Configuration options

* url: The url of the mongo server (including port.)
* database: The name of the database where state will be stored.
* collection (optional): The name of the collection where the state documents will be stored. If omitted, the name "botframeworkstate" will be used.

#### Unit Tests
```npm run test```
Unit tests are in pure javascript. The npm run test command executes tsc then invokes [nyc](https://github.com/istanbuljs/nyc)


#### Code Coverage
```npm run cover```

There is no need to execute 'npm run test' before code coverage. The cover command performs the following:

* Build via the TypeScript compiler (tsc.)
* Run run uni tests.
* Create an html report in the cover folder.
* Open a browser window with html report.




