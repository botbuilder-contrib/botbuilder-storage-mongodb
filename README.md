## MongoDb Storage for Bot Framework.

####  Build Badge (coming soon.)
#### Installation (coming soon. Not yet on NPM registry)
```npm install botbuilder-mongo-storage```


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




