# MongoDb Storage for Bot Framework.

### Running the bot

```JavaScript
const mongoStorage = new MongoDbStorage({
  url : "mongodb://localhost:27017/",
  database: "botframework",
  collection: "botframework"
});
const conversationState = new ConversationState(mongoStorage);
```
